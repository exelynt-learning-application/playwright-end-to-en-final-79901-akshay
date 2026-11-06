import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE } from './src/data/auth-state';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const isCI = Boolean(process.env.CI);
const externalBaseURL = process.env.BASE_URL || undefined;
const port = Number(process.env.PORT || 3100);
const baseURL = externalBaseURL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 4 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: isCI
    ? [
        ['list'],
        ['github'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }]
      ]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000
  },
  // Start the bundled EXELYNT reference app unless an external environment is supplied.
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'node app/server.js',
        url: `${baseURL}/health`,
        env: { PORT: String(port) },
        reuseExistingServer: !isCI,
        timeout: 30_000,
        stdout: 'ignore',
        stderr: 'pipe'
      },
  projects: [
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /.*\.setup\.ts/
    },
    {
      name: 'public',
      testDir: './tests/public',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'learner',
      testDir: './tests/learner',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE.learner }
    },
    {
      name: 'admin',
      testDir: './tests/admin',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE.admin }
    }
  ]
});
