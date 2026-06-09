from pydantic import BaseModel


class PersonProfile(BaseModel):
    name: str
    location: str
    latitude: float | None = None
    longitude: float | None = None
    budget: str
    dietary: list[str]
    cuisine_loves: list[str]
    must_have: list[str]
    avoid: list[str]


class GroupRequest(BaseModel):
    group_name: str = "Our Group"
    session_id: str | None = None
    persons: list[PersonProfile]
    meal_type: str
    day: str


class RefineRequest(BaseModel):
    session_id: str
    message: str


class VoteRequest(BaseModel):
    session_id: str
    voter_name: str
    restaurant_name: str


class RestaurantResult(BaseModel):
    name: str
    area: str
    address: str
    cuisine: str
    price_range: str
    tags: list[str]
    satisfies: list[str]
    deal: str | None
    summary: str
    why_this_group: str
    maps_url: str
    latitude: float | None = None
    longitude: float | None = None
    match_score: int
    photo_url: str | None = None
    opening_hours: str | None = None
    reservation_url: str | None = None


class AgentResponse(BaseModel):
    session_id: str
    suggested_area: str
    area_reason: str
    travel_summary: dict
    restaurants: list[RestaurantResult]
    warning: str | None = None


class VoteStatus(BaseModel):
    votes: dict[str, list[str]]  # restaurant_name -> list of voter names
    total_voters: int


class GpsRequest(BaseModel):
    latitude: float
    longitude: float
