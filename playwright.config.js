import { defineConfig } from '@playwright/test';

// Configuration flexible via variables d'environnement
const baseURL = process.env.BASE_URL || 'https://www.allmovies2a.dev/';

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 3,
  fullyParallel: true,
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
  workers: 5,
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  
  // Projets : setup d'authentification + tests
  projects: [
    // Projet de setup : se connecte et sauvegarde la session
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    // Projet principal : utilise la session authentifiée
    {
      name: 'chromium',
      use: {
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.js/,
    },
  ],
});
