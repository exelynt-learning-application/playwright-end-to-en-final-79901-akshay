# Architecture walkthrough (5-minute written script)

## 0:00–0:45 What this is

This framework tests the five critical EXELYNT journeys: registration and login, browsing and enrolling, completing lessons and seeing progress, taking an assessment and seeing the score, and an admin creating a course draft. It uses Playwright Test with TypeScript in strict mode. Because no shared EXELYNT environment was available, the repo includes a dependency-free EXELYNT reference app in `app/`. Playwright's `webServer` starts it, so `npm test` works on any machine and in CI. Setting `BASE_URL` points the same suite at a real deployment.

## 0:45–1:45 Layers

```
tests/*.spec.ts   ->  what the user does and what must be true (no selectors)
src/fixtures.ts   ->  injects page objects, API client and fresh test users
src/pages/*.ts    ->  Page Objects: locators + actions per screen
src/api/          ->  API client for fast "arrange" steps
src/data/         ->  seeded users, catalog/answer key, data builders
```

Each screen has a page object, such as `CatalogPage`, `CoursePlayerPage`, `AssessmentPage`, or `AdminCoursesPage`. Locators are declared once as `readonly` fields. Parameterised locators are methods, for example `courseCard(title)`, `lessonStatus(lesson)`, and `courseCell(title, 'Status')`. `BasePage` holds the parts every screen shares: the h1, the status message, the error alert, the signed-in user, and logout. Specs never contain raw selectors, so a UI change is fixed in one place.

## 1:45–2:45 Fixtures and storageState

`src/fixtures.ts` extends `test` with typed fixtures for every page object, plus two data fixtures:

- `api`: a standalone API client with its own cookie jar, used to seed data such as a pre-existing account for the duplicate-email test.
- `freshLearner`: registers a brand-new learner through the API on `page.request`. That shares cookies with the browser, so the page is already signed in as that learner.

`playwright.config.ts` defines four projects. `setup` logs in through the real UI as the learner and the admin and saves `playwright/.auth/{learner,admin}.json`. The `learner` and `admin` projects depend on `setup` and load their role's storageState, and `public` runs unauthenticated. The admin “draft hidden from learners” test opens a second browser context with the learner storageState, so it checks both roles in one scenario.

## 2:45–3:30 Data handling and isolation

Shared seeded accounts are only read, never changed or logged out. Anything that changes state, such as enrollment, progress, scores, or logout, runs as a `freshLearner` whose email includes the parallel index, the retry number, and a UUID. Course drafts get unique titles the same way. As a result, tests can run fully in parallel and in any order, and a retry never collides with the data from its first attempt. The reference app is in-memory and reseeded at start, so every CI run begins from the same state.

## 3:30–4:15 Locators, assertions, reliability

Locators are role- and label-first: `getByRole('article', { name })`, `getByRole('group', { name: question })`, `getByRole('progressbar')`, `getByLabel('Course title')`. `data-testid` is used only for plain values like the score. Assertions are web-first and specific. They check exact status messages, progress `value` attributes (`50`, `100`), HTTP 403/404 on role boundaries, ordered error lists, and that a control is hidden once it is no longer relevant. There are no sleeps. Fast API arrange steps keep each UI test focused and short.

## 4:15–5:00 CI and reporting

GitHub Actions runs on every push and pull request. It installs Node 20 and Chromium, type-checks, and runs the suite with 4 workers and 1 diagnostic retry. It then uploads the HTML report, JUnit XML, and failure traces/videos, and posts a pass-rate table to the job summary. Running the workflow manually with `repeat_each=5` runs every test five times with retries off, which is the evidence for the "5 consecutive runs" reliability criterion. Next steps would be cross-browser projects, axe accessibility checks, and API contract tests.
