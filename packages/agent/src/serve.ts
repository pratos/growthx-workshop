// The agent as a running Participant: signs in as the agent account, watches the plans it is given, and answers every
// question asked in their sessions, one at a time, in order. `just agent-serve` (PLAN=gh-12 by default).
//   GREENHOUSE_URL  the API, default http://localhost:3000/api (the web Worker forwards /api to it)
//   PLAN            comma-separated plan ids, default gh-12
//   AGENT_EMAIL / AGENT_PASSWORD   default: the local-only agent login in .dev.vars.example
//   AGENT_STORE     the pi-durable SQLite file, default packages/agent/agent-serve.sqlite
// With no model key it answers with a faux model, so the whole loop runs locally without one.
import { readFileSync, existsSync } from "node:fs";
import { openBrain } from "./brain.ts";
import { intoPlan, tick, type SessionsApi } from "./loop.ts";
import { stamp } from "./summary.ts";

const base = (process.env.GREENHOUSE_URL ?? "http://localhost:3000/api").replace(/\/$/, "");
const plans = (process.env.PLAN ?? "gh-12").split(",").map((p) => p.trim()).filter(Boolean);
const example = new URL("../../../.dev.vars.example", import.meta.url).pathname;
const vars = existsSync(example) ? Object.fromEntries(readFileSync(example, "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])) : {};
// Model keys from .dev.vars (`just secret put ANTHROPIC_API_KEY`), unless the environment already has them.
const local = new URL("../../../.dev.vars", import.meta.url).pathname;
if (await Bun.file(local).exists()) {
  for (const line of (await Bun.file(local).text()).split("\n")) {
    const m = /^([A-Z][A-Z0-9_]*_API_KEY|AGENT_MODEL)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2];
  }
}
const email = process.env.AGENT_EMAIL ?? vars.AGENT_EMAIL, password = process.env.AGENT_PASSWORD ?? vars.AGENT_PASSWORD;
if (!email || !password) { console.error("set AGENT_EMAIL and AGENT_PASSWORD (or keep .dev.vars.example)"); process.exit(2); }

const log = (line: string) => console.log(`${stamp()} ${line}`);
let token = "";
async function signIn() {
  const r = await fetch(`${base}/auth/sign-in`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  const body = (await r.json().catch(() => ({}))) as { token?: string; account?: { accountId: string }; rejected?: string };
  if (!r.ok || !body.token) throw new Error(`sign-in as ${email} failed: ${body.rejected ?? r.status}`);
  token = body.token;
  return body.account!.accountId;
}
async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const go = () => {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    headers.set("authorization", `Bearer ${token}`);
    return fetch(`${base}${path}`, { ...init, headers });
  };
  let r = await go();
  if (r.status === 401) { await signIn(); r = await go(); }
  return r;
}
const api: SessionsApi = {
  async list(planId) {
    const r = await call(`/plans/${encodeURIComponent(planId)}/sessions`);
    if (!r.ok) throw new Error(`list sessions on ${planId}: ${r.status}`);
    return ((await r.json()) as { sessions: never[] }).sessions;
  },
  async command(planId, type, data) {
    const r = await call(`/plans/${encodeURIComponent(planId)}/sessions`, { method: "POST", body: JSON.stringify({ type, data }) });
    const body = (await r.json().catch(() => ({}))) as { rejected?: string };
    return { ok: r.ok, ...(body.rejected ? { rejected: body.rejected } : {}) };
  },
  // Read the plan's text, put the answer in, save it as EditPlan based on what was read; if someone saved in between,
  // read again and redo it (three tries).
  async writeIntoPlan(planId, prompt, answer) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const read = await call(`/plans/${encodeURIComponent(planId)}`);
      if (!read.ok) return { ok: false, rejected: `read ${planId}: ${read.status}` };
      const body = ((await read.json()) as { body?: { content: string; edits: number } }).body ?? { content: "", edits: 0 };
      const saved = await call(`/plans/${encodeURIComponent(planId)}/commands`, { method: "POST", body: JSON.stringify({ type: "EditPlan", data: { content: intoPlan(body.content, prompt, answer), basedOn: body.edits } }) });
      if (saved.ok) return { ok: true };
      const refused = ((await saved.json().catch(() => ({}))) as { rejected?: string }).rejected ?? String(saved.status);
      if (saved.status !== 409) return { ok: false, rejected: refused };
    }
    return { ok: false, rejected: "the plan kept changing" };
  },
};

const me = await signIn();
const brain = await openBrain(process.env.AGENT_STORE ?? new URL("../agent-serve.sqlite", import.meta.url).pathname, log);
log(`pid ${process.pid} · signed in as ${me} · model ${brain.model} · watching ${plans.join(", ")} at ${base}`);
let stopping = false;
process.on("SIGINT", () => { stopping = true; nudge(); });

// Waking the plan room costs money, so the agent does not poll it hard. It listens on each plan's socket (hibernating on
// the room's side, so an idle connection is free) and looks the moment a session changes; otherwise it backs off from
// 1.5 s to 30 s while nothing is happening.
let nudge = () => {};
const pause = (ms: number) => new Promise<void>((resolve) => { const t = setTimeout(resolve, ms); nudge = () => { clearTimeout(t); resolve(); }; });
function listen(plan: string) {
  const url = `${base.replace(/\/api$/, "").replace(/^http/, "ws")}/plans/${encodeURIComponent(plan)}/ws`;
  const ws = new WebSocket(url, { headers: { authorization: `Bearer ${token}` } } as never);
  const ping = setInterval(() => { try { ws.send("ping"); } catch {} }, 30_000); // answered by the runtime, never wakes the room
  ws.onmessage = (m) => { try { if ((JSON.parse(String(m.data)) as { type?: string }).type === "session") nudge(); } catch {} };
  ws.onclose = () => { clearInterval(ping); if (!stopping) setTimeout(() => listen(plan), 5_000); };
}
for (const plan of plans) listen(plan);

let delay = 1_500;
while (!stopping) {
  let done = 0;
  for (const plan of plans) {
    try { done += await tick(plan, me, api, brain, log); } catch (e) { log(`tick on ${plan}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  delay = done > 0 ? 1_500 : Math.min(delay * 2, 30_000);
  await pause(delay);
}
await brain.close();
log("closed");
