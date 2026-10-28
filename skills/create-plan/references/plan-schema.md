# Plan schema

One JSON object. Prose fields are Markdown and are rendered; keep them to short paragraphs. `assets/example.plan.json` is a complete plan that uses every field.

```jsonc
{
  "title": "Resolve a comment thread into a decision",   // what the plan delivers, as a plain phrase
  "ticket": "GH-12",                                     // optional
  "date": "2026-10-28",
  "status": "draft",                                     // draft | final | implementing | done
  "author": "pratos with Claude Code",                   // optional
  "summary": "Two or three sentences: what changes for whom, and why now.",
  "current": "Where things are today.",
  "discoveries": ["One finding per item, with a file:line reference when it helps."],
  "endState": "What is true when the plan is done, and how someone would see it.",
  "notDoing": ["Out of scope, with the reason in the same sentence."],
  "approach": "Why the phases are in this order.",
  "approachDiagram": "lifecycle",                        // optional: id from diagrams

  "diagrams": [
    { "id": "lifecycle", "spec": { /* a viz-explainer spec: state-explorer, event-stream or architecture-map */ } }
  ],

  "decisions": [
    {
      "id": "events",
      "question": "Is a decision its own fact, or part of ThreadResolved?",
      "options": [{ "id": "two-events", "label": "Two events" }, { "id": "one-event", "label": "One event" }],
      "chosen": "two-events",                            // required unless status is draft
      "by": "pratos", "at": "2026-10-27",
      "why": "One paragraph.",
      "viz": { /* a viz-explainer decision-report spec; it renders locked on the chosen option */ }
    }
  ],

  "design": { /* see ui-blocks.md; required in practice when the plan changes UI */ },

  "phases": [
    {
      "id": "domain",
      "name": "Domain: resolve records two facts",
      "goal": "What is true when this phase is done.",
      "diagram": "lifecycle",                            // optional
      "changes": [
        { "file": "packages/domain/src/thread/decider.ts",
          "intent": "Add the command, the two events, and the resolve case in decide.",
          "contract": { "lang": "ts", "code": "ResolveThread = defineCommand('ResolveThread', { threadId, by, decision })" } }
      ],
      "components": [ /* see ui-blocks.md */ ],
      "verify": {
        "automated": [{ "cmd": "just test", "text": "optional note", "done": false }],
        "manual": [{ "text": "Read resolve.snap.txt aloud; it should sound like something that happened.", "done": false }]
      },
      "notes": "optional"
    }
  ],

  "references": ["`docs/ARCHITECTURE.md`", "`docs/decisions/agent-loop.html`"]
}
```

## What the builder enforces

| Rule | Why |
|---|---|
| `title`, `summary`, `notDoing`, at least one phase | A plan without scope or a reason is a wish |
| every change has `file` and `intent` | The intent is the instruction; the file is where |
| a `contract` is at most 15 lines | Plans carry contracts, not implementations |
| status other than `draft` ⇒ every decision has `chosen` | No open questions in a plan someone will implement |
| every phase has `verify.automated` and `verify.manual` | Done must be checkable |
| `diagram` and `approachDiagram` refer to real ids | A broken reference is a silent gap |

Warnings: an intent longer than two sentences, more than 40 contract lines in a phase, UI files changed without a component or without a design block, and every field over its word budget.

## Word budgets

| Field | Words |
|---|---|
| summary, current | 50 |
| endState | 40 |
| approach | 35 |
| discoveries | 5 items, 25 each |
| notDoing item, change intent, manual check, caption, option summary | 15 |
| phase goal | 25 |
| decision why | 35 |
| component notes | 20 |
| whole page, decided reports closed | about 1,000 |

The build line prints the visible word count and reading time; the page shows the reading time in its byline. A decided decision's report renders collapsed, so its option text does not count.
