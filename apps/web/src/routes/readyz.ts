import { createFileRoute } from '@tanstack/react-router';
import { apiGet } from '#/lib/api';

// Web readiness: this Worker is up and the api is ready, through the binding.
export const Route = createFileRoute('/readyz')({
  server: {
    handlers: {
      GET: async () => {
        const api = await apiGet<{ ok: boolean }>('/readyz').catch((e: Error) => ({ ok: false, error: e.message }));
        return Response.json({ ok: api.ok === true, web: 'ok', api }, api.ok === true ? 200 : 503);
      },
    },
  },
});
