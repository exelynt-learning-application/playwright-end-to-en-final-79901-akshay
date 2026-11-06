import { test as base, expect } from '@playwright/test';
import { ExelyntApi } from './api/exelynt-api';
import { buildLearner, type LearnerData } from './data/test-data';
import { AdminCoursesPage } from './pages/admin-courses.page';
import { AssessmentResultPage } from './pages/assessment-result.page';
import { AssessmentPage } from './pages/assessment.page';
import { CatalogPage } from './pages/catalog.page';
import { CourseDetailsPage } from './pages/course-details.page';
import { CoursePlayerPage } from './pages/course-player.page';
import { LessonPage } from './pages/lesson.page';
import { LoginPage } from './pages/login.page';
import { MyLearningPage } from './pages/my-learning.page';
import { RegistrationPage } from './pages/registration.page';

type PageObjects = {
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  catalogPage: CatalogPage;
  courseDetailsPage: CourseDetailsPage;
  myLearningPage: MyLearningPage;
  coursePlayerPage: CoursePlayerPage;
  lessonPage: LessonPage;
  assessmentPage: AssessmentPage;
  assessmentResultPage: AssessmentResultPage;
  adminCoursesPage: AdminCoursesPage;
};

export interface FreshLearner {
  data: LearnerData;
  /** API client sharing the browser page's session (cookies). */
  api: ExelyntApi;
}

type DataFixtures = {
  /** Standalone API client with its own cookie jar (does not touch the page session). */
  api: ExelyntApi;
  /**
   * A brand-new learner registered through the API and signed in on `page`.
   * Gives every mutating test its own account, so enrollments, progress and
   * scores never leak between tests, workers or retries.
   */
  freshLearner: FreshLearner;
};

export const test = base.extend<PageObjects & DataFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },
  courseDetailsPage: async ({ page }, use) => {
    await use(new CourseDetailsPage(page));
  },
  myLearningPage: async ({ page }, use) => {
    await use(new MyLearningPage(page));
  },
  coursePlayerPage: async ({ page }, use) => {
    await use(new CoursePlayerPage(page));
  },
  lessonPage: async ({ page }, use) => {
    await use(new LessonPage(page));
  },
  assessmentPage: async ({ page }, use) => {
    await use(new AssessmentPage(page));
  },
  assessmentResultPage: async ({ page }, use) => {
    await use(new AssessmentResultPage(page));
  },
  adminCoursesPage: async ({ page }, use) => {
    await use(new AdminCoursesPage(page));
  },

  api: async ({ playwright, baseURL }, use) => {
    const context = await playwright.request.newContext({ baseURL });
    await use(new ExelyntApi(context));
    await context.dispose();
  },

  freshLearner: async ({ page }, use, testInfo) => {
    const data = buildLearner(testInfo);
    const api = new ExelyntApi(page.request);
    await api.registerLearner(data);
    await use({ data, api });
  }
});

export { expect };
