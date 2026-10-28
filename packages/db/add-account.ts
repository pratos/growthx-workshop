// `just user-add`: one account as SQL, the password read from stdin so it never lands in argv or shell history.
import { accountsSql } from './accounts-sql';
const [email, name, role] = process.argv.slice(2);
if (!email || !name) { console.error('usage: add-account.ts EMAIL NAME [admin|member] < password'); process.exit(2); }
const password = (await Bun.stdin.text()).replace(/\r?\n$/, '');
process.stdout.write(await accountsSql([{ email, name, password, admin: role === 'admin' }], 'add'));
