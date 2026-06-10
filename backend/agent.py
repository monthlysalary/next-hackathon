import json
import os
import re
import uuid

import boto3
from botocore.exceptions import ClientError

from backend import dynamo, exa_search, location
from backend.aws_config import REGION, VERIFY_SSL
from backend.models import AgentResponse, GroupRequest, RefineRequest, RestaurantResult

# Tried in order until one works. Claude 4.x Sonnet is the sweet spot for this agent.
DEFAULT_BEDROCK_MODELS = [
    "us.amazon.nova-lite-v1:0",
    "us.amazon.nova-pro-v1:0",
    "us.anthropic.claude-sonnet-4-20250514-v1:0",
    "us.anthropic.claude-haiku-4-20250514-v1:0",
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

IMPORTANT — MEAL TYPE CONTEXT:
- If meal type is "lunch" or "dinner": recommend proper sit-down restaurants
  with full meals (rice, mains, sides).
- If meal type is "supper": recommend late-night options, supper spots,
  24-hour eateries, or places open past 10 PM.
- If meal type is "snack" or "any": include cafés, dessert spots, hawker
  snack stalls, or lighter options alongside restaurants.

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

8. For each restaurant, provide estimated opening hours if known
   (e.g. "11:00 AM - 9:00 PM daily" or "Mon-Sat 11am-10pm, closed Sun").
   If not known, use null.

9. For each restaurant, indicate whether it accepts reservations.
   Hawker centres, food courts, and casual takeaway stalls do NOT accept reservations.
   Sit-down restaurants with table service typically DO accept reservations.
   Set to true only if you are reasonably confident. If unsure, set to false.

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
      "match_score": 85,
      "opening_hours": "string or null",
      "accepts_reservations": true
    }}
  ]
}}"""


def _build_refine_prompt(
    session_data: dict,
    user_message: str,
    exa_results: list[dict],
) -> str:
    """Build a prompt for refining results based on user feedback."""
    return f"""You are a Singapore dining concierge AI.
The user previously searched for restaurants and got results, but now wants adjustments.

PREVIOUS RESULTS:
- Suggested area: {session_data.get('suggested_area', 'Unknown')}
- Restaurants found: {json.dumps([r.get('name', '') for r in session_data.get('restaurants', [])])}

GROUP PROFILES:
{json.dumps(session_data.get('persons', []), indent=2, default=str)}

MEAL TYPE: {session_data.get('meal_type', 'dinner')}
DAY: {session_data.get('day', 'today')}

IMPORTANT — MEAL TYPE CONTEXT:
- If meal type is "lunch" or "dinner": recommend proper sit-down restaurants
  with full meals (rice, mains, sides).
- If meal type is "supper": recommend late-night options, supper spots,
  24-hour eateries, or places open past 10 PM.
- If meal type is "snack" or "any": include cafés, dessert spots, hawker
  snack stalls, or lighter options alongside restaurants.

USER'S ADJUSTMENT REQUEST: "{user_message}"

ADDITIONAL SEARCH RESULTS (based on user's request):
{_format_exa_results(exa_results)}

Based on the user's request, provide NEW top 3 restaurant recommendations
that better match what they're looking for. Keep all the same constraints
(dietary, budget) but adjust based on their feedback.

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
      "match_score": 85,
      "opening_hours": "string or null",
      "accepts_reservations": true
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
        rest = [m for m in DEFAULT_BEDROCK_MODELS if m != configured]
        return [configured, *rest]
    return DEFAULT_BEDROCK_MODELS


def _call_bedrock(prompt: str) -> str:
    client = boto3.client("bedrock-runtime", region_name=REGION, verify=VERIFY_SSL)
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
    request_or_session,
    midpoint_area: str,
) -> dict:
    # Handle both GroupRequest objects and session dicts
    if hasattr(request_or_session, "persons"):
        names = [p.name for p in request_or_session.persons]
        persons_data = [
            {"name": p.name, "location": p.location}
            for p in request_or_session.persons
        ]
    else:
        persons = request_or_session.get("persons", [])
        names = [p.get("name", f"Person {i+1}") for i, p in enumerate(persons)]
        persons_data = persons

    return {
        "suggested_area": midpoint_area,
        "area_reason": (
            f"{midpoint_area} is the geographic midpoint of your group, "
            "offering reasonable MRT access for everyone."
        ),
        "travel_summary": {
            name: f"~20-30 min via MRT"
            for name in names
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
                "opening_hours": "8:00 AM - 10:00 PM daily",
                "accepts_reservations": False,
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
                "opening_hours": "7:00 AM - 10:30 PM daily",
                "accepts_reservations": False,
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
                "opening_hours": "Mon-Sat 7:00 AM - 8:00 PM, closed Sun",
                "accepts_reservations": True,
                "reservation_url": "https://www.chope.co/singapore-restaurants/restaurant/hjh-maimunah-restaurant-jalan-pisang",
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
            photo_url=r.get("photo_url"),
            opening_hours=r.get("opening_hours"),
            reservation_url=r.get("reservation_url"),
        )
        for r in parsed.get("restaurants", [])
    ]


