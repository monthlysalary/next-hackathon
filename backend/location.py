import math
import os

import httpx

SINGAPORE_AREAS = {
    "tampines": (1.3496, 103.9568),
    "jurong east": (1.3329, 103.7436),
    "woodlands": (1.4382, 103.7890),
    "orchard": (1.3048, 103.8318),
    "bishan": (1.3520, 103.8480),
    "ang mo kio": (1.3691, 103.8454),
    "bedok": (1.3240, 103.9300),
    "clementi": (1.3162, 103.7649),
    "punggol": (1.3984, 103.9072),
    "toa payoh": (1.3343, 103.8563),
    "novena": (1.3204, 103.8438),
    "bugis": (1.3009, 103.8559),
    "chinatown": (1.2815, 103.8448),
    "marina bay": (1.2802, 103.8509),
    "jurong west": (1.3404, 103.7090),
    "sengkang": (1.3868, 103.8914),
    "hougang": (1.3612, 103.8863),
    "yishun": (1.4304, 103.8354),
    "pasir ris": (1.3721, 103.9493),
    "buona vista": (1.3072, 103.7902),
    "serangoon": (1.3496, 103.8723),
    "kallang": (1.3100, 103.8710),
    "paya lebar": (1.3179, 103.8928),
    "dhoby ghaut": (1.2988, 103.8456),
    "boon lay": (1.3388, 103.7060),
}


def _fallback_geocode(area_name: str) -> dict:
    key = area_name.lower().strip()
    for area, coords in SINGAPORE_AREAS.items():
        if area in key or key in area:
            return {"latitude": coords[0], "longitude": coords[1]}
    return {"latitude": 1.3521, "longitude": 103.8198}


def geocode_area(area_name: str) -> dict:
    token = os.getenv("MAPBOX_TOKEN", "")
    if not token:
        return _fallback_geocode(area_name)

    url = (
        f"https://api.mapbox.com/geocoding/v5/mapbox.places/"
        f"{area_name}.json"
    )
    try:
        with httpx.Client(timeout=10.0, verify=False) as client:
            response = client.get(
                url,
                params={"country": "SG", "access_token": token},
            )
            response.raise_for_status()
            data = response.json()
            features = data.get("features", [])
            if features:
                lng, lat = features[0]["center"]
                return {"latitude": lat, "longitude": lng}
    except Exception:
        pass

    return _fallback_geocode(area_name)


def calculate_midpoint(locations: list[dict]) -> dict:
    if not locations:
        return {"latitude": 1.3521, "longitude": 103.8198}
    avg_lat = sum(loc["latitude"] for loc in locations) / len(locations)
    avg_lng = sum(loc["longitude"] for loc in locations) / len(locations)
    return {"latitude": avg_lat, "longitude": avg_lng}


def get_nearest_area(lat: float, lng: float) -> str:
    best_area = "orchard"
    best_dist = float("inf")
    for area, (area_lat, area_lng) in SINGAPORE_AREAS.items():
        dist = math.sqrt((lat - area_lat) ** 2 + (lng - area_lng) ** 2)
        if dist < best_dist:
            best_dist = dist
            best_area = area
    return best_area.title()
