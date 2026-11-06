import { test, expect } from '../../src/fixtures';
import { dataAnalysis, projectManagement, workplaceCommunication } from '../../src/data/catalog';

test.describe('Flow 4 – take an assessment and view the score', () => {
  test('all correct answers score 100% and pass @smoke', async ({
    page,
    freshLearner,
    coursePlayerPage,
    assessmentPage,
    assessmentResultPage,
    myLearningPage
  }) => {
    const course = projectManagement;
    await freshLearner.api.enroll(course.id);

    await coursePlayerPage.goto(course.id);
    await coursePlayerPage.openAssessment();
    await expect(assessmentPage.heading).toHaveText(`${course.title} assessment`);
    await expect(assessmentPage.questions).toHaveCount(course.assessment.length);

    await assessmentPage.answerAll(course.assessment);
    await assessmentPage.submit();

    await expect(page).toHaveURL(new RegExp(`/learn/${course.id}/assessment/results/[\\w-]+$`));
    await expect(assessmentResultPage.heading).toHaveText('Assessment result');
    await expect(assessmentResultPage.score).toHaveText('Your score: 100%');
    await expect(assessmentResultPage.correctCount).toHaveText('3 of 3 questions correct');
    await expect(assessmentResultPage.outcome).toHaveText('Passed');

    await assessmentResultPage.myLearningLink.click();
    await expect(myLearningPage.bestScore(course.title)).toHaveText('Best assessment score: 100%');
  });

  test('a score below the pass mark is reported as not passed', async ({
    freshLearner,
    assessmentPage,
    assessmentResultPage
  }) => {
    const course = dataAnalysis;
    await freshLearner.api.enroll(course.id);

    await assessmentPage.goto(course.id);
    await assessmentPage.answerAll(course.assessment, 1);
    await assessmentPage.submit();

    await expect(assessmentResultPage.score).toHaveText('Your score: 67%');
    await expect(assessmentResultPage.correctCount).toHaveText('2 of 3 questions correct');
    await expect(assessmentResultPage.outcome).toHaveText('Not passed');
  });

  test('submitting with unanswered questions is blocked and keeps chosen answers', async ({
    page,
    freshLearner,
    assessmentPage
  }) => {
    const course = workplaceCommunication;
    const [first, second] = course.assessment;
    await freshLearner.api.enroll(course.id);

    await assessmentPage.goto(course.id);
    await assessmentPage.answer(first.question, first.correct);
    await assessmentPage.submit();

    await expect(assessmentPage.errorAlert).toContainText('Please answer all questions before submitting.');
    await expect(page).toHaveURL(new RegExp(`/learn/${course.id}/assessment$`));
    await expect(assessmentPage.option(first.question, first.correct)).toBeChecked();
    await expect(assessmentPage.option(second.question, second.correct)).not.toBeChecked();
  });

  test('retaking keeps the best score on the course page', async ({
    freshLearner,
    assessmentPage,
    assessmentResultPage,
    coursePlayerPage
  }) => {
    const course = workplaceCommunication;
    await freshLearner.api.enroll(course.id);

    await assessmentPage.goto(course.id);
    await assessmentPage.answerAll(course.assessment);
    await assessmentPage.submit();
    await expect(assessmentResultPage.score).toHaveText('Your score: 100%');

    await assessmentPage.goto(course.id);
    await assessmentPage.answerAll(course.assessment, 2);
    await assessmentPage.submit();
    await expect(assessmentResultPage.score).toHaveText('Your score: 0%');

    await coursePlayerPage.goto(course.id);
    await expect(coursePlayerPage.bestScore).toHaveText('Best assessment score: 100%');
  });
});
