import { test, expect } from '../../src/fixtures';
import { buildLearner } from '../../src/data/test-data';

test.describe('Flow 1 – learner registration', () => {
  test('new learner registers and lands on an empty My learning page @smoke', async ({
    page,
    registrationPage,
    myLearningPage
  }, testInfo) => {
    const learner = buildLearner(testInfo);

    await registrationPage.goto();
    await expect(registrationPage.heading).toHaveText('Create your learner account');
    await registrationPage.register(learner);

    await expect(page).toHaveURL(/\/my-learning\?welcome=1$/);
    await expect(myLearningPage.statusMessage).toHaveText(`Account created. Welcome, ${learner.firstName}!`);
    await expect(myLearningPage.currentUser).toHaveText(`Signed in as ${learner.firstName} ${learner.lastName}`);
    await expect(myLearningPage.emptyState).toContainText('You are not enrolled in any courses yet.');
  });

  test('newly registered learner can log back in with the new credentials', async ({
    page,
    registrationPage,
    loginPage
  }, testInfo) => {
    const learner = buildLearner(testInfo);
    await registrationPage.goto();
    await registrationPage.register(learner);
    await expect(page).toHaveURL(/\/my-learning/);

    await registrationPage.logout();
    await expect(loginPage.statusMessage).toHaveText('You have been logged out.');
    await loginPage.login(learner.email, learner.password);

    await expect(page).toHaveURL(/\/my-learning$/);
    await expect(loginPage.currentUser).toHaveText(`Signed in as ${learner.firstName} ${learner.lastName}`);
  });

  test('registration is rejected when the email is already registered', async ({
    page,
    api,
    registrationPage
  }, testInfo) => {
    const existing = buildLearner(testInfo);
    await api.registerLearner(existing);

    await registrationPage.goto();
    await registrationPage.register({ ...existing, firstName: 'Duplicate' });

    await expect(registrationPage.errorAlert).toContainText('An account with this email already exists.');
    await expect(page).toHaveURL(/\/register$/);
    await expect(registrationPage.currentUser).toBeHidden();
  });

  test('registration validates required fields and password rules', async ({ registrationPage }, testInfo) => {
    const learner = buildLearner(testInfo, { firstName: '', password: 'short' });

    await registrationPage.goto();
    await registrationPage.register(learner, 'different');

    const errors = registrationPage.errorAlert.getByRole('listitem');
    await expect(errors).toHaveText([
      'First name is required.',
      'Password must be at least 8 characters.',
      'Passwords do not match.'
    ]);
    // Entered values are preserved so the learner only fixes what is wrong.
    await expect(registrationPage.emailInput).toHaveValue(learner.email);
    await expect(registrationPage.passwordInput).toHaveValue('');
  });
});
