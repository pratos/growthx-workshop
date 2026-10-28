import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { currentAccount, signOut } from '#/lib/session'

export const Route = createFileRoute('/')({ loader: () => currentAccount(), component: Home })

function Home() {
  const { account } = Route.useLoaderData()
  const router = useRouter()
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Greenhouse</h1>
      <p className="mt-2 text-gray-600">A planning room. People and an agent write a plan together; every decision is owned, dated and attached to the block it changed.</p>
      <p className="mt-6 text-sm" data-testid="session">
        {account ? (
          <>Signed in as <strong>{account.name}</strong> ({account.email}{account.admin ? ', admin' : ''}) ·{' '}
            <button type="button" className="underline" onClick={async () => { await signOut(); await router.invalidate() }}>Sign out</button></>
        ) : (
          <>Not signed in · <Link to="/login" className="underline">Sign in</Link> or <Link to="/signup" className="underline">sign up</Link></>
        )}
      </p>
      <ul className="mt-8 space-y-2">
        {/* <cp-04> */}
        {account?.admin && <li><Link to="/admin" className="underline">Admin</Link> · accounts, the event log, flags</li>}
        {/* </cp-04> */}
      </ul>
    </main>
  )
}
