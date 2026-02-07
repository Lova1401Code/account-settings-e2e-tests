import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const ENV = process.env.TEST_ENV || 'local';

const envFile = `.env.${ENV}`;
dotenv.config({ 
  path: path.resolve(process.cwd(), envFile),
  debug: false
});
const baseURL = process.env.BASE_URL || 'http://localhost:5173/';

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
  
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'no-auth',
      testMatch: /signup\.spec\.js|signin\.spec\.js|forgot-password\.spec\.js/,
    },
    {
      name: 'responsive-mobile',
      testDir: './tests-responsive',
      use: {
        ...devices['iPhone 13'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'responsive-tablet',
      testDir: './tests-responsive',
      use: {
        ...devices['iPad Mini'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'chromium',
      use: {
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.js|signup\.spec\.js|signin\.spec\.js|forgot-password\.spec\.js/,
    },
  ],
});
