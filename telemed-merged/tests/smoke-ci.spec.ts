import { test, expect } from '@playwright/test';

// @ts-ignore - process is available in Node.js environment
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
// @ts-ignore - process is available in Node.js environment
const HEALTH = process.env.E2E_HEALTH_PATH || '/';

test('smoke test - homepage loads', async ({ page }) => {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/telemed|home|dashboard/i);
});

test('smoke test - health endpoint responds', async ({ request }) => {
  const res = await request.get(`${BASE}${HEALTH}`);
  expect(res.ok()).toBeTruthy();
});