// One pass of the agent over a plan's sessions. The agent is a Participant: it uses the same session commands a person
// can, through the API, signed in as itself. Pure logic: the API and the brain are passed in, so tests drive it with
// fakes and the server drives it with HTTP and pi-durable.

export type RunView = { runId: string; status: "queued" | "running" | "finished" | "failed"; askedBy: string; asked: string; runBy?: string };
export type SessionViewLite = { sessionId: string; status: "open" | "ended"; participants: string[]; runs: RunView[] };
export type SessionsApi = {
  list(planId: string): Promise<SessionViewLite[]>;
  command(planId: string, type: string, data: Record<string, unknown>): Promise<{ ok: boolean; rejected?: string }>;
};
export type Answerer = { answer(sessionId: string, runId: string, asked: string): Promise<string> };

export const ATTEMPTS = 3;

// Starts the oldest queued run in each open session (or picks up one it was already running, after a restart),
// answers it, and finishes it. A run the brain cannot answer after ATTEMPTS tries is failed with the reason.
export async function tick(planId: string, me: string, api: SessionsApi, brain: Answerer, log: (line: string) => void = () => {}): Promise<number> {
  let done = 0;
  for (const s of await api.list(planId)) {
    if (s.status !== "open" || !s.participants.includes(me)) continue;
    const running = s.runs.find((r) => r.status === "running");
    if (running && running.runBy !== me) continue; // a person is working on this one
    let run = running;
    if (!run) {
      const next = s.runs.find((r) => r.status === "queued");
      if (!next) continue;
      const started = await api.command(planId, "StartRun", { sessionId: s.sessionId, runId: next.runId });
      if (!started.ok) { log(`skip ${next.runId}: ${started.rejected}`); continue; }
      run = next;
      log(`started ${run.runId} in ${s.sessionId}: ${run.asked}`);
    } else {
      log(`resuming ${run.runId} in ${s.sessionId}`);
    }
    let lastError = "";
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        const result = await brain.answer(s.sessionId, run.runId, run.asked);
        const finished = await api.command(planId, "FinishRun", { sessionId: s.sessionId, runId: run.runId, result });
        log(finished.ok ? `finished ${run.runId}` : `could not finish ${run.runId}: ${finished.rejected}`);
        done += finished.ok ? 1 : 0;
        lastError = "";
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        log(`attempt ${attempt} for ${run.runId} failed: ${lastError}`);
      }
    }
    if (lastError) {
      const failed = await api.command(planId, "FailRun", { sessionId: s.sessionId, runId: run.runId, reason: `could not answer after ${ATTEMPTS} tries: ${lastError}`.slice(0, 400) });
      log(failed.ok ? `failed ${run.runId}` : `could not fail ${run.runId}: ${failed.rejected}`);
    }
  }
  return done;
}
