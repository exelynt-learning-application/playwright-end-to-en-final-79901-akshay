import { expect, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminCoursePage extends BasePage {
  constructor(page: Page) { super(page); }

  async openCourseManagement(): Promise<void> {
    await this.page.goto('/admin/courses');
    await expect(this.page.getByRole('heading', { name: /courses|course management/i })).toBeVisible();
  }

  async createDraft(course: { title: string; description: string; category: string }): Promise<void> {
    await this.page.getByRole('button', { name: /create course|new course/i }).click();
    await this.page.getByLabel(/course title|title/i).fill(course.title);
    await this.page.getByLabel(/description/i).fill(course.description);
    await this.page.getByLabel(/category/i).selectOption({ label: course.category });
    await this.page.getByRole('button', { name: /save draft/i }).click();
    await expect(this.page.getByText(course.title, { exact: true })).toBeVisible();
    await expect(this.page.getByText(/draft/i).first()).toBeVisible();
  }
}