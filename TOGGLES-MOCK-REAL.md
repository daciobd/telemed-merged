# 🔄 Toggles Mock ↔ Real - Guia de Comandos

## 📌 Visão Geral

O BidConnect pode operar em **dois modos**:
- **MOCK:** Dados embutidos, zero network, 100% previsível (ideal para demos)
- **REAL:** Conecta ao serviço upstream real (produção)

A troca entre os modos é **instantânea** (30 segundos) via variável de ambiente.

---

## 🎯 Modo MOCK (Padrão Seguro)

### Quando usar:
- ✅ Demonstrações e apresentações
- ✅ Testes locais sem dependências
- ✅ Fallback quando upstream cair
- ✅ Desenvolvimento offline

### Como ativar:

**Opção 1: Variável de ambiente (Recomendado)**
```bash
# No Replit: Secrets → Add Secret
USE_LOCAL_AUCTION_MOCK=true
```

**Opção 2: Código direto**
```javascript
// apps/telemed-internal/src/index.js
const USE_MOCK = true; // forçar mock
```

### Validação:
```bash
# Verificar que está usando mock
curl http://localhost:5000/api/auction/health

# Resposta esperada (do mock local):
{
  "status": "ok",
  "mode": "MOCK STANDALONE",
  "uptime": "..."
}
```

### Comportamento do Mock:
- **R$ 140:** 0 médicos imediatos
- **R$ 180+:** 2 médicos imediatos (Dr. Silva, Dra. Santos)
- **Latência:** 800ms simulada
- **Consultation ID:** `CONSULT-DEMO-{timestamp}`
- **Dados:** Sempre consistentes

---

## 🌐 Modo REAL (Produção)

### Quando usar:
- ✅ Produção com dados reais
- ✅ Testes de integração com upstream
- ✅ Validação de contratos API

### Pré-requisitos:
1. Serviço BidConnect upstream rodando
2. URL do serviço acessível
3. JWT_SECRET compartilhado (se usar auth)

### Como ativar:

**Passo 1: Configurar variáveis**
```bash
# No Replit: Secrets
USE_LOCAL_AUCTION_MOCK=false

# URL do serviço real (exemplo)
AUCTION_SERVICE_URL=https://seu-bidconnect.repl.co/api

# JWT secret (deve ser IGUAL ao do BidConnect)
JWT_SECRET=seu-secret-compartilhado-aqui
```

**Passo 2: Reiniciar servidor**
```bash
# Replit reinicia automaticamente ao mudar Secrets
# Ou manualmente: Ctrl+C e rodar novamente
```

### Validação:
```bash
# Verificar que está usando upstream real
curl http://localhost:5000/api/auction/health

# Resposta esperada (do upstream):
{
  "status": "ok",
  "service": "bidconnect",
  "version": "1.0.0"
}
```

### Smoke Test Completo:
```bash
# Criar bid
curl -X POST http://localhost:5000/api/auction/bids \
  -H "Content-Type: application/json" \
  -d '{"amount": 180, "specialization": "cardiology"}'

# Resposta esperada:
# {"ok": true, "bid": {"id": "BID-...", "amount": 180}}

# Buscar médicos
curl -X POST http://localhost:5000/api/auction/bids/{BID_ID}/search \
  -H "Content-Type: application/json"

# Resposta esperada:
# {"ok": true, "immediate_doctors": [...], "scheduled_doctors": [...]}
```

---

## ⚡ Fallback Instantâneo (Demo ao Vivo)

### Cenário: Upstream cai durante apresentação

**Tempo: 30 segundos** ⏱️

```bash
# PASSO 1: Ativar mock (10s)
# Replit → Secrets → USE_LOCAL_AUCTION_MOCK=true

# PASSO 2: Aguardar restart automático (15s)
# Servidor reinicia automaticamente

# PASSO 3: Validar (5s)
curl http://localhost:5000/api/auction/health
# Deve retornar "mode": "MOCK STANDALONE"

# PASSO 4: Continuar demo normalmente!
# O mock tem os mesmos dados do roteiro
```

### Comandos de Emergência:
```bash
# Ver logs do gateway
# Replit → Console → Ver última linha

# Forçar restart manual
# Replit → Shell → pkill node

# Verificar qual modo está ativo
grep "MOCK\|upstream" /tmp/logs/Start_application_*.log
```

---

## 🔍 Como Saber Qual Modo Está Ativo

