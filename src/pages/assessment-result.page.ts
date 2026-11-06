import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class AssessmentResultPage extends BasePage {
  readonly score: Locator;
  readonly correctCount: Locator;
  readonly outcome: Locator;
  readonly myLearningLink: Locator;

  constructor(page: Page) {
    super(page);
    this.score = page.getByTestId('assessment-score');
    this.correctCount = page.getByTestId('assessment-correct');
    this.outcome = page.getByTestId('assessment-outcome');
    this.myLearningLink = page.getByRole('main').getByRole('link', { name: 'Go to My learning' });
  }
}
