import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { test as setup, expect } from '../../src/fixtures';
import { STORAGE_STATE } from '../../src/data/auth-state';
import { seededUsers } from '../../src/data/test-data';

/**
 * Logs in once per role through the real login form and saves the browser
 * storage state. The learner/admin projects reuse it, so specs start already
 * authenticated without repeating the login UI.
 */
setup.beforeAll(() => {
  mkdirSync(path.dirname(STORAGE_STATE.learner), { recursive: true });
});

setup('authenticate seeded learner', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login(seededUsers.learner.email, seededUsers.learner.password);
  await expect(page).toHaveURL(/\/my-learning$/);
  await expect(loginPage.currentUser).toHaveText(
    `Signed in as ${seededUsers.learner.firstName} ${seededUsers.learner.lastName}`
  );
  await page.context().storageState({ path: STORAGE_STATE.learner });
});

setup('authenticate seeded admin', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login(seededUsers.admin.email, seededUsers.admin.password);
  await expect(page).toHaveURL(/\/admin\/courses$/);
  await expect(loginPage.heading).toHaveText('Course management');
  await page.context().storageState({ path: STORAGE_STATE.admin });
});
