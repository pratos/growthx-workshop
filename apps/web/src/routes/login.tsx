import { createFileRoute, Link } from '@tanstack/react-router';
import { nextPath } from '#/lib/next';
import { useState } from 'react';
import { signIn } from '#/lib/session';

// Public login page. Email and password, checked by the API; the session cookie lives on this origin.
export const Route = createFileRoute('/login')({ component: Login });

const field = (f: FormData, name: string): string => { const v = f.get(name); return typeof v === 'string' ? v : ''; };

function Login() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in to Greenhouse</h1>
      <p className="mt-2 text-sm text-gray-500">A planning room for people and an agent.</p>
      <form
        method="post"
        className="mt-8 flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          setBusy(true); setError(null);
          const r = await signIn({ data: { email: field(d, 'email'), password: field(d, 'password') } });
          setBusy(false);
          if ('error' in r && r.error) return setError(r.error);
          window.location.assign(nextPath()); // back to the shared link, if one brought you here
        }}
      >
        <label className="text-sm">Email<input name="email" type="email" autoComplete="username" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
        <label className="text-sm">Password<input name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="mt-2 rounded bg-black px-3 py-2 text-white disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-6 text-sm text-gray-500">No account yet? <Link to="/signup" className="underline" onClick={(e) => { if (window.location.search) { e.preventDefault(); window.location.assign(`/signup${window.location.search}`); } }}>Sign up</Link></p>
    </main>
  );
}
