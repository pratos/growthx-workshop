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
  await expect(page.locator('[data-flag="resolve-thread"]')).toBeVisible();
  await signOut(page);
});
