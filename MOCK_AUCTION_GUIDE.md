# 🎭 Guia do Mock Local do Auction

**Status:** ✅ Implementado e pronto para uso

---

## 🎯 O Que É?

Um mock local completo do sistema de leilão (auction) que permite demos e desenvolvimento sem depender do BidConnect estar rodando. O frontend funciona identicamente com mock ou serviço real - basta trocar uma variável de ambiente!

---

## 🚀 Como Habilitar o Mock

### Via Replit Secrets (Recomendado)

1. **Abra o painel de Secrets:**
   - Clique em **Tools** → **Secrets**

2. **Adicione a variável:**
   ```
   Key: USE_LOCAL_AUCTION_MOCK
   Value: true
   ```

3. **Salve e reinicie:**
   - Clique em **Save**
   - Clique em **Run** para reiniciar o servidor

4. **Confirme que o mock está ativo:**
   - Verifique os logs por `➡️ USE_LOCAL_AUCTION_MOCK=TRUE — usando mock local no gateway`

### Desabilitar o Mock (Usar BidConnect Real)

```
Tools → Secrets → USE_LOCAL_AUCTION_MOCK → Mude para: false
```

Ou simplesmente **remova** a variável dos Secrets.

---

## 📋 Endpoints do Mock

Todos os endpoints seguem a mesma API do BidConnect real:

### 1. Health Check
```bash
GET /api/auction/health

Response:
{
  "ok": true,
  "service": "auction-mock",
  "ts": "2025-10-12T18:30:00.000Z"
}
```

### 2. Criar Bid
```bash
POST /api/auction/bids
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

Body (aceita múltiplos formatos):
{
  "specialty": "cardiology",
  "amountCents": 14000,
  "mode": "immediate"
}

# Campos alternativos aceitos:
# - specialty | consultationType | consultation_type
# - amountCents | amount_cents | initialAmount | valueCents | priceCents | amount

Response (201):
{
  "success": true,
  "bid": {
    "id": "bid_abc123",
    "specialty": "cardiology",
    "amountCents": 14000,
    "mode": "immediate",
    "status": "pending",
    "createdAt": "2025-10-12T18:30:00.000Z"
  }
}
```

### 3. Buscar Médicos
```bash
POST /api/auction/bids/{bidId}/search
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "immediate": [
    {
      "id": "doc_1",
      "name": "Dr. Roberto",
      "specialty": "cardiology"
    }
  ],
  "scheduled": [
    {
      "id": "doc_2",
      "name": "Dra. Maria",
      "specialty": "cardiology",
      "nextSlots": ["2025-10-12T20:00:00Z"]
    }
  ],
  "message": "Mock: médicos encontrados"
}
```

### 4. Aumentar Bid
```bash
PUT /api/auction/bids/{bidId}/increase
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

Body (aceita múltiplos formatos):
{
  "new_value": 18000
}

# Campos alternativos: new_value | newValue | amountCents | amount_cents

Response:
{
  "success": true,
  "bidId": "bid_abc123",
  "new_value": 18000
}
```

### 5. Aceitar Médico
```bash
POST /api/auction/bids/{bidId}/accept
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

Body:
{
  "doctorId": "doc_1"
}

# Campos alternativos: doctorId | doctor_id | doctor.id

Response:
{
  "success": true,
  "consultation_id": "c_xyz789",
  "is_immediate": true,
  "doctor": {
    "id": "doc_1",
    "name": "Dr. Mock"
  }
}
```

---

## 🧪 Como Testar

### Teste Rápido via curl

```bash
#!/bin/bash
BASE="http://localhost:5000"

# 1. Gerar token
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({sub:'demo',role:'paciente'}, process.env.JWT_SECRET, {expiresIn:'15m'}))")

# 2. Health
curl "$BASE/api/auction/health" | jq .

# 3. Criar bid
BID=$(curl -sS -X POST "$BASE/api/auction/bids" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"specialty":"cardiology","amountCents":14000,"mode":"immediate"}')

echo "$BID" | jq .
BID_ID=$(echo "$BID" | jq -r '.bid.id')

# 4. Buscar médicos
curl -sS -X POST "$BASE/api/auction/bids/$BID_ID/search" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Aumentar
curl -sS -X PUT "$BASE/api/auction/bids/$BID_ID/increase" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"new_value":18000}' | jq .

# 6. Aceitar
curl -sS -X POST "$BASE/api/auction/bids/$BID_ID/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"doctorId":"doc_1"}' | jq .
```

### Usando o Script de Teste

```bash
/tmp/test-mock.sh
```

---

## 🔍 Diagnóstico (Troubleshooting)

### Endpoint de Diagnóstico

Para testar comunicação direta com o BidConnect (bypass do proxy):

```bash
POST /_diag/auction/bids
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

Body:
{
  "specialty": "cardiology",
  "amountCents": 14000,
  "mode": "immediate"
}

Response:
{
  "passthroughStatus": 200,
  "response": { ... },
  "url": "https://bidconnect.../api/bids"
}
```

