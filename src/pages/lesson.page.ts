import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LessonPage extends BasePage {
  readonly markCompleteButton: Locator;
  readonly completedBadge: Locator;
  readonly backToCourseLink: Locator;

  constructor(page: Page) {
    super(page);
    this.markCompleteButton = page.getByRole('button', { name: 'Mark lesson as complete' });
    this.completedBadge = page.getByTestId('lesson-completion');
    this.backToCourseLink = page.getByRole('link', { name: 'Back to course' });
  }

  async markComplete(): Promise<void> {
    await this.markCompleteButton.click();
  }
}
