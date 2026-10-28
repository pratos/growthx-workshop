import { createServerFn } from '@tanstack/react-start';
import { deleteCookie, getCookie, getRequest, setCookie } from '@tanstack/react-start/server';
import { apiGetOrStatus, apiPost, SESSION_COOKIE } from '#/lib/api';

// Sign-in for the web Worker: the API checks the password and hands back a token; this Worker keeps it in an
// HttpOnly cookie on its own origin and forwards it on every API call.
export type User = { id: string; email: string; name: string; role: 'admin' | 'member' };

export const currentUser = createServerFn({ method: 'GET' }).handler(async () => {
  if (!getCookie(SESSION_COOKIE)) return { user: null };
  const r = await apiGetOrStatus<{ user: User }>('/auth/me');
  return { user: r.data?.user ?? null };
});

export const signIn = createServerFn({ method: 'POST' })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const r = await apiPost<{ user?: User; token?: string; rejected?: string }>('/auth/sign-in', data);
    if (r.status !== 200 || !r.token) return { error: r.rejected ?? `sign-in failed (${r.status})` };
    setCookie(SESSION_COOKIE, r.token, { httpOnly: true, sameSite: 'lax', secure: new URL(getRequest().url).protocol === 'https:', path: '/', maxAge: 30 * 86_400 });
    return { user: r.user };
  });

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  if (getCookie(SESSION_COOKIE)) await apiPost('/auth/sign-out', {});
  deleteCookie(SESSION_COOKIE, { path: '/' });
  return { ok: true };
});
