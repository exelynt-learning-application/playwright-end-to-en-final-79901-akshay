import { test, expect } from '../../src/fixtures';
import { dataAnalysis, projectManagement, publishedCourses } from '../../src/data/catalog';

test.describe('Flow 2 – browse the catalog and enroll', () => {
  test('catalog lists every published course with its details', async ({ catalogPage }) => {
    await catalogPage.goto();

    await expect(catalogPage.heading).toHaveText('Course catalog');
    for (const course of publishedCourses) {
      const card = catalogPage.courseCard(course.title);
      await expect(card).toBeVisible();
      await expect(card).toContainText(`${course.category} · ${course.lessons.length} lessons`);
    }
  });

  test('searching the catalog narrows the results', async ({ page, catalogPage }) => {
    await catalogPage.goto();
    await catalogPage.search('data analysis');

    await expect(page).toHaveURL(/\/courses\?q=data\+analysis$/);
    await expect(catalogPage.resultCount).toHaveText('1 course');
    await expect(catalogPage.courseCards).toHaveCount(1);
    await expect(catalogPage.courseCard(dataAnalysis.title)).toBeVisible();

    await catalogPage.search('no-such-course-xyz');
    await expect(catalogPage.courseCards).toHaveCount(0);
    await expect(catalogPage.emptyState).toHaveText('No courses match “no-such-course-xyz”.');
  });

  test('learner enrolls in a course and it appears in My learning at 0% @smoke', async ({
    page,
    freshLearner,
    catalogPage,
    courseDetailsPage,
    myLearningPage
  }) => {
    expect(freshLearner.data.email).toContain('@');
    await catalogPage.goto();
    await catalogPage.openCourse(projectManagement.title);

    await expect(page).toHaveURL(new RegExp(`/courses/${projectManagement.id}$`));
    await expect(courseDetailsPage.heading).toHaveText(projectManagement.title);
    await courseDetailsPage.enroll();

    await expect(courseDetailsPage.statusMessage).toHaveText(`You are enrolled in ${projectManagement.title}.`);
    await expect(courseDetailsPage.enrolledBadge).toHaveText('Enrolled');
    await expect(courseDetailsPage.enrollButton).toBeHidden();

    await myLearningPage.goto();
    await expect(myLearningPage.enrolledCourses).toHaveCount(1);
    await expect(myLearningPage.enrolledCourse(projectManagement.title)).toBeVisible();
    await expect(myLearningPage.progressBar(projectManagement.title)).toHaveAttribute('value', '0');
    await expect(myLearningPage.progressText(projectManagement.title)).toHaveText('0% complete');
    await expect(myLearningPage.bestScore(projectManagement.title)).toHaveText('Assessment not attempted yet');
  });

  test('enrolling twice is idempotent', async ({ freshLearner, courseDetailsPage, myLearningPage }) => {
    await freshLearner.api.enroll(dataAnalysis.id);

    await courseDetailsPage.goto(dataAnalysis.id);
    await expect(courseDetailsPage.enrolledBadge).toHaveText('Enrolled');
    await expect(courseDetailsPage.enrollButton).toBeHidden();

    await freshLearner.api.enroll(dataAnalysis.id);
    await myLearningPage.goto();
    await expect(myLearningPage.enrolledCourses).toHaveCount(1);
  });
});
