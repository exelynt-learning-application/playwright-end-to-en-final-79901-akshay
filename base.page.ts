import { expect, Locator, Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async expectPageReady(heading: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: heading, exact: false })).toBeVisible();
  }
}