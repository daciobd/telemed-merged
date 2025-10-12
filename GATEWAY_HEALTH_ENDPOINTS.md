# Gateway Health Endpoints - Guia de Referência

## 📊 Endpoints de Diagnóstico

### 1. `/health` - Health Detalhado do Gateway

**Método:** `GET`  
**Auth:** Público (sem autenticação)  
**Uso:** Diagnóstico geral do gateway + feature flags

#### Request:
```bash
curl http://localhost:3000/health
```

#### Response:
```json
{
  "ok": true,
  "service": "telemed-internal",
  "feature_pricing": true,
  "auction_target": "http://localhost:5001/api",
  "timestamp": "2025-10-12T13:50:03.281Z"
}
```

#### Campos:
- `feature_pricing`: Indica se o módulo de precificação/leilão está ativo
- `auction_target`: URL do serviço BidConnect configurado
- `timestamp`: Data/hora ISO 8601 do servidor

---

### 2. `/api/auction/health` - Health Local do Proxy

**Método:** `GET`  
**Auth:** Público (sem autenticação)  
**Uso:** Diagnóstico do proxy de leilão (NÃO consulta downstream)

#### Request:
```bash
curl http://localhost:3000/api/auction/health
```

#### Response:
```json
{
  "ok": true,
  "via": "gateway",
  "target": "http://localhost:5001/api",
  "feature_enabled": true
}
```

#### Campos:
- `via`: Sempre "gateway" (indica que a resposta vem do proxy, não do BidConnect)
- `target`: URL do BidConnect configurado
- `feature_enabled`: Status da feature flag

**⚠️ Importante:** Este endpoint **NÃO** testa conectividade real com o BidConnect. Use-o apenas para confirmar configuração do gateway.

---

### 3. `/healthz` - Health Minimalista

**Método:** `GET`  
**Auth:** Público (sem autenticação)  
**Uso:** Compatibilidade com monitores externos (UptimeRobot, Pingdom)

#### Request:
```bash
curl http://localhost:3000/healthz
```

#### Response:
```json
{
  "ok": true
}
```

---

### 4. `/config.js` - Feature Flags

**Método:** `GET`  
**Auth:** Público (sem autenticação)  
**Content-Type:** `application/javascript`  
**Uso:** Expor feature flags para o frontend

#### Request:
```bash
curl http://localhost:3000/config.js
```

#### Response:
```javascript
window.TELEMED_CFG = {
  FEATURE_PRICING: true,
  AUCTION_URL: '/api/auction'
};
```

---

## 🔧 Configuração do Proxy

### PathRewrite Automático

O gateway detecta automaticamente o formato da URL do BidConnect:

#### Opção A: BidConnect expõe rotas em `/api` (RECOMENDADO)

```bash
# .env
AUCTION_SERVICE_URL=https://seu-bidconnect.repl.co/api
```

**Comportamento:**
- ❌ PathRewrite **DESATIVADO**
- ✅ Request: `/api/auction/health` → `https://seu-bidconnect.repl.co/api/health`

#### Opção B: BidConnect expõe rotas na raiz

```bash
# .env
AUCTION_SERVICE_URL=https://seu-bidconnect.repl.co
```

**Comportamento:**
- ✅ PathRewrite **ATIVADO** (remove `/api/auction`)
- ✅ Request: `/api/auction/health` → `https://seu-bidconnect.repl.co/health`

### Lógica de Detecção

```javascript
// Regex que verifica se URL termina com /api
const needsRewrite = !/\/api\/?$/.test(AUCTION_SERVICE_URL);
```

---

## 🧪 Testes Rápidos

### Script Automatizado

```bash
# Testar gateway local (porta 3000)
/tmp/test-gateway-health.sh

# Testar gateway em produção
/tmp/test-gateway-health.sh https://seu-gateway.repl.co
```

### Testes Manuais

```bash
# 1. Health detalhado
curl http://localhost:3000/health | jq

# 2. Health do proxy
curl http://localhost:3000/api/auction/health | jq

# 3. Feature flags
curl http://localhost:3000/config.js

# 4. Healthz
curl http://localhost:3000/healthz | jq
```

---

## 🔍 Troubleshooting

### Problema: `/health` retorna 404

**Causa:** Gateway não está rodando ou porta incorreta  
**Solução:**
```bash
cd apps/telemed-internal
PORT=3000 npm start
```

### Problema: `/api/auction/health` retorna 503

**Causa:** `FEATURE_PRICING=false` ou não configurada  
**Solução:**
```bash
# .env
FEATURE_PRICING=true
```

### Problema: Proxy retorna 502

**Causa:** BidConnect não está acessível  
**Solução:**
1. Verificar se BidConnect está rodando:
   ```bash
   curl http://localhost:5001/api/health
   ```
2. Verificar variável `AUCTION_SERVICE_URL` no `.env`

### Problema: pathRewrite não funciona

**Causa:** Formato da URL não detectado corretamente  
**Solução:**
1. Testar endpoint direto do BidConnect:
   ```bash
   curl $AUCTION_SERVICE_URL/health
   ```
2. Ajustar URL conforme resposta:
   - ✅ Se funciona → URL está correta
   - ❌ Se 404 → Trocar entre `/api` e raiz

---

## 📋 Checklist de Deployment

- [ ] Variáveis de ambiente configuradas em Secrets do Replit:
  - [ ] `FEATURE_PRICING=true`
  - [ ] `AUCTION_SERVICE_URL=<URL_DO_BIDCONNECT>`
  - [ ] `JWT_SECRET=<SECRET_COMPARTILHADO>`

- [ ] Testar health endpoints:
  - [ ] `GET /health` retorna `ok: true`
  - [ ] `GET /api/auction/health` retorna `via: "gateway"`
  - [ ] `GET /config.js` retorna `FEATURE_PRICING: true`

- [ ] Testar proxy:
  - [ ] Proxy encaminha para BidConnect corretamente
  - [ ] pathRewrite funciona conforme esperado
  - [ ] Rate limiting está ativo (120 req/min)

---

## 📚 Referências

- **Código-fonte:** `apps/telemed-internal/src/index.js`
- **Configuração:** `apps/telemed-internal/.env.example`
- **Documentação completa:** `BIDCONNECT.md`
- **Quick Start:** `QUICK_START_AUCTION.md`
