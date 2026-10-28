import { test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { Layer } from 'effect';
import { EventStore } from '@greenhouse/engine';
import { bunSqlite } from '@greenhouse/engine/adapters/bun-sqlite';
import { story } from '@greenhouse/engine/story';
import { Accounts } from './accounts';
import { accountsView } from './view';

// Sign-up and sign-in as stories through the real engine: events appended, projections written in the same
// transaction, read back with SQL. Hashes and tokens print as •••; the clock and the tokens are fixed.
const world = () => {
  let n = 0;
  const clock = { now: () => new Date('2026-10-28T19:30:00Z'), newId: () => `id${++n}`, token: () => `token-${++n}` };
  const layer = Accounts.layer(clock).pipe(Layer.provideMerge(EventStore.layer([accountsView]).pipe(Layer.provideMerge(bunSqlite(new Database(':memory:'))))));
  const s = story(layer, import.meta.dir);
  return { s, setup: () => s.run(EventStore.use((st) => st.setup())) };
};
const accounts = 'SELECT account_id, email, name, admin FROM accounts ORDER BY account_id';
const signIns = 'SELECT account_id, expires_at FROM sign_ins ORDER BY account_id, signed_in_at';

test('sign up', async () => {
  const { s, setup } = world(); await setup();
  await s.step('Sam signs up as sam@greenhouse.test', Accounts.use((a) => a.signUp({ email: 'sam@greenhouse.test', name: 'Sam', password: 'correct horse battery' })));
  await s.step('someone signs up again with SAM@greenhouse.test', Accounts.use((a) => a.signUp({ email: 'SAM@greenhouse.test', name: 'Imposter', password: 'another long password' })));
  await s.step('Ana signs up with a short password', Accounts.use((a) => a.signUp({ email: 'ana@greenhouse.test', name: 'Ana', password: 'short' })));
  await s.step('sam@elsewhere.test signs up, wanting the id sam', Accounts.use((a) => a.signUp({ email: 'sam@elsewhere.test', name: 'Other Sam', password: 'a long enough password' })));
  await s.step('an admin is opened by `just user-add`', Accounts.use((a) => a.open({ email: 'admin@greenhouse.test', name: 'Admin', password: 'greenhouse-admin-local', admin: true })));
  await s.read('accounts', accounts);
  s.snapshot('sign-up');
});

test('sign in and out', async () => {
  const { s, setup } = world(); await setup();
  await s.step('Sam has an account', Accounts.use((a) => a.signUp({ email: 'sam@greenhouse.test', name: 'Sam', password: 'correct horse battery' })));
  await s.step('Sam signs in with the wrong password', Accounts.use((a) => a.signIn({ email: 'sam@greenhouse.test', password: 'correct horse' })));
  await s.step('nobody@greenhouse.test signs in', Accounts.use((a) => a.signIn({ email: 'nobody@greenhouse.test', password: 'correct horse battery' })));
  const first = await s.step('Sam signs in', Accounts.use((a) => a.signIn({ email: 'Sam@Greenhouse.test ', password: 'correct horse battery' })));
  await s.step('Sam signs in on a second device', Accounts.use((a) => a.signIn({ email: 'sam@greenhouse.test', password: 'correct horse battery' })));
  await s.read('sign_ins', signIns);
  const who = await s.run(Accounts.use((a) => a.accountFor(first!.token)));
  s.note(`the first token belongs to ${who?.accountId}`);
  await s.step('Sam signs out on the first device', Accounts.use((a) => a.signOut(first!.token)));
  await s.step('Sam signs out on the first device again', Accounts.use((a) => a.signOut(first!.token)));
  const after = await s.run(Accounts.use((a) => a.accountFor(first!.token)));
  s.note(`the first token now belongs to ${after?.accountId ?? 'nobody'}`);
  await s.read('sign_ins', signIns);
  s.snapshot('sign-in');
});
