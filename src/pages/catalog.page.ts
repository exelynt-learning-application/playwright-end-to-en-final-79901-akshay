import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CatalogPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly courseCards: Locator;
  readonly resultCount: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole('searchbox', { name: 'Search courses' });
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.courseCards = page.getByRole('article');
    this.resultCount = page.getByTestId('result-count');
    this.emptyState = page.getByTestId('empty-catalog');
  }

  async goto(): Promise<void> {
    await this.page.goto('/courses');
  }

  courseCard(title: string): Locator {
    return this.page.getByRole('article', { name: title, exact: true });
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  async openCourse(title: string): Promise<void> {
    await this.courseCard(title).getByRole('link', { name: 'View course' }).click();
  }
}
