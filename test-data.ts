export const learnerAccount = {
  email: process.env.LEARNER_EMAIL ?? 'learner.e2e@example.test',
  password: process.env.LEARNER_PASSWORD ?? 'ChangeMe-Learner-123!'
};

export const adminAccount = {
  email: process.env.ADMIN_EMAIL ?? 'admin.e2e@example.test',
  password: process.env.ADMIN_PASSWORD ?? 'ChangeMe-Admin-123!'
};

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const uniqueLearner = {
  firstName: 'E2E',
  lastName: 'Learner',
  email: `e2e.learner.${runId}@example.test`,
  password: 'ChangeMe-E2E-123!'
};

export const courseData = {
  title: `E2E Course ${runId}`,
  description: 'Course created by the EXELYNT Playwright end-to-end suite.',
  category: 'Technology'
};