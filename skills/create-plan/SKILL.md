---
name: create-plan
description: Create an implementation plan as a formatted HTML page built from a small JSON file, with viz-explainer diagrams and decision reports embedded, inline UI components and a design language for UI work, and code limited to contracts. Use for /create_plan, "plan this ticket", "write a plan for", or before any change that spans more than one phase. The same JSON is what implement, iterate and validate read and update.
---

# create-plan

A plan is for a person to agree with and an agent to follow. The person reads 240 words a minute and decides by looking, so the plan shows: diagrams for flow and state, a decision report for every real choice, the actual component for every new piece of UI. The agent needs what must be true when each phase is done, so the plan says that, plus the contracts other code will depend on. It does not carry the implementation; writing the code is the next step's job.

Source of truth: `docs/plans/YYYY-MM-DD-slug.plan.json` (or `thoughts/shared/plans/` in repos that use thoughts). The page next to it, `...plan.html`, is built from it and never edited by hand.

## Process

1. **Read what you were given, fully.** Ticket, linked docs, research, prior plans. Do this yourself before spawning anything.
2. **Research in parallel.** Claude Code: spawn `codebase-locator`, `codebase-analyzer` and `codebase-pattern-finder` agents in one message, plus `web-search-researcher` or the DeepWiki MCP for a library question. pi: `rg`, `fd`, `read`. Wait for all of them, then read the files they name.
3. **Say what you understood in five lines or fewer**, with file:line references. Ask only what the code cannot answer. Claude Code: `AskUserQuestion` with real options; pi: `clarify`. Never a paragraph of questions.
4. **Turn every design choice into a decision report**, never a prose "Option A or B?". Explore the options (separate threads or quick spikes), then build a viz-explainer decision report with the four axes and add it to `decisions`. The person picks; record `chosen`, `by`, `at` and one paragraph of `why`.
5. **Agree the phases** as a list of one-line names first. Each phase ends in something that can be verified on its own.
6. **Write the plan JSON** (`references/plan-schema.md`). Add a diagram where a reader would otherwise reconstruct flow or state in their head: a state explorer for a lifecycle, an event-stream story for "what happens", an architecture step from the project map.
7. **If the plan touches UI**, load `impeccable` before writing the design block and the components, and `animate` if anything moves. Add the design tokens the components use, and one component per new piece of UI with its real states: default, empty, error, loading, done, the state a flag hides. Use the product's real copy. See `references/ui-blocks.md`.
8. **Build and look**: `just plan docs/plans/<file>.plan.json` (a hook rebuilds on every edit of a `.plan.json`). Open the page. The builder refuses: contracts over 15 lines, a non-draft plan with an undecided decision, a phase without verification. It warns: UI files changed with no component, long intents, too much code in one phase.
9. **Fit the budget, then run `slop-guard`** on the prose fields. Fix every word-budget warning before handing over. Captions and intents are sentences a person would say.
10. **Hand over** the page path and one line. Iterate on the JSON until the person agrees, then set `status` to `final`.

## Rules

- **Few words, every one earning its place.** A plan is read at 240 words a minute, so the page has a budget: about 1,000 words with decided reports closed, four minutes at most. Each field has its own: summary 50, current 50, end state 40, approach 35, five discoveries of 25, not-doing items 15, a decision's why 35, a phase goal 25, a change intent 15, a manual check 15, captions and option summaries 15. The builder warns on each overrun and prints the reading time. Cut repetition first: say a thing once, in the section it belongs to, and let the diagram carry what a sentence would only describe. Keep every fact, name and number; drop restatements, transitions and qualifiers.
- **Contracts, not implementations.** A change is a file and one sentence saying what must be true after it. Add a `contract` only when other code will depend on its shape: a signature, a schema, a migration statement, an interface, an event. At most 15 lines. No function bodies, no full files, no diffs of logic. If a reader cannot follow the phase without seeing the code, the phase is too big.
- **Show, do not describe.** Flow and state get a diagram. A choice gets a decision report; once decided it collapses behind "Compare the options", so the page shows the choice and its why. UI gets a rendered component. A paragraph is for intent and reasons.
- **No open questions in a final plan.** Undecided means draft.
- **Say what is not being done.** `notDoing` is required.
- **Verification is runnable or observable.** Automated items are commands (prefer `just` recipes). Manual items are sentences a person can check by looking.
- **Use the glossary's words.** Load `ddd-vocabulary` if the plan names anything new.

## After the plan

- **Implementing** (`/implement_plan`): set `status` to `implementing`; work phase by phase; when a check passes, set its `"done": true` in the JSON and let the hook rebuild. Never tick a manual check until the person confirms it. If reality disagrees with the plan, stop and say so with the phase, what the plan says, and what you found.
- **Iterating** (`/iterate_plan`): change the JSON surgically. A new choice gets a new decision report; a changed choice keeps the old one and records the new `chosen` with today's date.
- **Validating** (`/validate_plan`): read the JSON, run every automated command, compare `changes` with the diff, and report per phase. Mark the plan `done` only when every check is done.

## Reference

- `references/plan-schema.md`: every field, with the GH-12 example.
- `references/ui-blocks.md`: the design block and components.
- `scripts/build.mjs`: JSON in, validated page out. Uses `../viz-explainer` for diagrams and decision reports.
- `assets/example.plan.json` and `assets/example.plan.html`: a real plan to copy.
