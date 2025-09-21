import { defineConfig, devices } from '@playwright/test';

// @ts-ignore - process is available in Node.js environment
const isCI = process.env.CI;
// @ts-ignore - process is available in Node.js environment
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: 'tests',
  testMatch: ['**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !isCI,
  },
});