**Uso:**
```bash
curl -sS -X POST "$BASE/_diag/auction/bids" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"specialty":"cardiology","amountCents":14000}' | jq .
```

---

## 📊 Comparação: Mock vs Real

| Aspecto | Mock Local | BidConnect Real |
|---------|-----------|-----------------|
| **Velocidade** | ⚡ Instantâneo | 🌐 Depende da rede |
| **Disponibilidade** | ✅ Sempre | ⚠️ Depende do serviço |
| **Dados** | 📋 Simulados | 💾 Persistidos |
| **JWT** | ✅ Não valida | 🔒 Valida com JWT_SECRET |
| **Casos de Uso** | 🎭 Demos, desenvolvimento | 🚀 Produção |
| **Setup** | 🎯 Uma variável | 🔧 BidConnect rodando + JWT sincronizado |

---

## 🎨 Compatibilidade com Frontend

O mock foi projetado para **100% de compatibilidade** com o frontend:

- ✅ Mesmas rotas (`/api/auction/*`)
- ✅ Mesma estrutura de resposta
- ✅ Mesmo comportamento esperado
- ✅ Headers e autenticação idênticos

**Resultado:** Frontend funciona sem modificações, independente de mock ou real!

---

## 🔄 Arquitetura

```
┌─────────────────────────────────────────────────┐
│         USE_LOCAL_AUCTION_MOCK=true             │
│                                                 │
│  Request → Mock Router → Response Imediata      │
│                                                 │
│  ✅ Não precisa de BidConnect                    │
│  ✅ Não precisa de JWT_SECRET sincronizado       │
│  ✅ Sempre disponível                            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         USE_LOCAL_AUCTION_MOCK=false            │
│                                                 │
│  Request → Proxy → BidConnect → Response        │
│                                                 │
│  ⚠️ Precisa de BidConnect rodando                │
│  ⚠️ Precisa de JWT_SECRET sincronizado           │
│  ⚠️ Depende de rede/serviço                      │
└─────────────────────────────────────────────────┘
```

**Implementação no código:**
```javascript
// apps/telemed-internal/src/index.js

const USE_LOCAL_AUCTION_MOCK = process.env.USE_LOCAL_AUCTION_MOCK === 'true';

if (USE_LOCAL_AUCTION_MOCK) {
  // Registra mock router
  app.use('/api/auction', mockRouter);
  console.log('➡️  Mock local ativo');
} else {
  // Proxy real para BidConnect (já configurado)
}
```

---

## ✅ Validação de Implementação

- [x] Mock implementado em `apps/telemed-internal/src/index.js`
- [x] Variável `USE_LOCAL_AUCTION_MOCK` documentada em `.env.example`
- [x] Endpoints `/health`, `/bids`, `/bids/:id/search`, `/bids/:id/increase`, `/bids/:id/accept`
- [x] Aceita formatos alternativos de campos (compatibilidade)
- [x] Validação de campos obrigatórios com mensagens claras
- [x] Logs de debug `[MOCK AUCTION]`
- [x] Endpoint de diagnóstico `/_diag/auction/bids`
- [x] Script de teste `/tmp/test-mock.sh`
- [x] Documentação completa

---

## 🎯 Casos de Uso

### 1. **Demo para Cliente**
```bash
# Habilitar mock
Tools → Secrets → USE_LOCAL_AUCTION_MOCK=true

# Frontend funciona imediatamente
# Cliente vê fluxo completo sem configuração
```

### 2. **Desenvolvimento Local**
```bash
# Desenvolver frontend sem BidConnect
USE_LOCAL_AUCTION_MOCK=true npm run dev

# Testar UI sem depender de serviço externo
```

### 3. **Testes Automatizados**
```javascript
// playwright.config.js
process.env.USE_LOCAL_AUCTION_MOCK = 'true';

// Testes sempre passam (mock sempre disponível)
```

### 4. **Produção**
```bash
# Desabilitar mock
Tools → Secrets → USE_LOCAL_AUCTION_MOCK=false

# Ou remover variável completamente
# Proxy real assume
```

---

## 📚 Arquivos Relacionados

- `apps/telemed-internal/src/index.js` - Implementação do mock
- `apps/telemed-internal/.env.example` - Documentação da variável
- `AUCTION_PROXY_DIAGNOSTIC.md` - Diagnóstico do proxy real
- `MOCK_AUCTION_GUIDE.md` - Este guia
- `/tmp/test-mock.sh` - Script de teste

---

## 🎉 Conclusão

O mock local permite **demos instantâneas** e **desenvolvimento ágil** sem depender de serviços externos. O frontend não sabe a diferença - funciona perfeitamente com ambos!

**Para usar agora:**
1. Tools → Secrets → `USE_LOCAL_AUCTION_MOCK=true`
2. Save e Run
3. Pronto! 🚀

**Para produção:**
1. Tools → Secrets → `USE_LOCAL_AUCTION_MOCK=false`
2. Certifique-se que `AUCTION_SERVICE_URL` e `JWT_SECRET` estão corretos
3. Deploy! 🎯
