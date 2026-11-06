import { test, expect } from '../../src/fixtures';

test('learner can browse and enroll in a published course', async ({ catalogPage, page }) => {
  await catalogPage.open();
  const firstCourse = page.getByRole('article').first();
  await expect(firstCourse).toBeVisible();
  await firstCourse.getByRole('button', { name: /enroll|join course/i }).click();
  await expect(page.getByText(/enrolled successfully|added to my learning|enrollment complete/i)).toBeVisible();
});