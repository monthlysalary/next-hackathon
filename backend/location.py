"""
Singapore location intelligence module.

Features:
- 80+ MRT stations with coordinates and line info
- MRT-weighted midpoint calculation (prefers interchange stations)
- Fuzzy matching for location names (handles typos)
- Input validation with "did you mean?" suggestions
"""

import math
import os
from difflib import get_close_matches

import httpx

# ─────────────────────────────────────────────────────────
# SINGAPORE AREAS + MRT STATIONS DATABASE
# Format: name -> (latitude, longitude, [mrt_lines], is_interchange)
# ─────────────────────────────────────────────────────────

MRT_STATIONS = {
    # North-South Line (NSL)
    "jurong east": (1.3329, 103.7436, ["NSL", "EWL"], True),
    "bukit batok": (1.3490, 103.7496, ["NSL"], False),
    "bukit gombak": (1.3587, 103.7519, ["NSL"], False),
    "choa chu kang": (1.3854, 103.7445, ["NSL"], False),
    "yew tee": (1.3973, 103.7475, ["NSL"], False),
    "kranji": (1.4252, 103.7620, ["NSL"], False),
    "marsiling": (1.4326, 103.7740, ["NSL"], False),
    "woodlands": (1.4370, 103.7865, ["NSL", "TEL"], True),
    "admiralty": (1.4406, 103.8010, ["NSL"], False),
    "sembawang": (1.4491, 103.8200, ["NSL"], False),
    "canberra": (1.4430, 103.8296, ["NSL"], False),
    "yishun": (1.4304, 103.8354, ["NSL"], False),
    "khatib": (1.4173, 103.8329, ["NSL"], False),
    "ang mo kio": (1.3700, 103.8495, ["NSL"], False),
    "bishan": (1.3512, 103.8491, ["NSL", "CCL"], True),
    "braddell": (1.3406, 103.8468, ["NSL"], False),
    "toa payoh": (1.3326, 103.8474, ["NSL"], False),
    "novena": (1.3204, 103.8438, ["NSL"], False),
    "newton": (1.3136, 103.8381, ["NSL", "DTL"], True),
    "orchard": (1.3048, 103.8318, ["NSL"], False),
    "somerset": (1.3007, 103.8387, ["NSL"], False),
    "dhoby ghaut": (1.2988, 103.8456, ["NSL", "NEL", "CCL"], True),
    "city hall": (1.2933, 103.8522, ["NSL", "EWL"], True),
    "raffles place": (1.2840, 103.8514, ["NSL", "EWL"], True),
    "marina bay": (1.2764, 103.8545, ["NSL", "CCL", "TEL"], True),
    "marina south pier": (1.2715, 103.8631, ["NSL"], False),

    # East-West Line (EWL)
    "pasir ris": (1.3731, 103.9493, ["EWL"], False),
    "tampines": (1.3534, 103.9452, ["EWL", "DTL"], True),
    "simei": (1.3432, 103.9533, ["EWL"], False),
    "tanah merah": (1.3272, 103.9464, ["EWL"], False),
    "bedok": (1.3240, 103.9300, ["EWL"], False),
    "kembangan": (1.3209, 103.9129, ["EWL"], False),
    "eunos": (1.3198, 103.9031, ["EWL"], False),
    "paya lebar": (1.3179, 103.8928, ["EWL", "CCL"], True),
    "aljunied": (1.3164, 103.8829, ["EWL"], False),
    "kallang": (1.3114, 103.8714, ["EWL"], False),
    "lavender": (1.3072, 103.8630, ["EWL"], False),
    "bugis": (1.3009, 103.8559, ["EWL", "DTL"], True),
    "tanjong pagar": (1.2766, 103.8464, ["EWL"], False),
    "outram park": (1.2803, 103.8394, ["EWL", "NEL", "TEL"], True),
    "tiong bahru": (1.2862, 103.8270, ["EWL"], False),
    "redhill": (1.2894, 103.8168, ["EWL"], False),
    "queenstown": (1.2949, 103.8060, ["EWL"], False),
    "commonwealth": (1.3024, 103.7983, ["EWL"], False),
    "buona vista": (1.3072, 103.7902, ["EWL", "CCL"], True),
    "dover": (1.3114, 103.7786, ["EWL"], False),
    "clementi": (1.3150, 103.7651, ["EWL"], False),
    "chinese garden": (1.3424, 103.7326, ["EWL"], False),
    "lakeside": (1.3442, 103.7209, ["EWL"], False),
    "boon lay": (1.3388, 103.7060, ["EWL"], False),
    "pioneer": (1.3376, 103.6972, ["EWL"], False),
    "joo koon": (1.3279, 103.6783, ["EWL"], False),
    "tuas crescent": (1.3210, 103.6493, ["EWL"], False),

    # North-East Line (NEL)
    "harbourfront": (1.2654, 103.8210, ["NEL", "CCL"], True),
    "chinatown": (1.2843, 103.8448, ["NEL", "DTL"], True),
    "clarke quay": (1.2885, 103.8465, ["NEL"], False),
    "little india": (1.3063, 103.8494, ["NEL", "DTL"], True),
    "farrer park": (1.3124, 103.8541, ["NEL"], False),
    "boon keng": (1.3195, 103.8619, ["NEL"], False),
    "potong pasir": (1.3313, 103.8691, ["NEL"], False),
    "woodleigh": (1.3393, 103.8707, ["NEL"], False),
    "serangoon": (1.3496, 103.8723, ["NEL", "CCL"], True),
    "kovan": (1.3600, 103.8851, ["NEL"], False),
    "hougang": (1.3715, 103.8925, ["NEL"], False),
    "buangkok": (1.3831, 103.8927, ["NEL"], False),
    "sengkang": (1.3917, 103.8953, ["NEL"], False),
    "punggol": (1.4053, 103.9023, ["NEL"], False),

    # Circle Line (CCL)
    "botanic gardens": (1.3224, 103.8153, ["CCL", "DTL"], True),
    "farrer road": (1.3175, 103.8073, ["CCL"], False),
    "holland village": (1.3110, 103.7960, ["CCL"], False),
    "one north": (1.2996, 103.7872, ["CCL"], False),
    "kent ridge": (1.2937, 103.7846, ["CCL"], False),
    "haw par villa": (1.2826, 103.7820, ["CCL"], False),
    "pasir panjang": (1.2762, 103.7917, ["CCL"], False),
    "labrador park": (1.2722, 103.8027, ["CCL"], False),
    "telok blangah": (1.2707, 103.8098, ["CCL"], False),
    "bayfront": (1.2819, 103.8591, ["CCL", "DTL"], True),
    "promenade": (1.2934, 103.8610, ["CCL", "DTL"], True),
    "nicoll highway": (1.2998, 103.8636, ["CCL"], False),
    "stadium": (1.3028, 103.8753, ["CCL"], False),
    "mountbatten": (1.3063, 103.8825, ["CCL"], False),
    "dakota": (1.3084, 103.8886, ["CCL"], False),
    "macpherson": (1.3265, 103.8900, ["CCL", "DTL"], True),
    "tai seng": (1.3358, 103.8883, ["CCL"], False),
    "bartley": (1.3424, 103.8798, ["CCL"], False),
    "lorong chuan": (1.3512, 103.8639, ["CCL"], False),
    "marymount": (1.3490, 103.8393, ["CCL"], False),
    "caldecott": (1.3375, 103.8395, ["CCL", "TEL"], True),

    # Downtown Line (DTL)
    "bukit panjang": (1.3789, 103.7620, ["DTL"], False),
    "cashew": (1.3690, 103.7645, ["DTL"], False),
    "hillview": (1.3627, 103.7672, ["DTL"], False),
    "beauty world": (1.3408, 103.7759, ["DTL"], False),
    "king albert park": (1.3353, 103.7835, ["DTL"], False),
    "sixth avenue": (1.3308, 103.7967, ["DTL"], False),
    "tan kah kee": (1.3259, 103.8077, ["DTL"], False),
    "stevens": (1.3200, 103.8260, ["DTL", "TEL"], True),
    "rochor": (1.3037, 103.8526, ["DTL"], False),
    "downtown": (1.2793, 103.8528, ["DTL"], False),
    "telok ayer": (1.2821, 103.8487, ["DTL"], False),
    "fort canning": (1.2922, 103.8441, ["DTL"], False),
    "bencoolen": (1.2985, 103.8501, ["DTL"], False),
    "jalan besar": (1.3055, 103.8555, ["DTL"], False),
    "bendemeer": (1.3133, 103.8629, ["DTL"], False),
    "geylang bahru": (1.3214, 103.8717, ["DTL"], False),
    "mattar": (1.3268, 103.8833, ["DTL"], False),
    "ubi": (1.3300, 103.9000, ["DTL"], False),
    "kaki bukit": (1.3350, 103.9080, ["DTL"], False),
    "bedok north": (1.3347, 103.9181, ["DTL"], False),
    "bedok reservoir": (1.3367, 103.9320, ["DTL"], False),
    "tampines west": (1.3458, 103.9385, ["DTL"], False),
    "tampines east": (1.3562, 103.9545, ["DTL"], False),
    "upper changi": (1.3414, 103.9613, ["DTL"], False),
    "expo": (1.3351, 103.9617, ["DTL", "CGL"], True),

    # Thomson-East Coast Line (TEL)
    "woodlands north": (1.4489, 103.7850, ["TEL"], False),
    "woodlands south": (1.4271, 103.7930, ["TEL"], False),
    "springleaf": (1.3976, 103.8189, ["TEL"], False),
    "lentor": (1.3848, 103.8362, ["TEL"], False),
    "mayflower": (1.3712, 103.8383, ["TEL"], False),
    "bright hill": (1.3634, 103.8337, ["TEL"], False),
    "upper thomson": (1.3540, 103.8330, ["TEL"], False),
    "napier": (1.3069, 103.8226, ["TEL"], False),
    "orchard boulevard": (1.3023, 103.8283, ["TEL"], False),
    "great world": (1.2933, 103.8317, ["TEL"], False),
    "havelock": (1.2885, 103.8367, ["TEL"], False),
    "maxwell": (1.2793, 103.8450, ["TEL"], False),
    "shenton way": (1.2763, 103.8467, ["TEL"], False),
    "gardens by the bay": (1.2824, 103.8659, ["TEL"], False),
    "tanjong rhu": (1.2964, 103.8729, ["TEL"], False),
    "katong park": (1.3017, 103.8849, ["TEL"], False),
    "tanjong katong": (1.3048, 103.8948, ["TEL"], False),
    "marine parade": (1.3026, 103.9053, ["TEL"], False),
    "marine terrace": (1.3066, 103.9134, ["TEL"], False),
    "siglap": (1.3113, 103.9248, ["TEL"], False),
    "bayshore": (1.3153, 103.9395, ["TEL"], False),

    # Additional areas (not MRT but commonly referenced)
    "jurong west": (1.3404, 103.7090, [], False),
    "tuas": (1.3150, 103.6360, [], False),
    "changi": (1.3573, 103.9880, [], False),
    "sentosa": (1.2494, 103.8303, [], False),
    "east coast": (1.3015, 103.9123, [], False),
    "katong": (1.3050, 103.8950, [], False),
    "tiong bahru": (1.2862, 103.8270, ["EWL"], False),
    "river valley": (1.2930, 103.8350, [], False),
    "robertson quay": (1.2905, 103.8380, [], False),
    "tanjong pagar": (1.2766, 103.8464, ["EWL"], False),
    "nus": (1.2966, 103.7764, [], False),
    "ntu": (1.3456, 103.6819, [], False),
    "changi airport": (1.3571, 103.9882, ["CGL"], False),
}

