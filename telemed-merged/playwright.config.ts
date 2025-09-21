import { defineConfig, devices } from '@playwright/test';

// @ts-ignore - process is available in Node.js environment
const isCI = process.env.CI;

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  use: {
    // @ts-ignore - process is available in Node.js environment
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:5173',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});