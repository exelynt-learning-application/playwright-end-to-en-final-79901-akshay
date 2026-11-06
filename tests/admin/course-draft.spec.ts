import { test, expect } from '../../src/fixtures';
import { STORAGE_STATE } from '../../src/data/auth-state';
import { buildCourseDraft, seededUsers } from '../../src/data/test-data';

test.describe('Flow 5 – admin creates a course draft', () => {
  test('stored admin session opens course management @smoke', async ({ page, adminCoursesPage }) => {
    await adminCoursesPage.goto();

    await expect(page).toHaveURL(/\/admin\/courses$/);
    await expect(adminCoursesPage.heading).toHaveText('Course management');
    await expect(adminCoursesPage.currentUser).toHaveText(
      `Signed in as ${seededUsers.admin.firstName} ${seededUsers.admin.lastName}`
    );
    await expect(adminCoursesPage.courseTable).toBeVisible();
  });

  test('admin saves a new course as a draft @smoke', async ({ page, adminCoursesPage }, testInfo) => {
    const draft = buildCourseDraft(testInfo, { category: 'Compliance' });

    await adminCoursesPage.goto();
    await adminCoursesPage.createDraft(draft);

    await expect(page).toHaveURL(/\/admin\/courses\?created=draft-[\w-]+$/);
    await expect(adminCoursesPage.statusMessage).toHaveText(`Course draft “${draft.title}” saved.`);
    await expect(adminCoursesPage.courseRow(draft.title)).toHaveCount(1);
    await expect(adminCoursesPage.courseCell(draft.title, 'Category')).toHaveText('Compliance');
    await expect(adminCoursesPage.courseCell(draft.title, 'Status')).toHaveText('Draft');
    await expect(adminCoursesPage.courseCell(draft.title, 'Lessons')).toHaveText('0');
  });

  test('draft form validates required fields and keeps entered values', async ({ page, adminCoursesPage }) => {
    await adminCoursesPage.goto();
    await adminCoursesPage.createCourseLink.click();
    await expect(adminCoursesPage.heading).toHaveText('Create course');

    await adminCoursesPage.descriptionInput.fill('Description without a title');
    await adminCoursesPage.saveDraftButton.click();

    await expect(adminCoursesPage.errorAlert.getByRole('listitem')).toHaveText([
      'Course title is required.',
      'Choose a category.'
    ]);
    await expect(page).toHaveURL(/\/admin\/courses\/new$/);
    await expect(adminCoursesPage.descriptionInput).toHaveValue('Description without a title');
  });

  test('duplicate course titles are rejected', async ({ adminCoursesPage }, testInfo) => {
    const draft = buildCourseDraft(testInfo);
    await adminCoursesPage.goto();
    await adminCoursesPage.createDraft(draft);
    await expect(adminCoursesPage.courseRow(draft.title)).toHaveCount(1);

    await adminCoursesPage.createDraft(draft);

    await expect(adminCoursesPage.errorAlert).toContainText('A course with this title already exists.');
  });

  test('a draft is hidden from learners until it is published', async ({
    browser,
    baseURL,
    adminCoursesPage
  }, testInfo) => {
    const draft = buildCourseDraft(testInfo);
    await adminCoursesPage.goto();
    await adminCoursesPage.createDraft(draft);
    await expect(adminCoursesPage.courseCell(draft.title, 'Status')).toHaveText('Draft');
    const draftPath = await adminCoursesPage.draftHref(draft.title);

    // Same browser, separate context authenticated as the learner via storageState.
    const learnerContext = await browser.newContext({ baseURL, storageState: STORAGE_STATE.learner });
    try {
      const learnerPage = await learnerContext.newPage();
      await learnerPage.goto(`/courses?q=${encodeURIComponent(draft.title)}`);
      await expect(learnerPage.getByTestId('result-count')).toHaveText('0 courses');
      await expect(learnerPage.getByRole('article')).toHaveCount(0);

      const response = await learnerPage.goto(draftPath);
      expect(response?.status()).toBe(404);
      await expect(learnerPage.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    } finally {
      await learnerContext.close();
    }
  });
});
