# Guia de Demonstração - Dr. AI Medical Triage

Este guia mostra como usar as rotas de demonstração para testar e validar as funcionalidades do Dr. AI.

## 📋 Pré-requisitos

1. Servidor rodando em `http://localhost:5000`
2. Banco de dados PostgreSQL configurado
3. OpenAI API key configurada (`OPENAI_API_KEY`)

## 🎯 Rotas de Demonstração

### 1. Seed de Dados (`POST /demo/seed`)

Cria dados de teste no banco de dados para demonstração.

**O que cria:**
- **Paciente 1** (ID: 1): Consulta recente (10 dias atrás) - Cardiologia
  - Orientações: Losartana 50mg, caminhadas, dieta hipossódica
  
- **Paciente 999** (ID: 999): Consulta expirada (100 dias atrás) - Psiquiatria
  - Orientações: Sertralina 50mg, higiene do sono

**Como usar:**

```bash
curl -X POST http://localhost:5000/demo/seed \
  -H "Content-Type: application/json"
```

**Resposta esperada:**

```json
{
  "ok": true,
  "patients": {
    "recent": 1,
    "expired": 999
  },
  "encounters": {
    "recent": 2,
    "expired": 3
  }
}
```

### 2. Spike de Carga (`POST /demo/spike`)

Simula carga controlada para testar rate limiting e observabilidade.

**Parâmetros (opcionais):**
- `patientId`: ID do paciente (padrão: 1)
- `seconds`: Duração em segundos (padrão: 10)
- `rps`: Requisições por segundo (padrão: 40)
- `apiUrl`: Endpoint a testar (padrão: /api/ai/answer)

**Como usar:**

```bash
# Spike padrão (40 req/s por 10s)
curl -X POST http://localhost:5000/demo/spike \
  -H "Content-Type: application/json"

# Spike customizado (10 req/s por 5s)
curl -X POST http://localhost:5000/demo/spike \
  -H "Content-Type: application/json" \
  -d '{"seconds": 5, "rps": 10}'
```

**Resposta esperada:**

```json
{
  "ok": true,
  "message": "Spike iniciado: ~40 req/s por 10s"
}
```

## 📊 Observabilidade

### Métricas Prometheus

Após executar o spike, verifique as métricas em:

```bash
curl http://localhost:5000/metrics
```

**Métricas principais:**

1. **Latência da IA** (`ai_latency_ms_*`)
   - Histogram com buckets: 100ms, 300ms, 600ms, 1s, 2s, 4s, 8s, 16s
   - Labels: `model`, `attempt`, `fallback`

2. **Tentativas de IA** (`ai_attempts_total`)
   - Counter de chamadas à IA
   - Labels: `model`, `fallback`, `success`

3. **Rate Limiting** (`rate_limit_blocks_total`)
   - Counter de bloqueios por rate limit

4. **Fallback** (`ai_fallback_used_total`)
   - Counter de uso do modelo fallback (OpenAI)

5. **Schema Inválido** (`ai_schema_invalid_total`)
   - Counter de respostas com schema inválido

6. **Escalações** (`ai_escalation_total`)
   - Counter de escalações para médico
   - Labels: `reason` (emergency, expired, out_of_scope)

### Grafana Dashboard

Importe o dashboard em `observability/grafana-telemed-dr-ai-dashboard.json` para visualização completa.

**Painéis disponíveis:**
- 📈 Latência p50/p90/p99
- 🔢 Chamadas à IA por minuto
- 🔄 Uso de Fallback
- 🚫 Bloqueios de Rate Limit
- ⚠️ Schemas Inválidos
- 🚨 Escalações (Emergency, Expired, Out of Scope)

## 🧪 Cenários de Teste

### Teste 1: Consulta Recente Válida

```bash
# 1. Criar seed
curl -X POST http://localhost:5000/demo/seed

# 2. Fazer pergunta ao Dr. AI (paciente com consulta recente)
curl -X POST http://localhost:5000/api/ai/answer \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "question": "Quais medicamentos preciso tomar?",
    "consent": {"granted": true, "timestamp": '$(date +%s)000'}
  }'
```

