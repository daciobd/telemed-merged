#!/bin/bash
# Smoke Test - TeleMed Manager Dashboard
# v1.1 - 27/12/2025 - Adaptado para endpoints reais
#
# Uso:
#   BASE_URL="http://localhost:5000" bash scripts/smoke_test.sh

# Não usar set -e para continuar mesmo com falhas

BASE_URL="${BASE_URL:-http://localhost:5000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass=0
fail=0

log_pass() { echo -e "${GREEN}✓${NC} $1"; ((pass++)); }
log_fail() { echo -e "${RED}✗${NC} $1"; ((fail++)); }
log_info() { echo -e "${YELLOW}→${NC} $1"; }

echo ""
echo -e "${BLUE}========================================"
echo "TeleMed Smoke Test v1.1"
echo "Base URL: $BASE_URL"
echo "========================================${NC}"
echo ""

# 1) CAC Real (endpoint principal)
log_info "1. CAC Real Summary"
FROM=$(date -d "7 days ago" +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d 2>/dev/null || echo "2025-12-20")
TO=$(date +%Y-%m-%d 2>/dev/null || echo "2025-12-27")
CAC=$(curl -s "${BASE_URL}/metrics/v2/marketing/cac-real?from=${FROM}&to=${TO}" 2>/dev/null || echo '{}')
if echo "$CAC" | jq -e '.totals' > /dev/null 2>&1; then
  SPEND=$(echo "$CAC" | jq '.totals.spend // 0')
  SIGNUPS=$(echo "$CAC" | jq '.totals.signed // 0')
  log_pass "GET /cac-real → spend=$SPEND signups=$SIGNUPS"
else
  log_fail "GET /cac-real → resposta inválida: $(echo "$CAC" | head -c 100)"
fi

# 2) CAC Real Details (com alocação proporcional)
log_info "2. CAC Real Details (proporcional)"
DETAILS=$(curl -s "${BASE_URL}/metrics/v2/marketing/cac-real/details?from=${FROM}&to=${TO}&groupBy=day" 2>/dev/null || echo '{}')
if echo "$DETAILS" | jq -e '.totals' > /dev/null 2>&1; then
  SPEND=$(echo "$DETAILS" | jq '.totals.spend_cents // 0')
  ROWS=$(echo "$DETAILS" | jq '.rows | length')
  log_pass "GET /cac-real/details → spend_cents=$SPEND rows=$ROWS"
else
  log_fail "GET /cac-real/details → resposta inválida: $(echo "$DETAILS" | head -c 100)"
fi

# 3) CAC Alerts
log_info "3. CAC Alerts"
ALERTS=$(curl -s "${BASE_URL}/metrics/v2/marketing/cac-real/alerts?days=7" 2>/dev/null || echo '{}')
if echo "$ALERTS" | jq -e '.metrics' > /dev/null 2>&1; then
  OK=$(echo "$ALERTS" | jq '.ok')
  COUNT=$(echo "$ALERTS" | jq '.alerts | length')
  log_pass "GET /cac-real/alerts → ok=$OK alerts=$COUNT"
else
  log_fail "GET /cac-real/alerts → resposta inválida: $(echo "$ALERTS" | head -c 100)"
fi

# 4) Marketing Spend List
log_info "4. Marketing Spend"
SPEND_DATA=$(curl -s "${BASE_URL}/api/manager/marketing/spend?from=${FROM}&to=${TO}" 2>/dev/null || echo '{}')
if echo "$SPEND_DATA" | jq -e '.spends or .rows' > /dev/null 2>&1; then
  if echo "$SPEND_DATA" | jq -e '.spends' > /dev/null 2>&1; then
    ROWS=$(echo "$SPEND_DATA" | jq '.spends | length')
  else
    ROWS=$(echo "$SPEND_DATA" | jq '.rows | length')
  fi
  TOTAL=$(echo "$SPEND_DATA" | jq '.totals.total_spend // "N/A"')
  log_pass "GET /marketing/spend → $ROWS registros"
else
  log_fail "GET /marketing/spend → resposta inválida: $(echo "$SPEND_DATA" | head -c 100)"
fi

# 5) Experiments List
log_info "5. Experiments"
EXPS=$(curl -s "${BASE_URL}/api/experiments" 2>/dev/null || echo '{}')
if echo "$EXPS" | jq -e 'type == "array" or .experiments' > /dev/null 2>&1; then
  if echo "$EXPS" | jq -e 'type == "array"' > /dev/null 2>&1; then
    COUNT=$(echo "$EXPS" | jq 'length')
  else
    COUNT=$(echo "$EXPS" | jq '.experiments | length')
  fi
  log_pass "GET /api/experiments → $COUNT experimentos"
else
  log_fail "GET /api/experiments → resposta inválida: $(echo "$EXPS" | head -c 100)"
fi

# 6) Funil de Telemetria
log_info "6. Funil Telemetria (metrics/v2/funnel)"
FUNIL=$(curl -s "${BASE_URL}/metrics/v2/funnel?days=7" 2>/dev/null || echo '{}')
if echo "$FUNIL" | jq -e '.rows or .events' > /dev/null 2>&1; then
  EVENTS=$(echo "$FUNIL" | jq '.events // 0')
  ROWS=$(echo "$FUNIL" | jq '.rows | length')
  log_pass "GET /metrics/v2/funnel → events=$EVENTS rows=$ROWS"
else
  log_fail "GET /metrics/v2/funnel → resposta inválida: $(echo "$FUNIL" | head -c 100)"
fi

# 7) Verificação de dados do seed
log_info "7. Verificação de Seed (ads_spend)"
SEED_CHECK=$(curl -s "${BASE_URL}/api/manager/marketing/spend?from=2025-12-20&to=${TO}" 2>/dev/null || echo '{}')
if echo "$SEED_CHECK" | jq -e '.spends | length > 0' > /dev/null 2>&1; then
  SEED_ROWS=$(echo "$SEED_CHECK" | jq '.spends | length')
  log_pass "Seed verificado → $SEED_ROWS registros de gasto encontrados"
elif echo "$SEED_CHECK" | jq -e '.rows | length > 0' > /dev/null 2>&1; then
  SEED_ROWS=$(echo "$SEED_CHECK" | jq '.rows | length')
  log_pass "Seed verificado → $SEED_ROWS registros de gasto encontrados"
else
  log_fail "Seed não encontrado → nenhum registro de gasto no período"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "Resultado: ${GREEN}$pass passou${NC} / ${RED}$fail falhou${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $fail -gt 0 ]; then
  echo -e "${RED}⚠️  Alguns testes falharam. Verifique os endpoints acima.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Todos os testes passaram!${NC}"
  exit 0
fi
