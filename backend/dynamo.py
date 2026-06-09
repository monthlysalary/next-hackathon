import time

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

from backend.aws_config import REGION

TABLE_NAME = "tablefor-sessions"

_dynamodb = boto3.resource("dynamodb", region_name=REGION)
_table = None
_dynamo_enabled = True

# In-memory fallback when AWS credentials aren't available (local dev)
_local_sessions: dict[str, dict] = {}


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
        **data,
    }
    table = _get_table()
    if table is None:
        _local_sessions[session_id] = item
        return
    try:
        table.put_item(Item=item)
    except (ClientError, NoCredentialsError, BotoCoreError) as e:
        print(f"DynamoDB save failed, using in-memory store: {e}")
        _local_sessions[session_id] = item


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
