import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { apiGetOrStatus } from '#/lib/api';
import { AdminNav, AdminRefusal } from '#/components/AdminGate';

// The admin dashboard: how many accounts, who is signed in, which flags are doing anything, how big the log is.
type Summary = { accounts: number; admins: number; signIns: number; flags: number; flagsOn: number; events: number; streams: number };
const loadSummary = createServerFn({ method: 'GET' }).handler(() => apiGetOrStatus<Summary>('/admin/summary'));

export const Route = createFileRoute('/admin/')({ loader: () => loadSummary(), component: Dashboard });

function Dashboard() {
  const r = Route.useLoaderData();
  if (!r.data) return <AdminRefusal status={r.status} title="Admin" />;
  const s = r.data;
  const tiles = [
    { label: 'Accounts', value: s.accounts, note: `${s.admins} admin${s.admins === 1 ? '' : 's'}`, to: '/admin/accounts' },
    { label: 'Signed in now', value: s.signIns, note: 'live sign-ins, all devices', to: '/admin/accounts' },
    { label: 'Flags', value: s.flags, note: `${s.flagsOn} on for someone`, to: '/admin/flags' },
    { label: 'Events recorded', value: s.events, note: `across ${s.streams} stream${s.streams === 1 ? '' : 's'}`, to: '/admin/events' },
  ] as const;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <AdminNav here="dashboard" />
      <p className="mt-4 text-sm text-gray-500">Everything here is read from the API, which reads the event log and its projections. Nothing on this page writes.</p>
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} data-tile={t.label} className="rounded-lg border border-gray-200 p-4 hover:border-gray-400">
            <p className="text-xs uppercase tracking-wide text-gray-500">{t.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{t.value}</p>
            <p className="mt-1 text-xs text-gray-500">{t.note}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
