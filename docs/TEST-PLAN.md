# EXELYNT E2E Test Plan (one page)

**Scope:** the five critical EXELYNT journeys, tested through the browser (Chromium) with Playwright + TypeScript. **Environment:** the bundled EXELYNT reference app (seeded, in-memory, reset on every run), or any deployed environment set through `BASE_URL`. **Approach:** POM, typed fixtures, role `storageState`, a new learner per state-changing test, API used for arrange steps, and web-first assertions.

## Feature-to-test mapping

| Feature | Test case (spec › title) | Key assertions | Pri |
|---|---|---|---|
| **1. Registration** | registration › new learner registers and lands on an empty My learning page `@smoke` | welcome status text, signed-in name, empty state | P1 |
| | registration › newly registered learner can log back in | logout message, login lands on My learning | P1 |
| | registration › rejected when email already registered | error text, stays on `/register`, not signed in | P2 |
| | registration › validates required fields and password rules | exact error list, values preserved, password cleared | P2 |
| **1. Login** | login › seeded learner logs in through the form `@smoke` | URL, heading, signed-in name | P1 |
| | login › wrong password shows an error | alert text, stays on `/login`, not signed in | P1 |
| | login › protected pages redirect to login and return afterwards | `?next=` redirect, returns to My learning | P2 |
| | session › stored learner session opens My learning `@smoke` | storageState reused, no login | P1 |
| | session › learner cannot open course management | HTTP 403, “Access denied”, no Admin nav | P1 |
| | session › learner can log out | logout message, protected page redirects | P2 |
| **2. Browse & enroll** | enrollment › catalog lists every published course | each card visible with category and lesson count | P1 |
| | enrollment › search narrows the results | query URL, count “1 course”, empty-state text | P2 |
| | enrollment › learner enrolls and it appears in My learning at 0% `@smoke` | status text, Enrolled badge, button hidden, progress 0 | P1 |
| | enrollment › enrolling twice is idempotent | single enrollment | P3 |
| **3. Lesson & progress** | lesson-progress › completing a lesson updates progress `@smoke` | status text, lesson status, `value=50`, “1 of 2” | P1 |
| | lesson-progress › every lesson reaches 100%, no re-submit | 33/67/100%, completed badge, button hidden | P1 |
| | lesson-progress › lessons not available before enrolling | redirected to course page | P2 |
| **4. Assessment & score** | assessment › all correct answers score 100% and pass `@smoke` | score, “3 of 3”, Passed, best score on My learning | P1 |
| | assessment › score below the pass mark is reported as not passed | 67%, “2 of 3”, Not passed | P1 |
| | assessment › unanswered questions are blocked | alert text, answers kept | P2 |
| | assessment › retake keeps the best score | 100% then 0%, best stays 100% | P3 |
| **5. Admin draft** | course-draft › stored admin session opens course management `@smoke` | heading, admin name, table | P1 |
| | course-draft › admin saves a new course as a draft `@smoke` | status text, row cells Category/Status=Draft/Lessons | P1 |
| | course-draft › form validates required fields | exact error list, values kept | P2 |
| | course-draft › duplicate course titles are rejected | error text | P3 |
| | course-draft › draft hidden from learners | learner search shows 0 results, direct URL returns 404 | P1 |

## Data, isolation and reliability

- Seeded learner and admin accounts are used for login and storageState only. They are never logged out or changed.
- Any test that changes state uses `freshLearner`: a new account registered through the API, with an email unique per test, worker, retry, and UUID. Draft titles are unique the same way. Tests are order-independent and run fully in parallel.
- The reference app is in-memory and reseeded on every CI run, so no leftover data carries over between runs.
- There are no fixed sleeps. All waits are auto-waiting locators or web-first assertions. CI allows 1 retry and keeps traces on failure. The `repeat_each=5` dispatch runs every test 5 times with retries disabled to prove stability.

## Entry / exit criteria

- **Entry:** Node 20, Chromium installed, app reachable (`/health` returns 200), seeded accounts present.
- **Exit:** type-check passes, all P1 tests pass, pass rate is at least 95%, there are no open blocker defects, and 5 consecutive CI runs are green.

## Not covered (out of scope / known gaps)

- Password reset, email verification, MFA, SSO/social login
- Course publishing, editing, deletion, lesson and question authoring (only draft creation is covered)
- Payments, certificates, notifications, reporting dashboards
- Cross-browser (Firefox/WebKit), mobile viewports, localisation
- Automated accessibility audit (axe), visual regression, performance/load, security/penetration testing
- Direct API contract tests (the API is only used for test setup)
- Concurrency edge cases, such as the same learner enrolling from two tabs, and session expiry
- On an external `BASE_URL`, the seeded catalog and answer key in `src/data/catalog.ts` must match that environment's data
