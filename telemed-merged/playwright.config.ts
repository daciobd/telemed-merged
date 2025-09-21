import { defineConfig, devices } from '@playwright/test';

// @ts-ignore - process is available in Node.js environment
const isCI = process.env.CI;

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!isCI,
  retries: 2,
  workers: isCI ? 1 : undefined,
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
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});