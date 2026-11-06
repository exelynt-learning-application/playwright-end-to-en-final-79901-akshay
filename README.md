# EXELYNT Playwright E2E Framework

A TypeScript + Playwright end-to-end framework covering the five requested EXELYNT capstone flows.

## Included coverage
1. Learner registration and login
2. Browse published courses and enroll
3. Complete a lesson and verify progress
4. Submit an assessment and view score
5. Admin creates and saves a course draft

Also includes Page Object Model classes, typed fixtures, role-specific authentication `storageState`, unique test data, GitHub Actions CI, HTML/JUnit reporting, and test documentation.

## Requirements
- Node.js 20+
- npm
- Access to a non-production EXELYNT environment
- Dedicated test learner and admin accounts
- At least one published course and one assessment seeded in the test environment

## Setup
```bash
npm install
npx playwright install --with-deps chromium
cp .env.example .env
```
Edit `.env` and set the real test environment URL and test account credentials. Do not commit `.env` or authentication state.

The test accounts must already exist and have the expected learner/admin roles. Registration test creates a separate unique learner.

## Run
```bash
npm run typecheck
npm test
npm run test:headed
npm run test:ui
npm run test:smoke
npm run report
```

The first run executes the `setup` project to authenticate learner/admin and save:
- `playwright/.auth/learner.json`
- `playwright/.auth/admin.json`

These files contain session credentials and are intentionally excluded from Git.

## GitHub Actions
Add the following repository Actions secrets:
- `BASE_URL`
- `LEARNER_EMAIL`
- `LEARNER_PASSWORD`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Push to `main`/`master` or open a pull request. The workflow installs Chromium, type-checks, runs tests with two retries, and uploads HTML/JUnit reports plus diagnostic artifacts.

## Application-specific alignment (required before execution)
The EXELYNT UI implementation was not provided with this assignment. Therefore route paths, accessible labels, headings, button names, and result text in the page objects are sensible starter assumptions, not verified selectors. Before the first run:
1. Confirm `/login`, `/register`, `/courses`, `/my-learning`, and `/admin/courses` routes.
2. Replace labels and accessible names in `src/pages/` with the actual EXELYNT accessible names.
3. If needed, add stable `data-testid` attributes to the application for complex widgets (question containers, progress, course cards).
4. Confirm enrollment and lesson completion behavior; seed a published course with at least one lesson and assessment.
5. Adjust the success assertions to the exact UI response.

Prefer `getByRole`, `getByLabel`, and `getByPlaceholder` over brittle CSS/XPath. Use `data-testid` only where accessible semantics are not practical.

## Reliability / grading evidence
- Run CI five consecutive times after selectors and environment are configured.
- Review HTML report and traces for flaky behavior.
- Fix product/test defects rather than increasing retries to hide instability.
- Attach the five-run CI evidence and peer review to the capstone submission.

## Documentation
- [One-page test plan](docs/TEST-PLAN.md)
- [Five-minute architecture walkthrough](docs/ARCHITECTURE-WALKTHROUGH.md)

## Important limitation
This repository is a complete framework starter, but it has not been run against your private EXELYNT instance because no application URL, UI contract, or test credentials were supplied. Do not represent the suite as passing until it is configured and the CI runs are green.
