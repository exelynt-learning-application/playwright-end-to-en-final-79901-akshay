'use strict';
/**
 * EXELYNT reference application (learning management system).
 *
 * A small, dependency-free Node.js server that implements the EXELYNT learner
 * and admin journeys the Playwright suite exercises. It keeps all state in
 * memory, so every CI run starts from the same seeded baseline.
 *
 * Start it with `npm run app` (Playwright's webServer starts it automatically).
 * Point the suite at a real EXELYNT environment by setting BASE_URL instead.
 */
const http = require('node:http');
const crypto = require('node:crypto');
const { courses: seedCourses, categories: CATEGORIES } = require('./seed');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const PASS_MARK = 70;
const SESSION_COOKIE = 'exelynt_sid';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_BODY_BYTES = 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// In-memory data store
// ---------------------------------------------------------------------------
const users = new Map(); // email -> user
const sessions = new Map(); // session id -> { email, expiresAt }
const courses = new Map(); // course id -> course
const attempts = new Map(); // attempt id -> attempt

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(String(password), salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function normaliseEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Only whitelisted fields are accepted from self-registration; the role is always learner. */
function learnerFields(input) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
    role: 'learner'
  };
}

function createUser({ firstName, lastName, email, password, role = 'learner' }) {
  const user = {
    id: crypto.randomUUID(),
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: normaliseEmail(email),
    passwordHash: hashPassword(password),
    role,
    enrollments: new Map() // course id -> { completedLessons: Set, bestScore: number | null }
  };
  users.set(user.email, user);
  return user;
}

