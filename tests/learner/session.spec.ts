import { test, expect } from '../../src/fixtures';
import { seededUsers } from '../../src/data/test-data';

test.describe('Learner session (storageState)', () => {
  test('stored learner session opens My learning without logging in @smoke', async ({ page, myLearningPage }) => {
    await myLearningPage.goto();

    await expect(page).toHaveURL(/\/my-learning$/);
    await expect(myLearningPage.heading).toHaveText('My learning');
    await expect(myLearningPage.currentUser).toHaveText(
      `Signed in as ${seededUsers.learner.firstName} ${seededUsers.learner.lastName}`
    );
  });

  test('learner role cannot open course management', async ({ page }) => {
    const response = await page.goto('/admin/courses');

    expect(response?.status()).toBe(403);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Access denied');
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Admin' })).toHaveCount(0);
  });

  test('learner can log out and protected pages require login again', async ({
    page,
    freshLearner,
    myLearningPage,
    loginPage
  }) => {
    await myLearningPage.goto();
    await expect(myLearningPage.currentUser).toContainText(freshLearner.data.firstName);

    await myLearningPage.logout();

    await expect(loginPage.statusMessage).toHaveText('You have been logged out.');
    await myLearningPage.goto();
    await expect(page).toHaveURL(/\/login\?next=%2Fmy-learning$/);
  });
});
