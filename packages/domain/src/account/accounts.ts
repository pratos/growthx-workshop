import { Context, Effect, Layer, Schema } from 'effect';
import { EventStore, Sql, replay, type Ctx } from '@greenhouse/engine';
import type { Account } from '@greenhouse/schema';
import { account, accountStream, OpenAccount, SignIn, SignOut, SignUp, WRONG } from './decider';
import { DECOY, hashPassword, newToken, tokenHash, verifyPassword } from './password';

// The Identity use cases on the engine: decode at the boundary, hash outside the decider, execute against the
// account's stream, read the projection for "who is this token".

const Credentials = Schema.Struct({
  email: Schema.String.check(Schema.isMinLength(3), Schema.isMaxLength(254)),
  password: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(200)),
});
const Registration = Schema.Struct({
  email: Schema.String.check(Schema.isMinLength(3), Schema.isMaxLength(254), Schema.isPattern(/^[^@\s]+@[^@\s]+$/)),
  name: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(80)),
  password: Schema.String.check(Schema.isMinLength(12), Schema.isMaxLength(200)),
  // The name people see and @mention, chosen at sign-up; without one it is the email's local part.
  participantId: Schema.optional(Schema.String.check(Schema.isPattern(/^[a-z0-9][a-z0-9-]{1,31}$/))),
});

export class SignInFailed extends Schema.TaggedError<SignInFailed>()('SignInFailed', { message: Schema.String }) {}
export class SignUpRefused extends Schema.TaggedError<SignUpRefused>()('SignUpRefused', { message: Schema.String }) {}

const SIGN_IN_DAYS = 30;
type Clock = Pick<Ctx, 'now' | 'newId'> & { token(): string };
const systemClock: Clock = { now: () => new Date(), newId: () => crypto.randomUUID().slice(0, 8), token: newToken };
const ctxOf = (c: Clock): Ctx => ({ now: c.now, newId: c.newId, flag: () => false });

// The participant id an account's commands carry: the part of the email before @.
const accountIdFor = (email: string) => email.split('@')[0]!.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 64);

type Row = { account_id: string; email: string; name: string; admin: number };
const fromRow = (r: Row): Account => ({ accountId: r.account_id, email: r.email, name: r.name, admin: Number(r.admin) === 1 });

export class Accounts extends Context.Service<Accounts, {
  signUp(body: unknown): Effect.Effect<Account, SignUpRefused>;
  open(input: { email: string; name: string; password: string; admin: boolean }): Effect.Effect<Account, SignUpRefused>;
  signIn(body: unknown): Effect.Effect<{ token: string; account: Account }, SignInFailed>;
  accountFor(token: string): Effect.Effect<Account | undefined>;
  signOut(token: string): Effect.Effect<void>;
}>()('greenhouse/domain/Accounts') {
  static readonly layer = (clock: Clock = systemClock) => Layer.effect(Accounts, Effect.gen(function* () {
    const store = yield* EventStore;
    const sql = yield* Sql;
    const ctx = ctxOf(clock);

    const register = Effect.fn('Accounts.register')(function* (input: { email: string; name: string; password: string; admin: boolean | 'sign-up'; participantId?: string | undefined }) {
      const email = input.email.trim().toLowerCase();
      const accountId = input.participantId ?? accountIdFor(email);
      const taken = yield* sql.query<{ n: number }>('SELECT count(*) AS n FROM accounts WHERE account_id = ? AND email <> ?', [accountId, email]);
      if (Number(taken[0]?.n ?? 0) > 0) return yield* new SignUpRefused({ message: `the name ${accountId} is taken; use another email` });
      const passwordHash = yield* Effect.promise(() => hashPassword(input.password));
      const command = input.admin === 'sign-up'
        ? SignUp({ accountId, email, name: input.name, passwordHash })
        : OpenAccount({ accountId, email, name: input.name, admin: input.admin, passwordHash });
      const result = yield* store.execute(account, accountStream(email), command, ctx, accountId).pipe(Effect.orDie);
      if ('rejected' in result) return yield* new SignUpRefused({ message: result.rejected });
      return { accountId, email, name: input.name, admin: input.admin === true };
    });

    const signUp = Effect.fn('Accounts.signUp')(function* (body: unknown) {
      const r = yield* Schema.decodeUnknownEffect(Registration)(body).pipe(
        Effect.mapError(() => new SignUpRefused({ message: 'an email, a name, a password of at least 12 characters, and a username of 2 to 32 lowercase letters, digits or dashes' })));
      return yield* register({ ...r, admin: 'sign-up' });
    });

    const open = (input: { email: string; name: string; password: string; admin: boolean }) => register(input);

    const signIn = Effect.fn('Accounts.signIn')(function* (body: unknown) {
      const failed = new SignInFailed({ message: WRONG });
      const { email, password } = yield* Schema.decodeUnknownEffect(Credentials)(body).pipe(Effect.mapError(() => failed));
      const stream = accountStream(email);
      const state = replay(account, (yield* store.read(stream)) as never);
      // Unknown emails still pay for one hash, so a miss takes as long as a wrong password.
      const matched = yield* Effect.promise(() => verifyPassword(password, state.kind === 'open' ? state.passwordHash : DECOY));
      const token = clock.token();
      const expiresAt = new Date(clock.now().getTime() + SIGN_IN_DAYS * 86_400_000).toISOString();
      const accountId = state.kind === 'open' ? state.accountId : 'nobody';
      const command = SignIn({ accountId, passwordMatched: matched, tokenHash: yield* Effect.promise(() => tokenHash(token)), expiresAt });
      const result = yield* store.execute(account, stream, command, ctx, accountId).pipe(Effect.orDie);
      if ('rejected' in result) return yield* failed;
      const rows = yield* sql.query<Row>('SELECT account_id, email, name, admin FROM accounts WHERE account_id = ?', [accountId]);
      return { token, account: fromRow(rows[0]!) };
    });

    const accountFor = Effect.fn('Accounts.accountFor')(function* (token: string) {
      const hash = yield* Effect.promise(() => tokenHash(token));
      const rows = yield* sql.query<Row>(
        'SELECT a.account_id, a.email, a.name, a.admin FROM sign_ins s JOIN accounts a ON a.account_id = s.account_id WHERE s.token_hash = ? AND s.expires_at > ?',
        [hash, clock.now().toISOString()]);
      return rows[0] ? fromRow(rows[0]) : undefined;
    });

    const signOut = Effect.fn('Accounts.signOut')(function* (token: string) {
      const hash = yield* Effect.promise(() => tokenHash(token));
      const rows = yield* sql.query<{ account_id: string; email: string }>('SELECT s.account_id, a.email FROM sign_ins s JOIN accounts a ON a.account_id = s.account_id WHERE s.token_hash = ?', [hash]);
      const row = rows[0];
      if (!row) return;
      yield* store.execute(account, accountStream(row.email), SignOut({ accountId: row.account_id, tokenHash: hash }), ctx, row.account_id).pipe(Effect.orDie);
    });

    return Accounts.of({ signUp, open, signIn, accountFor, signOut });
  }));
}
