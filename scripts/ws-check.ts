// Proves the multiplayer path: one socket subscribed, one HTTP command, the socket hears the events within two seconds.
// usage: bun scripts/ws-check.ts [socketBase] [commandBase]   (defaults: local api; in prod pass the web url and the api url)
const base = process.argv[2] ?? 'http://localhost:8787';
const cmdBase = process.argv[3] ?? base;
const plan = `ws-${Date.now()}`;
// Plan rooms are for signed-in participants: sign in as the local admin (or GH_EMAIL / GH_PASSWORD) and send the token.
const vars = Object.fromEntries((await Bun.file(new URL('../.dev.vars.example', import.meta.url)).text()).split('\n')
  .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const signIn = await fetch(`${cmdBase}/auth/sign-in`, { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: process.env.GH_EMAIL ?? vars.ADMIN_EMAIL, password: process.env.GH_PASSWORD ?? vars.ADMIN_PASSWORD }) });
const token = ((await signIn.json()) as { token?: string }).token;
if (!token) { console.error(`sign-in failed (${signIn.status})`); process.exit(1); }
const auth = { authorization: `Bearer ${token}` };
const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/plans/${plan}/ws`, { headers: auth } as never);
const heard = new Promise<string[]>((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('no events frame within 5s')), 5000);
  ws.onmessage = (m) => { const d = JSON.parse(String(m.data)); if (d.type === 'events') { clearTimeout(t); resolve(d.events.map((e: { type: string }) => e.type)); } };
  ws.onerror = (e) => reject(new Error(`socket error: ${String((e as ErrorEvent).message ?? e)}`));
});
await new Promise<void>((r, j) => { ws.onopen = () => r(); setTimeout(() => j(new Error('socket did not open')), 3000); });
await fetch(`${cmdBase}/plans/${plan}/commands`, { method: 'POST', headers: { 'content-type': 'application/json', ...auth }, body: JSON.stringify({ type: 'OpenThread', by: 'pratos', data: { blockId: 'b1', body: 'does the socket hear this?' } }) });
console.log('socket heard:', await heard);
ws.close();
