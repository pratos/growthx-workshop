// Prints a password hash for the users table. The password comes on stdin, so it never lands in shell history or argv.
import { hashPassword } from '../../apps/api/src/password';
const password = (await Bun.stdin.text()).replace(/\r?\n$/, '');
if (!password) { console.error('no password on stdin'); process.exit(2); }
console.log(await hashPassword(password));
