# EXELYNT – one-page end-to-end test plan

## Objective and approach
Validate the five required learner/admin journeys on the EXELYNT test environment using Playwright + TypeScript, Page Object Model, shared fixtures, isolated browser contexts, and role-specific `storageState`. Run Chromium in CI; retain traces, screenshots, video, HTML and JUnit output on failure/run.

| Feature / flow | Test case | Expected result | Priority |
|---|---|---|---|
| Learner registration | `tests/public/registration.spec.ts` – submit unique learner details | Confirmation or email-verification state appears; no duplicate account collision | P1 |
| Learner login | `tests/learner/login.spec.ts` – validate stored session and interactive login | Learner reaches My Learning without remaining on login page | P1 |
| Browse and enroll | `tests/learner/course-enrollment.spec.ts` – open catalog and enroll in a published course | Course card is visible and enrollment confirmation appears | P1 |
| Lesson and progress | `tests/learner/lesson-progress.spec.ts` – complete a lesson | Completion action succeeds and progress bar reaches at least 1% | P1 |
| Assessment and score | `tests/learner/assessment.spec.ts` – answer first question and submit | Assessment result/score is displayed | P1 |
| Admin course draft | `tests/admin/create-course-draft.spec.ts` – create course and save draft | New course title appears with Draft status | P1 |

## Test data, isolation and reliability
- Use dedicated non-production learner/admin accounts stored as GitHub Actions secrets.
- Registration uses a unique email per run; course draft title includes a run-specific suffix.
- Learner and admin authentication are prepared independently and saved to ignored `playwright/.auth/` files.
- Tests should not share mutable browser contexts. Avoid depending on test execution order.
- CI retries failed tests twice, uses two workers, and uploads reports/traces for diagnosis. Validate stability with five consecutive green workflow runs before sign-off.

## Entry / exit criteria
- Entry: test environment is reachable; seeded learner/admin accounts exist; required roles and at least one published course and assessment are available.
- Exit: typecheck passes; all six test cases pass; no blocker/critical defects; five consecutive CI runs pass; HTML report reviewed.

## Not covered / known limits
- Password reset, MFA, email delivery contents, social login, payment/refund, certificates, course authoring beyond draft creation, editing/publishing/deleting courses, permissions matrix, mobile/tablet layouts, cross-browser coverage, accessibility audit, load/performance, API contract/security testing, and negative validation/error states.
- Exact EXELYNT route names, labels, confirmation messages, and test IDs must be aligned with the deployed application. These tests are a framework baseline, not a claim that the live application has been executed or verified.
