'use strict';
// Stylesheet served at /styles.css (kept external so the CSP can forbid inline styles).
module.exports = `
:root { --ink:#1f2933; --muted:#52606d; --brand:#3b4cca; --line:#d9e2ec; --ok:#1f7a4d; --bad:#b42318; }
* { box-sizing: border-box; }
body { margin:0; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink); background:#f5f7fa; }
.topbar { display:flex; gap:1.5rem; align-items:center; padding:.75rem 1.5rem; background:#fff; border-bottom:1px solid var(--line); flex-wrap:wrap; }
.brand { font-weight:700; letter-spacing:.08em; color:var(--brand); text-decoration:none; }
nav ul { display:flex; gap:1rem; list-style:none; margin:0; padding:0; }
.account { margin-left:auto; display:flex; gap:.75rem; align-items:center; }
main { max-width:960px; margin:0 auto; padding:1.5rem; }
a { color: var(--brand); }
.form { display:grid; gap:.4rem; max-width:480px; }
.form input, .form textarea, .form select, .search input { padding:.5rem; border:1px solid var(--line); border-radius:6px; font:inherit; }
button, .button { background:var(--brand); color:#fff; border:0; border-radius:6px; padding:.55rem 1rem; font:inherit; cursor:pointer; text-decoration:none; display:inline-block; margin-top:.5rem; }
.link-button { background:none; color:var(--brand); padding:0; margin:0; text-decoration:underline; }
.inline { display:inline; }
.search { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; margin-bottom:1rem; }
.grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); }
.card { background:#fff; border:1px solid var(--line); border-radius:10px; padding:1rem 1.25rem; }
.meta { color:var(--muted); font-size:.9rem; }
.flash { background:#e3f8ec; border:1px solid var(--ok); padding:.6rem 1rem; border-radius:6px; }
.errors { background:#fdecea; border:1px solid var(--bad); padding:.6rem 1rem; border-radius:6px; }
.badge { display:inline-block; background:#eef2ff; border-radius:999px; padding:.1rem .6rem; font-size:.85rem; }
fieldset { border:1px solid var(--line); border-radius:8px; margin:0 0 1rem; padding:.75rem 1rem; background:#fff; }
.option { display:block; margin:.25rem 0; }
.progress { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
progress { width:160px; }
.score { font-size:1.5rem; font-weight:700; }
table { border-collapse:collapse; width:100%; background:#fff; }
th, td { border-bottom:1px solid var(--line); padding:.5rem; text-align:left; }
caption { text-align:left; font-weight:600; padding:.5rem 0; }
`;
