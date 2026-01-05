import { defineConfig } from '@playwright/test';

// Configuration flexible via variables d'environnement
const baseURL = process.env.BASE_URL || 'https://www.allmovies2a.dev';

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 3,
  expect: {
    timeout: 30000,
  },
  use: {
    baseURL,
    actionTimeout: 30000,
    navigationTimeout: 90000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  workers: 2,
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
});

