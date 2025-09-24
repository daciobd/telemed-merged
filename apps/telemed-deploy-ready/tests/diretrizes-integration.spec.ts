import { test, expect } from '@playwright/test';

test('Diretrizes abre Dr. AI com contexto', async ({ page, context }) => {
  // Navegar para a página de consulta como médico
  await page.goto('/consulta/sala?role=medico');
  
  // Preencher os dados do paciente
  await page.fill('[name="chief-complaint"]', 'Dor torácica ao esforço');
  await page.fill('[name="patient-age"]', '54');
  await page.selectOption('[name="patient-gender"]', { value: 'male' });

  // Aguardar um pouco para garantir que os dados foram preenchidos
  await page.waitForTimeout(500);

  // Esperar por uma nova página ao clicar no botão Diretrizes
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.click('button:has-text("Diretrizes")')
  ]);

  // Aguardar a nova página carregar completamente
  await newPage.waitForLoadState('domcontentloaded');

  // Verificar se a URL contém os parâmetros corretos
  await expect(newPage).toHaveURL(/\/dr-ai\/\?(.+&)?q=Dor\+tor%C3%A1cica\+ao\+esfor%C3%A7o&age=54&sex=male/);

  // Verificar se os campos estão pré-preenchidos
  await expect(newPage.locator('#symptom-input')).toHaveValue('Dor torácica ao esforço');
  await expect(newPage.locator('#age-input')).toHaveValue('54');
  await expect(newPage.locator('#gender-select')).toHaveValue('male');

  // Verificar se o banner de contexto está visível
  const contextBanner = newPage.locator('.dr-ai-container > div:first-child');
  await expect(contextBanner).toContainText('Contexto da Consulta');
  await expect(contextBanner).toContainText('Dor torácica ao esforço');
  await expect(contextBanner).toContainText('54 anos');
  await expect(contextBanner).toContainText('male');
});

test('Botão Diretrizes desabilitado sem dados completos', async ({ page }) => {
  // Navegar para a página de consulta como médico
  await page.goto('/consulta/sala?role=medico');
  
  // Inicialmente o botão deve estar desabilitado
  const diretrizesButton = page.locator('[data-testid="button-diretrizes"]');
  await expect(diretrizesButton).toBeDisabled();
  
  // Preencher apenas a queixa
  await page.fill('[name="chief-complaint"]', 'Dor de cabeça');
  await expect(diretrizesButton).toBeDisabled();
  
  // Preencher também a idade
  await page.fill('[name="patient-age"]', '30');
  await expect(diretrizesButton).toBeDisabled();
  
  // Preencher o sexo - agora deve habilitar
  await page.selectOption('[name="patient-gender"]', { value: 'female' });
  await expect(diretrizesButton).toBeEnabled();
});

test('Validação de idade fora do intervalo', async ({ page }) => {
  // Navegar para a página de consulta como médico
  await page.goto('/consulta/sala?role=medico');
  
  const diretrizesButton = page.locator('[data-testid="button-diretrizes"]');
  
  // Preencher com idade inválida (muito alta)
  await page.fill('[name="chief-complaint"]', 'Teste');
  await page.fill('[name="patient-age"]', '150');
  await page.selectOption('[name="patient-gender"]', { value: 'other' });
  
  await expect(diretrizesButton).toBeDisabled();
  
  // Corrigir para idade válida
  await page.fill('[name="patient-age"]', '65');
  await expect(diretrizesButton).toBeEnabled();
});

test('Queixa muito curta não habilita botão', async ({ page }) => {
  // Navegar para a página de consulta como médico
  await page.goto('/consulta/sala?role=medico');
  
  const diretrizesButton = page.locator('[data-testid="button-diretrizes"]');
  
  // Preencher com queixa muito curta
  await page.fill('[name="chief-complaint"]', 'dor');
  await page.fill('[name="patient-age"]', '30');
  await page.selectOption('[name="patient-gender"]', { value: 'male' });
  
  await expect(diretrizesButton).toBeDisabled();
  
  // Corrigir para queixa adequada
  await page.fill('[name="chief-complaint"]', 'dor abdominal');
  await expect(diretrizesButton).toBeEnabled();
});