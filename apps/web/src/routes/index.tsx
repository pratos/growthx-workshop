import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

// The first page: what this is, and proof that both Workers are up.
function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Greenhouse</h1>
      <p className="mt-2 text-gray-600">A planning room. People and an agent write a plan together; every decision is owned, dated and attached to the block it changed.</p>
      <p className="mt-8 text-sm">Running: <a href="/healthz" className="underline">/healthz</a> (both Workers, through the binding) · <a href="/readyz" className="underline">/readyz</a></p>
    </main>
  )
}