# Simplified lookup: area name -> (lat, lng) for backward compatibility
SINGAPORE_AREAS = {
    name: (data[0], data[1]) for name, data in MRT_STATIONS.items()
}


# ─────────────────────────────────────────────────────────
# FUZZY MATCHING + INPUT VALIDATION
# ─────────────────────────────────────────────────────────

# Common aliases and abbreviations
AREA_ALIASES = {
    "amk": "ang mo kio",
    "tpy": "toa payoh",
    "cck": "choa chu kang",
    "jw": "jurong west",
    "je": "jurong east",
    "bb": "bukit batok",
    "bg": "bukit gombak",
    "bp": "bukit panjang",
    "mbs": "marina bay",
    "marina bay sands": "marina bay",
    "cbd": "raffles place",
    "town": "city hall",
    "city": "city hall",
    "hv": "holland village",
    "holland v": "holland village",
    "botanic garden": "botanic gardens",
    "botanical gardens": "botanic gardens",
    "little india": "little india",
    "geylang": "aljunied",
    "ubi": "ubi",
    "expo": "expo",
    "changi airport": "changi airport",
    "airport": "changi airport",
    "harbourfront": "harbourfront",
    "vivocity": "harbourfront",
    "vivo city": "harbourfront",
    "imm": "jurong east",
    "westgate": "jurong east",
    "jem": "jurong east",
    "nex": "serangoon",
    "waterway point": "punggol",
    "jewel": "changi airport",
    "Somerset": "somerset",
    "somerset 313": "somerset",
    "313": "somerset",
    "ion": "orchard",
    "ion orchard": "orchard",
    "plaza sing": "dhoby ghaut",
    "plaza singapura": "dhoby ghaut",
    "compass one": "sengkang",
    "compassone": "sengkang",
    "tampines mall": "tampines",
    "tampines 1": "tampines",
    "our tampines hub": "tampines",
    "oth": "tampines",
    "yew tee point": "yew tee",
}


