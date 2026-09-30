import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome', headless: true, screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/preview-production.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
});
