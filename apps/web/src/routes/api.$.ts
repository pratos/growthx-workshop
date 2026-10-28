import { createFileRoute } from '@tanstack/react-router';
import { env } from 'cloudflare:workers';

// /api/* on the web origin is the API, reached over the service binding: one origin for the browser, curl and the agent.
// A browser's session cookie becomes the bearer token the API expects; an Authorization header passes through as is.
type Api = { fetch(input: Request): Promise<Response> };

async function forward({ request }: { request: Request }) {
  const url = new URL(request.url);
  const target = `https://api${url.pathname.replace(/^\/api/, '') || '/'}${url.search}`;
  const headers = new Headers(request.headers);
  const cookie = /(?:^|;\s*)gh_session=([^;]+)/.exec(headers.get('cookie') ?? '')?.[1];
  if (!headers.has('authorization') && cookie) headers.set('authorization', `Bearer ${cookie}`);
  headers.delete('cookie');
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();
  return (env as unknown as { API: Api }).API.fetch(new Request(target, { method: request.method, headers, body }));
}

export const Route = createFileRoute('/api/$')({
  server: { handlers: { GET: forward, POST: forward, PUT: forward, PATCH: forward, DELETE: forward } },
});
