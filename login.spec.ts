import { test, expect } from '../../src/fixtures';
import { learnerAccount } from '../../src/test-data';

test('learner session is authenticated using stored state @smoke', async ({ page }) => {
  await page.goto('/my-learning');
  await expect(page).not.toHaveURL(/\\/login/);
  await expect(page.getByRole('heading', { name: /my learning|my courses/i })).toBeVisible();
});

test('learner can log in through the login form', async ({ page, authPage }) => {
  // A fresh context verifies the interactive login path independently of storageState.
  await page.context().clearCookies();
  await authPage.openLogin();
  await authPage.login(learnerAccount.email, learnerAccount.password);
  await expect(page).not.toHaveURL(/\\/login/);
});