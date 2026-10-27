import { env } from 'cloudflare:workers';

// The only way the web Worker reaches data: the API over its service binding. No database import exists in this app, and the lint keeps it that way.
type Api = { fetch(input: string, init?: RequestInit): Promise<Response> };
const api = () => (env as unknown as { API: Api }).API;

export async function apiGet<T>(path: string): Promise<T> {
  const r = await api().fetch(`https://api${path}`);
  if (!r.ok) throw new Error(`api ${path} → ${r.status}`);
  return r.json() as Promise<T>;
}
export async function apiCommand(planId: string, type: string, by: string, data: Record<string, unknown>) {
  const r = await api().fetch(`https://api/plans/${planId}/commands`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, by, data }) });
  const body = (await r.json()) as Record<string, unknown>;
  return { status: r.status, ...body };
}
