#!/bin/bash
# Hitchr Campus Backend Smoke Test
# Run after every backend change. All must return 200.
#
# Usage: ./scripts/smoke_test.sh [BASE_URL]
#   BASE_URL defaults to http://localhost:8001/api

set -e
BASE="${1:-http://localhost:8001/api}"

echo "=== Hitchr Campus Backend Smoke Test ==="
echo "Base: $BASE"
echo ""

check() {
  local method="$1"
  local path="$2"
  local data="$3"
  local url="${BASE}${path}"
  local code

  if [ "$method" = "GET" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  elif [ "$method" = "POST" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
  elif [ "$method" = "PATCH" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$url")
  fi

  if [ "$code" = "200" ]; then
    echo "  ✅ $method $path → 200"
  else
    echo "  ❌ $method $path → $code"
    exit 1
  fi
}

echo "1. Health check"
check GET "/health" ""
echo ""

echo "2. Seed campus data"
check POST "/seed-campus" "{}"
echo ""

echo "3. Feed endpoints"
check GET "/routes" ""
check GET "/planned-trips" ""
check GET "/memories" ""
check GET "/communities" ""
echo ""

echo "4. Create user + role toggle"
USER_RESP=$(curl -s -X POST "$BASE/users" -H "Content-Type: application/json" -d '{"name":"SmokeTest","college":"DU"}')
USER_ID=$(echo "$USER_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
if [ -z "$USER_ID" ]; then
  echo "  ❌ POST /users → failed to get user id"
  exit 1
fi
echo "  ✅ POST /users → 200 (user=$USER_ID)"
check PATCH "/users/$USER_ID/role?role=pilot" ""
echo ""

echo "=== All smoke tests passed ==="
