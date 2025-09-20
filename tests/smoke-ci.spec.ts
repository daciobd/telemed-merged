import { test, expect } from '@playwright/test';

test('smoke test - homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TeleMed/i);
});

test('smoke test - health endpoint responds', async ({ request }) => {
  const response = await request.get('/health.json');
  expect(response.ok()).toBeTruthy();
});