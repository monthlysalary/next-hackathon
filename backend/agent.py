import json
import os
import re
import uuid

import boto3
from botocore.exceptions import ClientError

from backend import dynamo, exa_search, location
from backend.aws_config import REGION
from backend.models import AgentResponse, GroupRequest, RestaurantResult

# Tried in order until one works. Claude 4.x Sonnet is the sweet spot for this agent.
DEFAULT_BEDROCK_MODELS = [
    "anthropic.claude-sonnet-4-5-20250929-v1:0",
    "anthropic.claude-sonnet-4-6",
    "anthropic.claude-haiku-4-5-20251001-v1:0",
    "anthropic.claude-opus-4-5-20251101-v1:0",
    "anthropic.claude-opus-4-6-v1",
    "amazon.nova-lite-v1:0",
    "amazon.nova-pro-v1:0",
]


def _format_exa_results(results: list[dict]) -> str:
    if not results:
        return "No search results available. Use your knowledge of Singapore restaurants."
    parts = []
    for i, r in enumerate(results, 1):
        parts.append(
            f"--- Result {i} ---\n"
            f"Title: {r.get('title', 'Unknown')}\n"
            f"URL: {r.get('url', '')}\n"
            f"Content: {r.get('text', '')[:800]}\n"
        )
    return "\n".join(parts)


def _build_prompt(
    request: GroupRequest,
    midpoint_area: str,
    exa_results: list[dict],
) -> str:
    group_profiles = [
        {
            "name": p.name,
            "location": p.location,
            "budget": p.budget,
            "dietary": p.dietary,
            "cuisine_loves": p.cuisine_loves,
            "must_have": p.must_have,
            "avoid": p.avoid,
        }
        for p in request.persons
    ]

    return f"""You are a Singapore dining concierge AI.
Analyse this group and recommend the top 3 restaurants.

GROUP PROFILES:
{json.dumps(group_profiles, indent=2)}

GEOGRAPHIC MIDPOINT AREA: {midpoint_area}
(calculated from everyone's locations using coordinates)

MEAL TYPE: {request.meal_type}
DAY: {request.day}

RESTAURANT SEARCH RESULTS:
{_format_exa_results(exa_results)}

YOUR TASKS:
1. Confirm or adjust the suggested meetup area considering
   Singapore MRT connectivity, not just physical distance.
   Explain in 1-2 sentences.

2. Estimate rough MRT travel time for each person.
   You know Singapore's MRT network well — use it.

3. From the search results identify the top 3 restaurants
   satisfying ALL constraints simultaneously:
   - Every person's dietary requirements (non-negotiable)
   - Budget ceiling = the LOWEST budget in the group
   - Must-have amenities
   - Best cuisine overlap across the group

4. For each restaurant extract or infer these tags.
   Use "unknown" if not clearly mentioned:
   halal-certified | no pork | vegetarian-friendly |
   vegan-friendly | aircon | outdoor seating |
   big tables | quiet | lively | accepts card |
   accepts PayNow | cash only | student deal |
   parking | wheelchair accessible

5. Write a 2-sentence review summary:
   Sentence 1 = what people love
   Sentence 2 = common complaints

6. Write one sentence: why this restaurant works for
   THIS specific group.

7. Score 0-100 for group fit.

Return ONLY valid JSON, no markdown, no explanation:
{{
  "suggested_area": "string",
  "area_reason": "string",
  "travel_summary": {{
    "person_name": "~X min via [MRT line]"
  }},
  "restaurants": [
    {{
      "name": "string",
      "area": "string",
      "address": "string",
      "cuisine": "string",
      "price_range": "string e.g. S$8-15 per pax",
      "tags": ["tag1", "tag2"],
      "satisfies": ["name1", "name2"],
      "deal": "string or null",
      "summary": "string",
      "why_this_group": "string",
      "maps_url": "https://maps.google.com/?q=name+singapore",
      "latitude": null,
      "longitude": null,
      "match_score": 85
    }}
  ]
}}"""


def _parse_agent_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise


def _bedrock_model_ids() -> list[str]:
    configured = os.getenv("BEDROCK_MODEL_ID", "").strip()
    if configured:
        # User's pick first, then defaults (skip duplicates)
        rest = [m for m in DEFAULT_BEDROCK_MODELS if m != configured]
        return [configured, *rest]
    return DEFAULT_BEDROCK_MODELS


def _call_bedrock(prompt: str) -> str:
    client = boto3.client("bedrock-runtime", region_name=REGION)
    errors: list[str] = []

    for model_id in _bedrock_model_ids():
        try:
            response = client.converse(
                modelId=model_id,
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": prompt}],
                    }
                ],
                inferenceConfig={"maxTokens": 4000, "temperature": 0.3},
            )
            text = response["output"]["message"]["content"][0]["text"]
            print(f"Bedrock OK: {model_id}")
            return text
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            msg = e.response.get("Error", {}).get("Message", str(e))
            errors.append(f"{model_id}: {code} — {msg}")
            print(f"Bedrock skip {model_id}: {code}")
        except Exception as e:
            errors.append(f"{model_id}: {e}")
            print(f"Bedrock skip {model_id}: {e}")

    raise RuntimeError(
        "No Bedrock model available. Enable one in Console → Bedrock → "
        f"Model access (region {REGION}). Tried: "
        + "; ".join(errors[:3])
    )


