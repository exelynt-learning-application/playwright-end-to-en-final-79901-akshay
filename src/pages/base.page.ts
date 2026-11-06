import type { Locator, Page } from '@playwright/test';

/** Elements shared by every EXELYNT screen: heading, flash/status, errors and the account bar. */
export abstract class BasePage {
  readonly heading: Locator;
  readonly statusMessage: Locator;
  readonly errorAlert: Locator;
  readonly currentUser: Locator;
  readonly logoutButton: Locator;

  constructor(protected readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.statusMessage = page.getByRole('status');
    this.errorAlert = page.getByRole('alert');
    this.currentUser = page.getByTestId('current-user');
    this.logoutButton = page.getByRole('button', { name: 'Log out' });
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
