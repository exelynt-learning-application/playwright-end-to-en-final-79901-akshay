import { test } from '../../src/fixtures';

test('learner submits an assessment and sees score', async ({ assessmentPage }) => {
  await assessmentPage.openAssessment();
  await assessmentPage.answerFirstQuestion();
  await assessmentPage.submit();
  await assessmentPage.expectScoreVisible();
});