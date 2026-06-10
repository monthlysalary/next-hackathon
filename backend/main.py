import os
import re
import uuid

import stripe
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Must import after load_dotenv so env vars are available
import backend.aws_config  # noqa: E402 — patches SSL early
from backend import agent, dynamo, exa_search, location
from backend.models import (
    AgentResponse,
    CancelProRequest,
    ConfirmProRequest,
    GpsRequest,
    GroupRequest,
    GroupSetupPayload,
    JoinPersonRequest,
    RefineRequest,
    VoteRequest,
    VoteStatus,
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

app = FastAPI(title="TableFor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=(
        r"https://.*\.vercel\.app|"
        r"https://.*\.up\.railway\.app|"
        r"http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+"
    ),
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


FREE_MAX_PERSONS = 5
PRO_MAX_PERSONS = 20


@app.post("/find", response_model=AgentResponse)
async def find_restaurants(request: GroupRequest):
    max_persons = PRO_MAX_PERSONS if request.is_pro else FREE_MAX_PERSONS
    if len(request.persons) < 2:
        raise HTTPException(status_code=400, detail="At least 2 persons required")
    if len(request.persons) > max_persons:
        if request.is_pro:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {PRO_MAX_PERSONS} persons allowed",
            )
        raise HTTPException(
            status_code=403,
            detail=(
                f"Free plan supports up to {FREE_MAX_PERSONS} people. "
                "Go Pro for unlimited group size."
            ),
        )
    return await agent.run_agent(request)


@app.post("/refine", response_model=AgentResponse)
async def refine_restaurants(request: RefineRequest):
    """Re-run the AI with user's adjustment message (e.g. 'quieter', 'cheaper')."""
    try:
        return await agent.refine_results(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Refine error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Refine failed: {type(e).__name__}: {e}")


@app.post("/vote")
def vote_restaurant(request: VoteRequest):
    """Cast a vote for a restaurant. Each person gets one vote per session."""
    session = dynamo.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    result = dynamo.cast_vote(
        request.session_id, request.voter_name, request.restaurant_name
    )
    return result


@app.get("/votes/{session_id}")
def get_votes(session_id: str):
    """Get current vote tallies for a session (for polling from multiple devices)."""
    return dynamo.get_votes(session_id)


@app.get("/session/{session_id}")
def get_session(session_id: str):
    data = dynamo.get_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Session not found")
    return data


def _is_person_empty(person: dict | None) -> bool:
    if not person:
        return True
    return not (person.get("name") or "").strip() and not (
        person.get("location") or ""
    ).strip()


def _merge_person_slot(local: dict | None, remote: dict | None) -> dict:
    local = local or {}
    remote = remote or {}

    if _is_person_empty(remote) and not _is_person_empty(local):
        return local
    if _is_person_empty(local) and not _is_person_empty(remote):
        return remote

    merged = {**remote, **local}
    if (local.get("name") or "").strip():
        merged["name"] = local["name"]
    else:
        merged["name"] = remote.get("name", "")
    if (local.get("location") or "").strip():
        merged["location"] = local["location"]
    else:
        merged["location"] = remote.get("location", "")
    merged["latitude"] = (
        local.get("latitude")
        if local.get("latitude") is not None
        else remote.get("latitude")
    )
    merged["longitude"] = (
        local.get("longitude")
        if local.get("longitude") is not None
        else remote.get("longitude")
    )
    merged["budget"] = local.get("budget") or remote.get("budget") or ""
    merged["dietary"] = local.get("dietary") or remote.get("dietary") or []
    merged["cuisine_loves"] = (
        local.get("cuisine_loves") or remote.get("cuisine_loves") or []
    )
    merged["must_have"] = local.get("must_have") or remote.get("must_have") or []
    merged["avoid"] = local.get("avoid") or remote.get("avoid") or []
    merged["notes"] = (
        local.get("notes") or ""
    ).strip() or (remote.get("notes") or "")
    return merged


def _merge_persons_list(local: list, remote: list) -> list:
    max_len = max(len(local), len(remote))
    return [
        _merge_person_slot(
            local[i] if i < len(local) else {},
            remote[i] if i < len(remote) else {},
        )
        for i in range(max_len)
    ]


def _save_group_setup(session_id: str, payload: dict) -> dict:
    existing = dynamo.get_session(session_id) or {}
    data = {
        "status": "setup",
        "group_name": payload.get("group_name", "Our Group"),
        "meal_type": payload.get("meal_type", "dinner"),
        "day": payload.get("day", "today"),
        "persons": payload.get("persons", []),
        "votes": existing.get("votes", {}),
        "voters": existing.get("voters", []),
        "saved_restaurants": existing.get("saved_restaurants", []),
    }
    if existing.get("restaurants"):
        data["restaurants"] = existing.get("restaurants")
        data["suggested_area"] = existing.get("suggested_area")
        data["area_reason"] = existing.get("area_reason")
        data["travel_summary"] = existing.get("travel_summary")
    dynamo.save_session(session_id, data)
    return {"session_id": session_id, **data}


@app.post("/group/create")
def create_group(body: GroupSetupPayload):
    """Create a shareable group session before running a search."""
    session_id = body.session_id or str(uuid.uuid4())
    persons = [p.model_dump() for p in body.persons]
    return _save_group_setup(
        session_id,
        {
            "group_name": body.group_name,
            "meal_type": body.meal_type,
            "day": body.day,
            "persons": persons,
        },
    )


@app.get("/group/{session_id}")
def get_group(session_id: str):
    """Load group setup for host or join link."""
    data = dynamo.get_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="Group not found")
    return data


