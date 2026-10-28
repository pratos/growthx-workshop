import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="border-b border-gray-200/40">
      <nav className="mx-auto flex max-w-3xl items-center gap-5 px-4 py-3 text-sm">
        <Link to="/" className="font-semibold tracking-tight">Greenhouse</Link>
        <Link to="/admin/flags" className="opacity-80 hover:opacity-100">Flags</Link>
        <Link to="/login" className="ml-auto opacity-80 hover:opacity-100">Sign in</Link>
      </nav>
    </header>
  )
}
