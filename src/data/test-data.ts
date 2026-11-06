import { randomUUID } from 'node:crypto';
import type { TestInfo } from '@playwright/test';

export interface LearnerData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CourseDraftData {
  title: string;
  description: string;
  category: string;
}

/**
 * Pre-provisioned accounts. Values come from the environment so a real EXELYNT
 * environment can supply its own test accounts; the defaults match the seeded
 * accounts of the bundled reference app (non-secret demo credentials).
 */
export const seededUsers = {
  learner: {
    firstName: 'Lena',
    lastName: 'Learner',
    email: process.env.LEARNER_EMAIL || 'learner@exelynt.test',
    password: process.env.LEARNER_PASSWORD || 'Learner#2026'
  },
  admin: {
    firstName: 'Adam',
    lastName: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@exelynt.test',
    password: process.env.ADMIN_PASSWORD || 'Admin#2026'
  }
} as const;

/**
 * Collision-free suffix: unique per test, worker, retry and run, so parallel
 * workers and retries never share mutable data.
 */
export function uniqueSuffix(testInfo: TestInfo): string {
  return `w${testInfo.parallelIndex}r${testInfo.retry}-${randomUUID().slice(0, 8)}`;
}

export function buildLearner(testInfo: TestInfo, overrides: Partial<LearnerData> = {}): LearnerData {
  const suffix = uniqueSuffix(testInfo);
  return {
    firstName: 'Erin',
    lastName: `Tester ${suffix.slice(-4)}`,
    email: `e2e.learner.${suffix}@exelynt.test`,
    password: `Pw-${randomUUID().slice(0, 12)}`,
    ...overrides
  };
}

export function buildCourseDraft(testInfo: TestInfo, overrides: Partial<CourseDraftData> = {}): CourseDraftData {
  return {
    title: `E2E Draft ${uniqueSuffix(testInfo)}`,
    description: 'Draft course created by the EXELYNT Playwright suite.',
    category: 'Technology',
    ...overrides
  };
}
