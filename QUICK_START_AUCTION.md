# 🚀 Quick Start: TelemedMerged + BidConnect

## Como Iniciar os Serviços

### Opção 1: Desenvolvimento Local (2 Terminais)

#### Terminal 1: TeleMed Frontend + Gateway
```bash
# Na raiz do projeto
npm run dev
```
→ Roda em **http://localhost:5000**

#### Terminal 2: BidConnect (Auction Service)
```bash
# Em outro terminal
cd apps/auction-service
PORT=5001 node src/index.js
```
→ Roda em **http://localhost:5001**

### Opção 2: Produção (Render ou similar)

1. **telemed-deploy-ready**: Configurar `.env`
   ```bash
   FEATURE_PRICING=true
   AUCTION_SERVICE_URL=https://seu-bidconnect.repl.co/api
   JWT_SECRET=sua_secret_super_secreta_minimo_32_caracteres
   ```

2. **auction-service**: Configurar `.env`
   ```bash
   PORT=5000
   JWT_SECRET=sua_secret_super_secreta_minimo_32_caracteres
   ```

3. Deploy ambos os serviços e configure as URLs

---

## Testes Rápidos

### 1. Testar BidConnect Diretamente
```bash
# Health check
curl http://localhost:5001/api/health

# Criar bid (modo dev - sem autenticação)
curl -X POST http://localhost:5001/api/bids \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "pac123",
    "specialty": "cardiology",
    "amountCents": 14000,
    "mode": "immediate"
  }'

# Buscar médicos (retorna vazio para valor < 16000)
curl -X POST http://localhost:5001/api/bids/<bid_id>/search \
  -H "Content-Type: application/json"
```

### 2. Testar Via Gateway (Proxy)
```bash
# Health check via proxy
curl http://localhost:5000/api/auction/health

# Feature flags
curl http://localhost:5000/config.js
```

### 3. Testar no Browser

#### Abrir DevTools e setar token (opcional):
```javascript
localStorage.setItem('tm_auth_token', 'qualquer-token-em-dev');
```

#### Acessar páginas de demo:
- **Página standalone**: http://localhost:5000/auction-bid-demo.html
- **Componente React**: Integrado nas rotas da aplicação

---

## Fluxo de Teste Completo

### Cenário: "Leilão Conservador"

1. **Bid baixo (R$ 140)**
   ```bash
   curl -X POST http://localhost:5000/api/auction/bids \
     -H "Content-Type: application/json" \
     -d '{"patientId": "pac1", "specialty": "cardiology", "amountCents": 14000, "mode": "immediate"}'
   ```
   → Retorna bid com ID

2. **Buscar médicos (lista vazia - força aumentar)**
   ```bash
   curl -X POST http://localhost:5000/api/auction/bids/<bid_id>/search
   ```
   → `{ "doctors": [], "status": "not_found" }`

3. **Aumentar para R$ 160**
   ```bash
   curl -X PUT http://localhost:5000/api/auction/bids/<bid_id>/increase \
     -H "Content-Type: application/json" \
     -d '{"new_value": 16000}'
   ```

4. **Buscar novamente (aparece "hoje/amanhã")**
   ```bash
   curl -X POST http://localhost:5000/api/auction/bids/<bid_id>/search
   ```
   → `{ "doctors": [...], "status": "found_scheduled" }`

5. **Aumentar para R$ 180+**
   ```bash
   curl -X PUT http://localhost:5000/api/auction/bids/<bid_id>/increase \
     -H "Content-Type: application/json" \
     -d '{"new_value": 18000}'
   ```

6. **Buscar novamente (aparece "⚡ Imediato")**
   ```bash
   curl -X POST http://localhost:5000/api/auction/bids/<bid_id>/search
   ```
   → `{ "doctors": [...], "status": "found_immediate" }`

7. **Aceitar médico**
   ```bash
   curl -X POST http://localhost:5000/api/auction/bids/<bid_id>/accept \
     -H "Content-Type: application/json" \
     -d '{"doctorId": "SP-123456"}'
   ```
   → Retorna consulta criada

---

## Arquitetura de Portas (Desenvolvimento)

| Serviço | Porta | URL |
|---------|-------|-----|
| telemed-deploy-ready | 5000 | http://localhost:5000 |
| auction-service (BidConnect) | 5001 | http://localhost:5001 |
| Proxy /api/auction | 5000 | http://localhost:5000/api/auction → http://localhost:5001/api |

---

## Lógica do Mock de Médicos

```javascript
// apps/auction-service/src/routes/bids.js

amountCents < 16000  → doctors: []           (força aumentar)
amountCents >= 16000 → doctors: 3 (hoje/amanhã)
amountCents >= 18000 → doctors: 4 (1-2 imediatos ⚡)
```

**Badges de disponibilidade:**
- `"now"` → ⚡ Imediato
- `"today"` → 📅 Hoje
- `"tomorrow"` → 📆 Amanhã

---

## Troubleshooting

| Erro | Solução |
|------|---------|
| **EADDRINUSE: port 5000** | O telemed-deploy-ready já está usando. Inicie o auction-service na porta 5001 |
| **502 no /api/auction** | auction-service não está rodando. Execute `cd apps/auction-service && PORT=5001 node src/index.js` |
| **404 no /api/auction/health** | Verifique se AUCTION_SERVICE_URL inclui `/api` e se pathRewrite está correto |
| **401 invalid_token** | Em dev, autenticação é opcional. Configure `NODE_ENV=development` |

---

## Smoke Test Automatizado

Execute o script de teste completo:
```bash
# Certifique-se de que ambos os serviços estão rodando
./test-auction-connection.sh
```

---

## Próximos Passos

1. ✅ Ambos os serviços configurados com mocks in-memory
2. ✅ Proxy /api/auction funcionando
3. ✅ Feature flags ativos
4. 📋 Para produção: Configurar `AUCTION_SERVICE_URL` com URL real do BidConnect
5. 📋 Sincronizar `JWT_SECRET` nos dois serviços
6. 📋 Executar testes end-to-end via frontend

**Consulte BIDCONNECT.md para detalhes completos da integração!**
