import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  retries: 0,
  use: {
    baseURL: process.env.CAPYPAY_E2E_BASE_URL || 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1366, height: 900 }
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    port: 4173,
    timeout: 120_000,
    reuseExistingServer: true
  }
});