function seed() {
  createUser({
    firstName: 'Lena',
    lastName: 'Learner',
    email: process.env.LEARNER_EMAIL || 'learner@exelynt.test',
    password: process.env.LEARNER_PASSWORD || 'Learner#2026',
    role: 'learner'
  });
  createUser({
    firstName: 'Adam',
    lastName: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@exelynt.test',
    password: process.env.ADMIN_PASSWORD || 'Admin#2026',
    role: 'admin'
  });
  for (const course of seedCourses) {
    courses.set(course.id, { ...course, status: 'published' });
  }
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
function parseCookies(header) {
  const cookies = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) {
      cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return cookies;
}

function startSession(res, user) {
  const sid = crypto.randomBytes(32).toString('hex');
  sessions.set(sid, { email: user.email, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 });
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`
  );
}

function endSession(req, res) {
  const sid = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (sid) sessions.delete(sid);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function currentUser(req) {
  const sid = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const session = sid ? sessions.get(sid) : undefined;
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(sid);
    return null;
  }
  return users.get(session.email) || null;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', "default-src 'self'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store');
}

function sendHtml(res, status, html) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function redirect(res, location) {
  res.statusCode = 303;
  res.setHeader('Location', location);
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function parseBody(req) {
  const raw = await readBody(req);
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/json')) {
    try {
      const parsed = JSON.parse(raw || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

function safeNextPath(next) {
  if (typeof next !== 'string') return null;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null;
  return next;
}

function homeFor(user) {
  return user.role === 'admin' ? '/admin/courses' : '/my-learning';
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------
function layout({ title, user, body, flash }) {
  const nav = [
    '<li><a href="/courses">Courses</a></li>',
    user ? '<li><a href="/my-learning">My learning</a></li>' : '',
    user && user.role === 'admin' ? '<li><a href="/admin/courses">Admin</a></li>' : ''
  ].join('');
  const account = user
    ? `<span data-testid="current-user">Signed in as ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</span>
       <form method="post" action="/logout" class="inline"><button type="submit" class="link-button">Log out</button></form>`
    : '<a href="/login">Log in</a> <a href="/register">Register</a>';
  const flashHtml = flash ? `<p role="status" class="flash">${escapeHtml(flash)}</p>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · EXELYNT</title>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<header class="topbar">
  <a class="brand" href="/courses">EXELYNT</a>
  <nav aria-label="Main"><ul>${nav}</ul></nav>
  <div class="account">${account}</div>
</header>
<main>
${flashHtml}
${body}
</main>
</body>
</html>`;
}

function errorList(errors) {
  if (!errors || errors.length === 0) return '';
  const items = errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('');
  return `<div role="alert" class="errors"><p>Please fix the following:</p><ul>${items}</ul></div>`;
}

function progressHtml(course, enrollment) {
  const percent = progressPercent(course, enrollment);
  const done = enrollment.completedLessons.size;
  return `<div class="progress">
  <progress aria-label="${escapeHtml(course.title)} progress" max="100" value="${percent}">${percent}%</progress>
  <span data-testid="progress-percent">${percent}% complete</span>
  <span data-testid="lessons-completed">${done} of ${course.lessons.length} lessons complete</span>
</div>`;
}

function progressPercent(course, enrollment) {
  if (course.lessons.length === 0) return 0;
  return Math.round((enrollment.completedLessons.size / course.lessons.length) * 100);
}

function scoreText(enrollment) {
  return enrollment.bestScore === null
    ? 'Assessment not attempted yet'
    : `Best assessment score: ${enrollment.bestScore}%`;
}

function page(res, status, opts) {
  sendHtml(res, status, layout(opts));
}

function notFound(res, user) {
  page(res, 404, {
    title: 'Page not found',
    user,
    body: '<h1>Page not found</h1><p>The page you requested does not exist.</p><p><a href="/courses">Browse courses</a></p>'
  });
}

function forbidden(res, user) {
  page(res, 403, {
    title: 'Access denied',
    user,
    body: '<h1>Access denied</h1><p>You do not have permission to view this page.</p>'
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateRegistration(input) {
  const errors = [];
  if (!String(input.firstName || '').trim()) errors.push('First name is required.');
  if (!String(input.lastName || '').trim()) errors.push('Last name is required.');
  const email = normaliseEmail(input.email);
  if (!EMAIL_PATTERN.test(email)) errors.push('Enter a valid email address.');
  const password = String(input.password || '');
  if (password.length < 8) errors.push('Password must be at least 8 characters.');
  if (password !== String(input.confirmPassword ?? '')) errors.push('Passwords do not match.');
  if (errors.length === 0 && users.has(email)) errors.push('An account with this email already exists.');
  return errors;
}

function validateCourseDraft(input) {
  const errors = [];
  const title = String(input.title || '').trim();
  if (!title) errors.push('Course title is required.');
  else if (title.length < 3) errors.push('Course title must be at least 3 characters.');
  else if (title.length > 120) errors.push('Course title must be 120 characters or fewer.');
  else if ([...courses.values()].some((c) => c.title.toLowerCase() === title.toLowerCase())) {
    errors.push('A course with this title already exists.');
  }
  if (!String(input.description || '').trim()) errors.push('Description is required.');
  if (!CATEGORIES.includes(input.category)) errors.push('Choose a category.');
  return errors;
}

// ---------------------------------------------------------------------------
// Domain actions
// ---------------------------------------------------------------------------
function enroll(user, course) {
  if (!user.enrollments.has(course.id)) {
    user.enrollments.set(course.id, { completedLessons: new Set(), bestScore: null });
    return true;
  }
  return false;
}

function publishedCourse(id) {
  const course = courses.get(id);
  return course && course.status === 'published' ? course : null;
}

function createDraft(input, author) {
  const course = {
    id: `draft-${crypto.randomUUID()}`,
    title: String(input.title).trim(),
    description: String(input.description).trim(),
    category: input.category,
    status: 'draft',
    createdBy: author.email,
    lessons: [],
    assessment: null
  };
  courses.set(course.id, course);
  return course;
}

function gradeAttempt(user, course, answers) {
  const questions = course.assessment.questions;
  const correct = questions.filter((q) => Number(answers[q.id]) === q.answer).length;
  const score = Math.round((correct / questions.length) * 100);
  const attempt = {
    id: crypto.randomUUID(),
    userEmail: user.email,
    courseId: course.id,
    correct,
    total: questions.length,
    score,
    passed: score >= PASS_MARK
  };
  attempts.set(attempt.id, attempt);
  const enrollment = user.enrollments.get(course.id);
  enrollment.bestScore = enrollment.bestScore === null ? score : Math.max(enrollment.bestScore, score);
  return attempt;
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------
function loginView(res, { user, status = 200, errors = [], email = '', next = '', flash }) {
  const nextField = next ? `<input type="hidden" name="next" value="${escapeHtml(next)}">` : '';
  page(res, status, {
    title: 'Log in',
    user,
    flash,
    body: `<h1>Log in to EXELYNT</h1>
${errorList(errors)}
<form method="post" action="/login" novalidate class="form">
  ${nextField}
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="username" value="${escapeHtml(email)}">
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password">
  <button type="submit">Log in</button>
</form>
<p>New to EXELYNT? <a href="/register">Create an account</a></p>`
  });
}

function registerView(res, { user, status = 200, errors = [], values = {} }) {
  page(res, status, {
    title: 'Create account',
    user,
    body: `<h1>Create your learner account</h1>
${errorList(errors)}
<form method="post" action="/register" novalidate class="form">
  <label for="firstName">First name</label>
  <input id="firstName" name="firstName" autocomplete="given-name" value="${escapeHtml(values.firstName)}">
  <label for="lastName">Last name</label>
  <input id="lastName" name="lastName" autocomplete="family-name" value="${escapeHtml(values.lastName)}">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" value="${escapeHtml(values.email)}">
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="new-password">
  <label for="confirmPassword">Confirm password</label>
  <input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password">
  <button type="submit">Create account</button>
</form>
<p>Already registered? <a href="/login">Log in</a></p>`
  });
}

function courseCard(course) {
  const headingId = `course-${escapeHtml(course.id)}-title`;
  return `<article class="card" aria-labelledby="${headingId}">
  <h2 id="${headingId}">${escapeHtml(course.title)}</h2>
  <p class="meta">${escapeHtml(course.category)} · ${course.lessons.length} lessons</p>
  <p>${escapeHtml(course.description)}</p>
  <a href="/courses/${encodeURIComponent(course.id)}">View course</a>
</article>`;
}

function assessmentView(res, { user, course, status = 200, errors = [], answers = {} }) {
  const questions = course.assessment.questions
    .map((q, index) => {
      const options = q.options
        .map((option, optionIndex) => {
          const checked = String(answers[q.id]) === String(optionIndex) ? ' checked' : '';
          return `<label class="option"><input type="radio" name="${escapeHtml(q.id)}" value="${optionIndex}"${checked}> ${escapeHtml(option)}</label>`;
        })
        .join('');
      return `<fieldset data-testid="question"><legend>${index + 1}. ${escapeHtml(q.text)}</legend>${options}</fieldset>`;
    })
    .join('');
  page(res, status, {
    title: `${course.title} assessment`,
    user,
    body: `<p><a href="/learn/${encodeURIComponent(course.id)}">Back to course</a></p>
<h1>${escapeHtml(course.title)} assessment</h1>
<p>Answer every question. Pass mark: ${PASS_MARK}%.</p>
${errorList(errors)}
<form method="post" action="/learn/${encodeURIComponent(course.id)}/assessment" novalidate class="form">
  ${questions}
  <button type="submit">Submit assessment</button>
</form>`
  });
}

function courseDraftView(res, { user, status = 200, errors = [], values = {} }) {
  const options = CATEGORIES.map((category) => {
    const selected = values.category === category ? ' selected' : '';
    return `<option value="${escapeHtml(category)}"${selected}>${escapeHtml(category)}</option>`;
  }).join('');
  page(res, status, {
    title: 'Create course',
    user,
    body: `<p><a href="/admin/courses">Back to course management</a></p>
<h1>Create course</h1>
${errorList(errors)}
<form method="post" action="/admin/courses/new" novalidate class="form">
  <label for="title">Course title</label>
  <input id="title" name="title" value="${escapeHtml(values.title)}">
  <label for="description">Description</label>
  <textarea id="description" name="description" rows="4">${escapeHtml(values.description)}</textarea>
  <label for="category">Category</label>
  <select id="category" name="category"><option value="">Select a category</option>${options}</select>
  <button type="submit">Save draft</button>
</form>`
  });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const routes = [];
function route(method, pattern, handler) {
  routes.push({ method, pattern, handler });
}

function requireLogin(ctx) {
  if (ctx.user) return true;
  redirect(ctx.res, `/login?next=${encodeURIComponent(ctx.url.pathname)}`);
  return false;
}

function requireEnrollment(ctx, course) {
  if (!requireLogin(ctx)) return null;
  const enrollment = ctx.user.enrollments.get(course.id);
  if (!enrollment) {
    redirect(ctx.res, `/courses/${encodeURIComponent(course.id)}`);
    return null;
  }
  return enrollment;
}

route('GET', /^\/health$/, ({ res }) => sendJson(res, 200, { status: 'ok' }));

route('GET', /^\/$/, ({ res }) => redirect(res, '/courses'));

// --- Authentication ---------------------------------------------------------
route('GET', /^\/login$/, ({ res, user, url }) => {
  const flash = url.searchParams.get('loggedOut') ? 'You have been logged out.' : undefined;
  loginView(res, { user, next: safeNextPath(url.searchParams.get('next')) || '', flash });
});

route('POST', /^\/login$/, async ({ req, res }) => {
  const body = await parseBody(req);
  const account = users.get(normaliseEmail(body.email));
  const next = safeNextPath(body.next);
  if (!account || !verifyPassword(body.password || '', account.passwordHash)) {
    loginView(res, { user: null, status: 401, errors: ['Invalid email or password.'], email: body.email, next: next || '' });
    return;
  }
  startSession(res, account);
  redirect(res, next || homeFor(account));
});

route('POST', /^\/logout$/, ({ req, res }) => {
  endSession(req, res);
  redirect(res, '/login?loggedOut=1');
});

route('GET', /^\/register$/, ({ res, user }) => registerView(res, { user }));

route('POST', /^\/register$/, async ({ req, res, user }) => {
  const body = await parseBody(req);
  const errors = validateRegistration(body);
  if (errors.length > 0) {
    registerView(res, { user, status: 422, errors, values: body });
    return;
  }
  const account = createUser(learnerFields(body));
  startSession(res, account);
  redirect(res, '/my-learning?welcome=1');
});

// --- Catalog and enrollment -------------------------------------------------
route('GET', /^\/courses$/, ({ res, user, url }) => {
  const query = String(url.searchParams.get('q') || '').trim();
  const needle = query.toLowerCase();
  const list = [...courses.values()].filter(
    (c) =>
      c.status === 'published' &&
      (!needle || c.title.toLowerCase().includes(needle) || c.description.toLowerCase().includes(needle))
  );
  const countLabel = `${list.length} ${list.length === 1 ? 'course' : 'courses'}`;
  const results =
    list.length > 0
      ? `<div class="grid">${list.map(courseCard).join('')}</div>`
      : `<p data-testid="empty-catalog">No courses match “${escapeHtml(query)}”.</p>`;
  page(res, 200, {
    title: 'Course catalog',
    user,
    body: `<h1>Course catalog</h1>
<form method="get" action="/courses" role="search" class="search">
  <label for="q">Search courses</label>
  <input id="q" name="q" type="search" value="${escapeHtml(query)}">
  <button type="submit">Search</button>
</form>
<p data-testid="result-count">${countLabel}</p>
${results}`
  });
});

route('GET', /^\/courses\/(?<id>[\w-]+)$/, ({ res, user, url, params }) => {
  const course = courses.get(params.id);
  const canPreviewDraft = user && user.role === 'admin';
  if (!course || (course.status !== 'published' && !canPreviewDraft)) {
    notFound(res, user);
    return;
  }
  const enrollment = user ? user.enrollments.get(course.id) : undefined;
  let action;
  if (course.status !== 'published') {
    action = '<p class="badge">Draft – not visible to learners</p>';
  } else if (!user) {
    action = `<p><a href="/login?next=${encodeURIComponent(`/courses/${course.id}`)}">Log in to enroll</a></p>`;
  } else if (enrollment) {
    action = `<p class="badge" data-testid="enrollment-state">Enrolled</p><p><a href="/learn/${encodeURIComponent(course.id)}">Continue learning</a></p>`;
  } else {
    action = `<form method="post" action="/courses/${encodeURIComponent(course.id)}/enroll"><button type="submit">Enroll in course</button></form>`;
  }
  const lessons = course.lessons.map((l) => `<li>${escapeHtml(l.title)}</li>`).join('');
  const flash = url.searchParams.get('enrolled') && enrollment ? `You are enrolled in ${course.title}.` : undefined;
  page(res, 200, {
    title: course.title,
    user,
    flash,
    body: `<p><a href="/courses">Back to catalog</a></p>
<h1>${escapeHtml(course.title)}</h1>
<p class="meta">${escapeHtml(course.category)}</p>
<p>${escapeHtml(course.description)}</p>
<h2>Lessons</h2>
<ol>${lessons}</ol>
${action}`
  });
});

route('POST', /^\/courses\/(?<id>[\w-]+)\/enroll$/, (ctx) => {
  const course = publishedCourse(ctx.params.id);
  if (!course) return notFound(ctx.res, ctx.user);
  if (!requireLogin(ctx)) return undefined;
  enroll(ctx.user, course);
  return redirect(ctx.res, `/courses/${encodeURIComponent(course.id)}?enrolled=1`);
});

// --- My learning, lessons and progress ---------------------------------------
route('GET', /^\/my-learning$/, (ctx) => {
  if (!requireLogin(ctx)) return;
  const { user, res, url } = ctx;
  const items = [...user.enrollments.entries()]
    .map(([courseId, enrollment]) => {
      const course = courses.get(courseId);
      const headingId = `enrolled-${escapeHtml(course.id)}-title`;
      return `<article class="card" aria-labelledby="${headingId}">
  <h2 id="${headingId}">${escapeHtml(course.title)}</h2>
  ${progressHtml(course, enrollment)}
  <p data-testid="best-score">${escapeHtml(scoreText(enrollment))}</p>
  <a href="/learn/${encodeURIComponent(course.id)}">Continue learning</a>
</article>`;
    })
    .join('');
  const body = items
    ? `<div class="grid">${items}</div>`
    : '<p data-testid="empty-learning">You are not enrolled in any courses yet. <a href="/courses">Browse the catalog</a>.</p>';
  page(res, 200, {
    title: 'My learning',
    user,
    flash: url.searchParams.get('welcome') ? `Account created. Welcome, ${user.firstName}!` : undefined,
    body: `<h1>My learning</h1>${body}`
  });
});

route('GET', /^\/learn\/(?<id>[\w-]+)$/, (ctx) => {
  const course = publishedCourse(ctx.params.id);
  if (!course) return notFound(ctx.res, ctx.user);
  const enrollment = requireEnrollment(ctx, course);
  if (!enrollment) return undefined;
  const lessons = course.lessons
    .map((lesson) => {
      const done = enrollment.completedLessons.has(lesson.id);
      return `<li data-testid="lesson-item"><a href="/learn/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(lesson.id)}">${escapeHtml(lesson.title)}</a>
  <span class="badge" data-testid="lesson-status">${done ? 'Completed' : 'Not started'}</span></li>`;
    })
    .join('');
  const completedId = ctx.url.searchParams.get('completed');
  const completedLesson = course.lessons.find((l) => l.id === completedId);
  return page(ctx.res, 200, {
    title: course.title,
    user: ctx.user,
    flash: completedLesson ? `Lesson “${completedLesson.title}” marked as complete.` : undefined,
    body: `<p><a href="/my-learning">Back to My learning</a></p>
<h1>${escapeHtml(course.title)}</h1>
${progressHtml(course, enrollment)}
<h2>Lessons</h2>
<ol class="lessons">${lessons}</ol>
<h2>Assessment</h2>
<p data-testid="best-score">${escapeHtml(scoreText(enrollment))}</p>
<p><a href="/learn/${encodeURIComponent(course.id)}/assessment">Take assessment</a></p>`
  });
});

function findLesson(ctx) {
  const course = publishedCourse(ctx.params.id);
  const lesson = course ? course.lessons.find((l) => l.id === ctx.params.lessonId) : undefined;
  return { course, lesson };
}

route('GET', /^\/learn\/(?<id>[\w-]+)\/lessons\/(?<lessonId>[\w-]+)$/, (ctx) => {
  const { course, lesson } = findLesson(ctx);
  if (!course || !lesson) return notFound(ctx.res, ctx.user);
  const enrollment = requireEnrollment(ctx, course);
  if (!enrollment) return undefined;
  const done = enrollment.completedLessons.has(lesson.id);
  const action = done
    ? '<p class="badge" data-testid="lesson-completion">Lesson completed</p>'
    : `<form method="post" action="/learn/${encodeURIComponent(course.id)}/lessons/${encodeURIComponent(lesson.id)}/complete"><button type="submit">Mark lesson as complete</button></form>`;
  return page(ctx.res, 200, {
    title: lesson.title,
    user: ctx.user,
    body: `<p><a href="/learn/${encodeURIComponent(course.id)}">Back to course</a></p>
<h1>${escapeHtml(lesson.title)}</h1>
<p class="meta">${escapeHtml(course.title)}</p>
<div class="lesson-body"><p>${escapeHtml(lesson.body)}</p></div>
${action}`
  });
});

route('POST', /^\/learn\/(?<id>[\w-]+)\/lessons\/(?<lessonId>[\w-]+)\/complete$/, (ctx) => {
  const { course, lesson } = findLesson(ctx);
  if (!course || !lesson) return notFound(ctx.res, ctx.user);
  const enrollment = requireEnrollment(ctx, course);
  if (!enrollment) return undefined;
  enrollment.completedLessons.add(lesson.id);
  return redirect(ctx.res, `/learn/${encodeURIComponent(course.id)}?completed=${encodeURIComponent(lesson.id)}`);
});

// --- Assessments --------------------------------------------------------------
route('GET', /^\/learn\/(?<id>[\w-]+)\/assessment$/, (ctx) => {
  const course = publishedCourse(ctx.params.id);
  if (!course || !course.assessment) return notFound(ctx.res, ctx.user);
  if (!requireEnrollment(ctx, course)) return undefined;
  return assessmentView(ctx.res, { user: ctx.user, course });
});

route('POST', /^\/learn\/(?<id>[\w-]+)\/assessment$/, async (ctx) => {
  const course = publishedCourse(ctx.params.id);
  if (!course || !course.assessment) return notFound(ctx.res, ctx.user);
  if (!requireEnrollment(ctx, course)) return undefined;
  const answers = await parseBody(ctx.req);
  const unanswered = course.assessment.questions.filter((q) => answers[q.id] === undefined || answers[q.id] === '');
  if (unanswered.length > 0) {
    return assessmentView(ctx.res, {
      user: ctx.user,
      course,
      status: 422,
      errors: ['Please answer all questions before submitting.'],
      answers
    });
  }
  const attempt = gradeAttempt(ctx.user, course, answers);
  return redirect(ctx.res, `/learn/${encodeURIComponent(course.id)}/assessment/results/${attempt.id}`);
});

route('GET', /^\/learn\/(?<id>[\w-]+)\/assessment\/results\/(?<attemptId>[\w-]+)$/, (ctx) => {
  if (!requireLogin(ctx)) return undefined;
  const attempt = attempts.get(ctx.params.attemptId);
  if (!attempt || attempt.userEmail !== ctx.user.email || attempt.courseId !== ctx.params.id) {
    return notFound(ctx.res, ctx.user);
  }
  const course = courses.get(attempt.courseId);
  const courseHref = `/learn/${encodeURIComponent(course.id)}`;
  return page(ctx.res, 200, {
    title: 'Assessment result',
    user: ctx.user,
    body: `<h1>Assessment result</h1>
<p class="meta">${escapeHtml(course.title)}</p>
<p class="score" data-testid="assessment-score">Your score: ${attempt.score}%</p>
<p data-testid="assessment-correct">${attempt.correct} of ${attempt.total} questions correct</p>
<p class="badge" data-testid="assessment-outcome">${attempt.passed ? 'Passed' : 'Not passed'}</p>
<ul class="actions">
  <li><a href="${courseHref}/assessment">Retake assessment</a></li>
  <li><a href="${courseHref}">Back to course</a></li>
  <li><a href="/my-learning">Go to My learning</a></li>
</ul>`
  });
});

// --- Admin: course management -------------------------------------------------
function requireAdmin(ctx) {
  if (!requireLogin(ctx)) return false;
  if (ctx.user.role !== 'admin') {
    forbidden(ctx.res, ctx.user);
    return false;
  }
  return true;
}

route('GET', /^\/admin\/courses$/, (ctx) => {
  if (!requireAdmin(ctx)) return;
  const rows = [...courses.values()]
    .map(
      (c) => `<tr>
  <td><a href="/courses/${encodeURIComponent(c.id)}">${escapeHtml(c.title)}</a></td>
  <td>${escapeHtml(c.category)}</td>
  <td>${c.status === 'draft' ? 'Draft' : 'Published'}</td>
  <td>${c.lessons.length}</td>
</tr>`
    )
    .join('');
  const created = courses.get(String(ctx.url.searchParams.get('created') || ''));
  page(ctx.res, 200, {
    title: 'Course management',
    user: ctx.user,
    flash: created ? `Course draft “${created.title}” saved.` : undefined,
    body: `<h1>Course management</h1>
<p><a href="/admin/courses/new" class="button">Create course</a></p>
<table>
  <caption>All courses</caption>
  <thead><tr><th scope="col">Title</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Lessons</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`
  });
});

route('GET', /^\/admin\/courses\/new$/, (ctx) => {
  if (!requireAdmin(ctx)) return;
  courseDraftView(ctx.res, { user: ctx.user });
});

route('POST', /^\/admin\/courses\/new$/, async (ctx) => {
  if (!requireAdmin(ctx)) return;
  const body = await parseBody(ctx.req);
  const errors = validateCourseDraft(body);
  if (errors.length > 0) {
    courseDraftView(ctx.res, { user: ctx.user, status: 422, errors, values: body });
    return;
  }
  const course = createDraft(body, ctx.user);
  redirect(ctx.res, `/admin/courses?created=${encodeURIComponent(course.id)}`);
});

// --- JSON API (used by tests for fast, isolated data setup) -------------------
route('POST', /^\/api\/register$/, async ({ req, res }) => {
  const body = await parseBody(req);
  const errors = validateRegistration({ ...body, confirmPassword: body.password });
  if (errors.length > 0) {
    const status = errors.includes('An account with this email already exists.') ? 409 : 400;
    sendJson(res, status, { errors });
    return;
  }
  const account = createUser(learnerFields(body));
  startSession(res, account);
  sendJson(res, 201, { id: account.id, email: account.email });
});

route('POST', /^\/api\/login$/, async ({ req, res }) => {
  const body = await parseBody(req);
  const account = users.get(normaliseEmail(body.email));
  if (!account || !verifyPassword(body.password || '', account.passwordHash)) {
    sendJson(res, 401, { errors: ['Invalid email or password.'] });
    return;
  }
  startSession(res, account);
  sendJson(res, 200, { id: account.id, email: account.email, role: account.role });
});

route('GET', /^\/api\/courses$/, ({ res }) => {
  const list = [...courses.values()]
    .filter((c) => c.status === 'published')
    .map((c) => ({ id: c.id, title: c.title, category: c.category, lessons: c.lessons.length }));
  sendJson(res, 200, list);
});

route('POST', /^\/api\/courses\/(?<id>[\w-]+)\/enroll$/, ({ res, user, params }) => {
  if (!user) return sendJson(res, 401, { errors: ['Authentication required.'] });
  const course = publishedCourse(params.id);
  if (!course) return sendJson(res, 404, { errors: ['Course not found.'] });
  const created = enroll(user, course);
  return sendJson(res, created ? 201 : 200, { courseId: course.id, enrolled: true });
});

// --- Static -------------------------------------------------------------------
const STYLES = require('./styles');
route('GET', /^\/styles\.css$/, ({ res }) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.end(STYLES);
});

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
async function handle(req, res) {
  setSecurityHeaders(res);
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const user = currentUser(req);
  const match = routes.find((r) => r.method === req.method && r.pattern.test(url.pathname));
  if (!match) {
    const pathExists = routes.some((r) => r.pattern.test(url.pathname));
    if (pathExists) {
      res.statusCode = 405;
      res.end('Method not allowed');
      return;
    }
    notFound(res, user);
    return;
  }
  const params = (url.pathname.match(match.pattern) || {}).groups || {};
  await match.handler({ req, res, url, user, params });
}

seed();

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) {
      sendHtml(res, 500, '<h1>Something went wrong</h1>');
    } else {
      res.end();
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`EXELYNT reference app listening on http://${HOST}:${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
