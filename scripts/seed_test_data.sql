-- seed_test_data.sql (schema REAL)
-- TELEMED - Seed de teste idempotente para STAGING/TESTE (Neon)
-- Cobre: Search, Alerts, Audit, Funnel+Revenue, AB, Retarget, Ads spend (CAC)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 0) LIMPEZA (somente mocks)
-- =========================================================
-- (a) Telemetry / retarget / experiments
DELETE FROM telemetry_events WHERE session_id LIKE 'sess-%';
DELETE FROM retarget_queue WHERE email LIKE '%@telemed.test' OR phone LIKE '1199999%';
DELETE FROM experiments WHERE id IN ('lp_hero_v1','offer_ui_v1','price_anchor_v1');

-- (b) Auditoria
DELETE FROM prontuario_audit WHERE actor_email LIKE '%@telemed.test' OR actor_email='manager@telemed.test';

-- (c) Ads spend (apaga só campanhas de seed)
DELETE FROM ads_spend_daily WHERE campaign_name ILIKE 'TeleMed%Teste%';

-- =========================================================
-- 1) IDS FIXOS (UUIDs válidos)
-- =========================================================
-- Doctors
DO $$
BEGIN
  -- =======================================================
  -- 2) DOCTORS (insere se tabela existir)
  -- =======================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='doctors') THEN
    -- tenta inserir usando colunas que existirem (name/email/created_at)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctors' AND column_name='id') THEN
      -- Doctor 1
      EXECUTE $ins$
        INSERT INTO doctors (id, created_at)
        VALUES ('11111111-1111-1111-1111-111111111111', now() - interval '30 days')
        ON CONFLICT (id) DO NOTHING
      $ins$;

      -- Doctor 2
      EXECUTE $ins$
        INSERT INTO doctors (id, created_at)
        VALUES ('22222222-2222-2222-2222-222222222222', now() - interval '20 days')
        ON CONFLICT (id) DO NOTHING
      $ins$;

      -- name/email (se existirem)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctors' AND column_name='name') THEN
        EXECUTE $q$
          UPDATE doctors SET name='Dr. João Psiquiatra' WHERE id='11111111-1111-1111-1111-111111111111';
        $q$;
        EXECUTE $q$
          UPDATE doctors SET name='Dra. Maria Psiquiatra' WHERE id='22222222-2222-2222-2222-222222222222';
        $q$;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctors' AND column_name='email') THEN
        EXECUTE $q$
          UPDATE doctors SET email='joao@telemed.test' WHERE id='11111111-1111-1111-1111-111111111111';
        $q$;
        EXECUTE $q$
          UPDATE doctors SET email='maria@telemed.test' WHERE id='22222222-2222-2222-2222-222222222222';
        $q$;
      END IF;
    END IF;
  END IF;

  -- =======================================================
  -- 3) PATIENTS
  -- =======================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='patients') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='id') THEN
      EXECUTE $ins$
        INSERT INTO patients (id, created_at)
        VALUES ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', now() - interval '10 days')
        ON CONFLICT (id) DO NOTHING
      $ins$;

      EXECUTE $ins$
        INSERT INTO patients (id, created_at)
        VALUES ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', now() - interval '8 days')
        ON CONFLICT (id) DO NOTHING
      $ins$;

      EXECUTE $ins$
        INSERT INTO patients (id, created_at)
        VALUES ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', now() - interval '6 days')
        ON CONFLICT (id) DO NOTHING
      $ins$;

      -- name/email/phone (se existirem)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='name') THEN
        EXECUTE $q$ UPDATE patients SET name='Carlos Silva' WHERE id='aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1'; $q$;
        EXECUTE $q$ UPDATE patients SET name='Ana Souza'   WHERE id='aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2'; $q$;
        EXECUTE $q$ UPDATE patients SET name='Pedro Lima'  WHERE id='aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3'; $q$;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='email') THEN
        EXECUTE $q$ UPDATE patients SET email='carlos@test.com' WHERE id='aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1'; $q$;
        EXECUTE $q$ UPDATE patients SET email='ana@test.com'    WHERE id='aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2'; $q$;
        EXECUTE $q$ UPDATE patients SET email='pedro@test.com'  WHERE id='aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3'; $q$;
      END IF;

      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name IN ('phone','telefone')) THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='phone') THEN
          EXECUTE $q$ UPDATE patients SET phone='11999990001' WHERE id='aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1'; $q$;
          EXECUTE $q$ UPDATE patients SET phone='11999990002' WHERE id='aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2'; $q$;
          EXECUTE $q$ UPDATE patients SET phone='11999990003' WHERE id='aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3'; $q$;
        END IF;
      END IF;
    END IF;
  END IF;
