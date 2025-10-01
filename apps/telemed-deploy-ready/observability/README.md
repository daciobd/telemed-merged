# Telemed Dr. AI — Observabilidade & Carga
Gerado em 2025-10-01 01:04:09

## Grafana (Dashboard)
Arquivo: `grafana-telemed-dr-ai-dashboard.json`

### Como importar
1. Abra Grafana → Dashboards → Import.
2. Em **Upload JSON file**, selecione o arquivo.
3. Selecione o datasource Prometheus correspondente (ou ajuste a variável `DS_PROM`).
4. Salve como **Telemed Dr. AI – Observability**.

### Painéis incluídos
- AI Latency p50/p90/p99 por modelo (usa `ai_latency_ms_bucket`)
- Chamadas de IA por minuto (por modelo/fallback) (`ai_attempts_total`)
- Fallback utilizado por minuto (`ai_fallback_used_total`)
- Top 5 rate limit blocks (`rate_limit_blocks_total`)
- Respostas fora do schema por minuto (`schema_invalid_total`)
- Escalações por minuto por tipo (`escalations_total`)

> Observação: os nomes das métricas devem corresponder ao que seu backend expõe.
Se mudou algum nome, ajuste as queries no painel.

## Teste de Carga (k6)
Arquivo: `../tests/load/k6-telemed-ai-loadtest.js`

### Pré-requisitos
- Node.js para instalar k6? (Opcional) Recomenda-se instalar k6 nativo:
  - macOS: `brew install k6`
  - Linux: veja docs do k6
  - Docker: `docker run -i grafana/k6 run - < k6-telemed-ai-loadtest.js`

### Executar
```bash
# Local
API_URL="http://localhost:5000/api/ai/answer" k6 run tests/load/k6-telemed-ai-loadtest.js

# Com token (se sua rota exigir autorização)
API_URL="https://SEU_HOST/api/ai/answer" API_TOKEN="seu_token" k6 run tests/load/k6-telemed-ai-loadtest.js

# Via Docker
API_URL="https://SEU_HOST/api/ai/answer" API_TOKEN="seu_token" docker run --rm -i -e API_URL -e API_TOKEN grafana/k6 run - < tests/load/k6-telemed-ai-loadtest.js
```

### O que o teste faz
- **Scenario steady**: rampa 0→30 VUs (1m), mantém 30 VUs (2m), rampa para 0 (1m).
- **Scenario spike_rate_limit**: 200 VUs por 15s para validar rate limit.
- Envia perguntas variadas (esclarecimento, fora de escopo, emergência).
- Verifica que a API responde 200 e JSON parseável.
- Métricas:
  - `http_req_failed < 1%`
  - `p95 < 2s`
  - `escalate_rate < 30%` (ajuste conforme sua operação).

### Boas práticas
- Não use dados reais de pacientes.
- Execute em ambiente de staging.
- Ajuste VUs e thresholds conforme sua infra.

## Ajustes rápidos
- Models: defina `AI_PRIMARY_MODEL` e `AI_FALLBACK_MODEL` no backend.
- Métricas: confira que seu `/metrics` expõe as séries esperadas.
- Rate limit: verifique `REDIS_URL` e a estratégia (dual-mode).

Bom uso!
