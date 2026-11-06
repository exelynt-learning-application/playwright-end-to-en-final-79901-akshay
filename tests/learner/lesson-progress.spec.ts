import { test, expect } from '../../src/fixtures';
import { dataAnalysis, projectManagement } from '../../src/data/catalog';

test.describe('Flow 3 – complete a lesson and view progress', () => {
  test('completing a lesson updates course progress and My learning @smoke', async ({
    page,
    freshLearner,
    myLearningPage,
    coursePlayerPage,
    lessonPage
  }) => {
    const course = projectManagement;
    const [firstLesson, secondLesson] = course.lessons;
    await freshLearner.api.enroll(course.id);

    await myLearningPage.goto();
    await myLearningPage.continueLearning(course.title);
    await expect(page).toHaveURL(new RegExp(`/learn/${course.id}$`));
    await expect(coursePlayerPage.lessonStatus(firstLesson)).toHaveText('Not started');

    await coursePlayerPage.openLesson(firstLesson);
    await expect(lessonPage.heading).toHaveText(firstLesson);
    await lessonPage.markComplete();

    await expect(coursePlayerPage.statusMessage).toHaveText(`Lesson “${firstLesson}” marked as complete.`);
    await expect(coursePlayerPage.lessonStatus(firstLesson)).toHaveText('Completed');
    await expect(coursePlayerPage.lessonStatus(secondLesson)).toHaveText('Not started');
    await expect(coursePlayerPage.progressBar(course.title)).toHaveAttribute('value', '50');
    await expect(coursePlayerPage.progressText).toHaveText('50% complete');

    await myLearningPage.goto();
    await expect(myLearningPage.progressText(course.title)).toHaveText('50% complete');
    await expect(myLearningPage.lessonsCompleted(course.title)).toHaveText('1 of 2 lessons complete');
  });

  test('completing every lesson reaches 100% and a completed lesson cannot be re-submitted', async ({
    freshLearner,
    coursePlayerPage,
    lessonPage
  }) => {
    const course = dataAnalysis;
    await freshLearner.api.enroll(course.id);
    await coursePlayerPage.goto(course.id);

    const expectedProgress = ['33% complete', '67% complete', '100% complete'];
    for (const [index, lesson] of course.lessons.entries()) {
      await coursePlayerPage.openLesson(lesson);
      await lessonPage.markComplete();
      await expect(coursePlayerPage.progressText).toHaveText(expectedProgress[index]);
    }

    await expect(coursePlayerPage.lessonsCompleted).toHaveText('3 of 3 lessons complete');
    await expect(coursePlayerPage.progressBar(course.title)).toHaveAttribute('value', '100');

    await coursePlayerPage.openLesson(course.lessons[0]);
    await expect(lessonPage.completedBadge).toHaveText('Lesson completed');
    await expect(lessonPage.markCompleteButton).toBeHidden();
  });

  test('lessons are not available before enrolling', async ({ page, freshLearner }) => {
    expect(freshLearner.data.email).toContain('@');
    await page.goto(`/learn/${projectManagement.id}`);

    await expect(page).toHaveURL(new RegExp(`/courses/${projectManagement.id}$`));
    await expect(page.getByRole('button', { name: 'Enroll in course' })).toBeVisible();
  });
});
