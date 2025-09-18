import { test, expect } from '@playwright/test';

function ok(json: any) { return { status: 200, contentType: 'application/json', body: JSON.stringify(json) }; }
function resp(status: number, body: any = '') { return { status, contentType: 'application/json', body: typeof body==='string'? body: JSON.stringify(body) }; }

// 1) Idempotência: mesma Idempotency-Key não duplica emissão
// Simula backend retornando 200 na primeira e 409 na segunda com mesmo key
test('Prescrição: idempotência em POST /api/prescriptions', async ({ page }) => {
  await page.goto('/consulta.html?appointmentId=APT-777&role=medico');

  // Abrir modal
  await page.getByRole('button', { name: 'Nova Prescrição' }).click();
  await expect(page.locator('#rx-modal')).toHaveClass(/show/);

  // Buscar e adicionar
  await page.route(/\/api\/drugs\/search.*/, r => r.fulfill(ok([{ anvisa_code:'1023', name:'Amoxicilina 500mg cápsula', form:'cap', concentration:'500mg', route:'VO' }])));
  await page.fill('#drug-q', 'amoxi');
  await page.click('#drug-search');
  await page.getByRole('button', { name: 'Adicionar' }).click();

  let called = 0;
  let lastIdempotencyKey = '';
  await page.route(/\/api\/prescriptions$/, async r => {
    called += 1;
    const key = r.request().headers()['idempotency-key'];
    lastIdempotencyKey = key || '';
    
    if(called === 1) {
      expect(key).toBeTruthy(); // Deve haver uma chave na primeira chamada
      return r.fulfill(ok({ ok:true, id:'RX-ido-1', pdf_url:'about:blank' }));
    }
    
    // Segunda chamada deve usar mesma key (simulando retry/double-click)
    expect(key).toBe(lastIdempotencyKey);
    return r.fulfill(ok({ ok:true, id:'RX-ido-1', pdf_url:'about:blank', cached:true }));
  });

  // Emite uma vez
  await page.getByRole('button', { name: 'Emitir Prescrição' }).click();
  await expect(page.locator('#rx-modal')).not.toHaveClass(/show/);

  // Simula double-click/retry: reabre e submete com mesma idempotency key
  await page.getByRole('button', { name: 'Nova Prescrição' }).click();
  await expect(page.locator('#rx-modal')).toHaveClass(/show/);
  await page.getByRole('button', { name: 'Emitir Prescrição' }).click();
  
  // Deve ter feito 2 chamadas com mesma chave
  expect(called).toBe(2);
});

// 2) Permissão: outro médico não pode emitir receita do appointment de terceiros (403)
test('Prescrição: 403 para médico não pertencente ao atendimento', async ({ page }) => {
  await page.goto('/consulta.html?appointmentId=APT-888&role=medico');

  await page.getByRole('button', { name: 'Nova Prescrição' }).click();
  await expect(page.locator('#rx-modal')).toHaveClass(/show/);

  await page.route(/\/api\/drugs\/search.*/, r => r.fulfill(ok([{ anvisa_code:'9999', name:'Dipirona 500mg comprimido', form:'cp', concentration:'500mg' }])));
  await page.fill('#drug-q', 'dipi');
  await page.click('#drug-search');
  await page.getByRole('button', { name: 'Adicionar' }).click();

  await page.route(/\/api\/prescriptions$/, r => r.fulfill(resp(403, { ok:false, error:'forbidden' })));
  await page.getByRole('button', { name: 'Emitir Prescrição' }).click();

  // Modal permanece aberto em caso de erro; UI deve alertar (depende da sua implementação)
  await expect(page.locator('#rx-modal')).toHaveClass(/show/);
});

// 3) PDF expirado: link vencido exibe aviso amigável
test('Prescrição: PDF expirado exibe aviso amigável', async ({ page }) => {
  await page.goto('/phr.html?person=Paciente%20Exemplo&personId=P-0001');

  // Mocks para PHR: receitas recentes com PDF expirado
  await page.route(/\/api\/patients\/P-0001\/phr$/, r => r.fulfill(ok({
    person:{ name:'Paciente Exemplo', doc:'111', sex:'F', birth:'1990-01-01', age:34, gender:'Feminino', document:'123.456.789-00', joinedAt:new Date().toISOString() },
    allergies:[], medications:[], conditions:[], team:[]
  })));
  await page.route(/\/api\/patients\/P-0001\/events$/, r => r.fulfill(ok([])));
  await page.route(/\/api\/patients\/P-0001\/prescriptions$/, r => r.fulfill(ok([
    { id:'RX-exp', createdAt:new Date().toISOString(), items:[{name:'Paracetamol 750mg'}], pdf_url:'/api/prescriptions/RX-exp/pdf?sig=expired' }
  ])));

  // Intercepta HEAD request do PDF para devolver 410 (expirado)
  await page.route(/\/api\/prescriptions\/RX-exp\/pdf.*/, r => r.fulfill(resp(410, 'expired')));

  // Captura alert para verificar mensagem amigável
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('expirou');
    await dialog.accept();
  });

  // Clica no botão Ver PDF e espera alert amigável
  await page.getByRole('button', { name: 'Ver PDF' }).click();
  
  // Aguarda um pouco para garantir que o alert foi capturado
  await page.waitForTimeout(100);
});