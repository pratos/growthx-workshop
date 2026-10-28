import { test } from 'bun:test';
import { expectDecider } from '../kernel';
import { account, AccountOpened, RenameAccount } from './decider';

// Naming the agent: the name people see changes; its participant id, which @mentions use, does not.
const expect = expectDecider(account, import.meta.dir);
const opened = AccountOpened({ accountId: 'agent', email: 'agent@greenhouse.test', name: 'Agent', admin: false, passwordHash: 'h' });

test('an admin names the agent', () => {
  expect.given(opened).when(RenameAccount({ accountId: 'agent', name: 'Ada' })).snapshot('rename');
});
test('the same name again changes nothing', () => {
  expect.given(opened).when(RenameAccount({ accountId: 'agent', name: 'Agent' })).snapshot('rename-same');
});
test('no account, no rename', () => {
  expect.given().when(RenameAccount({ accountId: 'ghost', name: 'Ghost' })).snapshot('rename-none');
});
