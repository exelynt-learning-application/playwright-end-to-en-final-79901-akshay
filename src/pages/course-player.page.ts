import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/** Enrolled view of a course: lesson list, progress and the assessment entry point. */
export class CoursePlayerPage extends BasePage {
  readonly progressText: Locator;
  readonly lessonsCompleted: Locator;
  readonly takeAssessmentLink: Locator;
  readonly bestScore: Locator;

  constructor(page: Page) {
    super(page);
    this.progressText = page.getByTestId('progress-percent');
    this.lessonsCompleted = page.getByTestId('lessons-completed');
    this.takeAssessmentLink = page.getByRole('link', { name: 'Take assessment' });
    this.bestScore = page.getByTestId('best-score');
  }

  async goto(courseId: string): Promise<void> {
    await this.page.goto(`/learn/${encodeURIComponent(courseId)}`);
  }

  progressBar(courseTitle: string): Locator {
    return this.page.getByRole('progressbar', { name: `${courseTitle} progress` });
  }

  lessonStatus(lessonTitle: string): Locator {
    return this.page
      .getByTestId('lesson-item')
      .filter({ has: this.page.getByRole('link', { name: lessonTitle, exact: true }) })
      .getByTestId('lesson-status');
  }

  async openLesson(lessonTitle: string): Promise<void> {
    await this.page.getByRole('link', { name: lessonTitle, exact: true }).click();
  }

  async openAssessment(): Promise<void> {
    await this.takeAssessmentLink.click();
  }
}
