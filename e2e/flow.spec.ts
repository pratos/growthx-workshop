import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commentOn, logins, ready, signIn, signOut } from './helpers';

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
  await page.getByLabel('Name', { exact: true }).fill('Newcomer');
  await page.getByRole('textbox', { name: /^Username/ }).fill(`new-${Date.now().toString(36)}`);
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
  await commentOn(page, 'retries in the client or the wrapper?');
  const thread = page.locator('[data-thread]', { hasText: 'retries in the client or the wrapper?' }).last();
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
  await commentOn(admin, 'who owns the retry budget?', 'The retry budget needs an owner.');
  await expect(sam.locator('[data-thread]', { hasText: 'who owns the retry budget?' })).toBeVisible();

  // The admin starts a session; Sam joins it and asks; the agent answers, and both see the answer.
  const chat = `Retry budget ${Date.now().toString(36)}`;
  await admin.getByRole('button', { name: 'Switch chat' }).click();
  await admin.getByLabel('Find or start a chat').fill(chat);
  await admin.keyboard.press('Enter');
  await expect(admin.locator('[data-session]')).toBeVisible();
  await expect(admin.getByLabel(/Here now: .*sam/).first()).toBeVisible();
  await sam.getByRole('button', { name: 'Switch chat' }).click();
  await sam.getByLabel('Find or start a chat').fill(chat);
  await sam.keyboard.press('Enter');
  await sam.getByRole('button', { name: 'Join this chat' }).click();
  await sam.getByLabel('Message the chat').fill('Ana, can you check the budget block?');
  await sam.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(admin.locator('.gh-said', { hasText: 'Ana, can you check the budget block?' })).toBeVisible();
  await sam.getByLabel('Message the chat').fill('@agent Who should own the retry budget?');
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

test('a shared link to a thread brings someone signed out back to that thread after signing in', async ({ page }) => {
  const plan = `share-${Date.now().toString(36)}`;
  await signIn(page, logins.admin);
  await ready(page, `/plans/${plan}`);
  await commentOn(page, 'who signs off the rollout?', 'Roll out behind a flag.');
  const id = await page.locator('[data-thread]').first().getAttribute('data-thread');
  await signOut(page);
  await ready(page, `/plans/${plan}#thread-${id}`);
  await page.getByRole('alert').getByRole('link', { name: 'Sign in' }).click();
  await page.getByLabel('Email').fill(logins.sam.email);
  await page.getByLabel('Password').fill(logins.sam.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(new RegExp(`/plans/${plan}#thread-${id}$`));
  await expect(page.locator(`#thread-${id}`)).toContainText('who signs off the rollout?');
  await signOut(page);
});
