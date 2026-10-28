// The agent as a running Participant: signs in as the agent account, watches the plans it is given, and answers every
// question asked in their sessions, one at a time, in order. `just agent-serve` (PLAN=gh-12 by default).
//   GREENHOUSE_URL  the API, default http://localhost:3000/api (the web Worker forwards /api to it)
//   PLAN            comma-separated plan ids, default gh-12
//   AGENT_EMAIL / AGENT_PASSWORD   default: the local-only agent login in .dev.vars.example
// With no model key it answers with a faux model, so the whole loop runs locally without one.
import { readFileSync, existsSync } from "node:fs";
import { openBrain } from "./brain.ts";
import { tick, type SessionsApi } from "./loop.ts";
import { stamp } from "./summary.ts";

const base = (process.env.GREENHOUSE_URL ?? "http://localhost:3000/api").replace(/\/$/, "");
const plans = (process.env.PLAN ?? "gh-12").split(",").map((p) => p.trim()).filter(Boolean);
const example = new URL("../../../.dev.vars.example", import.meta.url).pathname;
const vars = existsSync(example) ? Object.fromEntries(readFileSync(example, "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])) : {};
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
};

const me = await signIn();
const brain = await openBrain(new URL("../agent-serve.sqlite", import.meta.url).pathname, log);
log(`pid ${process.pid} · signed in as ${me} · model ${brain.model} · watching ${plans.join(", ")} at ${base}`);
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
while (!stopping) {
  for (const plan of plans) {
    try { await tick(plan, me, api, brain, log); } catch (e) { log(`tick on ${plan}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  await new Promise((r) => setTimeout(r, 1500));
}
await brain.close();
log("closed");
