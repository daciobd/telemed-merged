#!/usr/bin/env bash
set -euo pipefail

BASE="https://60caaae2-b759-4421-bea0-41165f6b95a2-00-3gqmyfv0qhnan.worf.replit.dev"
echo "BASE=$BASE"

echo "== GET /health =="
curl -sS -w "\nHTTP %{http_code}\n" -o /tmp/health.json "$BASE/health" || true
echo "-- body --"
cat /tmp/health.json || true
echo

echo "== GET /api/auction/health =="
curl -sS -w "\nHTTP %{http_code}\n" -o /tmp/auction.json "$BASE/api/auction/health" || true
echo "-- body --"
cat /tmp/auction.json || true
echo
