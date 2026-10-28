import { env } from 'cloudflare:workers';
import { getCookie } from '@tanstack/react-start/server';

// The only way the web Worker reaches data: the API over its service binding. No database import exists in this app, and the lint keeps it that way.
// The browser's session lives in a cookie on the web origin; every call forwards it to the API as a bearer token.
type Api = { fetch(input: string, init?: RequestInit): Promise<Response> };
const api = () => (env as unknown as { API: Api }).API;
export const SESSION_COOKIE = 'gh_session';

function headers(json = false): Record<string, string> {
  const h: Record<string, string> = json ? { 'content-type': 'application/json' } : {};
  const token = getCookie(SESSION_COOKIE);
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await api().fetch(`https://api${path}`, { headers: headers() });
  if (!r.ok) throw new Error(`api ${path} → ${r.status}`);
  return r.json() as Promise<T>;
}
// Like apiGet, but a 401 or 403 is an answer, not an error: the page says who may see it.
export async function apiGetOrStatus<T>(path: string): Promise<{ status: number; data?: T; rejected?: string }> {
  const r = await api().fetch(`https://api${path}`, { headers: headers() });
  const body = (await r.json().catch(() => ({}))) as T & { rejected?: string };
  return r.ok ? { status: r.status, data: body } : { status: r.status, rejected: body.rejected ?? `failed (${r.status})` };
}
export async function apiPost<T extends Record<string, unknown>>(path: string, body: unknown) {
  const r = await api().fetch(`https://api${path}`, { method: 'POST', headers: headers(true), body: JSON.stringify(body) });
  const data = (await r.json().catch(() => ({}))) as T;
  return { status: r.status, ...data };
}
