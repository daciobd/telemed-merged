#!/bin/bash
# Script de verificação de páginas canônicas
# Usage: bash scripts/check-pages.sh

set -e

BASE="${BASE_URL:-http://localhost:5000}"

echo "🧪 Verificando páginas canônicas em: $BASE"
echo "═══════════════════════════════════════════════════════════"

pages=(
  /consulta.html
  /sala-de-espera.html
  /phr.html
  /dashboard-piloto.html
  /agenda.html
  /bidconnect-standalone.html
  /index.html
)

failed=0

for p in "${pages[@]}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p" 2>/dev/null || echo "ERROR")
  
  if [ "$code" = "200" ]; then
    echo "✅ $p → $code"
  else
    echo "❌ $p → $code (ESPERADO: 200)"
    failed=$((failed + 1))
  fi
done

echo "═══════════════════════════════════════════════════════════"

if [ $failed -eq 0 ]; then
  echo "🎉 TODAS AS PÁGINAS CANÔNICAS OK!"
  exit 0
else
  echo "⚠️  $failed página(s) falharam"
  exit 1
fi
