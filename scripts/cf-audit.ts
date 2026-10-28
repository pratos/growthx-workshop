// Cloudflare security and spending audit. Runs before every deploy (scripts/deploy.sh), in CI's check job, and as
// `just cf-audit`. Each check reads the code and config; a ✗ stops the deploy. Checks for things a stage has not built
// yet are skipped, so every stage runs it.
//
// Why spending: Durable Objects bill per request (HTTP, RPC, every WebSocket message, alarms) and for duration at 128 MB
// for as long as an object is awake; a WebSocket accepted without the Hibernation API keeps it awake for the whole
// connection (Cloudflare's own example: about $419/month for 100 objects with one socket each), and pending I/O or an
// outbound connection can keep it awake for up to 15 minutes. developers.cloudflare.com/durable-objects/platform/pricing
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const jsonc = (p: string) => JSON.parse(read(p).replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'));
let failed = 0;
const ok = (area: string, what: string) => console.log(`✓ ${area}: ${what}`);
const bad = (area: string, what: string, fix: string) => { failed++; console.log(`✗ ${area}: ${what}\n    fix: ${fix}`); };
const check = (cond: boolean, area: string, what: string, fix: string) => (cond ? ok(area, what) : bad(area, what, fix));

const api = existsSync('apps/api/wrangler.jsonc') ? jsonc('apps/api/wrangler.jsonc') : null;
const web = existsSync('apps/web/wrangler.jsonc') ? jsonc('apps/web/wrangler.jsonc') : null;
const index = read('apps/api/src/index.ts'), auth = read('apps/api/src/auth.ts'), room = read('apps/api/src/plan-room.ts');

// ---- security
for (const [name, cfg] of [['api', api], ['web', web]] as const) {
  if (!cfg) continue;
  check(/^[0-9a-f]{32}$/.test(cfg.account_id ?? ''), 'security', `${name}: the account is pinned in wrangler.jsonc`, 'set "account_id" so a cached login cannot deploy to another account');
  const vars = [cfg.vars, ...Object.values(cfg.env ?? {}).map((e: { vars?: object }) => e.vars)].flatMap((v) => Object.keys(v ?? {}));
  check(!vars.some((k) => /KEY|TOKEN|SECRET|PASSWORD/i.test(k)), 'security', `${name}: no secret-looking names in vars`, 'secrets go in `wrangler secret put` or `just secret put`, never in vars');
}
const tracked = spawnSync('git', ['ls-files'], { encoding: 'utf8' }).stdout.split('\n');
check(!tracked.some((f) => /(^|\/)\.dev\.vars$|(^|\/)\.env$/.test(f)), 'security', 'no .dev.vars or .env is tracked', 'git rm --cached it; it is in .gitignore');
if (auth) {
  check(/httpOnly:\s*true/.test(auth) && /sameSite:\s*'Lax'/.test(auth), 'security', 'the session cookie is HttpOnly and SameSite=Lax', 'set httpOnly and sameSite on setCookie in apps/api/src/auth.ts');
  check(/auth\.post\('\/sign-in', byIp/.test(auth) && /auth\.post\('\/sign-up', byIp/.test(auth), 'security', 'sign-in and sign-up are rate-limited per IP', 'put the AUTH_LIMIT middleware on /auth/sign-in and /auth/sign-up');
  const limits = [api?.ratelimits, ...Object.values(api?.env ?? {}).map((e: { ratelimits?: unknown }) => e.ratelimits)];
  check(limits.every((l) => Array.isArray(l) && (l as { name: string }[]).some((x) => x.name === 'AUTH_LIMIT')), 'security', 'every site has the AUTH_LIMIT binding', 'add "ratelimits" to apps/api/wrangler.jsonc at the top level and in env.demo');
}
for (const f of ['apps/api/src/flags-admin.ts', 'apps/api/src/admin.ts']) {
  if (existsSync(f)) check(/\.use\('\*', requireAdmin\)/.test(read(f)), 'security', `${f}: every route needs an admin`, "add `.use('*', requireAdmin)`");
}
if (existsSync('apps/api/src/admin.ts')) check(/SECRET = \/hash\|password\|token\/i/.test(read('apps/api/src/admin.ts')), 'security', 'the admin event log masks hashes, passwords and tokens', 'mask keys matching hash|password|token before returning events');

// ---- spending: Durable Objects
if (room) {
  check(/acceptWebSocket\(/.test(room) && !/\bserver\.accept\(\)|\bws\.accept\(\)/.test(room), 'spending', 'WebSockets use the Hibernation API (ctx.acceptWebSocket)', 'never call accept() on a server socket: it bills duration for the whole connection');
  check(/setWebSocketAutoResponse\(/.test(room), 'spending', 'pings are answered by the runtime without waking the room', "ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))");
  check(!/setInterval\(|setTimeout\(/.test(room), 'spending', 'no timers inside the Durable Object', 'timers keep an object awake; use an alarm, and only when there is work');
  check(!/setAlarm\(/.test(room) || /deleteAlarm\(/.test(room), 'spending', 'no alarm that can reschedule itself forever', 'every setAlarm needs a path that stops (deleteAlarm or a condition)');
  check(/app\.use\('\/plans\/:planId', requireSignIn\)/.test(index) && /app\.use\('\/plans\/:planId\/\*', requireSignIn\)/.test(index), 'spending', 'only signed-in participants reach a plan room', 'every /plans route goes behind requireSignIn: a new id creates (and bills) a new object');
  check(/PLAN_ID = \/\^\[a-z0-9\]/.test(index), 'spending', 'plan ids are validated before a room is touched', 'check the id against a short pattern before getByName');
  check(/byAccount/.test(index) && /app\.post\('\/plans\/:planId\/commands', byAccount/.test(index), 'spending', 'writes to a plan room are rate-limited per account', 'put the WRITE_LIMIT middleware on every POST under /plans');
}
const serve = read('packages/agent/src/serve.ts');
if (serve) check(/Math\.min\(delay \* 2, 30_000\)/.test(serve) && /\/ws`/.test(serve), 'spending', 'the agent listens on the room socket and backs off when idle', 'no fixed fast polling: each poll is a billed request that wakes the room');

// ---- spending: observability
for (const [name, cfg] of [['api', api], ['web', web]] as const) {
  const rate = cfg?.observability?.traces?.head_sampling_rate;
  if (rate !== undefined) check(rate <= 0.2, 'spending', `${name}: traces sampled at ${rate}`, 'keep traces at 0.2 or below; logs at 1 are fine at this size');
}

console.log(`\nNot checkable from code, do once per account: Billing → Notifications → a usage-based billing alert, and look at Billing → Billable usage after the first week. On the Free plan an exceeded limit fails the request instead of billing.`);
console.log(failed ? `\n${failed} check(s) failed. Fix them before deploying.` : '\nSecurity and spending checks pass.');
process.exit(failed ? 1 : 0);
