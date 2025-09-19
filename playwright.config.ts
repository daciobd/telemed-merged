import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  projects: [ { name: 'chromium', use: { ...devices['Desktop Chrome'] } } ]
});