@app.put("/group/{session_id}")
def update_group(session_id: str, body: GroupSetupPayload):
    """Sync group setup from the host device."""
    existing = dynamo.get_session(session_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Group not found")
    if existing.get("status") == "searched" and existing.get("restaurants"):
        raise HTTPException(
            status_code=409,
            detail="This group already has results. Share the results link instead.",
        )
    incoming_persons = [p.model_dump() for p in body.persons]
    existing_persons = existing.get("persons", [])
    merged_persons = _merge_persons_list(incoming_persons, existing_persons)
    return _save_group_setup(
        session_id,
        {
            "group_name": body.group_name,
            "meal_type": body.meal_type,
            "day": body.day,
            "persons": merged_persons,
        },
    )


@app.post("/group/{session_id}/join")
def join_group(session_id: str, body: JoinPersonRequest):
    """Add or update one person's preferences from a join link."""
    existing = dynamo.get_session(session_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Group not found")
    if existing.get("status") == "searched" and existing.get("restaurants"):
        raise HTTPException(
            status_code=409,
            detail="This group already has results. Open the results link to vote.",
        )

    persons = list(existing.get("persons", []))
    person_data = body.person.model_dump()
    assigned_index = body.person_index

    if assigned_index is not None and assigned_index >= 0:
        while len(persons) <= assigned_index:
            persons.append({})
        persons[assigned_index] = person_data
    else:
        name_key = person_data.get("name", "").strip().lower()
        match_idx = next(
            (
                i
                for i, p in enumerate(persons)
                if p.get("name", "").strip().lower() == name_key and name_key
            ),
            None,
        )
        if match_idx is not None:
            persons[match_idx] = person_data
            assigned_index = match_idx
        else:
            persons.append(person_data)
            assigned_index = len(persons) - 1

    result = _save_group_setup(
        session_id,
        {
            "group_name": existing.get("group_name", "Our Group"),
            "meal_type": existing.get("meal_type", "dinner"),
            "day": existing.get("day", "today"),
            "persons": persons,
        },
    )
    result["person_index"] = assigned_index
    return result


@app.post("/save/{session_id}/{restaurant_name}")
def save_restaurant(session_id: str, restaurant_name: str):
    session = dynamo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    restaurant = None
    for r in session.get("restaurants", []):
        if r.get("name") == restaurant_name:
            restaurant = r
            break

    if not restaurant:
        restaurant = {"name": restaurant_name}

    dynamo.save_restaurant(session_id, restaurant)
    return {"status": "saved"}


@app.get("/geocode/{area}")
def geocode(area: str):
    return location.geocode_area(area)


@app.get("/validate-location/{area}")
def validate_location_endpoint(area: str):
    """Validate a location input with fuzzy matching and suggestions."""
    return location.validate_location(area)


@app.get("/areas")
def list_areas():
    """All searchable MRT stations and areas for location autocomplete."""
    return {"areas": location.list_searchable_areas()}


@app.post("/gps-area")
def gps_area(body: GpsRequest):
    return location.resolve_gps_area(body.latitude, body.longitude)


@app.get("/menu/{restaurant_name:path}")
def get_menu(restaurant_name: str):
    """Search for a restaurant's menu. Returns empty if not found."""
    menu_data = exa_search.search_menu(restaurant_name)
    if not menu_data or not menu_data.get("menu_items"):
        return {
            "restaurant_name": restaurant_name,
            "menu_items": [],
            "source_url": None,
            "note": None,
        }
    return menu_data


@app.get("/menu/{restaurant_name}")
def get_menu(restaurant_name: str):
    """Search for a restaurant's menu."""
    menu_data = exa_search.search_menu(restaurant_name)
    if not menu_data:
        return {
            "restaurant_name": restaurant_name,
            "menu_items": ["No menu found for this restaurant."],
            "source_url": None,
            "note": "",
        }
    return menu_data


@app.post("/create-checkout")
def create_checkout():
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    demo_mode = os.getenv("STRIPE_DEMO_FREE", "true").lower() in ("1", "true", "yes")
    unit_amount = 0 if demo_mode else int(os.getenv("STRIPE_PRO_PRICE_CENTS", "499"))

    if not stripe.api_key:
        raise HTTPException(
            status_code=503,
            detail="Stripe not configured",
        )

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "sgd",
                        "product_data": {
                            "name": "TableFor Pro",
                            "description": (
                                "Unlimited group size · unlimited daily searches"
                                + (" · Demo $0.00/month" if demo_mode else "")
                            ),
                        },
                        "unit_amount": unit_amount,
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=(
                f"{frontend_url}?upgraded=true"
                "&checkout_session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url=frontend_url,
        )
        return {"url": session.url, "demo": demo_mode, "amount": unit_amount}
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/confirm-pro")
def confirm_pro(body: ConfirmProRequest):
    """Verify Stripe checkout and return subscription id after Go Pro."""
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    try:
        session = stripe.checkout.Session.retrieve(body.checkout_session_id)
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if session.payment_status not in ("paid", "no_payment_required"):
        raise HTTPException(status_code=400, detail="Checkout not completed")

    subscription_id = session.subscription
    if isinstance(subscription_id, dict):
        subscription_id = subscription_id.get("id")

    return {
        "status": "active",
        "subscription_id": subscription_id,
    }


@app.post("/cancel-pro")
def cancel_pro(body: CancelProRequest):
    """Cancel TableFor Pro — cancels Stripe subscription when present."""
    if body.subscription_id and stripe.api_key:
        try:
            stripe.Subscription.cancel(body.subscription_id)
        except stripe.StripeError as e:
            code = getattr(e, "code", "") or ""
            if code not in ("resource_missing",):
                raise HTTPException(status_code=500, detail=str(e))

    return {"status": "cancelled"}
