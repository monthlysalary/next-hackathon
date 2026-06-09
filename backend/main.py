import os
import re

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
    GpsRequest,
    GroupRequest,
    RefineRequest,
    VoteRequest,
    VoteStatus,
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

app = FastAPI(title="TableFor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1):\d+",
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


@app.post("/find", response_model=AgentResponse)
async def find_restaurants(request: GroupRequest):
    if len(request.persons) < 2:
        raise HTTPException(status_code=400, detail="At least 2 persons required")
    if len(request.persons) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 persons allowed")
    return await agent.run_agent(request)


@app.post("/refine", response_model=AgentResponse)
async def refine_restaurants(request: RefineRequest):
    """Re-run the AI with user's adjustment message (e.g. 'quieter', 'cheaper')."""
    try:
        return await agent.refine_results(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


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


@app.post("/gps-area")
def gps_area(body: GpsRequest):
    area = location.get_nearest_area(body.latitude, body.longitude)
    return {"area": area}


@app.get("/menu/{restaurant_name}")
def get_menu(restaurant_name: str):
    """Search for a restaurant's menu (Pro feature)."""
    menu_data = exa_search.search_menu(restaurant_name)
    if not menu_data:
        menu_data = {
            "restaurant_name": restaurant_name,
            "menu_items": [
                f"Popular dishes at {restaurant_name}:",
                "Set Lunch A — S$12.90",
                "Set Lunch B — S$14.90",
                "Signature Main Course — S$16.90",
                "Appetizer Platter — S$8.90",
                "Soup of the Day — S$5.50",
                "Dessert — S$6.90",
                "Drinks from S$2.50",
            ],
            "source_url": f"https://www.google.com/search?q={restaurant_name.replace(' ', '+')}+Singapore+menu",
            "note": "Estimated prices. Tap the link below for the latest menu.",
        }
    return menu_data


@app.post("/create-checkout")
def create_checkout():
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

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
                            "name": (
                                "TableFor Pro — unlimited saves "
                                "+ priority recommendations"
                            ),
                        },
                        "unit_amount": 499,
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=f"{frontend_url}?upgraded=true",
            cancel_url=frontend_url,
        )
        return {"url": session.url}
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))
