-- =========================
-- SEED CAC (TESTE ROBUSTO)
-- Período: 2025-12-20 a 2025-12-21
-- - 4 assinaturas
-- - gasto total = 30000 (cents)
-- - platform_fee total = 8000 (cents)
-- - CAC total = 7500 (cents)
-- =========================

BEGIN;

-- limpa gasto no período
DELETE FROM ads_spend_daily
WHERE date::date BETWEEN '2025-12-20' AND '2025-12-21';

-- cria 4 consultations novas e pega os IDs
WITH ins AS (
  INSERT INTO consultations (patient_id, doctor_id, consultation_type, status, platform_fee, created_at)
  VALUES 
    (1, 1, 'primeira_consulta', 'completed', 20.00, '2025-12-20 10:00:00'),
    (1, 1, 'primeira_consulta', 'completed', 20.00, '2025-12-20 14:00:00'),
    (1, 1, 'primeira_consulta', 'completed', 20.00, '2025-12-21 11:00:00'),
    (1, 1, 'primeira_consulta', 'completed', 20.00, '2025-12-21 18:00:00')
  RETURNING id
)
-- limpa possíveis prontuários com consulta_id desses IDs (por segurança)
, del AS (
  DELETE FROM prontuarios_consulta pc
  USING ins
  WHERE pc.consulta_id = ins.id::text
  RETURNING pc.id
)
INSERT INTO prontuarios_consulta (consulta_id, status, signed_at, created_at, updated_at)
SELECT
  id::text,
  'final',
  CASE
    WHEN row_number() OVER () IN (1,2) THEN '2025-12-20 12:00:00+00'::timestamptz
    ELSE '2025-12-21 12:00:00+00'::timestamptz
  END,
  now(),
  now()
FROM ins;

-- gastos (valores em REAIS para o schema atual)
INSERT INTO ads_spend_daily (date, provider, account_id, campaign_name, spend, notes)
VALUES
  ('2025-12-20', 'google_ads', 'manual', 'search_brand', 60.00, 'Seed CAC'),
  ('2025-12-20', 'meta_ads', 'manual', 'retarget', 40.00, 'Seed CAC'),
  ('2025-12-21', 'google_ads', 'manual', 'search_brand', 50.00, 'Seed CAC'),
  ('2025-12-21', 'meta_ads', 'manual', 'retarget', 150.00, 'Seed CAC')
ON CONFLICT DO NOTHING;

COMMIT;

-- =========================
-- VERIFICAÇÕES
-- =========================
SELECT SUM(spend) AS spend_total FROM ads_spend_daily WHERE date::date BETWEEN '2025-12-20' AND '2025-12-21';
SELECT COUNT(*) AS signups FROM prontuarios_consulta WHERE signed_at::date BETWEEN '2025-12-20' AND '2025-12-21';
SELECT SUM(cons.platform_fee) AS revenue FROM prontuarios_consulta pc JOIN consultations cons ON cons.id::text = pc.consulta_id WHERE pc.signed_at::date BETWEEN '2025-12-20' AND '2025-12-21';
