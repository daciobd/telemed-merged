import { test, expect } from '@playwright/test';

function ok(json: any) { return { status: 200, contentType: 'application/json', body: JSON.stringify(json) }; }

test('Consulta: emitir prescrição digital (ANVISA)', async ({ page }) => {
  await page.goto('/consulta.html?appointmentId=APT-555&role=medico');

  // Mocks comuns
  await page.route(/\/api\/events$/, r => r.fulfill(ok({ ok: true })));
  await page.route(/\/api\/feedback$/, r => r.fulfill(ok({ ok: true })));

  // Abrir modal de prescrição
  await page.getByRole('button', { name: 'Nova Prescrição' }).click();
  await expect(page.locator('#rx-modal')).toHaveClass(/show/);

  // Buscar medicamento
  await page.route(/\/api\/drugs\/search.*/, r => r.fulfill(ok([
    { anvisa_code:'102310045', name:'Paracetamol 750mg comprimido', form:'cp', concentration:'750mg', route:'VO' }
  ])));

  await page.fill('#drug-q', 'paracetamol');
  await page.click('#drug-search');
  await page.getByRole('button', { name: 'Adicionar' }).click();

  // Emitir
  await page.route(/\/api\/prescriptions$/, r => r.fulfill(ok({ ok: true, id: 'RX-999', pdf_url: 'about:blank' })));
  await page.getByRole('button', { name: 'Emitir Prescrição' }).click();

  // Modal fecha e tabela de prescrições é atualizada
  await expect(page.locator('#rx-modal')).not.toHaveClass(/show/);
  await expect(page.locator('#presc-table')).toContainText('Paracetamol');
});