# 🧪 TELEMED — Estratégia de Testes (Backend & Métricas)

Este documento descreve a estratégia oficial de testes do TELEMED.
O foco é proteger **fluxos críticos de negócio**, com **baixo custo de manutenção**.

---

## 🎯 Objetivo
Garantir que **o que não pode quebrar** continue funcionando:
- Métricas (funil, receita, A/B)
- Operação médica (pendências, SLA, auditoria)
- Marketing (experimentos, retarget)
- Segurança (rotas protegidas)

Não buscamos 100% de cobertura — buscamos **confiança real**.

---

## 🧱 Arquitetura de Testes

### N1 — Smoke Tests (Integração real)
- Executam via HTTP (`curl`)
- Usam banco Postgres real (Neon)
- Validam que o sistema está "de pé"

📁 Arquivos:
- `scripts/seed_test_data.sql`
- `scripts/smoke_test.sh`

▶️ Executar:
```bash
npm run test:smoke
```

### N2 — Testes Críticos (Jest + Supertest)
- Testes de API com asserts reais
- Rodam rápido (~6–8s)
- Protegem regras de negócio e métricas

📁 Arquivo principal:
- `tests/critical-routes.test.mjs`

▶️ Executar:
```bash
NODE_ENV=test npm run test:api
```

---

## ✅ Rotas Críticas Cobertas

| # | Rota | O que valida |
|---|------|--------------|
| 1 | `/api/manager/search` | Busca global + segurança |
| 2 | `/metrics/v2/doctors/alerts` | SLA e pendências |
| 3 | `/metrics/v2/funnel` | Funil e revenue |
| 4 | `/metrics/v2/ab` | Experimentos A/B |
| 5 | `/api/manager/prontuarios/:id/audit` | Auditoria legal |
| 6 | `/api/internal/retarget/run` | Idempotência |
| 7 | `PATCH /api/experiments/:id` | Kill switch |
| 8 | `/metrics/v2/funnel?includeRevenue=1` | GMV e Fee exatos |

---

## 🔐 Segurança em Testes

Rotas de manager exigem auth.

Em testes, usamos bypass controlado:
```
x-test-manager: 1
```

⚠️ Ativo somente em `NODE_ENV=test`.

---

## 🧬 Banco de Dados

- PostgreSQL 16 (Neon)
- Seed idempotente
- Dados de teste identificados por:
  - emails `@telemed.test`
  - sessões `sess-*`

---

## 🧠 Quando rodar cada teste?

**Antes de deploy:**
```bash
npm run test:api
```

**Mudança grande / refactor:**
```bash
npm run test:smoke
```

---

## 🚫 O que NÃO fazemos (por design)

- Não testamos UI pixel a pixel
- Não testamos todos os endpoints
- Não rodamos CI automático agressivo
- Não buscamos 100% coverage

Isso mantém velocidade e foco.

---

## 📌 Status

✅ Core do produto protegido  
✅ Métricas confiáveis  
✅ Operação segura  

---

**Este é o baseline oficial de qualidade do TELEMED.**
