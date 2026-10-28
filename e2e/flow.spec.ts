import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { logins, ready, signIn, signOut } from './helpers';

// The whole product as people use it, on a fresh plan per run: sign up, comment to decision, two people live in one
// room, and a session the agent answers. The agent is the real `agent-serve` process with the faux model.
const plan = `e2e-${Date.now().toString(36)}`;
let agent: ChildProcess | undefined;

test.beforeAll(() => {
  agent = spawn('bun', ['run', 'src/serve.ts'], {
    cwd: new URL('../packages/agent', import.meta.url).pathname,
    env: { ...process.env, PLAN: plan, AGENT_MODEL: 'faux', AGENT_STORE: join(mkdtempSync(join(tmpdir(), 'gh-e2e-agent-')), 'agent.sqlite') },
    stdio: 'ignore',
  });
});
test.afterAll(() => { agent?.kill('SIGINT'); });

const openPlan = (page: Page) => ready(page, `/plans/${plan}`);

test('a newcomer signs up and lands signed in', async ({ page }) => {
  const email = `e2e-${Date.now().toString(36)}@greenhouse.test`;
  await signOut(page);
  await ready(page, '/signup');
  await page.getByLabel('Name').fill('Newcomer');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('a long enough password');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByTestId('session')).toContainText('Signed in as Newcomer');
  await expect(page.getByTestId('header-account')).toContainText('Newcomer');
  await signOut(page);
});

test('a comment thread ends in a decision', async ({ page }) => {
  await signIn(page, logins.admin);
  await openPlan(page);
  await page.getByLabel('Block id').fill('b3');
  await page.getByLabel('What should we decide').fill('retries in the client or the wrapper?');
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  const thread = page.locator('[data-thread]').first();
  await expect(thread).toContainText('retries in the client or the wrapper?');
  await thread.getByLabel('What was decided').fill('the wrapper');
  await thread.getByRole('button', { name: 'Resolve', exact: true }).click();
  await expect(thread.locator('[data-decision]')).toContainText('the wrapper');
  await signOut(page);
});

test('two people in one room see each other, and the agent answers in their session', async ({ browser }) => {
  const adminCtx = await browser.newContext(), samCtx = await browser.newContext();
  const admin = await adminCtx.newPage(), sam = await samCtx.newPage();
  await signIn(admin, logins.admin); await signIn(sam, logins.sam);
  await openPlan(admin); await openPlan(sam);
  await expect(sam.locator('[data-live="live"]')).toBeVisible();

  // A thread opened by one appears for the other without a reload.
  await admin.getByLabel('Block id').fill('b7');
  await admin.getByLabel('What should we decide').fill('who owns the retry budget?');
  await admin.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(sam.locator('[data-thread]', { hasText: 'who owns the retry budget?' })).toBeVisible();

  // The admin starts a session; Sam joins it and asks; the agent answers, and both see the answer.
  if (!(await admin.getByLabel('New session title').isVisible())) await admin.getByRole('button', { name: 'New', exact: true }).click();
  await admin.getByLabel('New session title').fill('Retry budget');
  await admin.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(admin.locator('[data-session]')).toBeVisible();
  await expect(admin.getByLabel(/Here now: .*sam/).first()).toBeVisible();
  await sam.getByRole('button', { name: 'Retry budget' }).click();
  await sam.getByRole('button', { name: 'Join this session' }).click();
  await sam.getByLabel('Message the session').fill('Ana, can you check the budget block?');
  await sam.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(admin.locator('.gh-said', { hasText: 'Ana, can you check the budget block?' })).toBeVisible();
  await sam.getByLabel('Message the session').fill('@agent Who should own the retry budget?');
  await sam.getByRole('button', { name: 'Send', exact: true }).click();
  const answer = (p: Page) => p.locator('[data-run][data-status="finished"] [data-result]');
  await expect(answer(sam)).toContainText('Who should own the retry budget?', { timeout: 20_000 });
  await expect(answer(admin)).toContainText('Who should own the retry budget?', { timeout: 20_000 });
  await adminCtx.close(); await samCtx.close();
});

test('signed out, a plan asks you to sign in, and a malformed plan id is refused', async ({ page }) => {
  await signOut(page);
  await openPlan(page);
  await expect(page.getByRole('alert')).toContainText('Sign in');
  await expect(page.getByRole('button', { name: 'Open', exact: true })).toHaveCount(0);
  await signIn(page, logins.sam);
  await ready(page, '/plans/Not_A_Plan');
  await expect(page.getByRole('alert')).toContainText('lowercase');
  await signOut(page);
});
// <cp-05>

test('the plan is written in the editor: "/" makes a heading, and the text is saved for everyone', async ({ page }) => {
  const plan = `e2e-${Date.now().toString(36)}`;
  await signIn(page, logins.sam);
  await ready(page, `/plans/${plan}`);
  const text = page.getByRole('textbox', { name: 'Plan text' });
  await text.click();
  await page.keyboard.type('/head');
  await expect(page.getByRole('option', { name: /Heading/ })).toBeVisible();
  await page.keyboard.press('Enter');
  await page.keyboard.type('Rollout');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Flag first, then everyone.');
  await expect(page.locator('[data-save="saved"]')).toContainText('last edit by sam');
  await ready(page, `/plans/${plan}`);
  await expect(text.getByRole('heading', { name: 'Rollout' })).toBeVisible();
  await expect(text).toContainText('Flag first, then everyone.');
  await signOut(page);
});
// </cp-05>
