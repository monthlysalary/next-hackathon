import os

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
    import requests.adapters
    _original_send = requests.adapters.HTTPAdapter.send

    def _patched_send(self, request, **kwargs):
        kwargs.setdefault("verify", False)
        return _original_send(self, request, **kwargs)

    requests.adapters.HTTPAdapter.send = _patched_send
