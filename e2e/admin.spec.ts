import { test, expect } from '@playwright/test';
import { logins, ready, signIn, signOut } from './helpers';

// The admin workflows, as a person meets them: refused when signed out, refused as a participant, everything as an admin.

test('signed out, the admin pages say how to get in', async ({ page }) => {
  await signOut(page);
  for (const path of ['/admin', '/admin/accounts', '/admin/events', '/admin/flags']) {
    await ready(page, path);
    await expect(page.getByRole('alert')).toContainText('Sign in as an admin');
  }
});

test('a participant is refused, and told why', async ({ page }) => {
  await signIn(page, logins.sam);
  await ready(page, '/admin');
  await expect(page.getByRole('alert')).toContainText('this account is not an admin');
  await signOut(page);
});

test('an admin sees the dashboard, the accounts, the event log with secrets masked, and the flags', async ({ page }) => {
  await signIn(page, logins.admin);
  await ready(page, '/admin');
  await expect(page.locator('[data-tile="Accounts"]')).toContainText(/\d+/);

  await page.locator('[data-tile="Accounts"]').click();
  await expect(page.locator('[data-account="admin"]')).toContainText('admin');
  await expect(page.locator('[data-account="sam"]')).toContainText('participant');

  await ready(page, '/admin/events');
  const opened = page.locator('[data-event="AccountOpened"]').first();
  await expect(opened).toContainText('passwordHash="•••"');
  await expect(page.locator('body')).not.toContainText('pbkdf2$');

  await ready(page, '/admin/flags');
  await expect(page.getByRole('heading', { name: 'Flags' })).toBeVisible();
  // <cp-05>
  await expect(page.locator('[data-flag="resolve-thread"]')).toBeVisible();
  // </cp-05>
  await signOut(page);
});
// <cp-04>

test('an admin adds an account from the page, and it can sign in', async ({ page }) => {
  const email = `added-${Date.now().toString(36)}@greenhouse.test`;
  await signIn(page, logins.admin);
  await ready(page, '/admin/accounts');
  await page.getByLabel('Name', { exact: true }).fill('Added');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Starting password').fill('a-starting-password');
  await page.getByRole('button', { name: 'Add account' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'can sign in as' })).toContainText(`can sign in as ${email}`);
  await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();
  await signOut(page);
  await signIn(page, { email, password: 'a-starting-password' });
  await signOut(page);
});

test('an admin names the agent, and the name shows on the accounts page', async ({ page }) => {
  await signIn(page, logins.admin);
  await ready(page, '/admin/accounts');
  await page.getByLabel('Agent name').fill('Ada');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'The agent is now' })).toContainText('Ada');
  await expect(page.locator('[data-account="agent"]')).toContainText('Ada');
  await page.getByLabel('Agent name').fill('Agent');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('[data-account="agent"]')).toContainText('Agent');
  await signOut(page);
});
// </cp-04>
