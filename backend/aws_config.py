import os
from pathlib import Path

import boto3
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def refresh_env() -> None:
    load_dotenv(ENV_PATH, override=True)


refresh_env()

REGION = os.getenv("AWS_DEFAULT_REGION", "us-west-2")

# Disable SSL verification for local dev behind corporate proxy/VPN.
# Remove or set to True for production.
VERIFY_SSL = os.getenv("AWS_VERIFY_SSL", "false").lower() != "false"

# Suppress InsecureRequestWarning when SSL verification is disabled
if not VERIFY_SSL:
    import urllib3

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    # Monkey-patch SSL globally for all requests (Stripe, Exa, etc.)
    import ssl

    ssl._create_default_https_context = ssl._create_unverified_context

    # Also patch the requests library used by Stripe and Exa
    try:
        import requests.adapters

        _original_send = requests.adapters.HTTPAdapter.send

        def _patched_send(self, request, **kwargs):
            kwargs.setdefault("verify", False)
            return _original_send(self, request, **kwargs)

        requests.adapters.HTTPAdapter.send = _patched_send
    except ImportError:
        pass


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
