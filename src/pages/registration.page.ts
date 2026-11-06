import type { Locator, Page } from '@playwright/test';
import type { LearnerData } from '../data/test-data';
import { BasePage } from './base.page';

export class RegistrationPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByLabel('First name');
    this.lastNameInput = page.getByLabel('Last name');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm password');
    this.submitButton = page.getByRole('button', { name: 'Create account' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  async register(learner: LearnerData, confirmPassword: string = learner.password): Promise<void> {
    await this.firstNameInput.fill(learner.firstName);
    await this.lastNameInput.fill(learner.lastName);
    await this.emailInput.fill(learner.email);
    await this.passwordInput.fill(learner.password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }
}
