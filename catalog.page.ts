import { expect, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CatalogPage extends BasePage {
  constructor(page: Page) { super(page); }

  async open(): Promise<void> {
    await this.page.goto('/courses');
    await expect(this.page.getByRole('heading', { name: /courses|course catalog/i })).toBeVisible();
  }

  async searchCourse(title: string): Promise<void> {
    const search = this.page.getByRole('searchbox').or(this.page.getByPlaceholder(/search courses/i));
    await search.fill(title);
  }

  courseCard(title: string) {
    return this.page.getByRole('article').filter({ hasText: title });
  }

  async enroll(title: string): Promise<void> {
    const card = this.courseCard(title);
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: /enroll|join course/i }).click();
  }
}