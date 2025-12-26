-- PACOTE DE DADOS MOCK — TELEMED (TESTE)
-- v1.0 - 26/12/2025
-- ⚠️ RODAR EM STAGING ou dentro de transaction com ROLLBACK

-- 1️⃣ Médicos (2 médicos)
INSERT INTO medicos (id, nome, email, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dr. João Psiquiatra', 'joao@telemed.test', now() - interval '30 days'),
  ('22222222-2222-2222-2222-222222222222', 'Dra. Maria Psiquiatra', 'maria@telemed.test', now() - interval '20 days')
ON CONFLICT DO NOTHING;

-- 2️⃣ Pacientes (3 pacientes)
INSERT INTO pacientes (id, nome, email, telefone, created_at)
VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Carlos Silva', 'carlos@test.com', '11999990001', now() - interval '10 days'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Ana Souza',   'ana@test.com',    '11999990002', now() - interval '8 days'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Pedro Lima',  'pedro@test.com',  '11999990003', now() - interval '6 days')
ON CONFLICT DO NOTHING;

-- 3️⃣ Prontuários (mistura de status + SLA)
INSERT INTO prontuarios (
  id, paciente_id, medico_id,
  status, created_at, assinado_em
)
VALUES
  -- Crítico > 24h (João)
  ('p0000001-0000-0000-0000-000000000001',
   'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
   '11111111-1111-1111-1111-111111111111',
   'draft',
   now() - interval '30 hours',
   NULL),

  -- Normal < 24h (João)
  ('p0000002-0000-0000-0000-000000000002',
   'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
   '11111111-1111-1111-1111-111111111111',
   'final',
   now() - interval '10 hours',
   NULL),

  -- Assinado (não entra em pendência)
  ('p0000003-0000-0000-0000-000000000003',
   'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   '22222222-2222-2222-2222-222222222222',
   'final',
   now() - interval '5 days',
   now() - interval '4 days'),

  -- Muito crítico > 72h (Maria)
  ('p0000004-0000-0000-0000-000000000004',
   'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
   '22222222-2222-2222-2222-222222222222',
   'draft',
   now() - interval '80 hours',
   NULL)
ON CONFLICT DO NOTHING;

-- 4️⃣ Auditoria (alterações simuladas)
INSERT INTO prontuario_audit (
  id, prontuario_id, actor_email, actor_role,
  action, created_at,
  changed_fields, before, after
)
VALUES
  (
    gen_random_uuid(),
    'p0000001-0000-0000-0000-000000000001',
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
    'p0000001-0000-0000-0000-000000000001',
    'manager@telemed.test',
    'manager',
    'post_signature_update',
    now() - interval '1 hour',
    ARRAY['diagnostico'],
    '{"diagnostico":"Depressão"}'::jsonb,
    '{"diagnostico":"Transtorno depressivo recorrente"}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- 5️⃣ Telemetria — Funil + A/B (duas campanhas)
INSERT INTO telemetry_events (
  event_name, session_id, created_at,
  utm_campaign, properties
)
VALUES
  -- LANDING (A)
  ('landing_view', 'sess-A', now() - interval '2 days',
   'psi_plantao',
   '{"experiments":{"lp_hero_v1":"A"}}'),

  -- LANDING (B)
  ('landing_view', 'sess-B', now() - interval '2 days',
   'psi_plantao',
   '{"experiments":{"lp_hero_v1":"B"}}'),

  -- OFFER (A)
  ('offer_created', 'sess-A', now() - interval '2 days' + interval '5 minutes',
   'psi_plantao',
   '{"offeredPrice":200,"experiments":{"offer_ui_v1":"A","price_anchor_v1":"A"}}'),

  -- OFFER (B)
  ('offer_created', 'sess-B', now() - interval '2 days' + interval '4 minutes',
   'psi_plantao',
   '{"offeredPrice":280,"experiments":{"offer_ui_v1":"B","price_anchor_v1":"B"}}'),

  -- BOOKING CONFIRMED (A)
  ('booking_confirmed', 'sess-A', now() - interval '2 days' + interval '15 minutes',
   'psi_plantao',
   '{"agreedPrice":200,"platformFee":40,"doctorEarnings":160}'),

  -- BOOKING CONFIRMED (B)
  ('booking_confirmed', 'sess-B', now() - interval '2 days' + interval '12 minutes',
   'psi_plantao',
   '{"agreedPrice":280,"platformFee":56,"doctorEarnings":224}')
ON CONFLICT DO NOTHING;

-- 6️⃣ Experimentos (3 ativos)
INSERT INTO experiments (id, is_active, traffic_percent, variants)
VALUES
 ('lp_hero_v1', true, 100, '[{"name":"A","weight":50},{"name":"B","weight":50}]'),
 ('offer_ui_v1', true, 100, '[{"name":"A","weight":50},{"name":"B","weight":50}]'),
 ('price_anchor_v1', true, 100, '[{"name":"A","weight":50},{"name":"B","weight":50}]')
ON CONFLICT (id) DO NOTHING;

-- 7️⃣ Retarget (sessão sem booking)
INSERT INTO telemetry_events (
  event_name, session_id, created_at,
  utm_campaign, properties
)
VALUES
  ('offer_created', 'sess-retarget', now() - interval '40 minutes',
   'psi_plantao',
   '{"offeredPrice":180}')
ON CONFLICT DO NOTHING;

-- 8️⃣ Ads Spend (para CAC)
INSERT INTO ads_spend_daily (date, provider, campaign_name, spend, notes)
VALUES
  (CURRENT_DATE - 1, 'google_ads', 'TeleMed Search Teste', 150.00, 'Seed test'),
  (CURRENT_DATE - 2, 'meta_ads', 'TeleMed Facebook Teste', 200.50, 'Seed test'),
  (CURRENT_DATE - 3, 'google_ads', 'TeleMed Branding Teste', 100.00, 'Seed test')
ON CONFLICT DO NOTHING;

-- ✅ Dados mock inseridos com sucesso!
SELECT 'Seed concluído. Verifique métricas no Manager Dashboard.' AS resultado;
