import { expect, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class AuthPage extends BasePage {
  constructor(page: Page) { super(page); }

  async openLogin(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.page.getByRole('heading', { name: /log in|sign in/i })).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole('button', { name: /log in|sign in/i }).click();
  }

  async openRegistration(): Promise<void> {
    await this.page.goto('/register');
    await expect(this.page.getByRole('heading', { name: /create account|register|sign up/i })).toBeVisible();
  }

  async register(input: { firstName: string; lastName: string; email: string; password: string }): Promise<void> {
    await this.page.getByLabel(/first name/i).fill(input.firstName);
    await this.page.getByLabel(/last name/i).fill(input.lastName);
    await this.page.getByLabel(/email/i).fill(input.email);
    await this.page.getByLabel(/^password$/i).fill(input.password);
    await this.page.getByRole('button', { name: /create account|register|sign up/i }).click();
  }
}