import hashlib
import json
import os
from datetime import datetime, timezone

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from exa_py import Exa

from backend.aws_config import REGION

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

_s3 = boto3.client("s3", region_name=REGION)
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
        response = exa.search_and_contents(
            query,
            text=True,
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


def search_restaurants(area: str, dietary: list[str]) -> list[dict]:
    dietary_str = " ".join(d for d in dietary if d and d.lower() != "none")
    query = f"{area} Singapore restaurant {dietary_str} recommended 2024 2025"
    kwargs = {
        "num_results": 6,
        "use_autoprompt": True,
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
