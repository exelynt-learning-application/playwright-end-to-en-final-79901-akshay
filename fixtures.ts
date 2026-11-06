import { test as base, expect } from '@playwright/test';
import { AuthPage } from './pages/auth.page';
import { CatalogPage } from './pages/catalog.page';
import { LearningPage } from './pages/learning.page';
import { AssessmentPage } from './pages/assessment.page';
import { AdminCoursePage } from './pages/admin-course.page';

type AppFixtures = {
  authPage: AuthPage;
  catalogPage: CatalogPage;
  learningPage: LearningPage;
  assessmentPage: AssessmentPage;
  adminCoursePage: AdminCoursePage;
};

export const test = base.extend<AppFixtures>({
  authPage: async ({ page }, use) => use(new AuthPage(page)),
  catalogPage: async ({ page }, use) => use(new CatalogPage(page)),
  learningPage: async ({ page }, use) => use(new LearningPage(page)),
  assessmentPage: async ({ page }, use) => use(new AssessmentPage(page)),
  adminCoursePage: async ({ page }, use) => use(new AdminCoursePage(page))
});

export { expect };