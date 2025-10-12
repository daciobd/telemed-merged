# 🔌 Guia de Conexão: TelemedMerged ↔ BidConnect

## Overview
Este guia fornece o passo a passo completo para conectar o sistema TelemedMerged (Pricing/Auction) ao serviço BidConnect.

---

## 📋 Checklist de Conexão

### ✅ 1. Configurar AUCTION_SERVICE_URL

No **telemed-internal** (Gateway de Produção), configure em `.env` ou Secrets do Replit:

**Opção A: BidConnect expõe /api** (recomendado)
```bash
AUCTION_SERVICE_URL=https://<seu-bidconnect>.repl.co/api
```
→ Proxy já configurado SEM pathRewrite

**Opção B: BidConnect expõe na raiz**
```bash
AUCTION_SERVICE_URL=https://<seu-bidconnect>.repl.co
```
→ Ative `pathRewrite: { '^/api/auction': '' }` no proxy (apps/telemed-internal/src/index.js)

### ✅ 2. Sincronizar JWT_SECRET

**CRÍTICO:** O mesmo `JWT_SECRET` deve estar em AMBOS os serviços:

```bash
# telemed-internal/.env
JWT_SECRET=sua_secret_super_secreta_minimo_32_caracteres

# bidconnect/.env (no serviço BidConnect)
JWT_SECRET=sua_secret_super_secreta_minimo_32_caracteres
```

💡 **Dica:** Use um secret de 32+ caracteres aleatórios

### ✅ 3. Smoke Tests (Validação em Camadas)

Execute na ordem:

#### 3.1. Teste Direto no BidConnect
```bash
curl https://<seu-bidconnect>.repl.co/api/health
```
**Resposta esperada:**
```json
{ "ok": true, "service": "auction-service", "timestamp": "..." }
```

#### 3.2. Teste Via Gateway (Proxy)
```bash
curl https://<seu-telemed>.repl.co/api/auction/health
```
**Resposta esperada:** Mesmo JSON acima (proxyado)

#### 3.3. Teste Fluxo Frontend
1. Abra DevTools no browser
2. Console:
   ```javascript
   localStorage.setItem('tm_auth_token', '<seu_JWT_de_teste>');
   ```
3. Acesse `/auction-bid-demo.html` ou componente React
4. Teste: Criar bid → Buscar médicos → Aceitar (mock)

---

## 📝 Contrato da API BidConnect