def _normalize(name: str) -> str:
    """Normalize an area name for matching."""
    return name.lower().strip()


def fuzzy_match_area(input_name: str) -> tuple[str | None, list[str]]:
    """
    Match a user input to a known area.

    Returns:
        (matched_area, suggestions)
        - matched_area: exact or alias match (None if no confident match)
        - suggestions: list of close matches if no exact match
    """
    normalized = _normalize(input_name)

    # 1. Exact match
    if normalized in MRT_STATIONS:
        return normalized, []

    # 2. Alias match
    if normalized in AREA_ALIASES:
        return AREA_ALIASES[normalized], []

    # 3. Partial match (input contains area or area contains input)
    for area in MRT_STATIONS:
        if area in normalized or normalized in area:
            return area, []

    # 4. Alias partial match
    for alias, area in AREA_ALIASES.items():
        if alias in normalized or normalized in alias:
            return area, []

    # 5. Fuzzy match with difflib
    all_names = list(MRT_STATIONS.keys()) + list(AREA_ALIASES.keys())
    close = get_close_matches(normalized, all_names, n=3, cutoff=0.6)

    if close:
        # If the best match is very close (cutoff 0.8), use it directly
        best_matches_strict = get_close_matches(normalized, all_names, n=1, cutoff=0.8)
        if best_matches_strict:
            match = best_matches_strict[0]
            resolved = AREA_ALIASES.get(match, match)
            return resolved, []

        # Otherwise return suggestions
        suggestions = []
        for c in close:
            resolved = AREA_ALIASES.get(c, c)
            if resolved not in suggestions:
                suggestions.append(resolved)
        return None, suggestions

    # 6. No match at all
    return None, []


