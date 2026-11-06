import { test as setup, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { AuthPage } from '../src/pages/auth.page';
import { learnerAccount, adminAccount } from '../src/test-data';

const authDir = 'playwright/.auth';

setup('authenticate learner and admin accounts', async ({ browser }) => {
  await mkdir(authDir, { recursive: true });

  const learnerContext = await browser.newContext();
  const learnerPage = await learnerContext.newPage();
  const learnerAuth = new AuthPage(learnerPage);
  await learnerAuth.openLogin();
  await learnerAuth.login(learnerAccount.email, learnerAccount.password);
  await expect(learnerPage).not.toHaveURL(/\\/login/);
  await learnerContext.storageState({ path: `${authDir}/learner.json` });
  await learnerContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const adminAuth = new AuthPage(adminPage);
  await adminAuth.openLogin();
  await adminAuth.login(adminAccount.email, adminAccount.password);
  await expect(adminPage).not.toHaveURL(/\\/login/);
  await adminContext.storageState({ path: `${authDir}/admin.json` });
  await adminContext.close();
});