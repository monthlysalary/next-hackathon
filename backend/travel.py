"""Real travel times via OneMap public transport routing."""

from __future__ import annotations

import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import httpx

SGT = ZoneInfo("Asia/Singapore")
ROUTE_URL = "https://www.onemap.gov.sg/api/public/routingsvc/route"


def _get_token() -> str | None:
    token = os.getenv("ONEMAP_ACCESS_TOKEN", "").strip()
    if not token or token == "your_onemap_token":
        return None
    return token


def _departure_datetime(meal_type: str, day: str) -> datetime:
    now = datetime.now(SGT)
    meal = (meal_type or "dinner").lower()
    hour = {
        "lunch": 12,
        "dinner": 19,
        "supper": 22,
        "dessert": 15,
        "snack": 15,
        "any": now.hour,
    }.get(meal, 19)

    target_date = now.date()
    day_key = (day or "today").lower()
    if day_key == "tomorrow":
        target_date += timedelta(days=1)
    elif day_key == "weekend":
        days_until_sat = (5 - now.weekday()) % 7
        if days_until_sat == 0 and now.hour >= hour:
            days_until_sat = 7
        target_date += timedelta(days=days_until_sat)

    return datetime(
        target_date.year,
        target_date.month,
        target_date.day,
        hour,
        0,
        0,
        tzinfo=SGT,
    )


def _format_transit_lines(legs: list[dict]) -> str:
    lines: list[str] = []
    for leg in legs:
        if not leg.get("transitLeg"):
            continue
        label = leg.get("routeShortName") or leg.get("route") or leg.get("mode", "")
        if label and label not in lines:
            lines.append(str(label))
    if lines:
        return " + ".join(lines[:4])
    return "public transport"


def get_public_transit_route(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    *,
    meal_type: str = "dinner",
    day: str = "today",
) -> dict | None:
    """Return best public transport itinerary from OneMap, or None on failure."""
    token = _get_token()
    if not token:
        return None

    depart = _departure_datetime(meal_type, day)
    params = {
        "start": f"{origin_lat},{origin_lng}",
        "end": f"{dest_lat},{dest_lng}",
        "routeType": "pt",
        "mode": "TRANSIT",
        "date": depart.strftime("%m-%d-%Y"),
        "time": depart.strftime("%H:%M:%S"),
        "numItineraries": "1",
        "maxWalkDistance": "1000",
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(
                ROUTE_URL,
                params=params,
                headers={"Authorization": token},
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        print(f"OneMap routing failed: {exc}")
        return None

    itineraries = (data.get("plan") or {}).get("itineraries") or []
    if not itineraries:
        return None

    best = itineraries[0]
    duration_sec = best.get("duration", 0)
    legs = best.get("legs") or []
    return {
        "minutes": max(1, round(duration_sec / 60)),
        "lines": _format_transit_lines(legs),
        "transfers": best.get("transfers", 0),
        "fare": best.get("fare"),
    }


def format_travel_label(route: dict | None, fallback_location: str = "") -> str:
    if not route:
        loc = f" from {fallback_location}" if fallback_location else ""
        return f"Route unavailable{loc}"

    lines = route.get("lines") or "public transport"
    minutes = route["minutes"]
    transfer_note = ""
    transfers = route.get("transfers") or 0
    if transfers:
        transfer_note = f", {transfers} transfer{'s' if transfers != 1 else ''}"
    return f"~{minutes} min via {lines}{transfer_note}"


def compute_travel_summary(
    persons: list,
    dest_lat: float,
    dest_lng: float,
    *,
    meal_type: str = "dinner",
    day: str = "today",
) -> dict[str, str]:
    """Build travel_summary dict keyed by person name."""
    summary: dict[str, str] = {}

    for person in persons:
        if hasattr(person, "name"):
            name = person.name
            lat = person.latitude
            lng = person.longitude
            location = person.location
        else:
            name = person.get("name", "Unknown")
            lat = person.get("latitude")
            lng = person.get("longitude")
            location = person.get("location", "")

        if lat is None or lng is None:
            summary[name] = f"Unknown route from {location or name}"
            continue

        route = get_public_transit_route(
            lat,
            lng,
            dest_lat,
            dest_lng,
            meal_type=meal_type,
            day=day,
        )
        summary[name] = format_travel_label(route, location)

    return summary


def apply_travel_summary(
    parsed: dict,
    persons: list,
    meetup_area: str,
    *,
    meal_type: str = "dinner",
    day: str = "today",
) -> dict[str, str]:
    """Geocode meetup area and overwrite parsed travel_summary with OneMap data."""
    from backend import location

    if not _get_token():
        print("OneMap token missing — keeping existing travel_summary")
        return parsed.get("travel_summary", {})

    enriched: list[dict] = []
    for person in persons:
        if hasattr(person, "model_dump"):
            data = person.model_dump()
        elif hasattr(person, "name"):
            data = {
                "name": person.name,
                "location": person.location,
                "latitude": person.latitude,
                "longitude": person.longitude,
            }
        else:
            data = dict(person)

        if not data.get("latitude") or not data.get("longitude"):
            coords = location.geocode_area(data.get("location", ""))
            data["latitude"] = coords["latitude"]
            data["longitude"] = coords["longitude"]
        enriched.append(data)

    area = parsed.get("suggested_area") or meetup_area
    dest = location.geocode_area(area)
    summary = compute_travel_summary(
        enriched,
        dest["latitude"],
        dest["longitude"],
        meal_type=meal_type,
        day=day,
    )
    parsed["travel_summary"] = summary
    return summary
