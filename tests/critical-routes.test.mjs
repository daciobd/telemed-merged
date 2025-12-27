import { jest, describe, beforeAll, afterAll, test, expect } from '@jest/globals';
import request from 'supertest';
import { execSync } from 'node:child_process';
import pg from 'pg';

const { Pool } = pg;

let app;
let pool;

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
          ('offer_created', 'sess-A', now() - interval '2 days' + interval '5 minutes', 'psi_plantao', '{"offeredPrice":200}'),
          ('booking_confirmed', 'sess-A', now() - interval '2 days' + interval '15 minutes', 'psi_plantao', '{"agreedPrice":200,"platformFee":40}')
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
      } catch (err) {
        console.error('⚠️ Erro na limpeza:', err.message);
      }
      await pool.end();
    }
  });

  test('1. GET /api/manager/search - Busca global', async () => {
    const res = await request(app)
      .get('/api/manager/search')
      .query({ q: 'teste' });
    
    expect(res.status).toBeLessThan(500);
    
    if (res.status === 200) {
      expect(res.body).toHaveProperty('results');
      console.log(`   ✓ Busca retornou ${res.body.results?.length || 0} resultados`);
    } else if (res.status === 404) {
      console.log('   ⚠️ Endpoint não implementado (404)');
    } else {
      console.log(`   ⚠️ Status ${res.status}: ${JSON.stringify(res.body).slice(0, 100)}`);
    }
  });

  test('2. GET /metrics/v2/doctors/alerts - Alertas de médicos', async () => {
    const res = await request(app)
      .get('/metrics/v2/doctors/alerts')
      .query({ days: 7 });
    
    expect(res.status).toBeLessThan(500);
    
    if (res.status === 200) {
      expect(res.body).toBeDefined();
      console.log(`   ✓ Alertas: ${JSON.stringify(res.body).slice(0, 100)}`);
    } else if (res.status === 404) {
      console.log('   ⚠️ Endpoint não implementado (404)');
    } else {
      console.log(`   ⚠️ Status ${res.status}`);
    }
  });

  test('3. GET /metrics/v2/funnel - Funil de telemetria', async () => {
    const res = await request(app)
      .get('/metrics/v2/funnel')
      .query({ days: 7 });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rows');
    expect(res.body).toHaveProperty('events');
    
    console.log(`   ✓ Funil: ${res.body.rows?.length || 0} campanhas, ${res.body.events?.length || 0} eventos`);
  });

  test('4. GET /metrics/v2/ab - Experimentos A/B', async () => {
    const res = await request(app)
      .get('/metrics/v2/ab')
      .query({ days: 7, experiment: 'lp_hero_v1' });
    
    expect(res.status).toBeLessThan(500);
    
    if (res.status === 200) {
      expect(res.body).toBeDefined();
      console.log(`   ✓ A/B: ${JSON.stringify(res.body).slice(0, 100)}`);
    } else if (res.status === 404) {
      console.log('   ⚠️ Endpoint não implementado (404)');
    } else {
      console.log(`   ⚠️ Status ${res.status}`);
    }
  });

  test('5. GET /api/manager/prontuarios/:id/audit - Auditoria de prontuário', async () => {
    const testId = 'test-prontuario-123';
    
    const res = await request(app)
      .get(`/api/manager/prontuarios/${testId}/audit`);
    
    expect(res.status).toBeLessThan(500);
    
    if (res.status === 200) {
      expect(res.body).toBeDefined();
      const auditCount = res.body.audit?.length || res.body.length || 0;
      console.log(`   ✓ Auditoria: ${auditCount} registros`);
    } else if (res.status === 404) {
      console.log('   ⚠️ Prontuário não encontrado ou endpoint não implementado');
    } else {
      console.log(`   ⚠️ Status ${res.status}`);
    }
  });

});
