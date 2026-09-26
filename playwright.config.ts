import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3100';
const chrome = { channel: 'chrome' as const };

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Africa/Kinshasa',
    serviceWorkers: 'allow',
  },
  // Local runs start the production build themselves (npm run build first).
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npx next start -p 3100', url: 'http://localhost:3100', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...chrome, viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...chrome } },
  ],
});
