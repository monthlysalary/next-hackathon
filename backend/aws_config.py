import os
from pathlib import Path

import boto3
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def refresh_env() -> None:
    load_dotenv(ENV_PATH, override=True)


refresh_env()

REGION = os.getenv("AWS_DEFAULT_REGION", "us-west-2")


def get_boto_session() -> boto3.Session:
    refresh_env()
    key = os.getenv("AWS_ACCESS_KEY_ID")
    secret = os.getenv("AWS_SECRET_ACCESS_KEY")
    token = os.getenv("AWS_SESSION_TOKEN")
    if key and secret:
        return boto3.Session(
            aws_access_key_id=key,
            aws_secret_access_key=secret,
            aws_session_token=token or None,
            region_name=REGION,
        )
    return boto3.Session(region_name=REGION)


def get_client(service: str):
    return get_boto_session().client(service)


def get_resource(service: str):
    return get_boto_session().resource(service)
