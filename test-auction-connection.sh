#!/bin/bash

# 🔌 TelemedMerged - Script de Smoke Test para Conexão BidConnect
# Este script valida a integração completa entre TelemedMerged e BidConnect

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
GATEWAY_URL=${GATEWAY_URL:-"http://localhost:5000"}
BIDCONNECT_URL=${AUCTION_SERVICE_URL:-"http://localhost:5000/api"}

echo -e "${BLUE}🔌 TelemedMerged - Smoke Test${NC}"
echo -e "${BLUE}================================${NC}\n"

# Função de teste
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -ne "${YELLOW}Testing:${NC} $name ... "
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        if [ -n "$expected" ]; then
            if echo "$body" | grep -q "$expected"; then
                echo -e "${GREEN}✓ OK${NC}"
                return 0
            else
                echo -e "${RED}✗ FAIL (body mismatch)${NC}"
                echo -e "   Expected: $expected"
                echo -e "   Got: $body"
                return 1
            fi
        else
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        fi
    else
        echo -e "${RED}✗ FAIL (HTTP $http_code)${NC}"
        echo -e "   Response: $body"
        return 1
    fi
}

# Teste 1: Gateway Health
echo -e "\n${BLUE}1. Gateway Health Check${NC}"
test_endpoint "GET /api/health" "$GATEWAY_URL/api/health" "ok"

# Teste 2: Config Endpoint
echo -e "\n${BLUE}2. Feature Flags (config.js)${NC}"
test_endpoint "GET /config.js" "$GATEWAY_URL/config.js" "FEATURE_PRICING"

# Teste 3: BidConnect Health (Direto)
echo -e "\n${BLUE}3. BidConnect Direct Health${NC}"
if [ "$BIDCONNECT_URL" != "http://localhost:5000/api" ]; then
    test_endpoint "GET $BIDCONNECT_URL/health" "$BIDCONNECT_URL/health" "ok" || {
        echo -e "${YELLOW}   ⚠️  BidConnect pode não estar rodando${NC}"
        echo -e "${YELLOW}   Configure AUCTION_SERVICE_URL com a URL correta${NC}"
    }
else
    echo -e "${YELLOW}   ⚠️  AUCTION_SERVICE_URL usando valor padrão (localhost:5000/api)${NC}"
    echo -e "${YELLOW}   Configure para testar conexão real${NC}"
fi

# Teste 4: Proxy Auction Health
echo -e "\n${BLUE}4. Auction Proxy (via Gateway)${NC}"
test_endpoint "GET /api/auction/health" "$GATEWAY_URL/api/auction/health" "" || {
    echo -e "${YELLOW}   ⚠️  Proxy configurado, mas BidConnect pode não estar respondendo${NC}"
    echo -e "${YELLOW}   Verifique AUCTION_SERVICE_URL e se BidConnect está no ar${NC}"
}

# Teste 5: JWT Secret Check
echo -e "\n${BLUE}5. JWT Configuration${NC}"
if [ -n "$JWT_SECRET" ] && [ "$JWT_SECRET" != "telemed-dev-secret-2025" ]; then
    echo -e "${GREEN}   ✓ JWT_SECRET customizado detectado${NC}"
    echo -e "${YELLOW}   ⚠️  Confirme que o MESMO secret está no BidConnect${NC}"
else
    echo -e "${YELLOW}   ⚠️  Usando JWT_SECRET padrão ou não configurado${NC}"
    echo -e "${YELLOW}   Recomendado: Configure com 32+ caracteres aleatórios${NC}"
fi

# Teste 6: Feature Flag Status
echo -e "\n${BLUE}6. Feature Flag Status${NC}"
if [ "$FEATURE_PRICING" = "true" ]; then
    echo -e "${GREEN}   ✓ FEATURE_PRICING: ATIVO${NC}"
else
    echo -e "${YELLOW}   ⚠️  FEATURE_PRICING: DESLIGADO${NC}"
    echo -e "${YELLOW}   Para ativar: export FEATURE_PRICING=true${NC}"
fi

# Resumo
echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}📊 Resumo do Teste${NC}\n"

if curl -s "$GATEWAY_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Gateway respondendo"
else
    echo -e "${RED}✗${NC} Gateway offline"
fi

if curl -s "$GATEWAY_URL/config.js" | grep -q "FEATURE_PRICING"; then
    echo -e "${GREEN}✓${NC} Feature flags configurados"
else
    echo -e "${RED}✗${NC} Config.js não encontrado"
fi

if curl -s "$GATEWAY_URL/api/auction/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Proxy /api/auction operacional"
else
    echo -e "${YELLOW}⚠${NC} Proxy configurado, aguardando BidConnect"
fi

# Próximos passos
echo -e "\n${BLUE}📝 Próximos Passos:${NC}"
echo -e "1. Configure AUCTION_SERVICE_URL para apontar ao BidConnect"
echo -e "2. Sincronize JWT_SECRET nos dois serviços"
echo -e "3. Teste criação de bid via frontend: /auction-bid-demo.html"
echo -e "4. Consulte BIDCONNECT.md para detalhes completos"

echo -e "\n${GREEN}Teste concluído!${NC}\n"
