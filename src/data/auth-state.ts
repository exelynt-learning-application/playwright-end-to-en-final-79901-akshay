import path from 'node:path';

/** Role-specific browser storage state written by tests/setup/auth.setup.ts (git-ignored). */
const authDir = path.join(__dirname, '..', '..', 'playwright', '.auth');

export const STORAGE_STATE = {
  learner: path.join(authDir, 'learner.json'),
  admin: path.join(authDir, 'admin.json')
} as const;
