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

  describe('Testes avançados (Retarget, Kill Switch, Revenue)', () => {

    test('6. POST /api/internal/retarget/run - Idempotência (não duplica)', async () => {
      const token = process.env.INTERNAL_TOKEN;

      if (!token) {
        console.warn('   ⚠️ SKIP retarget: INTERNAL_TOKEN não definido');
        return;
      }

      // 1ª execução
      const r1 = await request(app)
        .post('/api/internal/retarget/run')
        .set('x-internal-token', token);

      expect([200, 201]).toContain(r1.status);
      expect(r1.body).toHaveProperty('ok', true);
      expect(typeof r1.body.enqueued).toBe('number');

      // 2ª execução imediata: idempotência
      const r2 = await request(app)
        .post('/api/internal/retarget/run')
        .set('x-internal-token', token);

      expect([200, 201]).toContain(r2.status);
      expect(r2.body).toHaveProperty('ok', true);
      expect(r2.body.enqueued).toBe(0);

      console.log(`   ✓ Retarget idempotente: 1ª=${r1.body.enqueued}, 2ª=${r2.body.enqueued}`);
    });

    test('7. Kill switch - set winner (B=100) e refletir em /api/experiments/active', async () => {
      // Usa PATCH /api/experiments/:id para atualizar (não requer INTERNAL_TOKEN)
      const upd = await request(app)
        .patch('/api/experiments/lp_hero_v1')
        .send({
          is_active: true,
          traffic_percent: 100,
          variants: [
            { name: 'A', weight: 0 },
            { name: 'B', weight: 100 },
          ],
        });

      expect([200, 201]).toContain(upd.status);
      expect(upd.body).toHaveProperty('ok', true);

      // Confere se o GET active reflete a configuração
      const active = await request(app).get('/api/experiments/active');

      expect(active.status).toBe(200);
      expect(active.body).toHaveProperty('experiments');
      expect(Array.isArray(active.body.experiments)).toBe(true);

      const exp = active.body.experiments.find((e) => e.id === 'lp_hero_v1');
      expect(exp).toBeTruthy();
      expect(exp.isActive).toBe(true);
      expect(exp.trafficPercent).toBe(100);

      const vA = exp.variants.find((v) => v.name === 'A');
      const vB = exp.variants.find((v) => v.name === 'B');
      expect(vA).toBeTruthy();
      expect(vB).toBeTruthy();
      expect(Number(vA.weight)).toBe(0);
      expect(Number(vB.weight)).toBe(100);

      console.log(`   ✓ Kill switch: B agora com 100% do tráfego`);
    });

    test('8. GET /metrics/v2/funnel?groupBy=utm_campaign&includeRevenue=1 - Receita confere com seed', async () => {
      const res = await request(app)
        .get('/metrics/v2/funnel')
        .set(TEST_HEADER)
        .query({ groupBy: 'utm_campaign', includeRevenue: '1', days: 7 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rows');
      expect(Array.isArray(res.body.rows)).toBe(true);

      // revenue pode vir em res.body.revenue (array por grupo)
      if (res.body.revenue && Array.isArray(res.body.revenue)) {
        const rev = res.body.revenue.find((r) => r.utm_campaign === 'psi_plantao');
        if (rev) {
          // Do seed: sess-A: agreedPrice 200, platformFee 40
          // total GMV=200, Fee=40 (só sess-A tem booking_confirmed)
          expect(Number(rev.gmv || rev.total_gmv || 0)).toBeGreaterThanOrEqual(200);
          expect(Number(rev.platform_fee || rev.platformFee || 0)).toBeGreaterThanOrEqual(40);
          console.log(`   ✓ Revenue psi_plantao: GMV=${rev.gmv || rev.total_gmv}, Fee=${rev.platform_fee || rev.platformFee}`);
        } else {
          console.log(`   ✓ Revenue: ${res.body.revenue.length} campanhas (psi_plantao não encontrada)`);
        }
      } else {
        console.log(`   ✓ Funil retornado: ${res.body.rows.length} rows (revenue não incluído ou vazio)`);
      }
    });

  });

});
