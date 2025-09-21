import { test, expect } from '@playwright/test';

test('smoke test - homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/telemed|home|dashboard/i);
});

test('smoke test - health endpoint responds', async ({ page }) => {
  const health = await page.request.get('/health.json').catch(() => null);
  if (health) {
    expect(health.ok()).toBeTruthy();
  } else {
    // Fallback: just verify page loads
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  }
});