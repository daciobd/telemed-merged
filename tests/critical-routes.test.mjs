import { jest, describe, beforeAll, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import pg from 'pg';

const { Pool } = pg;

let app;
let pool;

const TEST_HEADER = { 'x-test-manager': '1' };

describe('Critical Routes - Jest/Supertest', () => {
  
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('🌱 Executando seed_test_data...');
    try {
      await pool.query(`
        DELETE FROM ads_spend_daily WHERE notes = 'Seed test';
        DELETE FROM telemetry_events WHERE session_id LIKE 'sess-%';
        DELETE FROM experiments WHERE id IN ('lp_hero_v1','offer_ui_v1','price_anchor_v1');
      `);
      
      await pool.query(`
        INSERT INTO ads_spend_daily (provider, account_id, campaign_name, spend, date, notes)
        VALUES
          ('google_ads', 'manual', 'TeleMed Search Teste', 150.00, CURRENT_DATE - 1, 'Seed test'),
          ('meta_ads', 'manual', 'TeleMed Facebook Teste', 200.50, CURRENT_DATE - 2, 'Seed test')
        ON CONFLICT DO NOTHING;
      `);
      
      await pool.query(`
        INSERT INTO experiments (id, is_active, traffic_percent, variants)
        VALUES
         ('lp_hero_v1', true, 100, '[{"name":"A","weight":50},{"name":"B","weight":50}]'),
         ('offer_ui_v1', true, 100, '[{"name":"A","weight":50},{"name":"B","weight":50}]'),
         ('price_anchor_v1', true, 100, '[{"name":"A","weight":50},{"name":"B","weight":50}]')
        ON CONFLICT (id) DO UPDATE SET is_active = true;
      `);
      
      await pool.query(`
        INSERT INTO telemetry_events (event_name, session_id, created_at, utm_campaign, properties)
        VALUES
          ('landing_view', 'sess-A', now() - interval '2 days', 'psi_plantao', '{"experiments":{"lp_hero_v1":"A"}}'),
          ('landing_view', 'sess-B', now() - interval '2 days', 'psi_plantao', '{"experiments":{"lp_hero_v1":"B"}}'),
          ('offer_created', 'sess-A', now() - interval '2 days' + interval '5 minutes', 'psi_plantao', '{"offeredPrice":200}'),
          ('booking_confirmed', 'sess-A', now() - interval '2 days' + interval '15 minutes', 'psi_plantao', '{"agreedPrice":200,"platformFee":40}')
        ON CONFLICT DO NOTHING;
      `);

      await pool.query(`
        INSERT INTO prontuario_audit (prontuario_id, actor_email, actor_role, action, created_at, changed_fields, before, after)
        VALUES
          ('11111111-1111-1111-1111-111111111111'::uuid, 'test@telemed.test', 'doctor', 'update', now() - interval '1 hour', ARRAY['conduta'], '{"conduta":"Antiga"}'::jsonb, '{"conduta":"Nova"}'::jsonb)
        ON CONFLICT DO NOTHING;
      `);
      
      console.log('✅ Seed executado com sucesso');
    } catch (err) {
      console.error('⚠️ Seed parcialmente executado:', err.message);
    }
    
    const module = await import('../index.js');
    app = module.app;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (pool) {
      console.log('🧹 Limpando dados de teste...');
      try {
        await pool.query(`DELETE FROM ads_spend_daily WHERE notes = 'Seed test'`);
        await pool.query(`DELETE FROM telemetry_events WHERE session_id LIKE 'sess-%'`);
        await pool.query(`DELETE FROM experiments WHERE id IN ('lp_hero_v1','offer_ui_v1','price_anchor_v1')`);
        await pool.query(`DELETE FROM prontuario_audit WHERE actor_email LIKE '%@telemed.test'`);
      } catch (err) {
        console.error('⚠️ Erro na limpeza:', err.message);
      }
      await pool.end();
    }
  });

  describe('Rotas protegidas (bypass via x-test-manager)', () => {
    
    test('1. GET /api/manager/search - Busca global com payload', async () => {
      const res = await request(app)
        .get('/api/manager/search')
        .set(TEST_HEADER)
        .query({ q: 'teste', limit: 10 });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('groups');
      expect(res.body.groups).toHaveProperty('pacientes');
      expect(Array.isArray(res.body.groups.pacientes)).toBe(true);
      
      console.log(`   ✓ Busca retornou grupos: ${Object.keys(res.body.groups).join(', ')}`);
    });

    test('5. GET /api/manager/prontuarios/:id/audit - Auditoria com payload', async () => {
      const testId = '11111111-1111-1111-1111-111111111111';
      
      const res = await request(app)
        .get(`/api/manager/prontuarios/${testId}/audit`)
        .set(TEST_HEADER)
        .query({ limit: 10 });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('events');
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events.length).toBeGreaterThan(0);
      
      console.log(`   ✓ Auditoria: ${res.body.events.length} evento(s)`);
    });

  });

  describe('Rotas públicas ou sem auth', () => {
    
    test('2. GET /metrics/v2/doctors/alerts - Alertas de médicos', async () => {
      const res = await request(app)
        .get('/metrics/v2/doctors/alerts')
        .set(TEST_HEADER)
        .query({ days: 7 });
      
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      
      console.log(`   ✓ Alertas: ${JSON.stringify(res.body).slice(0, 80)}...`);
    });

    test('3. GET /metrics/v2/funnel - Funil de telemetria', async () => {
      const res = await request(app)
        .get('/metrics/v2/funnel')
        .query({ days: 7 });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rows');
      expect(res.body).toHaveProperty('events');
      expect(Array.isArray(res.body.events)).toBe(true);
      
      console.log(`   ✓ Funil: ${res.body.rows?.length || 0} campanhas, ${res.body.events?.length || 0} eventos`);
    });

    test('4. GET /metrics/v2/ab - Experimentos A/B', async () => {
      const res = await request(app)
        .get('/metrics/v2/ab')
        .query({ days: 7, experiment: 'lp_hero_v1' });
      
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      
      console.log(`   ✓ A/B lp_hero_v1: ${JSON.stringify(res.body).slice(0, 80)}...`);
    });

  });

  describe('Validação de auth 401 (sem bypass)', () => {
    
    test('1a. GET /api/manager/search - Retorna 401 sem header', async () => {
      const res = await request(app)
        .get('/api/manager/search')
        .query({ q: 'teste' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      
      console.log(`   ✓ Auth bloqueou corretamente: ${res.body.error}`);
    });

    test('5a. GET /api/manager/prontuarios/:id/audit - Retorna 401 sem header', async () => {
      const res = await request(app)
        .get('/api/manager/prontuarios/any-id/audit');
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      
      console.log(`   ✓ Auth bloqueou corretamente: ${res.body.error}`);
    });

  });

});
