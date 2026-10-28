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
  await admin.getByLabel('New session title').fill('Retry budget');
  await admin.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(admin.locator('[data-session]')).toBeVisible();
  await sam.getByRole('button', { name: 'Retry budget' }).click();
  await sam.getByRole('button', { name: 'Join this session' }).click();
  await sam.getByLabel('Ask the agent').fill('Who should own the retry budget?');
  await sam.getByRole('button', { name: 'Ask', exact: true }).click();
  const answer = (p: Page) => p.locator('[data-run][data-status="finished"] [data-result]');
  await expect(answer(sam)).toContainText('Who should own the retry budget?', { timeout: 20_000 });
  await expect(answer(admin)).toContainText('Who should own the retry budget?', { timeout: 20_000 });
  await adminCtx.close(); await samCtx.close();
});

test('signed out, the plan asks you to sign in before talking to the agent', async ({ page }) => {
  await signOut(page);
  await openPlan(page);
  await expect(page.getByRole('complementary', { name: 'Sessions' })).toContainText('Sign in');
});
