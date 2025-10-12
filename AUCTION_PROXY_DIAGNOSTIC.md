# 🔍 Diagnóstico do Proxy Auction - BidConnect

**Data:** 12 de Outubro de 2025  
**Status:** ⚠️ **REQUER AJUSTES MANUAIS**

---

## 🎯 Resumo Executivo (TL;DR)

**Você precisa fazer 2 ajustes nos Secrets do Replit:**

### 1️⃣ AUCTION_SERVICE_URL (adicionar `/api`)
```bash
# ANTES (errado):
https://e30631f8-552f-45ca-806b-2436971c4a6d-00-15smgio1pkhr6.worf.replit.dev/

# DEPOIS (correto):
https://e30631f8-552f-45ca-806b-2436971c4a6d-00-15smgio1pkhr6.worf.replit.dev/api
```

### 2️⃣ JWT_SECRET (copiar do BidConnect)
- Abra o BidConnect → Tools → Secrets → JWT_SECRET
- Copie o valor EXATO
- Cole no TeleMed → Tools → Secrets → JWT_SECRET
- Reinicie ambos os serviços

**Após correções:** Teste com `curl http://localhost:5000/api/auction/health`

---

## 📊 Problemas Identificados

### 1. ❌ AUCTION_SERVICE_URL Incorreta

**Problema:** URL não termina com `/api`, causando pathRewrite incorreto

**Valor Atual nos Secrets (INCORRETO):**
```bash
AUCTION_SERVICE_URL=https://e30631f8-552f-45ca-806b-2436971c4a6d-00-15smgio1pkhr6.worf.replit.dev/
```
☝️ Sem `/api` no final

**Valor Correto que DEVE ser configurado:**
```bash
AUCTION_SERVICE_URL=https://e30631f8-552f-45ca-806b-2436971c4a6d-00-15smgio1pkhr6.worf.replit.dev/api
```
☝️ **COM `/api` no final**

**Impacto:**
- Proxy usa pathRewrite quando NÃO deveria
- Requests vão para endpoints errados
- `/api/auction/health` → `https://.../health` ❌ (deveria ser `/api/health`)

**Como Corrigir:**
1. Tools → Secrets
2. Edite `AUCTION_SERVICE_URL`
3. Adicione `/api` no final
4. Salve e reinicie

---

### 2. ❌ JWT_SECRET Dessincronizado

**Problema:** JWT_SECRET diferente entre TeleMed e BidConnect

**Sintoma:**
```json
{
  "error": "invalid_token",
  "message": "Invalid or expired token"
}
```

**TeleMed Gateway:**
- JWT_SECRET: `23941d42c21b5bacbec5...` ✅

**BidConnect:**
- JWT_SECRET: ❓ (provavelmente diferente)

**Como Corrigir:**

#### ⚡ PASSOS OBRIGATÓRIOS (em ordem):

1. **Abra o Repl do BidConnect** (separadamente)
   - URL: https://e30631f8-552f-45ca-806b-2436971c4a6d-00-15smgio1pkhr6.worf.replit.dev

2. **No BidConnect:**
   - Tools → Secrets
   - Encontre `JWT_SECRET`
   - **COPIE o valor completo** (Ctrl+C)

3. **No TeleMed (este Repl):**
   - Tools → Secrets
   - Encontre `JWT_SECRET`
   - **COLE exatamente o mesmo valor** (Ctrl+V)
   - Clique em Save

4. **Reinicie AMBOS os serviços:**
   - TeleMed: Clique em Run (reinicia automaticamente)
   - BidConnect: Clique em Run no Repl do BidConnect

5. **Valide a sincronização:**
   ```bash
   # No Shell deste Repl (TeleMed)
   TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({sub:'test'}, process.env.JWT_SECRET, {expiresIn:'15m'}))")
   
   # Testar no BidConnect via proxy
   curl -X POST "http://localhost:5000/api/auction/bids" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"patientId":"test","specialty":"cardiology","amountCents":14000,"mode":"immediate"}'
   ```

   ✅ **Sucesso:** Retorna JSON com `"ok": true` e dados do bid  
   ❌ **Falhou:** Retorna `"invalid_token"` → valores ainda diferentes

---

## ✅ O Que Já Está Funcionando

1. ✅ **Gateway rodando** - Porta 5000
2. ✅ **Health endpoint** - `GET /health` retorna 200
3. ✅ **BidConnect acessível** - `GET /api/health` retorna 200
4. ✅ **Proxy configurado** - Middleware e feature flags OK
5. ✅ **Frontend servido** - Express.static funcionando

---

## 🧪 Como Validar Após Correções

### 1. Testar Health via Proxy

```bash
BASE="https://seu-telemed.repl.co"

# Deve retornar JSON do BidConnect
curl "$BASE/api/auction/health"
```

**Esperado:**
```json
{
  "status": "ok",
  "service": "auction-service",
  "timestamp": "..."
}
```

### 2. Testar Fluxo Completo

```bash
# Gerar token
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({sub:'test',role:'paciente'}, process.env.JWT_SECRET, {expiresIn:'15m'}))")

# Criar bid
curl -X POST "$BASE/api/auction/bids" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"patientId":"test","specialty":"cardiology","amountCents":14000,"mode":"immediate"}'
```

**Esperado:**
```json
{
  "ok": true,
  "bid": {
    "id": "bid_...",
    "patientId": "test",
    ...
  }
}
```

### 3. Buscar Médicos

```bash
BID_ID="<id_do_bid>"

curl -X POST "$BASE/api/auction/bids/$BID_ID/search" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 Checklist de Correção

- [ ] Atualizar `AUCTION_SERVICE_URL` nos Secrets (adicionar `/api`)
- [ ] Sincronizar `JWT_SECRET` entre TeleMed e BidConnect
- [ ] Reiniciar TeleMed Gateway
- [ ] Reiniciar BidConnect
- [ ] Testar `/api/auction/health` via proxy
- [ ] Testar criar bid com JWT
- [ ] Testar buscar médicos
- [ ] Testar aumentar bid
- [ ] Testar aceitar médico

---

## 🔗 Arquitetura Correta

```
Frontend (porta 5000)
    ↓
TeleMed Gateway
    ↓ /api/auction/*
Proxy (pathRewrite OFF)
    ↓
https://bidconnect.../api/*
    ↓
BidConnect Service
```

**PathRewrite:**
- ❌ Com URL raiz → pathRewrite ON → ERRADO
- ✅ Com URL `/api` → pathRewrite OFF → CORRETO

---

## 📚 Referências

- `GATEWAY_HEALTH_ENDPOINTS.md` - Guia de health endpoints
- `BIDCONNECT.md` - Documentação do BidConnect
- `apps/telemed-internal/.env.example` - Template de configuração
- `/tmp/jwt-sync-checklist.md` - Checklist de JWT
