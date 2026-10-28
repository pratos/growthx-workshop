// The agent's thinking, durable: one pi-durable conversation per Greenhouse session, one submission per run with the
// run's id as its requestId. Kill the process mid-answer and start it again: the same requestId finds the same
// submission, the run resumes from its last checkpoint, and the answer is produced once.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { AssistantEntry, createRegistry, Harness, type Conversation } from "@earendil-works/pi-durable";
import { chooseModelOrFaux } from "./model.ts";
import { openStorage } from "./storage.ts";

export type Brain = {
  readonly model: string;
  answer(sessionId: string, runId: string, asked: string): Promise<string>;
  close(): Promise<void>;
};

const INSTRUCTIONS =
  "You are the agent in a Greenhouse planning room. People ask you about the plan they are writing together. " +
  "Answer in at most three sentences, plainly, and say what you would decide and why.";

export async function openBrain(dbPath: string, log: (line: string) => void = () => {}): Promise<Brain> {
  const context = BACKGROUND_CONTEXT;
  const { models, model, faux } = chooseModelOrFaux();
  const storage = await openStorage(dbPath);
  const harness = await Harness.open(storage, { models, registry: createRegistry(), onReport: (e, info) => log(`report ${info.type}: ${String(e)}`) }, context);
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
    async answer(sessionId, runId, asked) {
      const conversation = await conversationFor(sessionId);
      const submission = await conversation.submit({ type: "input", content: asked, requestId: runId }, context);
      const settled = await submission.wait(context);
      if (settled.status !== "done" || settled.type !== "input") throw new Error(`run ${runId} ${settled.status}${"reason" in settled ? `: ${String(settled.reason)}` : ""}`);
      const entry = await conversation.commit((tx) => tx.entry(AssistantEntry, settled.answer), context);
      const content = entry?.model?.[0]?.content;
      const text = Array.isArray(content) ? content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n") : String(content ?? "");
      return text.trim() || "(no answer)";
    },
    close: () => harness.close(context),
  };
}
