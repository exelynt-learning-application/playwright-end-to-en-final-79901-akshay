import type { Locator, Page } from '@playwright/test';
import type { CourseDraftData } from '../data/test-data';
import { BasePage } from './base.page';

/** Admin course management: course table plus the "Create course" draft form. */
export class AdminCoursesPage extends BasePage {
  readonly createCourseLink: Locator;
  readonly courseTable: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly categorySelect: Locator;
  readonly saveDraftButton: Locator;

  constructor(page: Page) {
    super(page);
    this.createCourseLink = page.getByRole('link', { name: 'Create course' });
    this.courseTable = page.getByRole('table', { name: 'All courses' });
    this.titleInput = page.getByLabel('Course title');
    this.descriptionInput = page.getByLabel('Description');
    this.categorySelect = page.getByLabel('Category');
    this.saveDraftButton = page.getByRole('button', { name: 'Save draft' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/courses');
  }

  courseRow(title: string): Locator {
    return this.courseTable
      .getByRole('row')
      .filter({ has: this.page.getByRole('link', { name: title, exact: true }) });
  }

  /** Cell of the given column ("Title" | "Category" | "Status" | "Lessons") for a course row. */
  courseCell(title: string, column: 'Title' | 'Category' | 'Status' | 'Lessons'): Locator {
    const columnIndex = ['Title', 'Category', 'Status', 'Lessons'].indexOf(column);
    return this.courseRow(title).getByRole('cell').nth(columnIndex);
  }

  async fillDraft(course: CourseDraftData): Promise<void> {
    await this.titleInput.fill(course.title);
    await this.descriptionInput.fill(course.description);
    await this.categorySelect.selectOption({ label: course.category });
  }

  async createDraft(course: CourseDraftData): Promise<void> {
    await this.createCourseLink.click();
    await this.fillDraft(course);
    await this.saveDraftButton.click();
  }

  async draftHref(title: string): Promise<string> {
    const href = await this.courseRow(title).getByRole('link', { name: title, exact: true }).getAttribute('href');
    if (!href) throw new Error(`No link found for course "${title}"`);
    return href;
  }
}
