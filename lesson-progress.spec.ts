import { test } from '../../src/fixtures';

test('learner completes a lesson and sees progress update', async ({ learningPage, page }) => {
  await learningPage.openMyLearning();
  const firstCourseLink = page.getByRole('link', { name: /.+/ }).filter({ hasText: /course/i }).first();
  await firstCourseLink.click();
  await learningPage.completeCurrentLesson();
  await learningPage.expectProgressAtLeast(1);
});