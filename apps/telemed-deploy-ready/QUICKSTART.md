# 🚀 Quick Start - Dr. AI Demo Automática

## Pré-requisitos

✅ Já configurado neste projeto:
- Node.js 20+
- PostgreSQL database
- OpenAI API key (configurado via Replit Secrets)
- Servidor rodando em `http://localhost:5000`

## 1. Acesso Imediato à Demo

A demo automática está pronta para uso!

### 🎬 URL da Demo Automática:
```
http://localhost:5000/dr-ai-demo.html?autoplay=1
```

### 📊 Com Dashboard Grafana (opcional):
```
http://localhost:5000/dr-ai-demo.html?autoplay=1&grafana=URL_DO_SEU_GRAFANA
```

## 2. O que a Demo Testa

A demo executa automaticamente 6 cenários:

1. **Seed de dados** 
   - Cria pacientes de teste e consultas

2. **Esclarecimento baseado na última consulta**
   - Pergunta: "Como devo tomar meu remédio conforme a última consulta?"
   - Esperado: `tipo: "esclarecimento"`

3. **Fora de escopo** (remédio não prescrito)
   - Pergunta: "Posso tomar dipirona junto?"
   - Esperado: `tipo: "fora_escopo"`

4. **Sintoma novo** → Escalar
   - Pergunta: "Comecei a sentir tontura agora"
   - Esperado: `tipo: "escala_emergencia"`

5. **Emergência** → Escalar imediatamente
   - Pergunta: "Estou com dor no peito forte e falta de ar"
   - Esperado: `tipo: "escala_emergencia"`

6. **Consulta expirada** (política por especialidade)
   - Pergunta ao paciente 999: "Pode relembrar as orientações?"
   - Esperado: Orientação para reagendar (limite de 30 dias para Psiquiatria)

## 3. Testes Manuais via cURL

### a) Criar Seed de Dados
```bash
curl -X POST http://localhost:5000/demo/seed
```

**Resposta esperada:**
```json
{
  "ok": true,
  "patients": { "recent": 1, "expired": 999 },
  "encounters": { "recent": 8, "expired": 9 }
}
```

### b) Consulta ao Dr. AI
```bash
curl -X POST http://localhost:5000/api/ai/answer \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "question": "Quais medicamentos preciso tomar?",
    "consent": {"granted": true, "timestamp": '$(date +%s)000'}
  }'
```

### c) Spike de Carga (Rate Limiting)
```bash
curl -X POST http://localhost:5000/demo/spike \
  -H "Content-Type: application/json" \
  -d '{"seconds": 10, "rps": 40}'
```

### d) Métricas Prometheus
```bash
curl http://localhost:5000/metrics | grep ai_
```

## 4. Estrutura do Projeto

```
apps/telemed-deploy-ready/
├── dr-ai-demo.html              # ✨ Demo automática (interface web)
├── server.js                    # Servidor HTTP principal
├── routes/
│   ├── ai.js                    # Rotas Dr. AI (/api/ai/*)
│   └── demo.js                  # Rotas de demonstração (/demo/*)
├── lib/
│   ├── ai.js                    # Lógica de IA (OpenAI + políticas)
│   └── db.js                    # Conexão PostgreSQL
├── migrations/
│   ├── 001_ai_interactions.sql  # Tabela de auditoria LGPD
│   └── 002_add_specialty_to_encounters.sql
├── config/
│   └── ai-policies.yaml         # Políticas de segurança
├── util/
│   ├── metrics.js               # Métricas Prometheus
│   └── log-safe.js              # Logging LGPD-compliant
└── observability/
    ├── grafana-telemed-dr-ai-dashboard.json
    └── k6-load-test.js
```

## 5. Endpoints Disponíveis

### Rotas de Demonstração
- `POST /demo/seed` - Cria dados de teste
- `POST /demo/spike` - Spike de carga controlado

### Rotas Dr. AI
- `POST /api/ai/answer` - Pergunta ao Dr. AI
- `GET /api/ai/audit` - Auditoria de interações
- `POST /api/ai/escalations` - Escalações médicas

### Observabilidade
- `GET /metrics` - Métricas Prometheus
- `GET /healthz` - Health check

## 6. Métricas Prometheus

### Métricas Customizadas (9 total):

1. **ai_latency_ms** - Histogram de latência
   - Buckets: 100ms, 300ms, 600ms, 1s, 2s, 4s, 8s, 16s
   - Labels: `model`, `attempt`, `fallback`

