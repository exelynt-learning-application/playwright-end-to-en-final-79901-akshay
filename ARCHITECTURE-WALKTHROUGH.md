# Five-minute architecture walkthrough (written script)

**0:00–0:40 – Goal and structure**  
This project automates EXELYNT's five required business flows: registration/login, course discovery and enrollment, lesson completion/progress, assessment/score, and admin draft creation. Tests are grouped by role under `tests/`; reusable page behavior is in `src/pages/`.

**0:40–1:35 – Page Object Model**  
Each page object owns the selectors and actions for one application area. Specs describe business intent rather than repeating selector details. `BasePage` contains only small shared assertions. This keeps tests readable and makes selector changes local to a page object.

**1:35–2:25 – Fixtures and authentication**  
`src/fixtures.ts` extends Playwright's test fixture with typed page objects. `tests/auth.setup.ts` signs in separately as learner and admin, then saves role-specific browser storage state under `playwright/.auth/`. These files are ignored by Git. The learner and admin projects depend on setup and load only their own state.

**2:25–3:15 – Data and isolation**  
Credentials come from environment variables, never source control. `src/test-data.ts` creates unique registration emails and draft course names to reduce collisions. Each test gets a fresh Playwright context. Use a dedicated staging environment and reset or seed test data as needed; never point this suite at production.

**3:15–4:10 – Assertions and reliability**  
The framework prefers accessible roles and labels, and checks meaningful outcomes such as an enrollment confirmation, a visible progress bar, a score, and Draft status. Fixed sleeps are intentionally avoided. CI enables two retries, bounded parallelism, trace-on-failure, screenshots, video, HTML reporting, and JUnit output.

**4:10–5:00 – CI and next steps**  
The GitHub Actions workflow installs dependencies and Chromium, type-checks TypeScript, runs the suite, and uploads artifacts even when tests fail. Configure repository secrets, align page routes/labels with the actual EXELYNT UI, then run the workflow five consecutive times to assess stability. The initial implementation is a reusable baseline; the live app must be exercised before claiming a passing grade.
