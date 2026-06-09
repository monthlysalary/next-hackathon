import hashlib
import json
import os
from datetime import datetime, timezone

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from exa_py import Exa

from backend.aws_config import REGION, VERIFY_SSL

BUCKET_NAME = "tablefor-exa-cache"
CACHE_TTL_HOURS = 6

RESTAURANT_DOMAINS = [
    "burpple.com",
    "hungrygowhere.com",
    "sethlui.com",
    "danielfooddiary.com",
    "misstamchiak.com",
    "reddit.com",
    "yelp.com.sg",
]

DEAL_DOMAINS = [
    "burpple.com",
    "seedly.sg",
    "studentdeals.sg",
    "reddit.com",
]

PHOTO_DOMAINS = [
    "burpple.com",
    "hungrygowhere.com",
    "danielfooddiary.com",
    "misstamchiak.com",
    "sethlui.com",
    "tripadvisor.com.sg",
]

_s3 = boto3.client("s3", region_name=REGION, verify=VERIFY_SSL)
_exa: Exa | None = None
_bucket_ready = False
_cache_enabled = True


def _ensure_bucket():
    global _bucket_ready, _cache_enabled
    if _bucket_ready or not _cache_enabled:
        return
    try:
        _s3.head_bucket(Bucket=BUCKET_NAME)
        _bucket_ready = True
    except ClientError:
        try:
            _s3.create_bucket(
                Bucket=BUCKET_NAME,
                CreateBucketConfiguration={"LocationConstraint": REGION},
            )
            _bucket_ready = True
        except (ClientError, NoCredentialsError, BotoCoreError):
            _cache_enabled = False
    except (NoCredentialsError, BotoCoreError):
        _cache_enabled = False


def _get_exa() -> Exa | None:
    global _exa
    if _exa is not None:
        return _exa
    api_key = os.getenv("EXA_API_KEY", "")
    if not api_key or api_key == "your_key_here":
        return None
    _exa = Exa(api_key=api_key)
    return _exa


def get_cache_key(query: str) -> str:
    return hashlib.md5(query.encode()).hexdigest()


def search_with_cache(query: str, **kwargs) -> list[dict]:
    global _cache_enabled
    cache_key = get_cache_key(query + json.dumps(kwargs, sort_keys=True))
    s3_key = f"{cache_key}.json"

    if _cache_enabled:
        try:
            _ensure_bucket()
            if _bucket_ready:
                obj = _s3.get_object(Bucket=BUCKET_NAME, Key=s3_key)
                cached = json.loads(obj["Body"].read().decode())
                cached_at = datetime.fromisoformat(cached["cached_at"])
                age_hours = (
                    datetime.now(timezone.utc)
                    - cached_at.replace(tzinfo=timezone.utc)
                ).total_seconds() / 3600
                if age_hours < CACHE_TTL_HOURS:
                    return cached["results"]
        except (ClientError, NoCredentialsError, BotoCoreError):
            _cache_enabled = False
        except Exception:
            pass

    exa = _get_exa()
    if not exa:
        return []

    try:
        response = exa.search(
            query,
            contents={"text": {"max_characters": 1000}},
            **kwargs,
        )
        results = []
        for r in response.results:
            results.append(
                {
                    "title": r.title,
                    "url": r.url,
                    "text": getattr(r, "text", "") or "",
                }
            )
    except Exception as e:
        print(f"Exa search failed: {e}")
        return []

    if _cache_enabled and _bucket_ready:
        try:
            _s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=json.dumps(
                    {
                        "cached_at": datetime.now(timezone.utc).isoformat(),
                        "results": results,
                    }
                ),
                ContentType="application/json",
            )
        except (ClientError, NoCredentialsError, BotoCoreError):
            _cache_enabled = False

    return results


def _dedupe_results(results: list[dict]) -> list[dict]:
    seen = set()
    deduped = []
    for r in results:
        title = r.get("title", "")
        if title and title not in seen:
            seen.add(title)
            deduped.append(r)
    return deduped


def search_restaurants(area: str, dietary: list[str], meal_type: str = "") -> list[dict]:
    dietary_str = " ".join(d for d in dietary if d and d.lower() != "none")

    # Tailor search query to meal type
    meal_hint = ""
    if meal_type in ("supper",):
        meal_hint = "supper late night 24 hours"
    elif meal_type in ("snack", "any"):
        meal_hint = "cafe snack dessert"
    elif meal_type in ("lunch",):
        meal_hint = "lunch set meal"
    elif meal_type in ("dinner",):
        meal_hint = "dinner restaurant"
    elif meal_type in ("dessert",):
        meal_hint = "dessert cafe bakery ice cream waffles"

    query = f"{area} Singapore {meal_hint} restaurant {dietary_str} recommended 2024 2025"
    kwargs = {
        "num_results": 6,
        "include_domains": RESTAURANT_DOMAINS,
    }

    results = search_with_cache(query, **kwargs)

    from backend.location import SINGAPORE_AREAS

    area_key = area.lower()
    nearby_area = None
    for name in SINGAPORE_AREAS:
        if name in area_key or area_key in name:
            areas_list = list(SINGAPORE_AREAS.keys())
            idx = areas_list.index(name)
            nearby_area = areas_list[(idx + 1) % len(areas_list)]
            break

    if nearby_area:
        nearby_query = (
            f"{nearby_area} Singapore restaurant {dietary_str} recommended 2024 2025"
        )
        nearby_results = search_with_cache(nearby_query, **kwargs)
        results = _dedupe_results(results + nearby_results)
    else:
        results = _dedupe_results(results)

    return results


