import { env } from 'cloudflare:workers';

// The only way the web Worker reaches data: the API over its service binding. No database import exists in this app, and the lint keeps it that way.
// The browser's session lives in a cookie on the web origin; every call forwards it to the API as a bearer token.
type Api = { fetch(input: string, init?: RequestInit): Promise<Response> };
const api = () => (env as unknown as { API: Api }).API;
export const SESSION_COOKIE = 'gh_session';

function headers(json = false): Record<string, string> {
  const h: Record<string, string> = json ? { 'content-type': 'application/json' } : {};
  return h;
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await api().fetch(`https://api${path}`, { headers: headers() });
  if (!r.ok) throw new Error(`api ${path} → ${r.status}`);
  return r.json() as Promise<T>;
}
