import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { currentUser, signOut } from '#/lib/session'

export const Route = createFileRoute('/')({ loader: () => currentUser(), component: Home })

function Home() {
  const { user } = Route.useLoaderData()
  const router = useRouter()
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Greenhouse</h1>
      <p className="mt-2 text-gray-600">A planning room. People and an agent write a plan together; every decision is owned, dated and attached to the block it changed.</p>
      <p className="mt-6 text-sm" data-testid="session">
        {user ? (
          <>Signed in as <strong>{user.name}</strong> ({user.email}, {user.role}) ·{' '}
            <button type="button" className="underline" onClick={async () => { await signOut(); await router.invalidate() }}>Sign out</button></>
        ) : (
          <>Not signed in · <Link to="/login" className="underline">Sign in</Link></>
        )}
      </p>
      <ul className="mt-8 space-y-2">
        <li><Link to="/plans/$planId" params={{ planId: 'gh-12' }} className="underline">Plan GH-12</Link> · resolve a comment thread into a decision</li>
        {user?.role === 'admin' && <li><Link to="/admin/flags" className="underline">Flags</Link> · admin</li>}
      </ul>
    </main>
  )
}
