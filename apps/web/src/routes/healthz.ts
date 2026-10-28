import { createFileRoute } from '@tanstack/react-router';
import { apiGet } from '#/lib/api';

// Web health: this Worker is up and it can reach the API over the binding.
export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: async () => {
        const api = await apiGet<{ version: { label: string; id: string } }>('/healthz').catch((e: Error) => ({ error: e.message }));
        const { env } = await import('cloudflare:workers');
        const web = { label: (env as { GIT_DESCRIBE?: string }).GIT_DESCRIBE ?? 'dev', id: (env as { VERSION?: { id: string } }).VERSION?.id ?? 'dev' };
        return Response.json({ ok: !('error' in api), web, api });
      },
    },
  },
});
