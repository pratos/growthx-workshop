import { Link } from '@tanstack/react-router';

// What an admin page shows when the API refuses: why, and the way in. 401 is "sign in", 403 is "not an admin".
export function AdminRefusal({ status, title }: { status: number; title: string }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p role="alert" className="mt-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {status === 401 ? 'Sign in as an admin to see this page.' : 'Only admins can see this page, and this account is not an admin.'}{' '}
        <Link to="/login" className="underline">Sign in</Link>
      </p>
    </main>
  );
}

export function AdminNav({ here }: { here: 'dashboard' | 'accounts' | 'events' | 'flags' }) {
  const items = [['dashboard', '/admin', 'Dashboard'], ['accounts', '/admin/accounts', 'Accounts'], ['events', '/admin/events', 'Event log'], ['flags', '/admin/flags', 'Flags']] as const;
  return (
    <nav aria-label="Admin" className="mt-2 flex gap-4 text-sm">
      {items.map(([id, to, label]) => (
        <Link key={id} to={to} aria-current={here === id ? 'page' : undefined} className={here === id ? 'font-semibold underline underline-offset-4' : 'text-gray-500 hover:underline'}>{label}</Link>
      ))}
    </nav>
  );
}
