import { useState } from 'react';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { apiGetOrStatus, apiPost } from '#/lib/api';
import { AdminNav, AdminRefusal } from '#/components/AdminGate';

// Every account, from the accounts projection: who they are, whether they are an admin, how many devices are signed in.
type Row = { accountId: string; email: string; name: string; admin: boolean; openedAt: string; liveSignIns: number };
type NewAccount = { email: string; name: string; password: string; admin: boolean };
const loadAccounts = createServerFn({ method: 'GET' }).handler(() => apiGetOrStatus<{ accounts: Row[] }>('/admin/accounts'));
const openAccount = createServerFn({ method: 'POST' })
  .validator((d: NewAccount) => d)
  .handler(({ data }) => apiPost<{ account?: { accountId: string }; rejected?: string }>('/admin/accounts', data));

export const Route = createFileRoute('/admin/accounts')({ loader: () => loadAccounts(), component: Accounts });

const muted = 'text-[var(--sea-ink-soft)]';
const field = 'w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]';

function Accounts() {
  const r = Route.useLoaderData();
  if (!r.data) return <AdminRefusal status={r.status} title="Accounts" />;
  const rows = r.data.accounts;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
      <AdminNav here="accounts" />
      <p className={`mt-4 text-sm ${muted}`}>Each account is one stream of events (AccountOpened, SignedIn, SignedOut); this table is their projection.</p>
      {rows.length === 0 ? <p className={`mt-6 text-sm ${muted}`}>No accounts yet. <code>just seed</code> adds an admin, Sam and the agent.</p> : (
        <table className="mt-6 w-full text-sm">
          <thead><tr className={`text-left text-xs uppercase tracking-wide ${muted}`}><th className="py-2">Participant</th><th>Email</th><th>Role</th><th className="text-right">Signed in on</th><th className="text-right">Since</th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.accountId} data-account={a.accountId} className="border-t border-[var(--line)]">
                <td className="py-2 font-medium">{a.name} <span className={muted}>· {a.accountId}</span></td>
                <td>{a.email}</td>
                <td>{a.admin ? 'admin' : 'participant'}</td>
                <td className="text-right tabular-nums">{a.liveSignIns} device{a.liveSignIns === 1 ? '' : 's'}</td>
                <td className={`text-right tabular-nums ${muted}`}>{a.openedAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <AddAccount />
    </main>
  );
}

// Opening an account for someone else: the same AccountOpened as sign-up, with a role. `just user-add` does the same from a terminal.
function AddAccount() {
  const router = useRouter();
  const [form, setForm] = useState<NewAccount>({ email: '', name: '', password: '', admin: false });
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'adding' } | { kind: 'done'; text: string } | { kind: 'refused'; text: string }>({ kind: 'idle' });
  const set = (patch: Partial<NewAccount>) => { setForm((f) => ({ ...f, ...patch })); if (state.kind !== 'adding') setState({ kind: 'idle' }); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: 'adding' });
    const r = await openAccount({ data: form });
    if (r.account) {
      setState({ kind: 'done', text: `${form.name} can sign in as ${form.email.trim().toLowerCase()}${form.admin ? ', as an admin' : ''}. Pass the starting password on yourself; it is not shown again.` });
      setForm({ email: '', name: '', password: '', admin: false });
      await router.invalidate();
    } else setState({ kind: 'refused', text: r.rejected ?? `Not added (${r.status}).` });
  };
  return (
    <section aria-labelledby="add-account" className="mt-10 border-t border-[var(--line)] pt-6">
      <h2 id="add-account" className="text-lg font-semibold">Add an account</h2>
      <p className={`mt-1 text-sm ${muted}`}>For someone who should not sign themselves up. From a terminal: <code>just user-add</code>.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Name<input required value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="off" className={`mt-1 ${field}`} /></label>
        <label className="text-sm">Email<input required type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="off" className={`mt-1 ${field}`} /></label>
        <label className="text-sm">Starting password<input required type="password" minLength={12} value={form.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" placeholder="12 characters or more" className={`mt-1 ${field}`} /></label>
        <label className="text-sm">Role
          <select value={form.admin ? 'admin' : 'participant'} onChange={(e) => set({ admin: e.target.value === 'admin' })} className={`mt-1 ${field}`}>
            <option value="participant">Participant: comments and sessions</option>
            <option value="admin">Admin: also accounts, flags and the event log</option>
          </select>
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={state.kind === 'adding'} className="rounded-[10px] bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-[#0b2a2d] transition-transform active:scale-[0.97] disabled:opacity-60">{state.kind === 'adding' ? 'Adding…' : 'Add account'}</button>
          <p role="status" aria-live="polite" className={`text-sm ${state.kind === 'refused' ? 'text-[var(--gh-warn,#b45309)]' : muted}`}>{state.kind === 'done' || state.kind === 'refused' ? state.text : ''}</p>
        </div>
      </form>
    </section>
  );
}
