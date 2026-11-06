import { expect, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LearningPage extends BasePage {
  constructor(page: Page) { super(page); }

  async openMyLearning(): Promise<void> {
    await this.page.goto('/my-learning');
    await expect(this.page.getByRole('heading', { name: /my learning|my courses/i })).toBeVisible();
  }

  async openCourse(title: string): Promise<void> {
    await this.page.getByRole('link', { name: new RegExp(title, 'i') }).click();
  }

  async completeCurrentLesson(): Promise<void> {
    await this.page.getByRole('button', { name: /mark.*complete|complete lesson/i }).click();
  }

  async expectProgressAtLeast(percent: number): Promise<void> {
    const progress = this.page.getByRole('progressbar');
    await expect(progress).toBeVisible();
    await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(percent);
  }
}