import { expect, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class AssessmentPage extends BasePage {
  constructor(page: Page) { super(page); }

  async openAssessment(): Promise<void> {
    await this.page.getByRole('link', { name: /assessment|quiz|test/i }).click();
    await expect(this.page.getByRole('heading', { name: /assessment|quiz|test/i })).toBeVisible();
  }

  async answerFirstQuestion(): Promise<void> {
    const firstQuestion = this.page.locator('[data-testid="question"]').first();
    await expect(firstQuestion).toBeVisible();
    const option = firstQuestion.getByRole('radio').first();
    if (await option.count()) {
      await option.check();
    } else {
      await firstQuestion.getByRole('button').first().click();
    }
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: /submit assessment|submit quiz|finish/i }).click();
  }

  async expectScoreVisible(): Promise<void> {
    await expect(this.page.getByText(/score|result|your grade/i).first()).toBeVisible();
  }
}