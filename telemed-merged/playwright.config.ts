import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  // @ts-ignore - process is available in Node.js environment
  forbidOnly: !!process.env.CI,
  retries: 2,
  // @ts-ignore - process is available in Node.js environment
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  expect: { timeout: 10_000 },
  use: {
    // @ts-ignore - process is available in Node.js environment
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:5173',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // webServer removed - CI handles static server setup
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});