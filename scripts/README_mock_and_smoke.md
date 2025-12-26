# TeleMed - Dados Mock e Smoke Test

## Arquivos

1. **seed_test_data.sql** - Script SQL para inserir dados mock de teste
2. **smoke_test.sh** - Script bash para validar endpoints

---

## Como Rodar

### 1. Inserir Dados Mock (psql)

```bash
# Conectar ao banco
psql $DATABASE_URL

# Rodar dentro de transaction (seguro)
BEGIN;
\i scripts/seed_test_data.sql
COMMIT;

# Ou ROLLBACK se quiser desfazer
```

### 2. Executar Smoke Test

```bash
# Local
bash scripts/smoke_test.sh

# Render/Produção
BASE_URL="https://telemed-unified.onrender.com" \
MANAGER_COOKIE="connect.sid=...;" \
INTERNAL_TOKEN="SEU_INTERNAL_TOKEN" \
bash scripts/smoke_test.sh
```

---

## Dados Inseridos

| Tabela | Quantidade | Descrição |
|--------|------------|-----------|
| medicos | 2 | Dr. João e Dra. Maria |
| pacientes | 3 | Carlos, Ana, Pedro |
| prontuarios | 4 | 2 draft (SLA crítico), 1 final, 1 assinado |
| prontuario_audit | 2 | Histórico de alterações |
| telemetry_events | 7 | Funil + A/B + retarget |
| experiments | 3 | lp_hero_v1, offer_ui_v1, price_anchor_v1 |
| ads_spend_daily | 3 | Gastos Google/Meta para CAC |

---

## Adaptação ao Schema Real

Se algum INSERT falhar por diferença de coluna, rode no psql:

```sql
\d+ prontuarios
\d+ pacientes
\d+ medicos
\d+ prontuario_audit
\d+ telemetry_events
\d+ experiments
\d+ ads_spend_daily
```

E me envie o output - ajusto o script para seu schema.

---

## Limpeza (opcional)

```sql
DELETE FROM prontuario_audit WHERE actor_email LIKE '%@telemed.test';
DELETE FROM prontuarios WHERE id LIKE 'p000000%';
DELETE FROM pacientes WHERE email LIKE '%@test.com';
DELETE FROM medicos WHERE email LIKE '%@telemed.test';
DELETE FROM telemetry_events WHERE session_id LIKE 'sess-%';
DELETE FROM ads_spend_daily WHERE notes = 'Seed test';
DELETE FROM experiments WHERE id IN ('lp_hero_v1','offer_ui_v1','price_anchor_v1');
```

---

## Validações Esperadas

### Manager Dashboard
- 📊 Cards de CAC mostram gastos e alertas
- 🔎 Busca global encontra Carlos, Ana, Pedro, Dr. João, Dra. Maria
- 📈 Funil mostra 4 prontuários criados

### CAC Real (/manager/cac)
- Gasto total: ~R$450 (3 registros de ads_spend)
- Alertas: CAC_TOO_HIGH se gasto > R$50 sem assinaturas

### Experimentos (/manager/experiments)
- 3 experimentos ativos
- Variantes A/B com 50/50 split