def _fallback_response(
    request: GroupRequest,
    midpoint_area: str,
) -> dict:
    names = [p.name for p in request.persons]
    return {
        "suggested_area": midpoint_area,
        "area_reason": (
            f"{midpoint_area} is the geographic midpoint of your group, "
            "offering reasonable MRT access for everyone."
        ),
        "travel_summary": {
            p.name: f"~20-30 min via MRT from {p.location}"
            for p in request.persons
        },
        "restaurants": [
            {
                "name": "Maxwell Food Centre",
                "area": midpoint_area,
                "address": f"Near {midpoint_area}, Singapore",
                "cuisine": "Hawker / Mixed",
                "price_range": "S$5-12 per pax",
                "tags": ["halal stalls", "vegetarian options", "cash", "PayNow"],
                "satisfies": names[:2],
                "deal": None,
                "summary": (
                    "Popular hawker centre with diverse stalls and affordable prices. "
                    "Can get crowded during peak lunch hours."
                ),
                "why_this_group": (
                    "Offers options for varied dietary needs at budget-friendly prices."
                ),
                "maps_url": "https://maps.google.com/?q=Maxwell+Food+Centre+Singapore",
                "latitude": None,
                "longitude": None,
                "match_score": 75,
            },
            {
                "name": "Komala Vilas",
                "area": "Little India",
                "address": "76-78 Serangoon Road, Singapore",
                "cuisine": "South Indian Vegetarian",
                "price_range": "S$6-12 per pax",
                "tags": [
                    "vegetarian-friendly",
                    "vegan-friendly",
                    "aircon",
                    "accepts card",
                ],
                "satisfies": names,
                "deal": "10% off with valid student ID",
                "summary": (
                    "Beloved institution for vegetarian South Indian cuisine. "
                    "Aircon section can feel rushed at lunch."
                ),
                "why_this_group": (
                    "Vegetarian-friendly and fits most budgets in the group."
                ),
                "maps_url": "https://maps.google.com/?q=Komala+Vilas+Singapore",
                "latitude": None,
                "longitude": None,
                "match_score": 80,
            },
            {
                "name": "Hjh Maimunah Restaurant",
                "area": "Jalan Pisang",
                "address": "11 & 15 Jalan Pisang, Singapore",
                "cuisine": "Malay / Nasi Padang",
                "price_range": "S$8-14 per pax",
                "tags": [
                    "halal-certified",
                    "no pork",
                    "vegetarian options",
                    "big tables",
                ],
                "satisfies": names,
                "deal": None,
                "summary": (
                    "Famous nasi padang with generous portions and variety. "
                    "Long queues at peak hours."
                ),
                "why_this_group": (
                    "Halal-certified with vegetarian options, fits group budgets."
                ),
                "maps_url": "https://maps.google.com/?q=Hjh+Maimunah+Singapore",
                "latitude": None,
                "longitude": None,
                "match_score": 85,
            },
        ],
    }


def _build_restaurants(parsed: dict, midpoint_area: str) -> list[RestaurantResult]:
    return [
        RestaurantResult(
            name=r.get("name", "Unknown"),
            area=r.get("area", midpoint_area),
            address=r.get("address", ""),
            cuisine=r.get("cuisine", ""),
            price_range=r.get("price_range", ""),
            tags=r.get("tags", []),
            satisfies=r.get("satisfies", []),
            deal=r.get("deal"),
            summary=r.get("summary", ""),
            why_this_group=r.get("why_this_group", ""),
            maps_url=r.get(
                "maps_url",
                f"https://maps.google.com/?q={r.get('name', '')}+singapore",
            ),
            latitude=r.get("latitude"),
            longitude=r.get("longitude"),
            match_score=r.get("match_score", 70),
        )
        for r in parsed.get("restaurants", [])
    ]


async def run_agent(request: GroupRequest) -> AgentResponse:
    for person in request.persons:
        coords = location.geocode_area(person.location)
        person.latitude = coords["latitude"]
        person.longitude = coords["longitude"]

    locations = [
        {"latitude": p.latitude, "longitude": p.longitude}
        for p in request.persons
    ]
    midpoint = location.calculate_midpoint(locations)
    midpoint_area = location.get_nearest_area(
        midpoint["latitude"], midpoint["longitude"]
    )

    combined_dietary: list[str] = []
    for person in request.persons:
        for d in person.dietary:
            if d.lower() != "none" and d not in combined_dietary:
                combined_dietary.append(d)

    exa_results = exa_search.search_restaurants(midpoint_area, combined_dietary)

    prompt = _build_prompt(request, midpoint_area, exa_results)

    try:
        text = _call_bedrock(prompt)
        parsed = _parse_agent_response(text)
    except Exception as e:
        print(f"Bedrock unavailable, using fallback: {e}")
        parsed = _fallback_response(request, midpoint_area)

    for restaurant in parsed.get("restaurants", []):
        if not restaurant.get("deal"):
            deal = exa_search.search_deals(restaurant.get("name", ""))
            if deal:
                restaurant["deal"] = deal

    if not parsed.get("restaurants"):
        parsed = _fallback_response(request, midpoint_area)

    session_id = request.session_id or str(uuid.uuid4())
    restaurants = _build_restaurants(parsed, midpoint_area)

    response = AgentResponse(
        session_id=session_id,
        suggested_area=parsed.get("suggested_area", midpoint_area),
        area_reason=parsed.get("area_reason", ""),
        travel_summary=parsed.get("travel_summary", {}),
        restaurants=restaurants,
    )

    dynamo.save_session(
        session_id,
        {
            "group_name": request.group_name,
            "meal_type": request.meal_type,
            "day": request.day,
            "persons": [p.model_dump() for p in request.persons],
            "suggested_area": response.suggested_area,
            "area_reason": response.area_reason,
            "travel_summary": response.travel_summary,
            "restaurants": [r.model_dump() for r in response.restaurants],
        },
    )

    return response
