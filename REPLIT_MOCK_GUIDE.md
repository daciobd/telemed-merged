# Como Rodar o Mock Auction no Replit

## 🚀 Início Rápido

### 1. Configurar Variáveis de Ambiente

Edite `.env` (ou crie a partir de `.env.example`):

```env
PORT=5000
MOCK_PORT=3333
USE_LOCAL_AUCTION_MOCK=true  # Ativa o mock standalone
AUCTION_URL=                 # URL do serviço real (quando mock=false)
```

### 2. Rodar o Mock Standalone

**Opção A: Manualmente em Terminal Separado**

Abra um terminal no Replit e rode:

```bash
node mock-auction.js
```

O mock estará rodando em `http://localhost:3333`.

**Opção B: Em Background**

```bash
node mock-auction.js > /tmp/mock.log 2>&1 &
```

Para ver os logs:

```bash
tail -f /tmp/mock.log
```

### 3. Rodar o Gateway Principal

O workflow "Start application" já roda o gateway automaticamente.

Se precisar rodar manualmente:

```bash
npm run dev
```

O gateway estará em `http://localhost:5000` e fará proxy para o mock.

## 🔍 Testar o Fluxo

```bash
# 1. Criar bid
BID=$(curl -sS -X POST http://localhost:5000/api/auction/bids \
  -H "Content-Type: application/json" \
  -d '{"amount":180}' | jq -r '.bid.id')

echo "Bid criado: $BID"

# 2. Buscar médicos
curl -sS -X POST http://localhost:5000/api/auction/search \
  -H "Content-Type: application/json" \
  -d "{\"bid_id\":\"$BID\"}" | jq

# 3. Aumentar proposta
curl -sS -X PUT "http://localhost:5000/api/auction/bids/$BID/increase" \
  -H "Content-Type: application/json" \
  -d '{"increase_amount":20}' | jq

# 4. Aceitar médico
curl -sS -X POST http://localhost:5000/api/auction/accept \
  -H "Content-Type: application/json" \
  -d "{\"bid_id\":\"$BID\",\"doctor_id\":\"D1\"}" | jq
```

## 📊 Ver Telemetria

O mock exibe telemetria bonitinha no console:

```
🎯 [MOCK AUCTION] POST /api/auction/bids
  ┌─────────┬────────────────┐
  │ bidId   │ 'BID-ABC123'   │
  │ amount  │ 180            │
  └─────────┴────────────────┘
```

## 🔄 Trocar entre Mock e Serviço Real

**Usar mock local:**
```env
USE_LOCAL_AUCTION_MOCK=true
```

**Usar serviço real:**
```env
USE_LOCAL_AUCTION_MOCK=false
AUCTION_URL=https://bidconnect-api.example.com
```

Restart o workflow "Start application" para aplicar as mudanças.

## 🐛 Troubleshooting

### Mock não responde

1. Verifique se está rodando: `curl http://localhost:3333/health`
2. Se não estiver, rode manualmente: `node mock-auction.js`

### Proxy retorna 502

1. Mock não está rodando ou está em outra porta
2. Verifique `MOCK_PORT` em `.env`
3. Verifique logs do gateway para ver o target

### Endpoint não encontrado

1. Verifique se o pathRewrite está correto no gateway
2. Deve ser: `pathRewrite: { '^/': '/api/auction/' }`
3. Isso transforma `/bids` em `/api/auction/bids`

## 📝 Arquivos Importantes

- `mock-auction.js` - Servidor mock standalone
- `.env.example` - Template de variáveis
- `MOCK_AUCTION_STANDALONE.md` - Documentação completa
- `apps/telemed-internal/src/index.js` - Gateway com proxy

## ✅ Checklist

- [x] Mock standalone funcional
- [x] Proxy do gateway configurado
- [x] Telemetria com console.table
- [x] Regras de negócio (R$ 160/180)
- [x] Endpoints completos
- [x] Docker Compose funcional
- [x] Procfile para deploy
- [x] Documentação completa

🎉 Agora você tem um mock auction totalmente funcional!
