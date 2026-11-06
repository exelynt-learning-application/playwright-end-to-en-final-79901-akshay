import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class MyLearningPage extends BasePage {
  readonly emptyState: Locator;
  readonly enrolledCourses: Locator;

  constructor(page: Page) {
    super(page);
    this.emptyState = page.getByTestId('empty-learning');
    this.enrolledCourses = page.getByRole('article');
  }

  async goto(): Promise<void> {
    await this.page.goto('/my-learning');
  }

  enrolledCourse(title: string): Locator {
    return this.page.getByRole('article', { name: title, exact: true });
  }

  progressBar(title: string): Locator {
    return this.page.getByRole('progressbar', { name: `${title} progress` });
  }

  progressText(title: string): Locator {
    return this.enrolledCourse(title).getByTestId('progress-percent');
  }

  lessonsCompleted(title: string): Locator {
    return this.enrolledCourse(title).getByTestId('lessons-completed');
  }

  bestScore(title: string): Locator {
    return this.enrolledCourse(title).getByTestId('best-score');
  }

  async continueLearning(title: string): Promise<void> {
    await this.enrolledCourse(title).getByRole('link', { name: 'Continue learning' }).click();
  }
}
