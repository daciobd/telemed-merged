#!/bin/bash
# Smoke Test - TeleMed Manager Dashboard
# v1.0 - 26/12/2025
#
# Uso:
#   BASE_URL="https://telemed-unified.onrender.com" \
#   MANAGER_COOKIE="connect.sid=...;" \
#   INTERNAL_TOKEN="SEU_TOKEN" \
#   bash scripts/smoke_test.sh

set -e

BASE_URL="${BASE_URL:-http://localhost:5000}"
MANAGER_COOKIE="${MANAGER_COOKIE:-}"
INTERNAL_TOKEN="${INTERNAL_TOKEN:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass=0
fail=0

log_pass() { echo -e "${GREEN}✓${NC} $1"; ((pass++)); }
log_fail() { echo -e "${RED}✗${NC} $1"; ((fail++)); }
log_info() { echo -e "${YELLOW}→${NC} $1"; }

# Helper: curl GET com autenticação
curl_get() {
  local path="$1"
  if [ -n "$MANAGER_COOKIE" ]; then
    curl -s -b "$MANAGER_COOKIE" "${BASE_URL}${path}"
  elif [ -n "$INTERNAL_TOKEN" ]; then
    curl -s -H "Authorization: Bearer $INTERNAL_TOKEN" "${BASE_URL}${path}"
  else
    curl -s "${BASE_URL}${path}"
  fi
}

echo ""
echo "========================================"
echo "TeleMed Smoke Test"
echo "Base URL: $BASE_URL"
echo "========================================"
echo ""

# 1) Health Check
log_info "1. Health Check"
HEALTH=$(curl_get "/health" 2>/dev/null || echo '{}')
if echo "$HEALTH" | jq -e '.status == "ok"' > /dev/null 2>&1; then
  log_pass "GET /health → status=ok"
else
  log_fail "GET /health → resposta inesperada"
fi

# 2) CAC Real Details
log_info "2. CAC Real Details"
FROM=$(date -d "7 days ago" +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d)
TO=$(date +%Y-%m-%d)
CAC=$(curl_get "/metrics/v2/marketing/cac-real/details?from=${FROM}&to=${TO}" 2>/dev/null || echo '{}')
if echo "$CAC" | jq -e '.totals' > /dev/null 2>&1; then
  SPEND=$(echo "$CAC" | jq '.totals.spend_cents // 0')
  SIGNUPS=$(echo "$CAC" | jq '.totals.signups // 0')
  log_pass "GET /cac-real/details → spend=$SPEND signups=$SIGNUPS"
else
  log_fail "GET /cac-real/details → resposta inválida"
fi

# 3) CAC Alerts
log_info "3. CAC Alerts"
ALERTS=$(curl_get "/metrics/v2/marketing/cac-real/alerts?days=7" 2>/dev/null || echo '{}')
if echo "$ALERTS" | jq -e '.metrics' > /dev/null 2>&1; then
  OK=$(echo "$ALERTS" | jq '.ok')
  COUNT=$(echo "$ALERTS" | jq '.alerts | length')
  log_pass "GET /cac-real/alerts → ok=$OK alerts=$COUNT"
else
  log_fail "GET /cac-real/alerts → resposta inválida"
fi

# 4) Marketing Spend List
log_info "4. Marketing Spend"
SPEND_DATA=$(curl_get "/metrics/v2/marketing/spend?from=${FROM}&to=${TO}" 2>/dev/null || echo '{}')
if echo "$SPEND_DATA" | jq -e '.rows' > /dev/null 2>&1; then
  ROWS=$(echo "$SPEND_DATA" | jq '.rows | length')
  log_pass "GET /marketing/spend → $ROWS registros"
else
  log_fail "GET /marketing/spend → resposta inválida"
fi

# 5) Experiments List
log_info "5. Experiments"
EXPS=$(curl_get "/api/experiments" 2>/dev/null || echo '[]')
if echo "$EXPS" | jq -e 'type == "array"' > /dev/null 2>&1; then
  COUNT=$(echo "$EXPS" | jq 'length')
  log_pass "GET /api/experiments → $COUNT experimentos"
else
  log_fail "GET /api/experiments → resposta inválida"
fi

# 6) Funil Clínico
log_info "6. Funil Clínico"
FUNIL=$(curl_get "/metrics/v2?days=7" 2>/dev/null || echo '{}')
if echo "$FUNIL" | jq -e '.funnel' > /dev/null 2>&1; then
  CRIADOS=$(echo "$FUNIL" | jq '.funnel.criados // 0')
  log_pass "GET /metrics/v2 → criados=$CRIADOS"
else
  log_fail "GET /metrics/v2 → resposta inválida"
fi

echo ""
echo "========================================"
echo -e "Resultado: ${GREEN}$pass passou${NC} / ${RED}$fail falhou${NC}"
echo "========================================"
echo ""

if [ $fail -gt 0 ]; then
  exit 1
fi
