#!/usr/bin/env python3
"""Quick check that AWS + Exa credentials work. Run from project root."""
import os
import sys

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.aws_config import REGION, get_client, refresh_env

def check(name: str, ok: bool, detail: str = "") -> bool:
    status = "OK" if ok else "FAIL"
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
    return ok


def main() -> int:
    refresh_env()
    print("TableFor API health check\n")

    all_ok = True

    # AWS credentials
    key = os.getenv("AWS_ACCESS_KEY_ID", "")
    has_aws = bool(key and key != "your_key_here")
    all_ok &= check(
        "AWS credentials in .env",
        has_aws,
        "missing AWS_ACCESS_KEY_ID" if not has_aws else f"key starts with {key[:4]}...",
    )
    if key.startswith("ASIA"):
        has_token = bool(os.getenv("AWS_SESSION_TOKEN"))
        all_ok &= check(
            "AWS session token (required for ASIA keys)",
            has_token,
            "add AWS_SESSION_TOKEN to .env" if not has_token else "present",
        )

    region = os.getenv("AWS_DEFAULT_REGION", "us-west-2")
    print(f"  Region: {region}\n")

    if has_aws:
        from botocore.exceptions import ClientError

        try:
            ident = get_client("sts").get_caller_identity()
            check("AWS auth (STS)", True, f"account {ident['Account']}")
        except Exception as e:
            all_ok = False
            check("AWS auth (STS)", False, str(e)[:120])

        bedrock = get_client("bedrock-runtime")
        candidates = [os.getenv("BEDROCK_MODEL_ID", "").strip()] if os.getenv("BEDROCK_MODEL_ID") else []
        candidates += [
            "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
            "us.anthropic.claude-haiku-4-5-20251001-v1:0",
            "us.amazon.nova-lite-v1:0",
            "anthropic.claude-sonnet-4-5-20250929-v1:0",
            "amazon.nova-lite-v1:0",
        ]
        seen = set()
        bedrock_ok = False
        last_err = ""
        for model in candidates:
            if not model or model in seen:
                continue
            seen.add(model)
            try:
                bedrock.converse(
                    modelId=model,
                    messages=[{"role": "user", "content": [{"text": "Say OK"}]}],
                    inferenceConfig={"maxTokens": 10},
                )
                check("Bedrock", True, model)
                bedrock_ok = True
                break
            except ClientError as e:
                err = e.response.get("Error", {})
                last_err = f"{err.get('Code')}: {err.get('Message', '')[:100]}"
        if not bedrock_ok:
            all_ok = False
            check("Bedrock", False, last_err)
            print(
                "       → WSParticipantRole may lack bedrock:InvokeModel. "
                "Ask organizers or try BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5-20250929-v1:0"
            )

        try:
            get_client("dynamodb").list_tables(Limit=1)
            check("DynamoDB", True)
        except Exception as e:
            all_ok = False
            check("DynamoDB", False, str(e)[:80])

        try:
            get_client("s3").list_buckets()
            check("S3", True)
        except Exception as e:
            all_ok = False
            check("S3", False, str(e)[:80])

    print()

    exa_key = os.getenv("EXA_API_KEY", "")
    has_exa = bool(exa_key and exa_key != "your_key_here")
    if has_exa:
        try:
            from exa_py import Exa

            exa = Exa(api_key=exa_key)
            r = exa.search(
                "Singapore restaurant",
                num_results=1,
                include_domains=["burpple.com"],
            )
            check("Exa search", bool(r.results), f"{len(r.results)} result(s)")
        except Exception as e:
            all_ok = False
            check("Exa search", False, str(e)[:80])
    else:
        all_ok = False
        check("Exa API key", False, "missing EXA_API_KEY")

    print()
    if all_ok:
        print("All checks passed. Restart backend and try Find restaurants.")
        return 0
    print("Fix the FAIL items above, then restart: uvicorn backend.main:app --port 8000")
    return 1


if __name__ == "__main__":
    sys.exit(main())
