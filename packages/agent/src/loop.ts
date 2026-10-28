// One pass of the agent over a plan's sessions. The agent is a Participant: it uses the same session commands a person
// can, through the API, signed in as itself. Pure logic: the API and the brain are passed in, so tests drive it with
// fakes and the server drives it with HTTP and pi-durable.

export type RunView = { runId: string; status: "queued" | "running" | "finished" | "failed"; askedBy: string; asked: string; runBy?: string };
export type SessionViewLite = { sessionId: string; title?: string; status: "open" | "ended"; participants: string[]; runs: RunView[] };
export type SessionsApi = {
  list(planId: string): Promise<SessionViewLite[]>;
  command(planId: string, type: string, data: Record<string, unknown>): Promise<{ ok: boolean; rejected?: string }>;
  // Writing into the Plan's text, as EditPlan, for a question asked with "/ask" in the editor.
  writeIntoPlan?(planId: string, prompt: string, answer: string): Promise<{ ok: boolean; rejected?: string }>;
  // The room while a Run is answered: post a Message, relay the answer so far, read the plan's text.
  post?(planId: string, sessionId: string, body: string): Promise<{ ok: boolean; rejected?: string }>;
  partial?(planId: string, sessionId: string, runId: string, text: string): Promise<void>;
  readPlan?(planId: string): Promise<string>;
};

// What the agent can do in the room while it answers one Run. The loop builds one per Run; the tools act through it.
export type Room = {
  partial(text: string): void;                                   // the answer so far, to everyone watching
  writeIntoPlan(markdown: string): Promise<string>;              // EditPlan, where it was asked
  drawIntoPlan(title: string, mermaid: string): Promise<string>; // a Mermaid diagram into the plan
  post(body: string): Promise<string>;                           // a Message in the Session
  askedBy: string;
};

// The answer so far, at most every 300 ms, and always the last one.
function throttled(send: (text: string) => unknown, ms = 300) {
  let last = 0, pending: string | undefined, timer: ReturnType<typeof setTimeout> | undefined;
  return (text: string) => {
    pending = text;
    const wait = ms - (Date.now() - last);
    if (wait <= 0) { last = Date.now(); void send(text); pending = undefined; return; }
    timer ??= setTimeout(() => { timer = undefined; last = Date.now(); if (pending !== undefined) void send(pending); pending = undefined; }, wait);
  };
}

// The plan's text as the agent reads it: headings with #, list items with -, code fenced.
export function planText(content: string): string {
  let doc: Node;
  try { doc = content ? (JSON.parse(content) as Node) : { type: "doc" }; } catch { return ""; }
  const inline = (n: Node): string => n.text ?? (n.content ?? []).map(inline).join("");
  const block = (n: Node, depth = 0): string[] => {
    switch (n.type) {
      case "heading": return [`${"#".repeat(Number(n.attrs?.level ?? 2))} ${inline(n)}`];
      case "paragraph": return [inline(n)];
      case "codeBlock": return ["```" + (typeof n.attrs?.language === "string" ? n.attrs.language : ""), inline(n), "```"];
      case "bulletList": case "orderedList": case "taskList":
        return (n.content ?? []).flatMap((item) => (item.content ?? []).flatMap((c, i) => block(c, depth + 1).map((l) => (i === 0 ? `${"  ".repeat(depth)}- ${l}` : l))));
      default: return (n.content ?? []).flatMap((c) => block(c, depth));
    }
  };
  return (doc.content ?? []).flatMap((n) => block(n)).join("\n").slice(0, 6000);
}

// "/ask" in the editor asks with this prefix and leaves "Asked the agent to write: <prompt>" in the plan; the agent's
// answer replaces that line (apps/web/src/components/PlanEditor.tsx).
export const WRITE_PREFIX = "Write into the plan: ";
export const askedLine = (prompt: string) => `Asked the agent to write: ${prompt}`;

type Node = { type: string; attrs?: Record<string, unknown>; content?: Node[]; text?: string; marks?: { type: string }[] };
const text = (t: string, marks?: { type: string }[]): Node => ({ type: "text", text: t, ...(marks ? { marks } : {}) });
const paragraph = (t: string, marks?: { type: string }[]): Node => ({ type: "paragraph", content: t ? [text(t, marks)] : [] });

