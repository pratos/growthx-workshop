import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { slugify } from '@greenhouse/schema/slug'
import { createServerFn } from '@tanstack/react-start'
import { PLAN_ID } from '#/lib/recent-plans'
import { apiGetOrStatus } from '#/lib/api'
import { currentAccount, signOut } from '#/lib/session'

// Every plan room the orchestrator knows (the API's plans table), newest activity first, with who is in each now.
type PlanEntry = { planId: string; openedBy: string; openedAt: string; lastActiveAt: string; here: string[] }
const loadPlans = createServerFn({ method: 'GET' }).handler(() => apiGetOrStatus<{ plans: PlanEntry[] }>('/plans'))

export const Route = createFileRoute('/')({
  loader: async () => {
    const { account } = await currentAccount()
    const plans = account ? (await loadPlans()).data?.plans ?? [] : []
    return {
      account,
      plans,
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
      {account && <Plans plans={data.plans} />}
      <ul className="mt-8 space-y-2 text-sm">
        {account?.admin && <li><Link to="/admin" className="underline">Admin</Link> <span className={muted}>accounts, the event log, flags</span></li>}
      </ul>
    </main>
  )
}

// Open a plan by name (a new name starts a new plan), or go back to one opened on this device. You type freely; the id
// is the name as a slug ("Retry policy, v2" opens retry-policy-v2), at most 40 characters like every plan id.
function Plans({ plans }: { plans: PlanEntry[] }) {
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const slug = slugify(id, 40)
  const valid = PLAN_ID.test(slug)
  return (
    <section aria-labelledby="plans-heading" className="mt-10">
      <h2 id="plans-heading" className="text-lg font-semibold">Plans</h2>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (valid) void navigate({ to: '/plans/$planId', params: { planId: slug } }) }}>
        <label htmlFor="plan-id" className="sr-only">Plan name</label>
        <input id="plan-id" value={id} onChange={(e) => setId(e.target.value)} placeholder="Open or start a plan: Retry policy, gh-12…" aria-describedby="plan-id-help"
          className="h-9 min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--surface-strong)] px-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)]" />
        <button type="submit" disabled={!valid} className="h-9 rounded-lg bg-[var(--lagoon)] px-4 text-sm font-medium text-white disabled:opacity-50">Open</button>
      </form>
      <p id="plan-id-help" className={`mt-1.5 text-xs ${muted}`}>{!id.trim() ? 'A new name starts a new plan. Anyone signed in opens it by the same name.' : valid ? <>Opens as <code>{slug}</code>{slug === id ? '' : ', the id anyone can use'}</> : 'Use at least one letter or digit.'}</p>
      {plans.length === 0 ? <p className={`mt-5 text-sm ${muted}`}>No plans yet. Name one above to start it.</p> : (
        <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]" aria-label="Plans">
          {plans.map((p) => (
            <li key={p.planId}>
              <Link to="/plans/$planId" params={{ planId: p.planId }} className="flex items-center justify-between gap-4 py-2.5 text-sm hover:text-[var(--lagoon)]">
                <span className="font-medium">{p.planId}</span>
                <span className={`flex items-center gap-3 text-xs ${muted}`}>
                  {p.here.length > 0 && <span className="flex -space-x-1.5" aria-label={`Here now: ${p.here.join(', ')}`}>{p.here.map((who) => <span key={who} className="gh-face" data-agent={who === 'agent' || undefined} title={`${who}, here now`}>{who === 'agent' ? 'AI' : who.slice(0, 2).toUpperCase()}</span>)}</span>}
                  <span>{p.here.length > 0 ? `${p.here.length} here` : `active ${p.lastActiveAt.slice(0, 10)}`}</span>
                  <span>started by {p.openedBy}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
