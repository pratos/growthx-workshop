import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { apiGetOrStatus } from '#/lib/api';
import { AdminNav, AdminRefusal } from '#/components/AdminGate';

// The event log as recorded, newest first, one stream or all. Secrets arrive masked from the API.
type Event = { stream: string; version: number; type: string; by: string; at: string; data: Record<string, unknown> };
const loadEvents = createServerFn({ method: 'GET' })
  .validator((stream: string) => stream)
  .handler(({ data: stream }) => apiGetOrStatus<{ events: Event[] }>(`/admin/events${stream ? `?stream=${encodeURIComponent(stream)}` : ''}`));

export const Route = createFileRoute('/admin/events')({
  validateSearch: (s: Record<string, unknown>) => ({ stream: typeof s.stream === 'string' ? s.stream : '' }),
  loaderDeps: ({ search }) => ({ stream: search.stream }),
  loader: ({ deps }) => loadEvents({ data: deps.stream }),
  component: Events,
});

const show = (v: unknown) => (typeof v === 'string' ? `"${v}"` : JSON.stringify(v));

function Events() {
  const r = Route.useLoaderData();
  const { stream } = Route.useSearch();
  const navigate = useNavigate();
  if (!r.data) return <AdminRefusal status={r.status} title="Event log" />;
  const events = r.data.events;
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Event log</h1>
      <AdminNav here="events" />
      <p className="mt-4 text-sm text-gray-500">Facts, never edited, newest first. Each stream is one account or one session; a version is its place in that stream. Click a stream to see only it.</p>
      {stream && <p className="mt-3 text-sm">Stream <code>{stream}</code> · <button type="button" className="underline" onClick={() => void navigate({ to: '/admin/events', search: { stream: '' } })}>show all</button></p>}
      {events.length === 0 ? <p className="mt-6 text-sm text-gray-500">Nothing recorded yet.</p> : (
        <ol className="mt-6 space-y-2 font-mono text-[13px]">
          {events.map((e) => (
            <li key={`${e.stream}:${e.version}`} data-event={e.type} className="rounded border border-gray-200 px-3 py-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-semibold">{e.type}</span>
                <button type="button" className="text-gray-500 underline-offset-2 hover:underline" onClick={() => void navigate({ to: '/admin/events', search: { stream: e.stream } })}>{e.stream} · v{e.version}</button>
                <span className="text-gray-500">by {e.by} · {e.at.slice(0, 19).replace('T', ' ')} UTC</span>
              </div>
              <p className="mt-1 break-words text-gray-600">{Object.entries(e.data).map(([k, v]) => `${k}=${show(v)}`).join('  ')}</p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
