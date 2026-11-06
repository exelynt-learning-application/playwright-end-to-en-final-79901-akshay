# EXELYNT Playwright E2E Framework

![Playwright E2E](../../actions/workflows/playwright.yml/badge.svg)

A Playwright + TypeScript end-to-end framework for **EXELYNT**, a learning platform. It covers the five capstone flows using the Page Object Model, typed fixtures, role-based `storageState`, isolated test data, and GitHub Actions CI with HTML and JUnit reports.

| # | Flow | Spec |
|---|------|------|
| 1 | Learner registration and login | `tests/public/registration.spec.ts`, `tests/public/login.spec.ts`, `tests/learner/session.spec.ts` |
| 2 | Browse the catalog and enroll in a course | `tests/learner/course-enrollment.spec.ts` |
| 3 | Complete a lesson and view progress | `tests/learner/lesson-progress.spec.ts` |
| 4 | Take an assessment and view the score | `tests/learner/assessment.spec.ts` |
| 5 | Admin creates a course draft | `tests/admin/course-draft.spec.ts` |

There are 26 tests plus 2 authentication setup steps. See the [test plan](docs/TEST-PLAN.md) for the full feature-to-test mapping and the [architecture walkthrough](docs/ARCHITECTURE-WALKTHROUGH.md).

## How the application under test is provided

No public EXELYNT environment was supplied with this assignment. To make the suite runnable anywhere, the repo ships an **EXELYNT reference app** (`app/`): a small Node.js server with no dependencies that implements the same learner and admin journeys with accessible markup. Playwright starts it automatically through `webServer`, and every run begins from the same seeded data.

To test a deployed EXELYNT environment instead, set `BASE_URL` (and the account variables below). Playwright then skips the bundled app. Selectors live only in `src/pages/`, so adapting to a different UI is contained to the page objects.

## Project structure

```
app/                     EXELYNT reference app (server, seed data, CSS)
src/
  api/exelynt-api.ts     API client for fast test-data setup
  data/                  seeded users, catalog/answer key, data builders, storageState paths
  pages/                 Page Objects (one per screen) + BasePage
  fixtures.ts            typed fixtures: page objects, `api`, `freshLearner`
tests/
  setup/auth.setup.ts    logs in learner and admin once and saves storageState
  public/                unauthenticated flows (registration, login)
  learner/               runs with the learner storageState
  admin/                 runs with the admin storageState
docs/                    test plan and architecture walkthrough
.github/workflows/       CI pipeline
```

## Requirements

- Node.js 20 or newer
- npm

## Setup and run

```bash
npm install
npx playwright install --with-deps chromium

npm test                 # full suite (starts the reference app automatically)
npm run test:smoke       # @smoke-tagged critical path only
npm run test:public      # or test:learner / test:admin
npm run test:stability   # every test 5x with retries disabled (flakiness check)
npm run test:headed      # watch it run
npm run test:ui          # Playwright UI mode
npm run typecheck        # tsc --noEmit
npm run report           # open the last HTML report
npm run app              # run the reference app on http://127.0.0.1:3000 to explore it
```

### Configuration (environment variables)

All variables are optional. Copy `.env.example` to `.env` to set them locally; `.env` is git-ignored.

| Variable | Purpose | Default |
|---|---|---|
| `BASE_URL` | Target a deployed EXELYNT environment instead of the bundled app | bundled app on port `3100` |
| `LEARNER_EMAIL` / `LEARNER_PASSWORD` | Pre-provisioned learner account | seeded demo learner |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Pre-provisioned admin account | seeded demo admin |
| `PORT` | Port for the bundled app | `3100` |

The defaults are demo credentials for the local reference app only. Real environment credentials must come from CI secrets, not source code.

## Key design decisions

- **POM:** every screen has a page object with locators declared once as `readonly` properties. Specs read as user intent: `catalogPage.openCourse(title)`, `assessmentPage.answerAll(key)`.
- **Locators:** user-facing first: `getByRole` (with names), `getByLabel`. `data-testid` is used only for values that have no accessible role, such as score and progress text. There are no CSS or XPath chains and no `waitForTimeout`.
- **Assertions:** web-first and specific. They check exact messages, exact progress percentages, `value` attributes, table cells per column, HTTP status codes, and that controls are hidden when they should be.
- **storageState:** the `setup` project logs in through the real login form once per role. The `learner` and `admin` projects depend on it, so their tests start already authenticated.
- **Data isolation:** any test that changes state uses the `freshLearner` fixture, a new learner registered through the API with a unique email per test, worker and retry. Course drafts get unique titles the same way. Shared seeded accounts are only used for read-only checks, and they are never logged out. Tests are order-independent and run `fullyParallel`.
- **Fast arrange, UI for the behaviour under test:** enrollment is done through the API when the test is about lessons or assessments, which keeps tests short and stable.

## CI

`.github/workflows/playwright.yml` runs on every push, pull request, and manual dispatch:

1. Install Node 20, dependencies, and Chromium.
2. Type-check.
3. Run the suite (4 workers, 1 retry in CI for diagnostics; traces, video, and screenshots are kept on failure).
4. Upload the HTML report and JUnit/test-results artifacts, and write a pass-rate table to the job summary.

**Stability check:** start the workflow manually with `repeat_each = 5`. Every test then runs 5 times with retries disabled, so any flaky test shows up as a failure instead of being hidden by a retry.

To target a real environment in CI, set the repository **variable** `BASE_URL` and the **secrets** `LEARNER_EMAIL`, `LEARNER_PASSWORD`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

## Reports

- `playwright-report/index.html`: HTML report with traces for failed tests (`npm run report`)
- `test-results/junit.xml`: JUnit XML for CI dashboards
- GitHub Actions job summary: totals and pass rate per run