2. **ai_attempts_total** - Counter de tentativas
   - Labels: `model`, `fallback`, `success`

3. **ai_fallback_used_total** - Counter de fallback

4. **rate_limit_blocks_total** - Counter de bloqueios

5. **ai_schema_invalid_total** - Counter de schemas inválidos

6. **ai_escalation_total** - Counter de escalações
   - Labels: `reason` (emergency, expired, out_of_scope)

7. **consent_checks_total** - Counter de consentimento

8. **scope_detections_total** - Counter de detecções de escopo

9. **emergency_detections_total** - Counter de emergências

### Verificar Métricas:
```bash
# Latência p50/p90/p99
curl -s http://localhost:5000/metrics | grep ai_latency_ms_bucket

# Escalações por motivo
curl -s http://localhost:5000/metrics | grep ai_escalation_total

# Rate limiting
curl -s http://localhost:5000/metrics | grep rate_limit_blocks_total
```

## 7. Configuração para Produção

### Variáveis de Ambiente (.env)

Use `.env.example` como template:

```bash
cp .env.example .env
# Edite .env com seus valores reais
```

**Variáveis importantes:**
- `OPENAI_API_KEY` - Chave da API OpenAI (obrigatório)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis (opcional, tem fallback in-memory)
- `PORT` - Porta do servidor (padrão: 5000)

### Aplicar Migrações

```bash
# Migration 1: Tabela ai_interactions
psql $DATABASE_URL -f migrations/001_ai_interactions.sql

# Migration 2: Coluna specialty
psql $DATABASE_URL -f migrations/002_add_specialty_to_encounters.sql
```

## 8. Grafana Dashboard

### Importar Dashboard:

1. Abra o Grafana
2. Vá em **Dashboards** → **Import**
3. Upload do arquivo: `observability/grafana-telemed-dr-ai-dashboard.json`
4. Configure a datasource do Prometheus
5. Salve o dashboard

### Painéis Disponíveis:
- 📈 Latência p50/p90/p99
- 🔢 Chamadas à IA por minuto
- 🔄 Uso de Fallback
- 🚫 Bloqueios de Rate Limit
- ⚠️ Schemas Inválidos
- 🚨 Escalações (Emergency, Expired, Out of Scope)

## 9. Load Testing com k6

```bash
# Executar teste steady (30 VUs)
k6 run observability/k6-load-test.js

# Executar teste spike (200 VUs)
k6 run observability/k6-load-test.js --env SCENARIO=spike
```

**Thresholds validados:**
- ✅ http_req_failed < 1%
- ✅ http_req_duration p95 < 2s
- ✅ ai_escalation_rate < 30%

## 10. Segurança e Compliance LGPD

### Logging Seguro
- ✅ Perguntas truncadas (500 chars) + SHA-256 hash
- ✅ Flag `pii_redacted` para dados sensíveis
- ✅ Pseudonimização opcional via `PSEUDONYM_SALT`

### Auditoria
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

### Políticas de Segurança (config/ai-policies.yaml)
- 37 keywords de emergência
- 16 keywords de sintomas novos
- 23 keywords fora de escopo
- 18 frases deny-list

## 11. Checklist de Validação

Antes de ir para produção:

- [ ] Demo automática funcionando em `/dr-ai-demo.html?autoplay=1`
- [ ] Todos os 6 cenários passando
- [ ] Métricas Prometheus sendo coletadas
- [ ] Grafana dashboard importado e funcionando
- [ ] Migrations aplicadas no banco
- [ ] Rate limiting bloqueando requisições excessivas
- [ ] Logs LGPD-compliant (truncamento + hash)
- [ ] k6 load tests passando
- [ ] Variáveis de ambiente configuradas
- [ ] `.env` não commitado ao git

## 12. Próximos Passos

1. **Integração Frontend**: Conectar UI do Dr. AI às rotas
2. **CI/CD**: Pipeline com security scan + testes
3. **Deploy**: Render com 5 microsserviços
4. **Monitoring**: Datadog + Grafana em produção
5. **Documentação API**: OpenAPI/Swagger

## 📚 Documentação Relacionada

- [DEMO_GUIDE.md](./DEMO_GUIDE.md) - Guia detalhado de demonstração
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Sumário executivo
- [replit.md](../../replit.md) - Documentação geral do projeto

---

**Status**: ✅ Demo Pronta para Uso  
**URL**: http://localhost:5000/dr-ai-demo.html?autoplay=1  
**Métricas**: http://localhost:5000/metrics
