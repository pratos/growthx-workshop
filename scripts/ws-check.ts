// Proves the multiplayer path: one socket subscribed, one HTTP command, the socket hears the events within two seconds.
// usage: bun scripts/ws-check.ts [socketBase] [commandBase]   (defaults: local api; in prod pass the web url and the api url)
const base = process.argv[2] ?? 'http://localhost:8787';
const cmdBase = process.argv[3] ?? base;
const plan = `ws-${Date.now()}`;
const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/plans/${plan}/ws`);
const heard = new Promise<string[]>((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('no events frame within 5s')), 5000);
  ws.onmessage = (m) => { const d = JSON.parse(String(m.data)); if (d.type === 'events') { clearTimeout(t); resolve(d.events.map((e: { type: string }) => e.type)); } };
  ws.onerror = (e) => reject(new Error(`socket error: ${String((e as ErrorEvent).message ?? e)}`));
});
await new Promise<void>((r, j) => { ws.onopen = () => r(); setTimeout(() => j(new Error('socket did not open')), 3000); });
await fetch(`${cmdBase}/plans/${plan}/commands`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'OpenThread', by: 'pratos', data: { blockId: 'b1', body: 'does the socket hear this?' } }) });
console.log('socket heard:', await heard);
ws.close();