END $$;

-- =========================================================
-- 4) CONSULTATIONS + PRONTUARIOS_CONSULTA (pendências e assinados)
-- =========================================================
DO $$
DECLARE
  c1 INT;
  c2 INT;
  c3 INT;
  c4 INT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='consultations') THEN
    -- cria 4 consultations
    INSERT INTO consultations (doctor_id, patient_id, status, created_at)
    VALUES
      ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'created', now() - interval '30 hours'),
      ('11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'created', now() - interval '10 hours'),
      ('22222222-2222-2222-2222-222222222222', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'finished', now() - interval '5 days'),
      ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'created', now() - interval '80 hours')
    ON CONFLICT DO NOTHING;

    -- pegar IDs gerados (mais robusto)
    SELECT id INTO c1 FROM consultations WHERE doctor_id='11111111-1111-1111-1111-111111111111' AND patient_id='aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1' AND created_at > now() - interval '40 hours' ORDER BY id DESC LIMIT 1;
    SELECT id INTO c2 FROM consultations WHERE doctor_id='11111111-1111-1111-1111-111111111111' AND patient_id='aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2' AND created_at > now() - interval '20 hours' ORDER BY id DESC LIMIT 1;
    SELECT id INTO c3 FROM consultations WHERE doctor_id='22222222-2222-2222-2222-222222222222' AND patient_id='aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3' AND created_at > now() - interval '10 days' ORDER BY id DESC LIMIT 1;
    SELECT id INTO c4 FROM consultations WHERE doctor_id='22222222-2222-2222-2222-222222222222' AND patient_id='aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1' AND created_at > now() - interval '90 hours' ORDER BY id DESC LIMIT 1;

    -- preencher valores financeiros se colunas existirem
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='agreed_price') THEN
      UPDATE consultations SET agreed_price=200, platform_fee=40, doctor_earnings=160 WHERE id=c1;
      UPDATE consultations SET agreed_price=250, platform_fee=50, doctor_earnings=200 WHERE id=c2;
      UPDATE consultations SET agreed_price=280, platform_fee=56, doctor_earnings=224 WHERE id=c3;
      UPDATE consultations SET agreed_price=180, platform_fee=36, doctor_earnings=144 WHERE id=c4;
    END IF;

    -- prontuarios_consulta (pendências e assinado)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='prontuarios_consulta') THEN
      -- IDs UUID válidos
      INSERT INTO prontuarios_consulta (id, consultation_id, status, created_at, signed_at)
      VALUES
        ('00000001-0000-0000-0000-000000000001', c1, 'draft', now() - interval '30 hours', NULL),
        ('00000002-0000-0000-0000-000000000002', c2, 'final', now() - interval '10 hours', NULL),
        ('00000003-0000-0000-0000-000000000003', c3, 'final', now() - interval '5 days', now() - interval '4 days'),
        ('00000004-0000-0000-0000-000000000004', c4, 'draft', now() - interval '80 hours', NULL)
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- =========================================================
-- 5) AUDITORIA (prontuario_audit) usando UUID válido do prontuário
-- =========================================================
INSERT INTO prontuario_audit (
  id, prontuario_id, actor_email, actor_role, action, created_at, changed_fields, before, after
)
VALUES
(
  gen_random_uuid(),
  '00000001-0000-0000-0000-000000000001',
  'joao@telemed.test',
  'doctor',
  'update',
  now() - interval '2 hours',
  ARRAY['conduta'],
  '{"conduta":"Antiga"}'::jsonb,
  '{"conduta":"Nova conduta ajustada"}'::jsonb
),
(
  gen_random_uuid(),
  '00000001-0000-0000-0000-000000000001',
  'manager@telemed.test',
  'manager',
  'post_signature_update',
  now() - interval '1 hour',
  ARRAY['diagnostico'],
  '{"diagnostico":"Depressão"}'::jsonb,
  '{"diagnostico":"Transtorno depressivo recorrente"}'::jsonb
);

