// Where to go after signing in or up: a shared link's own path (?next=/plans/gh-12#thread-t7), never another site.
export function nextPath(fallback = '/'): string {
  if (typeof window === 'undefined') return fallback;
  const next = new URLSearchParams(window.location.search).get('next') ?? '';
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
}
// The current page as a ?next= for the sign-in link, hash included.
export const signInHref = (page: 'login' | 'signup' = 'login') =>
  typeof window === 'undefined' ? `/${page}` : `/${page}?next=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`;
