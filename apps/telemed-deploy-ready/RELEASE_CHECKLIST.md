# Checklist de Release - Dr. AI Medical Triage

Versão: 1.0.0
Data: 2025-10-01

## ✅ Pré-Produção

### Segurança e Compliance
- [x] **Timeout/Retry/Fallback** ativo e testado
  - Timeout: 15s (OPENAI_TIMEOUT_MS)
  - Retry: 2 tentativas (OPENAI_MAX_RETRIES)
  - Fallback: Modelo secundário configurado (OPENAI_FALLBACK_MODEL)
  - Simulação de 429/timeout realizada

- [x] **Rate Limiting** validado
  - Redis auto-detectado (REDIS_URL)
  - Fallback in-memory funcional
  - Testado com múltiplas instâncias simultâneas
  - Sliding window ZSET com TTL 70s

- [x] **Logging Seguro** LGPD-compliant
  - Truncamento + hash implementado (500 chars)
  - PII redatado (pii_redacted=true)
  - Salvando em ai_interactions com UUID
  - Pseudonimização opcional (PSEUDONYM_SALT)

- [x] **Retenção de Dados**
  - Job de cleanup configurado (180 dias)
  - Migration com índices otimizados
  - RLS preparado para multi-tenant (opcional)

### Observabilidade
- [x] **/metrics** exposto e funcional
  - Prometheus endpoint ativo
  - Métricas customizadas:
    - `ai_latency_ms` (latência das chamadas)
    - `ai_attempts_total` (tentativas)
    - `ai_fallback_used_total` (fallback usado)
    - `rate_limit_blocks_total` (bloqueios)
    - `schema_invalid_total` (JSON inválido)
    - `escalations_total` (escalações)
    - `safety_validations_total` (validações)
    - `deny_list_hits_total` (deny-list)
    - `http_request_duration_ms` (HTTP)

### CI/CD e Quality Gates
- [x] **CI Pipeline** configurado
  - Secret scan (npx @zedeus/secrets-scan)
  - Security audit (npm audit)
  - Linter executando
  - Testes E2E (Playwright smoke)
  - Artifacts em caso de falha

- [ ] **Testes** executando
  - Smoke tests passando
  - Cobertura > 80% (módulos críticos)
  - Testes de rate limiting
  - Testes de segurança

### Configuração de Ambiente
- [x] **Variáveis Definidas**
  - `OPENAI_API_KEY` (Secrets)
  - `OPENAI_MODEL` (gpt-4o-mini)
  - `OPENAI_FALLBACK_MODEL` (gpt-4o-mini)
  - `DATABASE_URL` (PostgreSQL)
  - `REDIS_URL` (opcional, fallback in-memory)
  - `PSEUDONYM_SALT` (opcional, para LGPD)

### Políticas e Governança
- [x] **YAML Policies** versionadas
  - `config/safety_policies.yaml`:
    - 37 keywords de emergência
    - 16 keywords de sintomas novos
    - 23 keywords de fora de escopo
    - 18 frases deny-list
  - `config/consultation_age_policy.yaml`:
    - 15 especialidades mapeadas
    - Limites por especialidade (30-120 dias)
    - Default: 90 dias

## 🚀 Deploy

### Banco de Dados
- [x] **Migration aplicada**
  - `migrations/001_ai_interactions.sql`
  - Extensão pgcrypto habilitada
  - Tabela ai_interactions criada
  - Índices criados

- [ ] **Seed de dados**
  - Dados de exemplo carregados
  - Consultas e orientações criadas

### Monitoramento
- [ ] **Prometheus/Grafana** configurado
  - Scraping do /metrics ativo
  - Dashboard criado
  - Alertas configurados

- [ ] **Logs centralizados**
  - Datadog/Metrics streams ativo
  - Retention policy configurada

### Performance
- [ ] **Load testing** realizado
  - Latência p95 < 2s
  - Taxa de erro < 1%
  - Rate limiting efetivo

## 📋 Pós-Deploy

### Validação
- [ ] **Health checks** passando
  - `/api/health` retornando 200
  - `/metrics` acessível
  - Database conectado

- [ ] **Smoke tests produção**
  - Pergunta normal → esclarecimento
  - Emergência → escalação
  - Fora de escopo → redirecionamento
  - Rate limit → 429 com Retry-After

### Documentação
- [x] **README atualizado**
  - Variáveis de ambiente documentadas
  - Arquitetura descrita
  - Políticas YAML documentadas

- [ ] **Runbook criado**
  - Procedimentos de troubleshooting
  - Escalação de incidentes
  - Rollback procedures

## 🔍 Troubleshooting

### Problemas Comuns

**1. Rate limit não funcionando**
- Verificar REDIS_URL (se Redis disponível)
- Checar logs: "✅ Using Redis rate limiter" ou "✅ Using in-memory rate limiter"
- Testar com curl: `curl -X POST /api/ai/answer` (repetir rapidamente)

**2. Métricas não aparecendo**
- Acessar `/metrics` e verificar conteúdo
- Verificar imports em lib/ai.js e routes/ai.js
- Checar logs de erro no console

**3. Logging não salvando**
- Verificar tabela ai_interactions criada: `SELECT * FROM ai_interactions LIMIT 1`
- Checar permissões do usuário do banco
- Verificar logs: "❌ Error saving AI interaction"

**4. Deny-list bloqueando respostas válidas**
- Revisar `config/safety_policies.yaml`
- Ajustar frases para serem mais específicas
- Reload da política: reiniciar servidor

## 📊 Métricas de Sucesso

- **Latência**: p95 < 2s, p99 < 4s
- **Disponibilidade**: > 99.9% uptime
- **Taxa de erro**: < 1%
- **Escalações**: < 10% das interações
- **Fallback usado**: < 5% das chamadas
- **Deny-list hits**: < 0.1% das respostas

---

**Aprovado por:** _________________
**Data:** _________________
