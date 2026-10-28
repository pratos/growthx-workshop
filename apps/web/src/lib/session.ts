import { createServerFn } from '@tanstack/react-start';
import { deleteCookie, getCookie, getRequest, setCookie } from '@tanstack/react-start/server';
import { apiGetOrStatus, apiPost, SESSION_COOKIE } from '#/lib/api';

// Sign-in for the web Worker: the API checks the password and hands back a token; this Worker keeps it in an
// HttpOnly cookie on its own origin and forwards it on every API call.
export type Account = { accountId: string; email: string; name: string; admin: boolean };

export const currentAccount = createServerFn({ method: 'GET' }).handler(async () => {
  if (!getCookie(SESSION_COOKIE)) return { account: null };
  const r = await apiGetOrStatus<{ account: Account }>('/auth/me');
  return { account: r.data?.account ?? null };
});

// Sign-up creates the account, then signs in with the same credentials so the person lands signed in.
export const signUp = createServerFn({ method: 'POST' })
  .validator((d: { email: string; name: string; password: string; participantId?: string }) => d)
  .handler(async ({ data }) => {
    const r = await apiPost<{ account?: Account; rejected?: string }>('/auth/sign-up', data);
    if (r.status !== 201) return { error: r.rejected ?? `sign-up failed (${r.status})` };
    return startSignIn(data.email, data.password);
  });

export const signIn = createServerFn({ method: 'POST' })
  .validator((d: { email: string; password: string }) => d)
  .handler(({ data }) => startSignIn(data.email, data.password));

async function startSignIn(email: string, password: string) {
  const r = await apiPost<{ account?: Account; token?: string; rejected?: string }>('/auth/sign-in', { email, password });
  if (r.status !== 200 || !r.token) return { error: r.rejected ?? `sign-in failed (${r.status})` };
  setCookie(SESSION_COOKIE, r.token, { httpOnly: true, sameSite: 'lax', secure: new URL(getRequest().url).protocol === 'https:', path: '/', maxAge: 30 * 86_400 });
  return { account: r.account };
}

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  if (getCookie(SESSION_COOKIE)) await apiPost('/auth/sign-out', {});
  deleteCookie(SESSION_COOKIE, { path: '/' });
  return { ok: true };
});
