import { createFileRoute } from '@tanstack/react-router';

// The browser never talks to the api directly. The socket is proxied over the service binding, upgrade and all.
export const Route = createFileRoute('/plans/$planId/ws')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { env } = await import('cloudflare:workers');
        const api = (env as unknown as { API: { fetch(r: Request): Promise<Response> } }).API;
        return api.fetch(new Request(`https://api/plans/${params.planId}/ws`, request));
      },
    },
  },
});