def validate_location(area_name: str) -> dict:
    """
    Validate a location input and return structured result.

    Returns dict with:
        - valid: bool
        - area: resolved area name (if valid)
        - latitude/longitude: coords (if valid)
        - suggestions: list of alternatives (if invalid)
        - message: human-readable feedback
    """
    matched, suggestions = fuzzy_match_area(area_name)

    if matched:
        lat, lng = SINGAPORE_AREAS[matched]
        return {
            "valid": True,
            "area": matched.title(),
            "latitude": lat,
            "longitude": lng,
            "suggestions": [],
            "message": f"Matched to {matched.title()}",
        }

    if suggestions:
        return {
            "valid": False,
            "area": None,
            "latitude": None,
            "longitude": None,
            "suggestions": [s.title() for s in suggestions],
            "message": f"Location not recognized. Did you mean: {', '.join(s.title() for s in suggestions)}?",
        }

    return {
        "valid": False,
        "area": None,
        "latitude": None,
        "longitude": None,
        "suggestions": [],
        "message": f"Location '{area_name}' not recognized. Try an MRT station name or area like 'Bishan', 'Tampines', 'Orchard'.",
    }


# ─────────────────────────────────────────────────────────
# GEOCODING
# ─────────────────────────────────────────────────────────

def _fallback_geocode(area_name: str) -> dict:
    """Geocode using local database with fuzzy matching."""
    matched, _ = fuzzy_match_area(area_name)
    if matched:
        lat, lng = SINGAPORE_AREAS[matched]
        return {"latitude": lat, "longitude": lng}
    # Default to Singapore center
    return {"latitude": 1.3521, "longitude": 103.8198}


