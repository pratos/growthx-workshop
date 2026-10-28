import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { currentAccount, signOut } from '#/lib/session'


export const Route = createFileRoute('/')({
  loader: async () => {
    const { account } = await currentAccount()
    return {
      account,
    }
  },
  component: Home,
})

const muted = 'text-[var(--sea-ink-soft)]'

function Home() {
  const data = Route.useLoaderData()
  const { account } = data
  const router = useRouter()
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl">Greenhouse</h1>
      <p className={`mt-2 max-w-[60ch] ${muted}`}>A planning room. People and an agent write a plan together; every decision is owned, dated and attached to the block it changed.</p>
      <p className={`mt-6 text-sm ${muted}`} data-testid="session">
        {account ? (
          <>Signed in as <strong className="text-[var(--sea-ink)]">{account.name}</strong> ({account.email}{account.admin ? ', admin' : ''}){' '}
            <button type="button" className="ml-2 underline" onClick={async () => { await signOut(); await router.invalidate() }}>Sign out</button></>
        ) : (
          <>Not signed in. <Link to="/login" className="underline">Sign in</Link> or <Link to="/signup" className="underline">sign up</Link> to open a plan.</>
        )}
      </p>
      <ul className="mt-8 space-y-2 text-sm">
        {account?.admin && <li><Link to="/admin" className="underline">Admin</Link> <span className={muted}>accounts, the event log, flags</span></li>}
      </ul>
    </main>
  )
}
