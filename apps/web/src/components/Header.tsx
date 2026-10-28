import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { currentAccount, signOut, type Account } from '#/lib/session'

// The top bar says who you are on every page: your name and Sign out, or Sign in and Sign up. It rechecks on each
// navigation, so signing in or out anywhere shows up here at once.
export default function Header() {
  const router = useRouter()
  const path = useRouterState({ select: (s) => s.location.pathname })
  const [account, setAccount] = useState<Account | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    void currentAccount().then((r) => { if (alive) setAccount(r.account) }, () => { if (alive) setAccount(null) })
    return () => { alive = false }
  }, [path])

  return (
    <header className="border-b" style={{ borderColor: 'var(--line)' }}>
      <nav className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-3 text-sm" aria-label="Main">
        <Link to="/" className="font-semibold tracking-tight">Greenhouse</Link>
        {account?.admin && <Link to="/admin" className="opacity-80 hover:opacity-100">Admin</Link>}
        <span className="ml-auto flex items-center gap-3" data-testid="header-account">
          {account === undefined ? null : account ? (
            <>
              <span className="gh-muted">{account.name}</span>
              <button type="button" className="opacity-80 hover:opacity-100" onClick={async () => { await signOut(); setAccount(null); await router.invalidate() }}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="opacity-80 hover:opacity-100">Sign in</Link>
              <Link to="/signup" className="gh-btn gh-btn-primary !py-1">Sign up</Link>
            </>
          )}
        </span>
      </nav>
    </header>
  )
}
