import { expect, type APIRequestContext } from '@playwright/test';
import type { LearnerData } from '../data/test-data';

/**
 * Thin client over the EXELYNT JSON API. Used for fast, deterministic test-data
 * setup (arrange) so UI steps are only spent on the behaviour under test.
 * When built from `page.request`, session cookies are shared with the page.
 */
export class ExelyntApi {
  constructor(private readonly request: APIRequestContext) {}

  async registerLearner(learner: LearnerData): Promise<void> {
    const response = await this.request.post('/api/register', {
      data: {
        firstName: learner.firstName,
        lastName: learner.lastName,
        email: learner.email,
        password: learner.password
      }
    });
    expect(response.status(), await response.text()).toBe(201);
  }

  async login(email: string, password: string): Promise<void> {
    const response = await this.request.post('/api/login', { data: { email, password } });
    await expect(response).toBeOK();
  }

  async enroll(courseId: string): Promise<void> {
    const response = await this.request.post(`/api/courses/${encodeURIComponent(courseId)}/enroll`);
    await expect(response).toBeOK();
  }

  async publishedCourseTitles(): Promise<string[]> {
    const response = await this.request.get('/api/courses');
    await expect(response).toBeOK();
    const courses = (await response.json()) as Array<{ title: string }>;
    return courses.map((course) => course.title);
  }
}
