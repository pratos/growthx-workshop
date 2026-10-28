import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

// The local-only logins the seed opens, read from the same file the seed reads.
const vars = Object.fromEntries(readFileSync(new URL('../.dev.vars.example', import.meta.url), 'utf8')
  .split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
export const logins = {
  admin: { email: vars.ADMIN_EMAIL!, password: vars.ADMIN_PASSWORD! },
  sam: { email: vars.USER_EMAIL!, password: vars.USER_PASSWORD! },
  agent: { email: vars.AGENT_EMAIL!, password: vars.AGENT_PASSWORD! },
};

// Wait for the page to hydrate before typing: a form submitted before React attaches posts natively.
// The root layout sets <html data-hydrated> once React is live.
export async function ready(page: Page, path: string) {
  await page.goto(path);
  await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
}

export async function signIn(page: Page, who: { email: string; password: string }) {
  await ready(page, '/login');
  await page.getByLabel('Email').fill(who.email);
  await page.getByLabel('Password').fill(who.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByTestId('session')).toContainText('Signed in as');
}

export async function signOut(page: Page) {
  await ready(page, '/');
  const button = page.getByRole('button', { name: 'Sign out' });
  if (await button.isVisible()) { await button.click(); await expect(page.getByTestId('session')).toContainText('Not signed in'); }
}
