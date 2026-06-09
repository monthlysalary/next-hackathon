import os

REGION = os.getenv("AWS_DEFAULT_REGION", "us-west-2")

# Disable SSL verification for local dev behind corporate proxy/VPN.
# Remove or set to True for production.
VERIFY_SSL = os.getenv("AWS_VERIFY_SSL", "false").lower() != "false"

# Suppress InsecureRequestWarning when SSL verification is disabled
if not VERIFY_SSL:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