def search_deals(restaurant_name: str) -> str | None:
    query = f"{restaurant_name} Singapore student deal discount promo 2025"
    results = search_with_cache(
        query,
        num_results=2,
        include_domains=DEAL_DOMAINS,
    )
    for r in results:
        text = r.get("text", "")
        if text and len(text) > 20:
            snippet = text[:300].strip()
            if any(
                kw in snippet.lower()
                for kw in ["deal", "discount", "promo", "off", "%"]
            ):
                return snippet
    if results:
        return results[0].get("text", "")[:200] or None
    return None


def search_restaurant_photo(restaurant_name: str) -> str | None:
    """Search for a restaurant photo URL via Exa."""
    exa = _get_exa()
    if not exa:
        return None

    query = f"{restaurant_name} Singapore restaurant food photo"
    cache_key = get_cache_key(f"photo:{query}")
    s3_key = f"photos/{cache_key}.json"

    # Check cache first
    global _cache_enabled
    if _cache_enabled:
        try:
            _ensure_bucket()
            if _bucket_ready:
                obj = _s3.get_object(Bucket=BUCKET_NAME, Key=s3_key)
                cached = json.loads(obj["Body"].read().decode())
                return cached.get("photo_url")
        except Exception:
            pass

    try:
        response = exa.search(
            query,
            num_results=3,
            include_domains=PHOTO_DOMAINS,
        )
        photo_url = None
        for r in response.results:
            url = r.url or ""
            # Burpple and food blogs often have og:image in their pages
            if any(domain in url for domain in PHOTO_DOMAINS):
                photo_url = url
                break

        # Cache result
        if _cache_enabled and _bucket_ready:
            try:
                _s3.put_object(
                    Bucket=BUCKET_NAME,
                    Key=s3_key,
                    Body=json.dumps({"photo_url": photo_url}),
                    ContentType="application/json",
                )
            except Exception:
                pass

        return photo_url
    except Exception as e:
        print(f"Photo search failed for {restaurant_name}: {e}")
        return None


def search_opening_hours(restaurant_name: str) -> str | None:
    """Search for opening hours of a restaurant."""
    query = f"{restaurant_name} Singapore opening hours"
    results = search_with_cache(
        query,
        num_results=2,
        include_domains=RESTAURANT_DOMAINS + ["google.com"],
    )
    for r in results:
        text = r.get("text", "").lower()
        # Look for time patterns like "10am", "11:00", "mon-fri"
        if any(kw in text for kw in ["am", "pm", "open", "close", "hours", "daily"]):
            # Extract the relevant snippet
            lines = r.get("text", "").split("\n")
            for line in lines:
                lower_line = line.lower()
                if any(
                    kw in lower_line
                    for kw in ["am", "pm", "open", "close", "hours", "daily", "mon"]
                ):
                    cleaned = line.strip()
                    if 10 < len(cleaned) < 150:
                        return cleaned
    return None


def search_menu(restaurant_name: str) -> dict | None:
    """Search for a restaurant's menu items and prices via Exa (Pro feature)."""
    query = f"{restaurant_name} Singapore menu prices"
    results = search_with_cache(
        query,
        num_results=3,
        include_domains=RESTAURANT_DOMAINS + ["grab.com", "foodpanda.sg", "deliveroo.com.sg"],
    )

    if not results:
        return None

    # Extract menu-like content from search results
    menu_items = []
    source_url = None

    for r in results:
        text = r.get("text", "")
        url = r.get("url", "")
        if not text:
            continue

        if not source_url:
            source_url = url

        # Look for lines that might be menu items (contain $ or price patterns)
        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            if not line or len(line) < 5 or len(line) > 200:
                continue
            # Lines with $ signs or "S$" are likely menu items
            if "$" in line or any(
                kw in line.lower()
                for kw in ["per pax", "per person", "set meal", "ala carte"]
            ):
                menu_items.append(line)
            # Also grab lines that look like dish names (capitalized, reasonable length)
            elif (
                len(line) > 8
                and len(line) < 80
                and not line.startswith("http")
                and any(c.isupper() for c in line[:3])
            ):
                menu_items.append(line)

        if len(menu_items) >= 15:
            break

    if not menu_items:
        # Fallback: return the raw text snippet
        best_text = results[0].get("text", "")[:500] if results else None
        if best_text:
            return {
                "restaurant_name": restaurant_name,
                "menu_items": [best_text],
                "source_url": results[0].get("url", ""),
                "note": "Full menu details may vary. Check the source link for the latest menu.",
            }
        return None

    return {
        "restaurant_name": restaurant_name,
        "menu_items": menu_items[:15],
        "source_url": source_url,
        "note": "Prices may vary. Check the source link for the latest menu.",
    }
