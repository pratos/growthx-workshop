import { useEffect, useRef, useState } from 'react';

// Sharing a plan: a link anyone signed in can open (signed out, it goes through sign-in and comes back), or an email
// invite from your own mail app with the link in it. Threads and sessions have their own links.
const absolute = (path: string) => (typeof window === 'undefined' ? path : new URL(path, window.location.origin).toString());

export function CopyLink({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className="gh-link-btn" aria-label={label} title={label}
      onClick={async () => { await navigator.clipboard.writeText(absolute(path)); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}>
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

export function ShareMenu({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  const link = absolute(`/plans/${planId}`);
  const mail = `mailto:?subject=${encodeURIComponent(`Join the ${planId} plan on Greenhouse`)}&body=${encodeURIComponent(`We're planning ${planId} together in Greenhouse. Open it here (sign up first if you have no account):\n\n${link}\n`)}`;
  return (
    <div className="relative" ref={box}>
      <button type="button" className="gh-btn gh-btn-ghost gh-session-tab" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)}>Share</button>
      {open && (
        <div className="gh-slash gh-share" role="menu" aria-label="Share this plan">
          <button type="button" role="menuitem" className="gh-slash-item" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => { setCopied(false); setOpen(false); }, 900); }}>
            <span>{copied ? 'Link copied' : 'Copy link'}</span><span className="gh-slash-hint">anyone signed in can open it</span>
          </button>
          <a role="menuitem" className="gh-slash-item" href={mail} onClick={() => setOpen(false)}>
            <span>Email an invite</span><span className="gh-slash-hint">opens your mail app</span>
          </a>
          <p className="gh-share-note">Each thread has its own link too.</p>
        </div>
      )}
    </div>
  );
}