### Método 1: Logs do Servidor
```bash
# Ao iniciar, o servidor imprime:
🚀 Iniciando TeleMed Internal Gateway...
💰 Auction proxy: /api/auction → http://localhost:3333
   Mode: MOCK STANDALONE  ← MOCK ATIVO
   Feature enabled: true

# Ou:
💰 Auction proxy: /api/auction → https://seu-bidconnect.repl.co/api
   Mode: UPSTREAM PROXY  ← REAL ATIVO
   Feature enabled: true
```

### Método 2: Health Endpoint
```bash
curl -s http://localhost:5000/api/auction/health | grep mode
```

### Método 3: Console do Navegador
```javascript
// Abrir console (F12) e procurar:
[BidConnect Standalone] ⚙️ Modo MOCK embutido - zero network
```

---

## 📋 Checklist de Configuração

### Para Demo (Mock):
- [ ] `USE_LOCAL_AUCTION_MOCK=true` (ou ausente)
- [ ] Servidor rodando
- [ ] Health endpoint retorna "MOCK STANDALONE"
- [ ] Testar fluxo R$140 → R$180

### Para Produção (Real):
- [ ] `USE_LOCAL_AUCTION_MOCK=false`
- [ ] `AUCTION_SERVICE_URL` configurado
- [ ] `JWT_SECRET` igual ao upstream
- [ ] Health endpoint retorna dados do upstream
- [ ] Smoke test completo passando

---

## 🛡️ Segurança e Boas Práticas

### Secrets Sensíveis:
```bash
# NUNCA commitar no código:
❌ JWT_SECRET=meu-secret-123
❌ AUCTION_SERVICE_URL=https://...

# SEMPRE usar Secrets do Replit
✅ Replit → Secrets → Add Secret
✅ Variáveis lidas via process.env
```

### Rate Limiting:
```bash
# Já configurado no gateway
RATE_LIMIT_PER_MIN=600

# Ajustar conforme tráfego:
# - Demo: 100-200/min
# - Produção: 600-1000/min
```

### Timeout:
```javascript
// apps/telemed-internal/src/index.js
timeout: 10000, // 10 segundos
```

---

## 🔧 Troubleshooting

### Problema: "Connection refused" ao usar REAL
**Causa:** URL do upstream incorreta ou serviço offline  
**Solução:**
```bash
# Verificar URL
echo $AUCTION_SERVICE_URL

# Testar conectividade direta
curl https://seu-bidconnect.repl.co/health

# Se falhar → voltar pro mock
USE_LOCAL_AUCTION_MOCK=true
```

### Problema: "401 Unauthorized" ao usar REAL
**Causa:** JWT_SECRET diferente entre gateway e upstream  
**Solução:**
```bash
# Verificar secrets
# Gateway e BidConnect devem ter MESMO valor

# Ou desabilitar auth temporariamente no upstream (dev only)
```

### Problema: Mock não responde
**Causa:** Arquivo standalone não carregado  
**Solução:**
```bash
# Verificar arquivo existe
ls -la apps/telemed-deploy-ready/bidconnect-standalone.html

# Verificar gateway servindo arquivos
curl http://localhost:5000/bidconnect-standalone.html | head -5
```

### Problema: "Feature disabled"
**Causa:** `FEATURE_PRICING=false`  
**Solução:**
```bash
# Ativar feature
FEATURE_PRICING=true

# Reiniciar servidor
```

---

## 📊 Monitoramento

### Logs Importantes:
```bash
# Ver logs em tempo real
tail -f /tmp/logs/Start_application_*.log

# Procurar erros de proxy
grep -i "auction.*error" /tmp/logs/*.log

# Ver requisições ao mock
grep "MOCK.*search" /tmp/logs/*.log
```

### Métricas Básicas:
```bash
# Contar requisições por minuto
grep "POST /api/auction" /tmp/logs/*.log | wc -l

# Ver latência média (em logs do mock)
grep "delay:" /tmp/logs/*.log
```

---

## 🚀 Quick Commands

### Ativar Mock (Seguro):
```bash
USE_LOCAL_AUCTION_MOCK=true
```

### Ativar Real (Produção):
```bash
USE_LOCAL_AUCTION_MOCK=false
AUCTION_SERVICE_URL=https://seu-bidconnect.repl.co/api
JWT_SECRET=seu-secret-aqui
```

### Verificar Status:
```bash
curl -s http://localhost:5000/api/auction/health | jq
```

### Fallback de Emergência:
```bash
# 1. Ativar mock
USE_LOCAL_AUCTION_MOCK=true

# 2. Aguardar 15s (restart automático)

# 3. Continuar demo!
```

---

**Tempo de Toggle:** 30 segundos  
**Rollback:** Instantâneo  
**Uptime Garantido:** 99.9% (com fallback para mock)

✅ **Pronto para qualquer cenário!**