**Resultado esperado:**
- ✅ Resposta com orientações da última consulta (Losartana, caminhadas, dieta)
- ✅ Sem escalação (consulta recente - 10 dias)

### Teste 2: Consulta Expirada

```bash
# 1. Criar seed (se ainda não criou)
curl -X POST http://localhost:5000/demo/seed

# 2. Fazer pergunta ao Dr. AI (paciente com consulta expirada)
curl -X POST http://localhost:5000/api/ai/answer \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 999,
    "question": "Quais medicamentos preciso tomar?",
    "consent": {"granted": true, "timestamp": '$(date +%s)000'}
  }'
```

**Resultado esperado:**
- ⚠️ Escalação para médico (consulta expirada - 100 dias, limite Psiquiatria: 30 dias)
- 📊 Métrica `ai_escalation_total{reason="expired"}` incrementada

### Teste 3: Rate Limiting

```bash
# 1. Criar seed
curl -X POST http://localhost:5000/demo/seed

# 2. Executar spike de carga
curl -X POST http://localhost:5000/demo/spike \
  -H "Content-Type: application/json" \
  -d '{"seconds": 10, "rps": 50}'

# 3. Verificar métricas de rate limiting
curl http://localhost:5000/metrics | grep rate_limit
```

**Resultado esperado:**
- 🚫 Algumas requisições bloqueadas por rate limit
- 📊 Métrica `rate_limit_blocks_total` > 0

### Teste 4: Emergência

```bash
curl -X POST http://localhost:5000/api/ai/answer \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "question": "Estou com dor no peito e falta de ar",
    "consent": {"granted": true, "timestamp": '$(date +%s)000'}
  }'
```

**Resultado esperado:**
- 🚨 Escalação imediata para médico (keywords: "dor no peito", "falta de ar")
- 📊 Métrica `ai_escalation_total{reason="emergency"}` incrementada

## 🔍 Auditoria LGPD

Todas as interações são logadas de forma segura:

```sql
SELECT 
  id,
  patient_id,
  question_hash,
  answer_truncated,
  escalation_reason,
  created_at
FROM ai_interactions
ORDER BY created_at DESC
LIMIT 10;
```

**Campos LGPD-compliant:**
- `question_hash`: SHA-256 da pergunta (não armazena texto completo)
- `answer_truncated`: Primeiros 500 caracteres (limite LGPD)
- `pii_redacted`: Flag indicando se há PII

## 📈 Load Testing com k6

Para testes de carga mais completos, use o script k6:

```bash
# Instalar k6 (se necessário)
# https://k6.io/docs/get-started/installation/

# Executar teste steady (30 VUs)
k6 run observability/k6-load-test.js

# Executar teste spike (200 VUs)
k6 run observability/k6-load-test.js --env SCENARIO=spike
```

**Thresholds validados:**
- ✅ http_req_failed < 1%
- ✅ http_req_duration p95 < 2s
- ✅ ai_escalation_rate < 30%

## 🎯 Checklist de Validação

Antes de ir para produção, valide:

- [ ] Seed de dados criado com sucesso
- [ ] Consulta recente retorna orientações sem escalação
- [ ] Consulta expirada escala para médico
- [ ] Keywords de emergência acionam escalação imediata
- [ ] Rate limiting bloqueia requisições excessivas
- [ ] Métricas Prometheus sendo coletadas
- [ ] Logs LGPD-compliant (truncados + hash)
- [ ] Grafana dashboard visualizando métricas
- [ ] k6 load tests passando (< 1% falhas, p95 < 2s)

## 🚀 Próximos Passos

1. **Integração com Frontend**: Conectar UI do Dr. AI às rotas
2. **Testes E2E**: Playwright smoke tests (6 cenários críticos)
3. **CI/CD**: Pipeline com security scan, audit, linter
4. **Deploy**: Render com 5 microsserviços + PostgreSQL
5. **Monitoring**: Datadog + Grafana em produção

---

**Documentação completa**: `apps/telemed-deploy-ready/README.md`
**Dashboard Grafana**: `observability/grafana-telemed-dr-ai-dashboard.json`
**k6 Tests**: `observability/k6-load-test.js`
