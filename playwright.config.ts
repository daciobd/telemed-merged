import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  retries: 0,
  use: { baseURL: BASE_URL, headless: true },
  projects: [ { name: 'chromium', use: { ...devices['Desktop Chrome'] } } ]
});