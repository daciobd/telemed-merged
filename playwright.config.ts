import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// @ts-ignore - process is available in Node.js environment
const isCI = process.env.CI;
// @ts-ignore - process is available in Node.js environment
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

// @ts-ignore - __dirname is available in Node.js environment
const appDir = path.resolve(__dirname, 'telemed-merged');

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
    cwd: appDir,
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: !isCI,
  },
});