// The stage this branch is for, and its plan as the contract. On a workshop branch, `.stage` names the next stage to
// build (e.g. cp-04); its plan is docs/plans/stages/cp-04-*.plan.json.
//   bun scripts/stage.ts next          what to build: goal, phases, the files each may touch, how to check
//   bun scripts/stage.ts check         run the plan's automated checks; list changed files the plan does not name
//   bun scripts/stage.ts guard <file>  exit 2 if the file is outside the plan (the Claude Code hook)
//   bun scripts/stage.ts staged        exit 1 if a staged file is outside the plan (the pre-commit hook)
// No `.stage` (main's final product, or a branch with nothing left to build): every command is a no-op.
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, basename, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim() || process.cwd();
const stage = existsSync(join(root, '.stage')) ? readFileSync(join(root, '.stage'), 'utf8').trim() : '';
const [cmd, arg] = process.argv.slice(2);
if (!stage) { if (cmd === 'next') console.log('No .stage here: nothing to build on this branch.'); process.exit(0); }

const dir = join(root, 'docs/plans/stages');
const file = existsSync(dir) ? readdirSync(dir).find((f) => f.startsWith(`${stage}-`) && f.endsWith('.plan.json')) : undefined;
if (!file) { console.error(`.stage says ${stage}, but docs/plans/stages has no ${stage}-*.plan.json`); process.exit(cmd === 'guard' ? 0 : 1); }
const stem = file.replace(/\.plan\.json$/, '');
type Change = { file: string; intent: string };
type Check = { cmd?: string; text?: string };
type Phase = { id: string; name: string; goal: string; changes: Change[]; verify: { automated: Check[]; manual: Check[] } };
const plan = JSON.parse(readFileSync(join(dir, file), 'utf8')) as { title: string; summary: string; endState?: string; phases: Phase[] };
const listed = plan.phases.flatMap((p) => p.changes.map((c) => c.file));

// Always fine: the plan itself (so it can be amended, with a reason), tests and their snapshots, and generated files.
const ALWAYS = [
  new RegExp(`^docs/plans/stages/${stem}\\.plan\\.`), /\/__expect__\//, /\.(test|spec)\.ts$/,
  /^apps\/web\/src\/routeTree\.gen\.ts$/, /^apps\/api\/worker-configuration\.d\.ts$/, /(^|\/)bun\.lock$/, /^docs\/architecture\//,
];
const glob = (pattern: string) => new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
export function allowed(rel: string) {
  if (ALWAYS.some((r) => r.test(rel))) return true;
  return listed.some((f) => (f.endsWith('/') ? rel.startsWith(f) : f.includes('*') ? glob(f).test(rel) : rel === f));
}
// Real paths on both sides: on macOS /var is /private/var, and a file being created may not exist yet.
const real = (p: string): string => { try { return realpathSync(p); } catch { return p === dirname(p) ? p : join(real(dirname(p)), basename(p)); } };
const relOf = (p: string) => relative(real(root), real(resolve(root, p))).split('\\').join('/');
const refuse = (files: string[]) =>
  `Stage ${stage} is being built here, and its plan (docs/plans/stages/${stem}.plan.html) does not list:\n` +
  files.map((f) => `  ${f}`).join('\n') +
  `\nBuild only what the plan says. If the plan is missing this file, add it to the right phase's changes with a one-line intent ` +
  `and set "change": { "intent": "why" } in the plan first; the plan's versions record it. (Anything else: leave it for a later stage.)`;

if (cmd === 'guard') {
  const rel = relOf(arg ?? '');
  if (!arg || rel.startsWith('..') || allowed(rel)) process.exit(0);
  console.error(refuse([rel])); process.exit(2);
}

if (cmd === 'staged') {
  if (process.env.STAGE_GUARD === 'off') process.exit(0);
  const staged = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { cwd: root, encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
  const outside = staged.filter((f) => !allowed(f));
  if (outside.length) { console.error(refuse(outside) + '\n(Override for one commit: STAGE_GUARD=off git commit …)'); process.exit(1); }
  process.exit(0);
}

if (cmd === 'next') {
  console.log(`\nNext stage: ${stage} · ${plan.title}\n\n${plan.summary}\n`);
  if (plan.endState) console.log(`Done when: ${plan.endState}\n`);
  plan.phases.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}\n   ${p.goal}`);
    for (const c of p.changes) console.log(`   · ${c.file}: ${c.intent}`);
    for (const v of p.verify.automated) console.log(`   ✓ ${v.cmd ?? v.text}`);
    for (const v of p.verify.manual) console.log(`   ◻ ${v.text}`);
  });
  console.log(`\nThe plan as a page: docs/plans/stages/${stem}.plan.html\nWhen done: just stage-check, then compare with the ${stage} pull request.\n`);
  process.exit(0);
}

if (cmd === 'check') {
  let failed = 0;
  for (const p of plan.phases) for (const v of p.verify.automated) {
    if (!v.cmd) continue;
    const r = spawnSync('bash', ['-c', v.cmd], { cwd: root, encoding: 'utf8' });
    console.log(`${r.status === 0 ? '✓' : '✗'} ${p.name}: ${v.cmd}`);
    if (r.status !== 0) { failed++; console.log((r.stdout + r.stderr).trim().split('\n').slice(-6).map((l) => `    ${l}`).join('\n')); }
  }
  // Everything changed since the branch was handed over (the commit that last set .stage), committed or not.
  const since = spawnSync('git', ['log', '-1', '--format=%H', '--', '.stage'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  const changed = new Set([
    ...spawnSync('git', ['diff', '--name-only', since || 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.split('\n'),
    ...spawnSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).stdout.split('\n'),
  ].filter(Boolean));
  const outside = [...changed].filter((f) => !allowed(f) && f !== '.stage');
  if (outside.length) { failed++; console.log(`✗ changed outside the plan:\n${outside.map((f) => `    ${f}`).join('\n')}`); }
  else console.log(`✓ every changed file is in the plan (${changed.size} changed)`);
  console.log(failed ? `\n${failed} problem(s). Fix them, or amend the plan with a reason.` : `\nStage ${stage} checks out. Compare with its pull request, then stop: the next stage is the next plan.`);
  process.exit(failed ? 1 : 0);
}

console.error('usage: bun scripts/stage.ts next|check|guard <file>|staged'); process.exit(2);
