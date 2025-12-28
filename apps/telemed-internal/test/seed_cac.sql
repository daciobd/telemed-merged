-- =========================
-- SEED CAC (TESTE)
-- Período: 2025-12-20 a 2025-12-21
-- - 4 assinaturas
-- - gasto total = 300.00 (REAIS)
-- - platform_fee total = 80.00 (REAIS)
-- - CAC total = 75.00 (REAIS)
-- =========================

BEGIN;

-- 1) Limpa gasto do período de teste
DELETE FROM ads_spend_daily
WHERE date::date >= '2025-12-20' AND date::date <= '2025-12-21'
  AND campaign_name IN ('search_brand', 'retarget');

-- 2) Limpa prontuarios de teste do período
DELETE FROM prontuarios_consulta
WHERE consulta_id IN ('cac-test-900001', 'cac-test-900002', 'cac-test-900003', 'cac-test-900004');

-- 3) Limpa consultations de teste (se existirem)
DELETE FROM consultations WHERE id IN (900001, 900002, 900003, 900004);

-- 4) Insere consultations de teste (IDs fixos altos)
INSERT INTO consultations (id, patient_id, doctor_id, consultation_type, status, platform_fee, created_at)
VALUES
  (900001, 1, 1, 'primeira_consulta', 'completed', 20.00, '2025-12-20 09:00:00'),
  (900002, 1, 1, 'primeira_consulta', 'completed', 20.00, '2025-12-20 14:00:00'),
  (900003, 1, 1, 'primeira_consulta', 'completed', 20.00, '2025-12-21 10:00:00'),
  (900004, 1, 1, 'primeira_consulta', 'completed', 20.00, '2025-12-21 19:00:00')
ON CONFLICT (id) DO UPDATE SET platform_fee = EXCLUDED.platform_fee;

-- 5) Insere prontuários assinados (4 assinaturas em 2 dias)
INSERT INTO prontuarios_consulta (consulta_id, status, signed_at, created_at, updated_at)
VALUES
  ('cac-test-900001', 'final', '2025-12-20 10:00:00', '2025-12-20 09:30:00', now()),
  ('cac-test-900002', 'final', '2025-12-20 15:00:00', '2025-12-20 14:30:00', now()),
  ('cac-test-900003', 'final', '2025-12-21 11:00:00', '2025-12-21 10:30:00', now()),
  ('cac-test-900004', 'final', '2025-12-21 20:00:00', '2025-12-21 19:30:00', now());

-- 6) Insere gasto diário por provider/campaign_name (valores em REAIS)
INSERT INTO ads_spend_daily (date, provider, account_id, campaign_name, spend, notes)
VALUES
  ('2025-12-20', 'google_ads', 'manual', 'search_brand', 60.00, 'Seed CAC test'),
  ('2025-12-20', 'meta_ads', 'manual', 'retarget', 40.00, 'Seed CAC test'),
  ('2025-12-21', 'google_ads', 'manual', 'search_brand', 50.00, 'Seed CAC test'),
  ('2025-12-21', 'meta_ads', 'manual', 'retarget', 150.00, 'Seed CAC test')
ON CONFLICT DO NOTHING;

COMMIT;

-- =========================
-- VERIFICAÇÕES (rodar após seed)
-- =========================

-- Gasto total no período (esperado: 300.00)
SELECT SUM(spend) AS spend_total
FROM ads_spend_daily
WHERE date::date BETWEEN '2025-12-20' AND '2025-12-21'
  AND campaign_name IN ('search_brand', 'retarget');

-- Assinaturas no período (esperado: 4)
SELECT COUNT(*) AS signups
FROM prontuarios_consulta
WHERE signed_at::date BETWEEN '2025-12-20' AND '2025-12-21'
  AND consulta_id LIKE 'cac-test-%';

-- Receita (platform_fee) no período (esperado: 80.00)
SELECT SUM(platform_fee) AS revenue
FROM consultations
WHERE id IN (900001, 900002, 900003, 900004);

-- CAC = spend / signups (esperado: 75.00)
SELECT 
  (SELECT SUM(spend) FROM ads_spend_daily WHERE date::date BETWEEN '2025-12-20' AND '2025-12-21' AND campaign_name IN ('search_brand', 'retarget')) AS spend_total,
  (SELECT COUNT(*) FROM prontuarios_consulta WHERE signed_at::date BETWEEN '2025-12-20' AND '2025-12-21' AND consulta_id LIKE 'cac-test-%') AS signups,
  (SELECT SUM(spend) FROM ads_spend_daily WHERE date::date BETWEEN '2025-12-20' AND '2025-12-21' AND campaign_name IN ('search_brand', 'retarget')) /
  NULLIF((SELECT COUNT(*) FROM prontuarios_consulta WHERE signed_at::date BETWEEN '2025-12-20' AND '2025-12-21' AND consulta_id LIKE 'cac-test-%'), 0) AS cac;
