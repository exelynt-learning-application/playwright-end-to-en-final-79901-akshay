import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL is required. Copy .env.example to .env and set BASE_URL.');
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/*.setup.ts'
    },
    {
      name: 'learner-chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/learner.json' },
      dependencies: ['setup'],
      testMatch: '**/tests/learner/**/*.spec.ts'
    },
    {
      name: 'admin-chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/admin.json' },
      dependencies: ['setup'],
      testMatch: '**/tests/admin/**/*.spec.ts'
    },
    {
      name: 'public-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/tests/public/**/*.spec.ts'
    }
  ]
});