import { test } from '../../src/fixtures';
import { courseData } from '../../src/test-data';

test('admin can create and save a course draft', async ({ adminCoursePage }) => {
  await adminCoursePage.openCourseManagement();
  await adminCoursePage.createDraft(courseData);
});