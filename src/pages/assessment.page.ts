import type { Locator, Page } from '@playwright/test';
import type { QuestionKey } from '../data/catalog';
import { BasePage } from './base.page';

export class AssessmentPage extends BasePage {
  readonly questions: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.questions = page.getByTestId('question');
    this.submitButton = page.getByRole('button', { name: 'Submit assessment' });
  }

  async goto(courseId: string): Promise<void> {
    await this.page.goto(`/learn/${encodeURIComponent(courseId)}/assessment`);
  }

  question(text: string): Locator {
    return this.page.getByRole('group', { name: text });
  }

  option(questionText: string, optionLabel: string): Locator {
    return this.question(questionText).getByRole('radio', { name: optionLabel, exact: true });
  }

  async answer(questionText: string, optionLabel: string): Promise<void> {
    await this.option(questionText, optionLabel).check();
  }

  /** Answers every question; `wrongCount` questions (from the end) get the incorrect option. */
  async answerAll(keys: readonly QuestionKey[], wrongCount = 0): Promise<void> {
    const firstWrong = keys.length - wrongCount;
    for (const [index, key] of keys.entries()) {
      await this.answer(key.question, index >= firstWrong ? key.incorrect : key.correct);
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
