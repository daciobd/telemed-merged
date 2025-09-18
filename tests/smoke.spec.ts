import { test, expect } from '@playwright/test';

// Util de mocks
function ok(json: any) { return { status: 200, contentType: 'application/json', body: JSON.stringify(json) }; }
function noContent() { return { status: 200, body: '' }; }

// Rotas comuns
async function wireCommonMocks(page) {
  await page.route(/\/api\/events$/, route => route.fulfill(ok({ ok: true })));
  await page.route(/\/api\/feedback$/, route => route.fulfill(ok({ ok: true })));
  await page.route(/\/api\/chat\/send$/, route => route.fulfill(ok({ ok: true })));
}

// 1) Fluxo da Consulta: SOAP + Chat + Finalizar
test('Consulta: validação, chat e finalizar com NPS', async ({ page }) => {
  await page.goto('/consulta.html?appointmentId=APT-123&role=medico');

  await wireCommonMocks(page);
  await page.route(/\/api\/appointments\/APT-123\/room-state/, r => r.fulfill(ok({ hostPresent: true, patientPresent: false, canJoin: true })));
  await page.route(/\/api\/appointments\/APT-123\/call\/start/, r => r.fulfill(ok({ ok: true })));
  await page.route(/\/api\/appointments\/APT-123\/note\/save/, r => r.fulfill(ok({ ok: true })));
  await page.route(/\/api\/appointments\/APT-123\/finalize/, r => r.fulfill(ok({ ok: true })));

  // Gate desabilitado no início
  await expect(page.locator('#btn-finalize')).toBeDisabled();

  // Preencher obrigatórios
  await page.fill('#queixa', 'febre e odinofagia');
  await page.fill('#hda', '3 dias, sem dispneia');
  await page.fill('#hipotese', 'Faringite aguda');

  // Chat abre e envia
  await page.getByRole('button', { name: 'Chat' }).click();
  await page.fill('#tm-chat-input', 'Paciente relata piora noturna');
  await page.click('#tm-chat-form button[type="submit"]');

  // Finalizar
  await expect(page.locator('#btn-finalize')).toBeEnabled();
  await page.click('#btn-finalize');

  // NPS modal aparece
  await expect(page.locator('#nps')).toBeVisible();
  await page.click('#nps-send');
});

// 2) Dashboard: Ver slots e Agendar
test('Dashboard: ver slots e agendar', async ({ page }) => {
  await page.goto('/dashboard-medico.html');

  await wireCommonMocks(page);
  await page.route(/\/api\/doctor\/dashboard.*/, r => r.fulfill(ok({
    stats: { queue: 1, upcoming: 1, done: 0 },
    queue: [{ appointmentId: 'APT-101', person: 'Karina', age: 31, complaint: 'ansiedade', offer: 120, since: new Date().toISOString(), specialty: 'psiquiatria' }],
    upcoming: [{ appointmentId: 'APT-201', person: 'Solange', age: 55, at: new Date(Date.now()+3_600_000).toISOString(), minPrice: 110, specialty: 'psiquiatria' }],
    recent: []
  })));
  await page.route(/\/api\/market\/price-floor.*/, r => r.fulfill(ok({ now_floor: 140, in_2h_floor: 110, tomorrow_floor: 90 })));
  await page.route(/\/api\/market\/availability.*/, r => r.fulfill(ok({
    offer: 120,
    immediate: { doctors_available: 0, eta_minutes: null },
    next_2h: { doctors_available: 2, eta_minutes: 60 },
    tomorrow: { doctors_available: 5 },
    suggested_slots: [
      { start: new Date(Date.now()+3_600_000).toISOString(), min_price: 110 }
    ]
  })));
  await page.route(/\/api\/appointments\/APT-101\/schedule$/, r => r.fulfill(ok({ ok: true })));

  // Abrir modal de slots do card da fila
  await page.getByRole('button', { name: /ver slots/i }).first().click();
  await expect(page.locator('#tm-slots-modal')).toHaveClass(/show/);

  // Clicar em Agendar
  await page.getByRole('button', { name: 'Agendar' }).click();
  await expect(page.locator('#tm-slots-modal')).not.toHaveClass(/show/);
});

// 3) Meus Pacientes: filtro e links
test('Meus Pacientes: buscar e abrir PHR', async ({ page }) => {
  await page.goto('/meus-pacientes.html');

  await page.route(/\/api\/doctor\/patients.*/, r => r.fulfill(ok([
    { personId: 'P-0001', name: 'Karina Pinheiro', lastSpec: 'psiquiatria', lastAppt: new Date().toISOString() }
  ])));

  await page.fill('#f-name', 'Karina');
  await page.click('#btn-search');

  const row = page.getByRole('row').filter({ hasText: 'Karina Pinheiro' });
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: 'PHR' }).click();
});

// 4) Consulta: lookup CID/CIAP
test('Consulta: lookup CID-10/CIAP preenche código oculto', async ({ page }) => {
  await page.goto('/consulta.html?appointmentId=APT-999&role=medico');
  await wireCommonMocks(page);

  await page.route(/\/api\/codes\/search.*/, r => r.fulfill(ok([
    { system: 'icd10', code: 'J02.9', label: 'Faringite aguda, não especificada' }
  ])));

  await page.fill('#hipotese', 'Faringite');
  // caixa de sugestões aparece
  await page.waitForSelector('.icd-hints', { state: 'visible' });
  // clicar na primeira sugestão
  const first = page.locator('.icd-hints div').first();
  await first.click();

  // validar campo oculto com system:code
  const hiddenValue = await page.locator('#hipotese_code').getAttribute('value');
  expect(hiddenValue).toBe('icd10:J02.9');
});

// 5) Widget de Suporte: Reportar problema
test('Widget de Suporte: reportar problema', async ({ page }) => {
  await page.goto('/dashboard-medico.html');
  
  await wireCommonMocks(page);
  await page.route(/\/api\/support\/ticket$/, r => r.fulfill(ok({ ok: true })));

  // Clicar no widget de ajuda
  await page.click('button[data-testid="help-widget"]');
  await expect(page.locator('#tm-help-panel')).toBeVisible();
  
  // Clicar em "Reportar problema"
  await page.click('a[href="#report"]');
  
  // Simular entrada de problema (será um prompt)
  page.on('dialog', async dialog => {
    expect(dialog.type()).toBe('prompt');
    await dialog.accept('Teste de integração do widget');
  });
  
  // Aguardar confirmação
  await expect(page.locator('#tm-help-panel')).toContainText('Problema reportado');
});

// 6) Dr. AI: Dashboard de métricas
test('Dr. AI: dashboard de métricas carrega', async ({ page }) => {
  await page.goto('/dr-ai-dashboard.html');

  // Verificar se elementos do dashboard carregam
  await expect(page.locator('#triagens-hoje')).toBeVisible();
  await expect(page.locator('#precisao-algoritmo')).toBeVisible();
  await expect(page.locator('#distribuicao-especialidade')).toBeVisible();
  await expect(page.locator('#tempo-medio')).toBeVisible();

  // Widget de ajuda deve estar presente
  await expect(page.locator('button[data-testid="help-widget"]')).toBeVisible();
});