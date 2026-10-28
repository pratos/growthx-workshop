import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { apiGet, apiPut } from '#/lib/api';

// The flags admin page: every flag in D1 with its three switches. All data comes over the API binding; nothing here touches storage.
type Flag = { name: string; enabled: boolean; allowlist: ReadonlyArray<string>; percent: number };

const loadFlags = createServerFn({ method: 'GET' }).handler(() => apiGet<{ flags: Flag[] }>('/flags'));

type Patch = { name: string; enabled?: boolean; allowlist?: string[]; percent?: number };
const setFlag = createServerFn({ method: 'POST' })
  .validator((d: Patch) => d)
  .handler(({ data: { name, ...patch } }) => apiPut<{ flag?: Flag; rejected?: string }>(`/flags/${encodeURIComponent(name)}`, patch));

export const Route = createFileRoute('/admin/flags')({
  loader: () => loadFlags(),
  component: FlagsPage,
});

const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter((x) => x.length > 0);

function FlagsPage() {
  const { flags } = Route.useLoaderData();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function run(p: Promise<{ status: number; rejected?: string }>) {
    setError(null);
    const r = await p;
    if (r.status >= 400) setError(r.rejected ?? `failed (${r.status})`);
    await router.invalidate();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Flags</h1>
        <p className="text-sm text-gray-500">{flags.length} flags · default off</p>
      </header>
      <p className="mt-1 text-sm text-gray-500">A flag is on for a participant when it is enabled, or they are on the allowlist, or their bucket is under the percent.</p>
      {error && <p role="alert" className="mt-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}

      <section className="mt-8 space-y-4">
        {flags.length === 0 && <p className="text-sm text-gray-500">No flags yet. Add one below.</p>}
        {flags.map((f) => (
          <article key={f.name} data-flag={f.name} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-mono text-base">{f.name}</h2>
              <button
                type="button"
                onClick={() => void run(setFlag({ data: { name: f.name, enabled: !f.enabled } }))}
                className={f.enabled ? 'rounded bg-emerald-700 px-3 py-1 text-sm text-white' : 'rounded border border-gray-300 px-3 py-1 text-sm'}
              >
                {f.enabled ? 'Enabled for everyone' : 'Off · turn on'}
              </button>
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
              {f.allowlist.length} on the allowlist · {f.percent}% rollout
            </p>
            <form
              className="mt-3 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                void run(setFlag({ data: { name: f.name, allowlist: splitList(String(d.get('allowlist'))), percent: Number(d.get('percent')) } }));
              }}
            >
              <label className="flex flex-1 items-center gap-2 text-sm text-gray-500">
                allowlist
                <input name="allowlist" defaultValue={f.allowlist.join(', ')} placeholder="participant ids, comma separated" className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900" />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-500">
                percent
                <input name="percent" type="number" min={0} max={100} defaultValue={f.percent} className="w-20 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900" />
              </label>
              <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">Save</button>
            </form>
          </article>
        ))}
      </section>

      <form
        className="mt-10 flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          void run(setFlag({ data: { name: String(d.get('name')).trim(), enabled: false } }));
          e.currentTarget.reset();
        }}
      >
        <p className="text-sm font-medium">Add a flag</p>
        <div className="flex gap-2">
          <input name="name" required placeholder="flag-name" className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded border border-gray-300 px-3 py-2 text-sm">Add, off</button>
        </div>
      </form>
    </main>
  );
}