// The answer as the editor's blocks: "## " and "### " lines are headings, runs of "- " lines a list, the rest paragraphs.
export function answerBlocks(answer: string): Node[] {
  const blocks: Node[] = [];
  // Fenced code first (a diagram's source may hold blank lines), then the rest chunk by chunk.
  const parts = answer.split(/^```(\w*)\n([\s\S]*?)^```\s*$/m);
  if (parts.length > 1) {
    for (let i = 0; i < parts.length; i += 3) {
      blocks.push(...answerBlocks(parts[i] ?? ""));
      if (parts[i + 2] !== undefined) blocks.push({ type: "codeBlock", attrs: { language: parts[i + 1] || null }, content: [text(parts[i + 2]!.replace(/\n$/, ""))] });
    }
    return blocks;
  }
  for (const chunk of answer.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean)) {
    const lines = chunk.split("\n");
    if (lines.every((l) => /^[-*] /.test(l))) {
      blocks.push({ type: "bulletList", content: lines.map((l) => ({ type: "listItem", content: [paragraph(l.slice(2).trim())] })) });
    } else if (/^#{2,3} /.test(chunk) && lines.length === 1) {
      blocks.push({ type: "heading", attrs: { level: chunk.startsWith("### ") ? 3 : 2 }, content: [text(chunk.replace(/^#+ /, ""))] });
    } else {
      blocks.push(paragraph(lines.join(" ")));
    }
  }
  return blocks;
}

// The plan's text with the answer in place of the "/ask" line (or at the end, if someone removed that line), credited.
export function intoPlan(content: string, prompt: string, answer: string): string {
  let doc: Node;
  try { doc = content ? (JSON.parse(content) as Node) : { type: "doc", content: [] }; } catch { doc = { type: "doc", content: [] }; }
  const blocks = [paragraph(`Written by the agent: ${prompt}`, [{ type: "italic" }]), ...answerBlocks(answer)];
  const isAsked = (n: Node) => n.type === "paragraph" && n.content?.map((c) => c.text ?? "").join("") === askedLine(prompt);
  const contains = (n: Node): boolean => isAsked(n) || (n.content ?? []).some(contains);
  const without = (n: Node): Node => ({ ...n, content: (n.content ?? []).filter((c) => !isAsked(c)).map(without) });
  const top = doc.content ?? [];
  const at = top.findIndex(contains);
  if (at < 0) return JSON.stringify({ ...doc, type: "doc", content: [...top, ...blocks] });
  // The line may sit inside a list: take it out there, and put the answer right after the block that held it.
  const holder = isAsked(top[at]!) ? [] : [without(top[at]!)];
  return JSON.stringify({ ...doc, type: "doc", content: [...top.slice(0, at), ...holder, ...blocks, ...top.slice(at + 1)] });
}
export type Answerer = { answer(sessionId: string, runId: string, asked: string, room?: Room): Promise<string> };

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
        // The room for this Run (when the API offers it): what the agent's tools act through, and where the answer streams.
        const prompt = run.asked.startsWith(WRITE_PREFIX) ? run.asked.slice(WRITE_PREFIX.length) : run.asked;
        let wrote = false;
        const room: Room | undefined = api.post && api.writeIntoPlan ? {
          askedBy: run.askedBy,
          partial: throttled((t) => api.partial?.(planId, s.sessionId, run!.runId, t)),
          writeIntoPlan: async (markdown) => { const w = await api.writeIntoPlan!(planId, prompt, markdown); wrote ||= w.ok; return w.ok ? "written into the plan" : `not written: ${w.rejected}`; },
          drawIntoPlan: async (title, mermaid) => { const w = await api.writeIntoPlan!(planId, prompt, `## ${title}\n\n\`\`\`mermaid\n${mermaid}\n\`\`\``); wrote ||= w.ok; return w.ok ? "drawn into the plan" : `not drawn: ${w.rejected}`; },
          post: async (body) => { const p = await api.post!(planId, s.sessionId, body); return p.ok ? "posted to the session" : `not posted: ${p.rejected}`; },
        } : undefined;
        const framed = api.readPlan
          ? `${run.asked}\n\n<run>Asked by ${run.askedBy} in the Session "${s.title ?? s.sessionId}" on plan ${planId}.</run>\n<plan_text>\n${planText(await api.readPlan(planId))}\n</plan_text>`
          : run.asked;
        const result = await brain.answer(s.sessionId, run.runId, framed, room);
        const finished = await api.command(planId, "FinishRun", { sessionId: s.sessionId, runId: run.runId, result });
        log(finished.ok ? `finished ${run.runId}` : `could not finish ${run.runId}: ${finished.rejected}`);
        if (finished.ok && run.asked.startsWith(WRITE_PREFIX) && api.writeIntoPlan && !wrote) {
          const wrote = await api.writeIntoPlan(planId, run.asked.slice(WRITE_PREFIX.length), result);
          log(wrote.ok ? `wrote ${run.runId} into ${planId}` : `could not write ${run.runId} into ${planId}: ${wrote.rejected}`);
        }
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
