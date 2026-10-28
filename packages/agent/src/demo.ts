// One input, one fixed requestId, a slow replay-safe tool. Kill this process with `kill -9` while the tool runs, run it
// again, and the run continues from its checkpoint. Run it a third time and the saved answer comes back without a
// model call.
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { AssistantEntry, createRegistry, Harness } from "@earendil-works/pi-durable";
import { chooseModel } from "./model.ts";
import { DB_PATH, openStorage } from "./storage.ts";
import { stamp, summarize } from "./summary.ts";
import { Incident } from "./tools.ts";

const REQUEST_ID = "incident-106";
const QUESTION = "What is the checkout status? Use the service_status tool.";

const context = BACKGROUND_CONTEXT;
const log = (line: string) => console.log(`${stamp()} ${line}`);
const started = performance.now();
const elapsed = () => `${((performance.now() - started) / 1000).toFixed(1)}s`;

const { models, model } = chooseModel();
const registry = createRegistry();
registry.install(Incident);

log(`pid ${process.pid}  model ${model.provider}/${model.modelId}  storage ${DB_PATH}`);

const storage = await openStorage();
const harness = await Harness.open(
  storage,
  {
    models,
    registry,
    onReport: (error, info) => console.error(`${stamp()} report ${info.type}:`, error),
  },
  context,
);

const root = await harness.root(context, {
  agent: {
    model,
    instructions:
      "You are an on-call assistant. When asked about a service, call the service_status tool, then answer in one short sentence.",
  },
});

// What the last process left behind, before anything runs again.
const before = await harness.inspect(context);
if (before.tasks.length > 0) {
  log(`resuming: ${before.tasks.length} unfinished task(s) found in storage`);
  for (const task of before.tasks) {
    log(
      `  task #${task.record.id} ${task.record.kind} ${task.record.state.status} → ${task.state.kind}`,
    );
  }
} else {
  log("no unfinished work in storage");
}

// Print each entry as it is committed (the same thing watch.ts shows from another process).
const seen = new Set<string>();
const view = await root.viewState(context);
for (const entry of view.value.entries) seen.add(String(entry.id));
if (seen.size > 0)
  log(`transcript already has ${seen.size} committed entr${seen.size === 1 ? "y" : "ies"}`);
view.subscribe((value) => {
  for (const entry of value.entries) {
    if (seen.has(String(entry.id))) continue;
    seen.add(String(entry.id));
    log(`committed  #${entry.id} ${entry.kind}  ${summarize(entry)}`);
  }
});

harness.resume(); // continue any run the last process left unfinished

const submission = await root.submit(
  { type: "input", content: QUESTION, requestId: REQUEST_ID },
  context,
);
const status = await submission.status(context);
log(`submission ${REQUEST_ID} → #${submission.id} status ${status.status}`);

const settled = await submission.wait(context);
if (settled.status === "done" && settled.type === "input") {
  const answer = await root.commit((tx) => tx.entry(AssistantEntry, settled.answer), context);
  const content = answer?.model?.[0]?.content;
  const text = Array.isArray(content)
    ? content
        .filter((block) => block.type === "text")
        .map((block) => (block as { text: string }).text)
        .join("\n")
    : String(content ?? "");
  console.log(`\nANSWER (${elapsed()}): ${text}\n`);
} else {
  console.log(
    `\nUNANSWERED (${elapsed()}): ${settled.status} ${"reason" in settled ? settled.reason : ""}\n`,
  );
}

view.dispose();
await harness.close(context);
log("closed");
