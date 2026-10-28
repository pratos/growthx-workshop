// Local seed, printed as SQL for `wrangler d1 execute --local`. Never run against prod.
// Three accounts opened through the engine (an admin, a person, the agent) with the local-only logins in
// .dev.vars.example, and the flags, default off.
import { readFileSync } from 'node:fs';
import { accountsSql } from './accounts-sql';

const vars = Object.fromEntries(readFileSync(new URL('../../.dev.vars.example', import.meta.url), 'utf8')
  .split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const need = (k: string) => vars[k] ?? (() => { throw new Error(`.dev.vars.example has no ${k}`); })();

process.stdout.write(await accountsSql([
  { email: need('ADMIN_EMAIL'), name: 'Admin', password: need('ADMIN_PASSWORD'), admin: true },
  { email: need('USER_EMAIL'), name: 'Sam', password: need('USER_PASSWORD'), admin: false },
  { email: need('AGENT_EMAIL'), name: 'Agent', password: need('AGENT_PASSWORD'), admin: false },
], 'seed'));