-- =========================================================
-- 6) EXPERIMENTS (A/B)
-- =========================================================
INSERT INTO experiments (id, is_active, traffic_percent, variants)
VALUES
 ('lp_hero_v1', true, 100, '[{"name":"A","weight":50},{"name":"B","weight":50}]'),
 ('offer_ui_v1', true, 100, '[{"name":"A","weight":50},{"name":"B","weight":50}]'),
 ('price_anchor_v1', true, 100, '[{"name":"A","weight":50},{"name":"B","weight":50}]')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 7) TELEMETRIA (funil + A/B + receita)
-- =========================================================
INSERT INTO telemetry_events (
  event_name, session_id, created_at,
  utm_campaign, utm_source, utm_medium,
  properties
)
VALUES
  ('landing_view', 'sess-A', now() - interval '2 days', 'psi_plantao', 'google', 'cpc', '{"experiments":{"lp_hero_v1":"A"}}'),
  ('landing_view', 'sess-B', now() - interval '2 days', 'psi_plantao', 'google', 'cpc', '{"experiments":{"lp_hero_v1":"B"}}'),
  ('offer_created', 'sess-A', now() - interval '2 days' + interval '5 minutes', 'psi_plantao', 'google', 'cpc', '{"offeredPrice":200,"experiments":{"offer_ui_v1":"A","price_anchor_v1":"A"}}'),
  ('offer_created', 'sess-B', now() - interval '2 days' + interval '4 minutes', 'psi_plantao', 'google', 'cpc', '{"offeredPrice":280,"experiments":{"offer_ui_v1":"B","price_anchor_v1":"B"}}'),
  ('booking_confirmed', 'sess-A', now() - interval '2 days' + interval '15 minutes', 'psi_plantao', 'google', 'cpc', '{"agreedPrice":200,"platformFee":40,"doctorEarnings":160}'),
  ('booking_confirmed', 'sess-B', now() - interval '2 days' + interval '12 minutes', 'psi_plantao', 'google', 'cpc', '{"agreedPrice":280,"platformFee":56,"doctorEarnings":224}');

-- Retarget elegível
INSERT INTO telemetry_events (
  event_name, session_id, created_at,
  utm_campaign, utm_source, utm_medium,
  properties
)
VALUES
  ('offer_created', 'sess-retarget', now() - interval '40 minutes', 'psi_plantao', 'google', 'cpc', '{"offeredPrice":180}');

-- =========================================================
-- 8) ADS SPEND (para CAC)
-- =========================================================
INSERT INTO ads_spend_daily (date, provider, account_id, campaign_name, spend, notes)
VALUES
  (CURRENT_DATE - 1, 'google_ads', 'manual', 'TeleMed Search Teste', 150.00, 'Seed test'),
  (CURRENT_DATE - 2, 'meta_ads', 'manual', 'TeleMed Facebook Teste', 200.50, 'Seed test'),
  (CURRENT_DATE - 3, 'google_ads', 'manual', 'TeleMed Branding Teste', 100.00, 'Seed test')
ON CONFLICT DO NOTHING;

COMMIT;

-- =========================================================
-- RESULTADO
-- =========================================================
SELECT 'Seed concluído com sucesso. Dados de teste inseridos.' AS resultado;