### Rotas Obrigatórias

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/bids` | Criar lance/bid |
| GET | `/api/bids/:id` | Obter bid por ID |
| POST | `/api/bids/:id/search` | Buscar médicos disponíveis |
| PUT | `/api/bids/:id/increase` | Aumentar valor do bid |
| POST | `/api/bids/:id/accept` | Aceitar médico |

### Autenticação
- **Header:** `Authorization: Bearer <JWT>`
- **Secret:** Mesmo `JWT_SECRET` configurado
- **Payload JWT:** `{ sub: userId, role: 'patient' | 'doctor', exp: timestamp }`

### Schemas de Resposta

#### POST /api/bids (Create Bid)
```json
{
  "id": "bid-123",
  "patientId": "pac-456",
  "specialty": "Cardiologia",
  "amountCents": 15000,
  "status": "pending"
}
```

#### POST /api/bids/:id/search (Search Doctors)
```json
{
  "doctors": [
    {
      "id": "doc-1",
      "name": "Dr. João Silva",
      "uf": "SP",
      "crm": "123456",
      "specialty": "Cardiologia",
      "priceCents": 15000,
      "availability": "now"
    },
    {
      "id": "doc-2",
      "name": "Dra. Maria Santos",
      "uf": "RJ",
      "crm": "654321",
      "specialty": "Cardiologia",
      "priceCents": 15000,
      "availability": "today"
    }
  ]
}
```

**Valores de `availability`:**
- `"now"` - Imediato
- `"today"` - Hoje
- `"tomorrow"` - Amanhã

#### PUT /api/bids/:id/increase (Increase Bid)
```json
{
  "id": "bid-123",
  "amountCents": 17000
}
```

#### POST /api/bids/:id/accept (Accept Doctor)
```json
{
  "id": "bid-123",
  "physicianId": "doc-1",
  "scheduledAt": "2025-10-12T15:30:00Z",
  "isImmediate": true
}
```

---

## 🎛️ Feature Toggle (Demo/Produção)

### Desligar Módulo
```bash
FEATURE_PRICING=false
```
→ UI oculta e API bloqueada

### Ligar Módulo
```bash
FEATURE_PRICING=true
```
→ Sistema ativo

---

## 🔧 Diagnóstico de Erros

| Erro | Causa Provável | Solução |
|------|----------------|---------|
| **502 no `/api/auction/*`** | BidConnect offline ou URL incorreta | Verifique `AUCTION_SERVICE_URL` e teste `/api/health` direto |
| **401 / Invalid token** | `JWT_SECRET` diferente | Sincronize o secret nos dois serviços |
| **Lista de médicos vazia** | Mock do BidConnect vazio | Adicione fixtures: 2 "now", 2 "today" |
| **429 (Rate limit)** | Muitas requisições em testes | Aumente `max` no rate limiter ou use delay |
| **CORS error** | Proxy não configurado | Use `/api/auction` (relativo) no frontend |

---

## ✅ Critérios de Sucesso

Considere a conexão **100% funcional** quando:

- [ ] `GET /api/auction/health` via gateway → **200 OK**
- [ ] Criar bid no frontend → **Sem erro, retorna ID**
- [ ] Buscar médicos → **Lista preenchida (mock ou real)**
- [ ] Aceitar médico → **Retorna objeto de consulta**
- [ ] UI funciona em **1 porta, sem CORS**
- [ ] Feature flag (`FEATURE_PRICING`) liga/desliga corretamente

---

## 🚀 Script de Teste Automático

Use o script `test-auction-connection.sh` para validar tudo de uma vez:

```bash
chmod +x test-auction-connection.sh
./test-auction-connection.sh
```

**Customização de Portas:**
- **telemed-deploy-ready** (desenvolvimento): porta 5000 (padrão do script)
- **telemed-internal** (produção): porta 3000

Para testar gateway em porta diferente:
```bash
export GATEWAY_URL=http://localhost:3000
./test-auction-connection.sh
```

---

## 📦 Mock de Desenvolvimento

Se o BidConnect ainda não estiver disponível, use este mock temporário em `apps/telemed-internal/src/index.js`:

```javascript
// Mock temporário para desenvolvimento (remover quando BidConnect estiver no ar)
if (process.env.FEATURE_PRICING === 'true' && !process.env.AUCTION_SERVICE_URL) {
  app.get('/api/auction/health', (req, res) => {
    res.json({ ok: true, service: 'auction-mock', mode: 'development' });
  });
  
  app.post('/api/auction/bids', (req, res) => {
    const { patientId, specialty, amountCents } = req.body;
    res.json({
      id: `bid-${Date.now()}`,
      patientId,
      specialty,
      amountCents,
      status: 'pending'
    });
  });
  
  app.post('/api/auction/bids/:id/search', (req, res) => {
    res.json({
      doctors: [
        { id: 'doc-1', name: 'Dr. Mock Imediato', uf: 'SP', crm: '111111', specialty: 'Cardiologia', priceCents: 15000, availability: 'now' },
        { id: 'doc-2', name: 'Dra. Mock Hoje', uf: 'RJ', crm: '222222', specialty: 'Cardiologia', priceCents: 15000, availability: 'today' }
      ]
    });
  });
  
  app.post('/api/auction/bids/:id/accept', (req, res) => {
    res.json({
      id: req.params.id,
      physicianId: req.body.doctorId,
      scheduledAt: new Date().toISOString(),
      isImmediate: true
    });
  });
}
```

---

## 📞 Suporte

- **Logs do Gateway:** `apps/telemed-internal/logs/`
- **Logs do BidConnect:** Verificar no serviço correspondente
- **Debug Frontend:** DevTools → Network → filtrar `/api/auction`
- **Rate Limit:** Configurado em 120 req/min (ajustável)

---

**Última Atualização:** 12 de outubro de 2025  
**Status:** ✅ Proxy configurado, aguardando conexão ao BidConnect