def geocode_area(area_name: str) -> dict:
    """Geocode an area name. Uses Mapbox if available, falls back to local DB."""
    # Try local match first (faster and works offline)
    matched, _ = fuzzy_match_area(area_name)
    if matched:
        lat, lng = SINGAPORE_AREAS[matched]
        return {"latitude": lat, "longitude": lng}

    # Try Mapbox for unknown areas
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


# ─────────────────────────────────────────────────────────
# MRT-WEIGHTED MIDPOINT CALCULATION
# ─────────────────────────────────────────────────────────

def _station_connectivity_score(station_name: str) -> float:
    """
    Score a station by MRT connectivity.
    Interchanges score higher (more accessible from different lines).
    """
    data = MRT_STATIONS.get(station_name)
    if not data:
        return 1.0
    lines = data[2]
    is_interchange = data[3]

    if is_interchange:
        return 2.0 + len(lines) * 0.5  # e.g., Dhoby Ghaut (3 lines) = 3.5
    if lines:
        return 1.5
    return 1.0  # No MRT


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km between two points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_midpoint(locations: list[dict]) -> dict:
    """
    Calculate MRT-weighted midpoint for a group.

    Instead of simple geographic average, this:
    1. Computes the geographic centroid
    2. Finds nearby MRT stations (within 3km)
    3. Weights them by connectivity (interchanges preferred)
    4. Returns the best accessible meeting point
    """
    if not locations:
        return {"latitude": 1.3521, "longitude": 103.8198}

    # Step 1: Geographic centroid
    avg_lat = sum(loc["latitude"] for loc in locations) / len(locations)
    avg_lng = sum(loc["longitude"] for loc in locations) / len(locations)

    # Step 2: Find MRT stations within 3km of centroid
    candidates = []
    for name, (lat, lng, lines, is_interchange) in MRT_STATIONS.items():
        if not lines:  # Skip non-MRT areas
            continue
        dist = _haversine_km(avg_lat, avg_lng, lat, lng)
        if dist <= 3.0:
            connectivity = _station_connectivity_score(name)
            # Score = connectivity bonus - distance penalty
            # This prefers nearby interchanges over distant ones
            score = connectivity - (dist * 0.5)
            candidates.append((name, lat, lng, score, dist))

    if not candidates:
        # No stations within 3km — expand to 6km
        for name, (lat, lng, lines, is_interchange) in MRT_STATIONS.items():
            if not lines:
                continue
            dist = _haversine_km(avg_lat, avg_lng, lat, lng)
            if dist <= 6.0:
                connectivity = _station_connectivity_score(name)
                score = connectivity - (dist * 0.3)
                candidates.append((name, lat, lng, score, dist))

    if not candidates:
        # Still nothing — return raw centroid
        return {"latitude": avg_lat, "longitude": avg_lng}

    # Step 3: Also factor in total travel distance from all group members
    best_score = float("-inf")
    best_station = None

    for name, lat, lng, connectivity_score, centroid_dist in candidates:
        # Calculate average distance from all group members to this station
        total_member_dist = sum(
            _haversine_km(loc["latitude"], loc["longitude"], lat, lng)
            for loc in locations
        )
        avg_member_dist = total_member_dist / len(locations)

        # Final score: high connectivity, low average travel
        final_score = connectivity_score - (avg_member_dist * 0.3)

        if final_score > best_score:
            best_score = final_score
            best_station = (lat, lng)

    if best_station:
        return {"latitude": best_station[0], "longitude": best_station[1]}

    return {"latitude": avg_lat, "longitude": avg_lng}


def get_nearest_area(lat: float, lng: float) -> str:
    """Find the nearest named MRT station/area to given coordinates."""
    best_area = "orchard"
    best_dist = float("inf")
    for area, (area_lat, area_lng, lines, _) in MRT_STATIONS.items():
        # Prefer stations with MRT lines
        dist = _haversine_km(lat, lng, area_lat, area_lng)
        if lines:
            dist *= 0.8  # 20% bonus for MRT stations
        if dist < best_dist:
            best_dist = dist
            best_area = area
    return best_area.title()
