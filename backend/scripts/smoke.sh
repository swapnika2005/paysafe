#!/usr/bin/env bash
# Manual / CI-adjacent smoke checks for a running stack.
# Usage: BASE_URL=http://localhost:8000/api/v1 ./scripts/smoke.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000/api/v1}"

echo "== Health =="
curl -fsS "$BASE_URL/health" | tee /tmp/safepay-health.json
echo

echo "== Root =="
curl -fsS "${BASE_URL%/api/v1}/" || true
echo

echo "Smoke OK: health endpoint responded."
