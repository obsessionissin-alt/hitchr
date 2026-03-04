#!/usr/bin/env python3
"""
Verify live_sessions TTL expiration.

Tests:
1. Pilot starts live, never sends location updates
2. After ~60s, document is auto-deleted (no zombie pilots)
3. Radar returns no stale ghosts

Usage:
  python3 scripts/verify_live_ttl.py [--base-url URL] [--wait-seconds N]

Requires: requests (pip install requests)
"""
import argparse
import sys
import time

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

DEFAULT_URL = "http://localhost:8001/api"
TEST_PILOT_ID = "ttl_verify_pilot_001"


def main():
    parser = argparse.ArgumentParser(description="Verify live_sessions TTL")
    parser.add_argument("--base-url", default=DEFAULT_URL, help="API base URL (e.g. http://localhost:8001/api)")
    parser.add_argument("--wait-seconds", type=int, default=70, help="Seconds to wait for TTL")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    # Ensure base ends with /api for correct path construction
    if not base.endswith("/api"):
        base = f"{base.rstrip('/')}/api"
    wait = args.wait_seconds

    print("=== Live Sessions TTL Verification ===\n")

    # 0. Pre-check: verify hitchr-campus backend is reachable
    print(f"0. GET {base}/health (pre-check)")
    try:
        r = requests.get(f"{base}/health", timeout=5)
        if r.status_code != 200:
            print(f"   FAIL: {r.status_code} - Is hitchr-campus FastAPI backend running?")
            print("   Start with: cd hitchr-campus/backend && uvicorn server:app --host 0.0.0.0 --port 8001")
            sys.exit(1)
        print("   OK")
    except requests.exceptions.ConnectionError:
        print("   FAIL: Connection refused. Start the backend first:")
        print("   cd hitchr-campus/backend && uvicorn server:app --host 0.0.0.0 --port 8001")
        sys.exit(1)

    # 1. Start live (no location updates)
    print(f"\n1. POST {base}/live/start (pilot_id={TEST_PILOT_ID})")
    r = requests.post(f"{base}/live/start", json={"pilot_id": TEST_PILOT_ID, "seats_available": 2}, timeout=10)
    if r.status_code != 200:
        print(f"   FAIL: {r.status_code} {r.text}")
        if r.status_code == 404:
            print("   Hint: Restart the hitchr-campus backend to load live routes:")
            print("   cd hitchr-campus/backend && uvicorn server:app --host 0.0.0.0 --port 8001")
        sys.exit(1)
    print("   OK")

    # 2. Verify document exists
    print(f"\n2. GET {base}/debug/overview")
    r = requests.get(f"{base}/debug/overview", timeout=10)
    if r.status_code != 200:
        print(f"   FAIL: {r.status_code}")
        sys.exit(1)
    data = r.json()
    count_before = data.get("live_sessions", -1)
    print(f"   live_sessions count: {count_before}")
    if count_before < 1:
        print("   FAIL: Expected at least 1 live_session")
        sys.exit(1)

    # 3. Radar should see pilot (at 0,0 - placeholder location)
    print(f"\n3. GET {base}/live/radar?lat=0&lng=0&radius_km=5")
    r = requests.get(f"{base}/live/radar", params={"lat": 0, "lng": 0, "radius_km": 5}, timeout=10)
    if r.status_code != 200:
        print(f"   FAIL: {r.status_code}")
        sys.exit(1)
    pilots = r.json()
    print(f"   Pilots in radar: {len(pilots)}")
    if not any(p.get("pilot_id") == TEST_PILOT_ID for p in pilots):
        print("   WARN: Pilot not in radar (may be expected if geo filter excludes 0,0)")

    # 4. Wait for TTL
    print(f"\n4. Waiting {wait}s for MongoDB TTL to expire documents...")
    time.sleep(wait)
    print("   Done")

    # 5. Verify document is gone
    print(f"\n5. GET {base}/debug/overview")
    r = requests.get(f"{base}/debug/overview", timeout=10)
    if r.status_code != 200:
        print(f"   FAIL: {r.status_code}")
        sys.exit(1)
    data = r.json()
    count_after = data.get("live_sessions", -1)
    print(f"   live_sessions count: {count_after}")
    if count_after >= count_before:
        print("   FAIL: Document should have been deleted by TTL")
        sys.exit(1)
    print("   OK: Document removed by TTL")

    # 6. Radar should return no ghosts
    print(f"\n6. GET {base}/live/radar?lat=0&lng=0&radius_km=5")
    r = requests.get(f"{base}/live/radar", params={"lat": 0, "lng": 0, "radius_km": 5}, timeout=10)
    if r.status_code != 200:
        print(f"   FAIL: {r.status_code}")
        sys.exit(1)
    pilots = r.json()
    ghost = [p for p in pilots if p.get("pilot_id") == TEST_PILOT_ID]
    if ghost:
        print(f"   FAIL: Stale radar ghost: {ghost}")
        sys.exit(1)
    print("   OK: No stale radar ghosts")

    print("\n=== All TTL checks passed ===")


if __name__ == "__main__":
    main()
