import { test, expect } from '@playwright/test';
import { AuthPage } from '../../src/pages/auth.page';
import { uniqueLearner } from '../../src/test-data';

test('learner can register a new account @smoke', async ({ page }) => {
  const auth = new AuthPage(page);
  await auth.openRegistration();
  await auth.register(uniqueLearner);
  await expect(page.getByText(/account created|welcome|verify your email/i)).toBeVisible();
});