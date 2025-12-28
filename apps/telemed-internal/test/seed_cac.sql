-- =========================
-- SEED CAC (TESTE)
-- Período: 2025-12-20 a 2025-12-21
-- - 4 assinaturas
-- - gasto total = 300.00 (REAIS)
-- - platform_fee total = 80.00 (REAIS)
-- - CAC total = 75.00 (REAIS)
-- =========================

BEGIN;

-- 1) Limpa gasto do período (seguro)
DELETE FROM ads_spend_daily
WHERE date::date >= '2025-12-20' AND date::date <= '2025-12-21';

-- 2) Garante consultas (IDs fixos)
INSERT INTO consultations (id, platform_fee, status, created_at)
VALUES
  (900001, 20.00, 'finished', '2025-12-20 09:00:00'),
  (900002, 20.00, 'finished', '2025-12-20 14:00:00'),
  (900003, 20.00, 'finished', '2025-12-21 10:00:00'),
  (900004, 20.00, 'finished', '2025-12-21 19:00:00')
ON CONFLICT (id) DO UPDATE SET platform_fee = EXCLUDED.platform_fee;

-- 3) Garante prontuários assinados (4 assinaturas em 2 dias)
INSERT INTO prontuarios_consulta (consultation_id, signed_at, status, created_at)
VALUES
  (900001, '2025-12-20 10:00:00', 'final', '2025-12-20 09:30:00'),
  (900002, '2025-12-20 15:00:00', 'final', '2025-12-20 14:30:00'),
  (900003, '2025-12-21 11:00:00', 'final', '2025-12-21 10:30:00'),
  (900004, '2025-12-21 20:00:00', 'final', '2025-12-21 19:30:00')
ON CONFLICT (consultation_id) DO UPDATE SET signed_at = EXCLUDED.signed_at;

-- 4) Insere gasto diário por provider/campaign_name (valores em REAIS)
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
WHERE date::date BETWEEN '2025-12-20' AND '2025-12-21';

-- Assinaturas no período (esperado: 4)
SELECT COUNT(*) AS signups
FROM prontuarios_consulta
WHERE signed_at::date BETWEEN '2025-12-20' AND '2025-12-21';

-- Receita (platform_fee) no período (esperado: 80.00)
SELECT SUM(cons.platform_fee) AS revenue
FROM prontuarios_consulta pc
JOIN consultations cons ON cons.id = pc.consultation_id
WHERE pc.signed_at::date BETWEEN '2025-12-20' AND '2025-12-21';

-- CAC = spend / signups (esperado: 75.00)
SELECT 
  SUM(spend) AS spend_total,
  (SELECT COUNT(*) FROM prontuarios_consulta WHERE signed_at::date BETWEEN '2025-12-20' AND '2025-12-21') AS signups,
  SUM(spend) / NULLIF((SELECT COUNT(*) FROM prontuarios_consulta WHERE signed_at::date BETWEEN '2025-12-20' AND '2025-12-21'), 0) AS cac
FROM ads_spend_daily
WHERE date::date BETWEEN '2025-12-20' AND '2025-12-21';
