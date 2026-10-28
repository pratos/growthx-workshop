import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { apiGetOrStatus } from '#/lib/api';
import { AdminNav, AdminRefusal } from '#/components/AdminGate';

// Every account, from the accounts projection: who they are, whether they are an admin, how many devices are signed in.
type Row = { accountId: string; email: string; name: string; admin: boolean; openedAt: string; liveSignIns: number };
const loadAccounts = createServerFn({ method: 'GET' }).handler(() => apiGetOrStatus<{ accounts: Row[] }>('/admin/accounts'));

export const Route = createFileRoute('/admin/accounts')({ loader: () => loadAccounts(), component: Accounts });

function Accounts() {
  const r = Route.useLoaderData();
  if (!r.data) return <AdminRefusal status={r.status} title="Accounts" />;
  const rows = r.data.accounts;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
      <AdminNav here="accounts" />
      <p className="mt-4 text-sm text-gray-500">Each account is one stream of events (AccountOpened, SignedIn, SignedOut); this table is their projection. Add one with <code>just user-add</code>.</p>
      {rows.length === 0 ? <p className="mt-6 text-sm text-gray-500">No accounts yet. <code>just seed</code> adds an admin, Sam and the agent.</p> : (
        <table className="mt-6 w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-gray-500"><th className="py-2">Participant</th><th>Email</th><th>Role</th><th className="text-right">Signed in on</th><th className="text-right">Since</th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.accountId} data-account={a.accountId} className="border-t border-gray-200">
                <td className="py-2 font-medium">{a.name} <span className="text-gray-500">· {a.accountId}</span></td>
                <td>{a.email}</td>
                <td>{a.admin ? 'admin' : 'participant'}</td>
                <td className="text-right tabular-nums">{a.liveSignIns} device{a.liveSignIns === 1 ? '' : 's'}</td>
                <td className="text-right tabular-nums text-gray-500">{a.openedAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
