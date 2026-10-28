import { Schema } from 'effect';
import { Email, Name, ParticipantId, Secret } from '@greenhouse/schema';
import { defineCommand, defineEvent, reject, type Decider } from '../kernel';

// Identity context. One stream per email (`account-<email>`), so two sign-ups racing for one email meet at the
// stream's version and the second is decided again against the first. Hashing happens before decide: the decider
// sees a hash and whether the password matched, never a password.

export const SignUp      = defineCommand('SignUp',      { accountId: ParticipantId, email: Email, name: Name, passwordHash: Secret });
export const OpenAccount = defineCommand('OpenAccount', { accountId: ParticipantId, email: Email, name: Name, admin: Schema.Boolean, passwordHash: Secret }); // seeds and `just user-add`
export const SignIn      = defineCommand('SignIn',      { accountId: ParticipantId, passwordMatched: Schema.Boolean, tokenHash: Secret, expiresAt: Schema.String });
export const SignOut     = defineCommand('SignOut',     { accountId: ParticipantId, tokenHash: Secret });

export const AccountOpened = defineEvent('AccountOpened', { accountId: ParticipantId, email: Email, name: Name, admin: Schema.Boolean, passwordHash: Secret });
export const SignedIn      = defineEvent('SignedIn',      { accountId: ParticipantId, tokenHash: Secret, expiresAt: Schema.String });
export const SignedOut     = defineEvent('SignedOut',     { accountId: ParticipantId, tokenHash: Secret });

export type AccountCommand = ReturnType<typeof SignUp> | ReturnType<typeof OpenAccount> | ReturnType<typeof SignIn> | ReturnType<typeof SignOut>;
export type AccountEvent = ReturnType<typeof AccountOpened> | ReturnType<typeof SignedIn> | ReturnType<typeof SignedOut>;

export type AccountState =
  | { kind: 'none' }
  | { kind: 'open'; accountId: string; passwordHash: string; signIns: ReadonlyArray<string> };

// One message for an unknown email and a wrong password, so sign-in does not tell anyone who has an account.
export const WRONG = 'wrong email or password';

export const account: Decider<AccountState, AccountCommand, AccountEvent> = {
  initial: { kind: 'none' },
  evolve(state, event) {
    switch (event.type) {
      case 'AccountOpened': return { kind: 'open', accountId: event.data.accountId, passwordHash: event.data.passwordHash, signIns: [] };
      case 'SignedIn':      return state.kind === 'open' ? { ...state, signIns: [...state.signIns, event.data.tokenHash] } : state;
      case 'SignedOut':     return state.kind === 'open' ? { ...state, signIns: state.signIns.filter((t) => t !== event.data.tokenHash) } : state;
    }
  },
  decide(state, command) {
    switch (command.type) {
      case 'SignUp':
        if (state.kind === 'open') return reject('an account with this email exists');
        return [AccountOpened({ ...command.data, admin: false })];
      case 'OpenAccount':
        if (state.kind === 'open') return reject('an account with this email exists');
        return [AccountOpened(command.data)];
      case 'SignIn':
        if (state.kind !== 'open' || !command.data.passwordMatched) return reject(WRONG);
        return [SignedIn({ accountId: state.accountId, tokenHash: command.data.tokenHash, expiresAt: command.data.expiresAt })];
      case 'SignOut':
        // Signing out twice is not an error; the second time there is nothing to record.
        if (state.kind !== 'open' || !state.signIns.includes(command.data.tokenHash)) return [];
        return [SignedOut(command.data)];
    }
  },
};

export const accountStream = (email: string) => `account-${email.trim().toLowerCase()}`;
