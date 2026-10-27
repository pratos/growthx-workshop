import { createFileRoute } from '@tanstack/react-router';

// Public login page. Username and password first (cp-05 wires Better Auth), Google after.
export const Route = createFileRoute('/login')({ component: Login });

function Login() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in to Greenhouse</h1>
      <p className="mt-2 text-sm text-gray-500">A planning room for people and an agent.</p>
      <form className="mt-8 flex flex-col gap-3" method="post" action="/api/auth/sign-in/email">
        <label className="text-sm">Email<input name="email" type="email" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
        <label className="text-sm">Password<input name="password" type="password" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
        <button type="submit" className="mt-2 rounded bg-black px-3 py-2 text-white">Sign in</button>
      </form>
    </main>
  );
}
