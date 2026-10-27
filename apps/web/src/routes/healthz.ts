import { createFileRoute } from '@tanstack/react-router';
import { apiGet } from '#/lib/api';

// Web health: this Worker is up and it can reach the API over the binding.
export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: async () => {
        const api = await apiGet<{ version: string }>('/healthz').catch((e: Error) => ({ error: e.message }));
        return Response.json({ ok: !('error' in api), web: 'ok', api });
      },
    },
  },
});
