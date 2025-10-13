# Mock Auction Standalone - Guia de Uso

## 🚀 Overview

Sistema de **mock auction standalone** separado do gateway principal. Permite desenvolvimento e testes independentes do serviço de leilão/pricing.

## 📁 Arquitetura

```
mock-auction.js          → Servidor mock standalone (porta 3333)
↓
apps/telemed-internal/   → Gateway principal (porta 5000)
   └─ Proxy /api/auction → localhost:3333 (se USE_LOCAL_AUCTION_MOCK=true)
```

## ⚙️ Configuração Rápida

### 1. Copiar variáveis de ambiente

```bash
cp .env.example .env
```

### 2. Editar `.env`

```env
PORT=5000
MOCK_PORT=3333
USE_LOCAL_AUCTION_MOCK=true  # true = mock standalone, false = upstream real
AUCTION_URL=                 # URL do serviço real (quando mock=false)
```

## 🎯 Como Rodar

### Opção A: Manualmente (2 terminais)

**Terminal 1 - Mock Auction:**
```bash
node mock-auction.js
# Roda em http://localhost:3333
```

**Terminal 2 - Gateway Principal:**
```bash
npm run dev
# Roda em http://localhost:5000
# Proxy /api/auction → localhost:3333
```

### Opção B: Com Concurrently (1 comando)

**Nota:** Scripts `dev`, `dev:mock`, `dev:web` precisam ser configurados manualmente no Replit Workflows ou via `concurrently`.

**Exemplo manual:**
```bash
npx concurrently \
  "node mock-auction.js" \
  "npm run dev"
```

### Opção C: Docker Compose

```bash
docker-compose up --build
# Web: http://localhost:5000
# Mock: http://localhost:3333
```

## 🧪 Endpoints do Mock

### Health Check
```bash
GET /health
→ {"ok":true,"service":"mock-auction","port":3333}
```

### Criar Bid
```bash
POST /api/auction/bids
Body: {"amount": 180}
→ {"ok":true,"bid":{"id":"BID-XXX","amount":180}}
```

### Buscar Médicos
```bash
POST /api/auction/search
Body: {"bid_id": "BID-XXX"}
→ {"ok":true,"immediate_doctors":[...], "scheduled_doctors":[...]}
```

### Aumentar Proposta
```bash
PUT /api/auction/bids/:id/increase
Body: {"increase_amount": 20}
→ {"ok":true,"bid":{"id":"BID-XXX","amount":200}}
```

### Aceitar Médico
```bash
POST /api/auction/accept
Body: {"bid_id":"BID-XXX", "doctor_id":"D1"}
→ {"ok":true,"consultation_id":"CONS-XXX"}
```

## 📊 Regras de Negócio (Mock)

O mock simula disponibilidade de médicos baseado no **valor da proposta**:

| Valor | Imediatos | Agendados |
|-------|-----------|-----------|
| **≥ R$ 180** | 3 médicos | 6 médicos |
| **≥ R$ 160** | 0 médicos | 6 médicos |
| **< R$ 160** | 0 médicos | 0 médicos |

## 🔍 Telemetria

O mock exibe logs bonitinhos no console:

```bash
🎯 [MOCK AUCTION] POST /api/auction/bids
  ┌─────────┬────────────────┐
  │ bidId   │ 'BID-JUK2Y90N' │
  │ amount  │ 180            │
  └─────────┴────────────────┘
```

## 🌐 Teste via Gateway

O frontend sempre usa **caminhos relativos** (`/api/auction/*`), então funciona transparentemente:

```javascript
// Frontend faz:
fetch('/api/auction/bids', {
  method: 'POST',
  body: JSON.stringify({ amount: 180 })
})

// Gateway roteia para:
// - localhost:3333 (se USE_LOCAL_AUCTION_MOCK=true)
// - AUCTION_URL      (se USE_LOCAL_AUCTION_MOCK=false)
```

## 🧪 Smoke Test Rápido

```bash
# 1. Criar bid
BID=$(curl -sS -X POST http://localhost:5000/api/auction/bids \
  -H "Content-Type: application/json" \
  -d '{"amount":180}' | jq -r '.bid.id')

# 2. Buscar médicos
curl -sS -X POST http://localhost:5000/api/auction/search \
  -H "Content-Type: application/json" \
  -d "{\"bid_id\":\"$BID\"}" | jq

# 3. Aceitar médico
curl -sS -X POST http://localhost:5000/api/auction/accept \
  -H "Content-Type: application/json" \
  -d "{\"bid_id\":\"$BID\",\"doctor_id\":\"D1\"}" | jq
```

## 🔄 Trocar entre Mock e Real

**Para usar mock local:**
```env
USE_LOCAL_AUCTION_MOCK=true
```

**Para usar serviço real:**
```env
USE_LOCAL_AUCTION_MOCK=false
AUCTION_URL=https://bidconnect-api.example.com
```

Restart do gateway aplica mudanças automaticamente.

## 📦 Deploy (Heroku/Render)

### Procfile
```
web: node apps/telemed-internal/src/index.js
mock: node mock-auction.js
```

### Escalar processos
```bash
# Heroku
heroku ps:scale web=1 mock=1

# Render: configurar via dashboard (2 services)
```

## 🐳 Docker

```bash
# Build e run
docker-compose up --build

# Apenas mock
docker-compose up mock

# Apenas web
docker-compose up web
```

## 📝 Arquivos Criados

- `mock-auction.js` - Servidor mock standalone
- `.env.example` - Variáveis de ambiente
- `nodemon.json` - Hot-reload config
- `Procfile` - Deploy Heroku/Render
- `docker-compose.yml` - Orquestração Docker

## ✅ Checklist Final

- [x] Mock standalone criado
- [x] Proxy do gateway configurado
- [x] Telemetria com console.table
- [x] Regras de negócio (R$ 160/180)
- [x] Endpoints completos (bids/search/increase/accept)
- [x] Docker Compose funcional
- [x] Procfile para deploy
- [x] Documentação completa

## 🎉 Pronto para Uso!

Agora você tem um mock auction totalmente funcional e separado do gateway!
