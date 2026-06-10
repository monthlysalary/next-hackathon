import json
import time
from decimal import Decimal
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

from backend.aws_config import REGION


def _convert_floats(obj):
    """Convert all float values to Decimal for DynamoDB compatibility."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: _convert_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_floats(i) for i in obj]
    return obj


TABLE_NAME = "tablefor-sessions"

_dynamodb = boto3.resource("dynamodb", region_name=REGION)
_table = None
_dynamo_enabled = True

# In-memory fallback when AWS credentials aren't available (local dev)
_local_sessions: dict[str, dict] = {}
_LOCAL_STORE_PATH = Path(__file__).resolve().parent.parent / ".local-sessions.json"


def _load_local_store() -> None:
    global _local_sessions
    if not _LOCAL_STORE_PATH.exists():
        return
    try:
        _local_sessions = json.loads(_LOCAL_STORE_PATH.read_text())
    except (OSError, json.JSONDecodeError) as e:
        print(f"Could not load local sessions: {e}")


def _persist_local_store() -> None:
    try:
        _LOCAL_STORE_PATH.write_text(json.dumps(_local_sessions, default=str))
    except OSError as e:
        print(f"Could not persist local sessions: {e}")


_load_local_store()


def _get_table():
    global _table, _dynamo_enabled
    if not _dynamo_enabled:
        return None
    if _table is not None:
        return _table

    try:
        _table = _dynamodb.create_table(
            TableName=TABLE_NAME,
            KeySchema=[{"AttributeName": "session_id", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "session_id", "AttributeType": "S"}
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        _table.wait_until_exists()
        try:
            _dynamodb.meta.client.update_time_to_live(
                TableName=TABLE_NAME,
                TimeToLiveSpecification={
                    "Enabled": True,
                    "AttributeName": "ttl",
                },
            )
        except ClientError:
            pass
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceInUseException":
            _table = _dynamodb.Table(TABLE_NAME)
        else:
            print(f"DynamoDB unavailable, using in-memory store: {e}")
            _dynamo_enabled = False
            return None
    except (NoCredentialsError, BotoCoreError) as e:
        print(f"DynamoDB unavailable, using in-memory store: {e}")
        _dynamo_enabled = False
        return None

    return _table


def save_session(session_id: str, data: dict) -> None:
    item = {
        "session_id": session_id,
        "ttl": int(time.time()) + 86400,
        "saved_restaurants": [],
        "votes": {},
        "voters": [],
        **data,
    }
    table = _get_table()
    if table is None:
        _local_sessions[session_id] = item
        _persist_local_store()
        return
    try:
        table.put_item(Item=_convert_floats(item))
    except (ClientError, NoCredentialsError, BotoCoreError) as e:
        print(f"DynamoDB save failed, using in-memory store: {e}")
        _local_sessions[session_id] = item
        _persist_local_store()


def get_session(session_id: str) -> dict | None:
    if session_id in _local_sessions:
        return _local_sessions[session_id]
    table = _get_table()
    if table is None:
        return None
    try:
        response = table.get_item(Key={"session_id": session_id})
        item = response.get("Item")
        if item:
            return item
    except (ClientError, NoCredentialsError, BotoCoreError):
        pass
    return _local_sessions.get(session_id)


def save_restaurant(session_id: str, restaurant: dict) -> None:
    table = _get_table()
    if table is None:
        session = _local_sessions.get(session_id)
        if session:
            session.setdefault("saved_restaurants", []).append(restaurant)
            _persist_local_store()
        return
    try:
        table.update_item(
            Key={"session_id": session_id},
            UpdateExpression=(
                "SET saved_restaurants = list_append("
                "if_not_exists(saved_restaurants, :empty), :restaurant)"
            ),
            ExpressionAttributeValues={
                ":restaurant": [restaurant],
                ":empty": [],
            },
        )
    except (ClientError, NoCredentialsError, BotoCoreError) as e:
        print(f"DynamoDB save_restaurant failed: {e}")
        session = _local_sessions.get(session_id)
        if session:
            session.setdefault("saved_restaurants", []).append(restaurant)
            _persist_local_store()


def cast_vote(session_id: str, voter_name: str, restaurant_name: str) -> dict:
    """Cast a vote for a restaurant. Returns updated vote tallies."""
    session = get_session(session_id)
    if not session:
        return {"votes": {}, "voters": []}

    votes = session.get("votes", {})
    voters = session.get("voters", [])

    # Convert Decimal values if from DynamoDB
    if isinstance(votes, dict):
        votes = {k: list(v) if not isinstance(v, list) else v for k, v in votes.items()}

    # Remove previous vote by this voter (one vote per person)
    for r_name in list(votes.keys()):
        if voter_name in votes[r_name]:
            votes[r_name].remove(voter_name)
            if not votes[r_name]:
                del votes[r_name]

    # Add new vote
    if restaurant_name not in votes:
        votes[restaurant_name] = []
    votes[restaurant_name].append(voter_name)

    # Track unique voters
    if voter_name not in voters:
        voters.append(voter_name)

    # Persist
    table = _get_table()
    if table is None:
        session["votes"] = votes
        session["voters"] = voters
        _local_sessions[session_id] = session
        _persist_local_store()
    else:
        try:
            table.update_item(
                Key={"session_id": session_id},
                UpdateExpression="SET votes = :votes, voters = :voters",
                ExpressionAttributeValues={
                    ":votes": votes,
                    ":voters": voters,
                },
            )
        except (ClientError, NoCredentialsError, BotoCoreError) as e:
            print(f"DynamoDB vote failed: {e}")
            session["votes"] = votes
            session["voters"] = voters
            _local_sessions[session_id] = session
            _persist_local_store()

    return {"votes": votes, "voters": voters}


def get_votes(session_id: str) -> dict:
    """Get current vote tallies for a session."""
    session = get_session(session_id)
    if not session:
        return {"votes": {}, "voters": []}
    votes = session.get("votes", {})
    voters = session.get("voters", [])
    return {"votes": votes, "voters": voters}
