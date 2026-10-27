import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Greenhouse</h1>
      <p className="mt-2 text-gray-600">A planning room. People and an agent write a plan together; every decision is owned, dated and attached to the block it changed.</p>
      <ul className="mt-8 space-y-2">
        <li><Link to="/plans/$planId" params={{ planId: 'gh-12' }} className="underline">Plan GH-12</Link> · resolve a comment thread into a decision</li>
        <li><Link to="/login" className="underline">Sign in</Link></li>
      </ul>
    </main>
  )
}
