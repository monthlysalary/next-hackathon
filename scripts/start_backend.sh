#!/bin/bash
# Start backend with fresh .env credentials (hackathon-friendly)
set -e
cd "$(dirname "$0")/.."

# Clear stale shell credentials so only .env is used
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE

echo "Checking APIs..."
python3 scripts/check_apis.py || {
  echo ""
  echo "Fix .env credentials first, then run this script again."
  exit 1
}

echo ""
echo "Starting backend on http://0.0.0.0:8000"
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE
exec python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
