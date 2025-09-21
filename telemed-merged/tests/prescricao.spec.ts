import { test, expect } from '@playwright/test';

function ok(json: any) { return { status: 200, contentType: 'application/json', body: JSON.stringify(json) }; }

// @ts-ignore - process is available in Node.js environment
const RX_ENTRY = process.env.E2E_ENTRY_PRESCRICAO || '/consulta.html?appointmentId=APT-555&role=medico';

test('Consulta: emitir prescrição digital (ANVISA)', async ({ page }) => {
  // 1) Entre na rota correta (configure no CI se não for padrão)
  await page.goto(RX_ENTRY, { waitUntil: 'domcontentloaded' });

  // 2) Garanta que a UI principal carregou
  await expect(page.locator('body')).toBeVisible();

  // Mocks comuns
  await page.route(/\/api\/events$/, r => r.fulfill(ok({ ok: true })));
  await page.route(/\/api\/feedback$/, r => r.fulfill(ok({ ok: true })));

  // 3) Seletor robusto: tente por data-testid; se não tiver, use regex e espere visibilidade
  const novaRxBtn = page
    .getByTestId('rx-new')                      // melhor: use data-testid="rx-new" no botão real
    .or(page.getByRole('button', { name: /nova prescri(ç|c)ão/i }))
    .or(page.getByText(/nova prescri(ç|c)ão/i).filter({ has: page.locator('button') }));

  await expect(novaRxBtn).toBeVisible({ timeout: 15000 });
  await novaRxBtn.scrollIntoViewIfNeeded();
  await novaRxBtn.click();

  const modal = page.locator('#rx-modal').or(page.getByTestId('rx-modal'));
  await expect(modal).toBeVisible();

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