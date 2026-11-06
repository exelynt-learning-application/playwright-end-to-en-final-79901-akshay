import { test, expect } from '../../src/fixtures';
import { seededUsers } from '../../src/data/test-data';

test.describe('Flow 1 – learner login', () => {
  test('seeded learner logs in through the form @smoke', async ({ page, loginPage, myLearningPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toHaveText('Log in to EXELYNT');

    await loginPage.login(seededUsers.learner.email, seededUsers.learner.password);

    await expect(page).toHaveURL(/\/my-learning$/);
    await expect(myLearningPage.heading).toHaveText('My learning');
    await expect(myLearningPage.currentUser).toHaveText(
      `Signed in as ${seededUsers.learner.firstName} ${seededUsers.learner.lastName}`
    );
  });

  test('login with a wrong password shows an error and keeps the user signed out', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(seededUsers.learner.email, 'not-the-right-password');

    await expect(loginPage.errorAlert).toContainText('Invalid email or password.');
    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.emailInput).toHaveValue(seededUsers.learner.email);
    await expect(loginPage.currentUser).toBeHidden();
  });

  test('protected pages redirect to login and return the learner afterwards', async ({ page, loginPage }) => {
    await page.goto('/my-learning');
    await expect(page).toHaveURL(/\/login\?next=%2Fmy-learning$/);

    await loginPage.login(seededUsers.learner.email, seededUsers.learner.password);

    await expect(page).toHaveURL(/\/my-learning$/);
    await expect(loginPage.heading).toHaveText('My learning');
  });
});
