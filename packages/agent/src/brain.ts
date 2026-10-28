// The agent's thinking, durable: one pi-durable conversation per Greenhouse session, one submission per run with the
// run's id as its requestId. Kill the process mid-answer and start it again: the same requestId finds the same
// submission, the run resumes from its last checkpoint, and the answer is produced once.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { AssistantEntry, createRegistry, defineExtension, defineTool, Harness, watchEvents, type Conversation } from "@earendil-works/pi-durable";
import { Type } from "@earendil-works/pi-ai";
import { chooseModelOrFaux } from "./model.ts";
import type { Room } from "./loop.ts";
import { openStorage } from "./storage.ts";

export type Brain = {
  readonly model: string;
  answer(sessionId: string, runId: string, asked: string, room?: Room): Promise<string>;
  close(): Promise<void>;
};

// Shaped like pi's own system prompt: who the agent is and what it helps with, then its tools, then its rules.
export const INSTRUCTIONS = `You are the agent in Greenhouse, a planning room where people and an agent write a plan together. You help them by answering their questions, writing into the plan, drawing diagrams of it, and asking when something is unclear. People decide; you explore, draft and answer.

<tools>
- edit_plan: Write Markdown into the plan where you were asked (## headings, - lists, paragraphs). It is shown as written by the agent.
- draw_diagram: Put a Mermaid diagram (flowchart, sequence or state) into the plan, with a one-line title.
- ask_room: Post a question to everyone in the Session, when the answer needs someone's knowledge.
- clarify: Ask the person who asked you, when their question can be read two ways. Then stop and say what you are waiting for.
</tools>

<rules>
- Answer in at most three sentences unless you are writing into the plan
- Say what you would decide and why; never record a Decision yourself, people resolve Threads
- Use the plan's words: Plan, Block, Thread, Decision, Session, Run, Participant; never user, bot, document or chat
- Write into the plan only when asked to write, draft or draw, or when the answer is a section the plan needs
- Clarify instead of guessing when the question names no Block, option or person
- The plan's current text arrives with each question in <plan_text>; quote it rather than restate it
- Be concise
</rules>

<room>
A Session is where people ask you; a Run is one question, answered in order. Anyone in the Session can steer the Run you are on; steering arrives as a new input. You are a Participant with the same commands as a person, signed in as yourself.
</room>`;

// The Room for the Run being answered. The loop answers one Run at a time, so one slot is enough.
let current: Room | undefined;
const text = (t: string) => ({ output: [{ type: "text" as const, text: t }] });
const inRoom = async (act: (room: Room) => Promise<string>) => (current ? text(await act(current)) : text("not in a run; nothing done"));
const Greenhouse = defineExtension({
  name: "greenhouse",
  tools: [
    defineTool({ name: "edit_plan", description: "Write Markdown into the plan where you were asked: ## headings, - lists, paragraphs.",
      parameters: Type.Object({ markdown: Type.String() }), execute: (a) => inRoom((r) => r.writeIntoPlan(a.markdown)) }),
    defineTool({ name: "draw_diagram", description: "Put a Mermaid diagram (flowchart, sequenceDiagram or stateDiagram-v2) into the plan, with a one-line title.",
      parameters: Type.Object({ title: Type.String(), mermaid: Type.String() }), execute: (a) => inRoom((r) => r.drawIntoPlan(a.title, a.mermaid)) }),
    defineTool({ name: "ask_room", description: "Post a question to everyone in the Session.",
      parameters: Type.Object({ question: Type.String() }), execute: (a) => inRoom((r) => r.post(a.question)) }),
    defineTool({ name: "clarify", description: "Ask the person who asked you to clarify; then stop and say what you are waiting for.",
      parameters: Type.Object({ question: Type.String() }), execute: (a) => inRoom((r) => r.post(`@${r.askedBy} ${a.question}`)) }),
  ],
});

export async function openBrain(dbPath: string, log: (line: string) => void = () => {}): Promise<Brain> {
  const context = BACKGROUND_CONTEXT;
  const { models, model, faux } = chooseModelOrFaux();
  const storage = await openStorage(dbPath);
  const registry = createRegistry();
  registry.install(Greenhouse);
  const harness = await Harness.open(storage, { models, registry, onReport: (e, info) => log(`report ${info.type}: ${String(e)}`) }, context);
  harness.resume(); // continue any run the last process left unfinished

  // Which conversation holds which session: a small file next to the store, written before the first submission.
  const mapPath = `${dbPath}.sessions.json`;
  const map: Record<string, string> = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, "utf8")) : {};
  async function conversationFor(sessionId: string): Promise<Conversation> {
    const known = map[sessionId] ? await harness.conversation(map[sessionId] as never, context) : undefined;
    if (known) return known;
    const created = await harness.createConversation({ ownership: { kind: "ownerless" }, agent: { model, instructions: INSTRUCTIONS } }, context);
    map[sessionId] = String(created.id);
    writeFileSync(mapPath, JSON.stringify(map, null, 2));
    return created;
  }

  return {
    model: `${model.provider}/${model.modelId}${faux ? " (faux)" : ""}`,
    async answer(sessionId, runId, asked, room) {
      const conversation = await conversationFor(sessionId);
      current = room;
      // Stream: the text deltas of the reply as it is generated, relayed to the room (pi-durable commits them ~every 100 ms).
      let streamed = "";
      const events = room ? await watchEvents(harness, conversation.id, context) : undefined;
      events?.start(async (batch) => {
        for (const e of batch) {
          if (e.type === "message_start") streamed = "";
          if (e.type === "message_update") for (const c of e.changes) if (c.type === "text_delta") streamed += c.delta;
          if (e.type === "tool_execution_start") room?.partial(`${streamed}\n\n(${e.toolName.replace("_", " ")}…)`.trim());
        }
        if (streamed) room?.partial(streamed);
      });
      let settled;
      try {
        const submission = await conversation.submit({ type: "input", content: asked, requestId: runId }, context);
        settled = await submission.wait(context);
      } finally {
        await events?.stop();
        current = undefined;
      }
      if (settled.status !== "done" || settled.type !== "input") throw new Error(`run ${runId} ${settled.status}${"reason" in settled ? `: ${String(settled.reason)}` : ""}`);
      const entry = await conversation.commit((tx) => tx.entry(AssistantEntry, settled.answer), context);
      const content = entry?.model?.[0]?.content;
      const text = Array.isArray(content) ? content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n") : String(content ?? "");
      return text.trim() || "(no answer)";
    },
    close: () => harness.close(context),
  };
}
