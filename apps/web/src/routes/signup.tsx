import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { signUp } from '#/lib/session';

// Public sign-up page. The API opens the account (AccountOpened), then this Worker signs the person in.
export const Route = createFileRoute('/signup')({ component: SignUpPage });

const field = (f: FormData, name: string): string => { const v = f.get(name); return typeof v === 'string' ? v : ''; };

function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign up for Greenhouse</h1>
      <p className="mt-2 text-sm text-gray-500">A planning room for people and an agent.</p>
      <form
        method="post"
        className="mt-8 flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          setBusy(true); setError(null);
          const r = await signUp({ data: { email: field(d, 'email'), name: field(d, 'name'), password: field(d, 'password') } });
          setBusy(false);
          if ('error' in r && r.error) return setError(r.error);
          await router.navigate({ to: '/' });
        }}
      >
        <label className="text-sm">Name<input name="name" autoComplete="name" required maxLength={80} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
        <label className="text-sm">Email<input name="email" type="email" autoComplete="username" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
        <label className="text-sm">Password<input name="password" type="password" autoComplete="new-password" required minLength={12} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="mt-2 rounded bg-black px-3 py-2 text-white disabled:opacity-60">{busy ? 'Creating your account…' : 'Sign up'}</button>
      </form>
      <p className="mt-6 text-sm text-gray-500">Already have an account? <Link to="/login" className="underline">Sign in</Link></p>
    </main>
  );
}