def _enrich_restaurants(parsed: dict) -> None:
    """Add photo URLs, opening hours, and reservation links to restaurant results."""
    for restaurant in parsed.get("restaurants", []):
        name = restaurant.get("name", "")
        if not name:
            continue

        # Search for deals if none found
        if not restaurant.get("deal"):
            deal = exa_search.search_deals(name)
            if deal:
                restaurant["deal"] = deal

        # Search for photo
        if not restaurant.get("photo_url"):
            photo_url = exa_search.search_restaurant_photo(name)
            if photo_url:
                restaurant["photo_url"] = photo_url

        # Search for opening hours if not provided by AI
        if not restaurant.get("opening_hours"):
            hours = exa_search.search_opening_hours(name)
            if hours:
                restaurant["opening_hours"] = hours

        # Search for reservation URL only if the AI says it accepts reservations
        if restaurant.get("accepts_reservations") and not restaurant.get("reservation_url"):
            reservation_url = exa_search.search_reservation_url(name)
            if reservation_url:
                restaurant["reservation_url"] = reservation_url


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

    exa_results = exa_search.search_restaurants(midpoint_area, combined_dietary, request.meal_type)

    prompt = _build_prompt(request, midpoint_area, exa_results)

    warning = None
    try:
        text = _call_bedrock(prompt)
        parsed = _parse_agent_response(text)
    except RuntimeError as e:
        print(f"Bedrock unavailable, using fallback: {e}")
        parsed = _fallback_response(request, midpoint_area)
        warning = (
            "AI recommendations unavailable — showing generic suggestions. "
            "Reason: " + str(e)
        )
    except Exception as e:
        print(f"Bedrock error, using fallback: {e}")
        parsed = _fallback_response(request, midpoint_area)
        warning = (
            "AI recommendations unavailable — showing generic suggestions. "
            f"Error: {type(e).__name__}: {e}"
        )

    # Enrich with photos, hours, deals
    _enrich_restaurants(parsed)

    if not parsed.get("restaurants"):
        parsed = _fallback_response(request, midpoint_area)
        if not warning:
            warning = "AI returned no results — showing generic suggestions."

    session_id = request.session_id or str(uuid.uuid4())
    restaurants = _build_restaurants(parsed, midpoint_area)

    response = AgentResponse(
        session_id=session_id,
        suggested_area=parsed.get("suggested_area", midpoint_area),
        area_reason=parsed.get("area_reason", ""),
        travel_summary=parsed.get("travel_summary", {}),
        restaurants=restaurants,
        warning=warning,
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


async def refine_results(refine_request: RefineRequest) -> AgentResponse:
    """Re-run the agent with user's adjustment message."""
    session = dynamo.get_session(refine_request.session_id)
    if not session:
        raise ValueError("Session not found")

    # Get the midpoint area from session
    midpoint_area = session.get("suggested_area", "Bishan")

    # Build dietary list from session persons
    combined_dietary: list[str] = []
    for person in session.get("persons", []):
        for d in person.get("dietary", []):
            if d.lower() != "none" and d not in combined_dietary:
                combined_dietary.append(d)

    # Do a new Exa search incorporating user's feedback
    user_msg = refine_request.message.lower()
    search_query_extra = ""
    if any(w in user_msg for w in ["quiet", "peaceful", "calm"]):
        search_query_extra = "quiet cozy"
    elif any(w in user_msg for w in ["cheap", "budget", "affordable"]):
        search_query_extra = "cheap affordable"
    elif any(w in user_msg for w in ["fancy", "upscale", "fine dining"]):
        search_query_extra = "fine dining upscale"
    elif any(w in user_msg for w in ["outdoor", "alfresco"]):
        search_query_extra = "outdoor alfresco"
    else:
        search_query_extra = refine_request.message[:50]

    dietary_str = " ".join(combined_dietary)
    query = f"{midpoint_area} Singapore restaurant {dietary_str} {search_query_extra} 2024 2025"
    exa_results = exa_search.search_with_cache(
        query,
        num_results=6,
        include_domains=exa_search.RESTAURANT_DOMAINS,
    )

    prompt = _build_refine_prompt(session, refine_request.message, exa_results)

    warning = None
    try:
        text = _call_bedrock(prompt)
        parsed = _parse_agent_response(text)
    except RuntimeError as e:
        print(f"Bedrock unavailable for refine, using fallback: {e}")
        parsed = _fallback_response(session, midpoint_area)
        warning = (
            "AI recommendations unavailable — showing generic suggestions. "
            "Reason: " + str(e)
        )
    except Exception as e:
        print(f"Bedrock error for refine, using fallback: {e}")
        parsed = _fallback_response(session, midpoint_area)
        warning = (
            "AI recommendations unavailable — showing generic suggestions. "
            f"Error: {type(e).__name__}: {e}"
        )

    # Enrich with photos, hours, deals
    _enrich_restaurants(parsed)

    if not parsed.get("restaurants"):
        parsed = _fallback_response(session, midpoint_area)
        if not warning:
            warning = "AI returned no results — showing generic suggestions."

    # Reuse session ID
    session_id = refine_request.session_id
    restaurants = _build_restaurants(parsed, midpoint_area)

    response = AgentResponse(
        session_id=session_id,
        suggested_area=parsed.get("suggested_area", midpoint_area),
        area_reason=parsed.get("area_reason", ""),
        travel_summary=parsed.get("travel_summary", {}),
        restaurants=restaurants,
        warning=warning,
    )

    # Update session with new results
    dynamo.save_session(
        session_id,
        {
            "group_name": session.get("group_name", "Our Group"),
            "meal_type": session.get("meal_type", "dinner"),
            "day": session.get("day", "today"),
            "persons": session.get("persons", []),
            "suggested_area": response.suggested_area,
            "area_reason": response.area_reason,
            "travel_summary": response.travel_summary,
            "restaurants": [r.model_dump() for r in response.restaurants],
        },
    )

    return response
