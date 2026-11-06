import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CourseDetailsPage extends BasePage {
  readonly enrollButton: Locator;
  readonly enrolledBadge: Locator;
  readonly continueLearningLink: Locator;
  readonly lessonItems: Locator;

  constructor(page: Page) {
    super(page);
    this.enrollButton = page.getByRole('button', { name: 'Enroll in course' });
    this.enrolledBadge = page.getByTestId('enrollment-state');
    this.continueLearningLink = page.getByRole('link', { name: 'Continue learning' });
    this.lessonItems = page.getByRole('main').getByRole('listitem');
  }

  async goto(courseId: string): Promise<void> {
    await this.page.goto(`/courses/${encodeURIComponent(courseId)}`);
  }

  async enroll(): Promise<void> {
    await this.enrollButton.click();
  }
}
