---
name: ddd-vocabulary
description: Keep one vocabulary across the person, the code and the agent. Use before introducing any new noun (type, table, event, command, route, UI label), when a user's phrase has no type behind it, when two words seem to mean the same thing, or when someone asks what a term means or how the domain fits together. Explains with an interactive vocabulary map built by viz-explainer, never with a Markdown write-up.
---

# ddd-vocabulary

Three speakers, one vocabulary. The person says "resolve this thread", the code says `ResolveThread`, and the agent, reading the repo, says the same thing back. The agent learns the domain from identifiers: if Order, Booking and Reservation all mean one thing, it will invent a fourth. This skill is how a new word enters the system, and how an existing one is explained.

## When this fires

- You are about to name something new: a type, table, column, event, command, route, component or UI label.
- A user's sentence contains a noun that has no type in the code. That is a design finding, not a naming chore.
- Two identifiers look like synonyms, or one identifier is used for two things.
- Someone asks "what is a Decision here?" or "how do Plan, Block and Thread relate?"
- A review (`just review`) checks a branch against the glossary.

## Rules

1. **Glossary before code.** A noun appears in `docs/GLOSSARY.md` and as a schema before it appears anywhere else. The scaffold refuses otherwise (see `scripts/check-glossary.sh`).
2. **One concept, one word, everywhere.** The glossary entry lists the banned synonyms. Code, UI copy, events and the agent's replies all use the entry's word.
3. **Events and commands are glossary words in a tense.** Command: imperative, what a Participant asks (`ResolveThread`). Event: past tense, what happened (`ThreadResolved`). A command or event whose stem is not a glossary noun or verb is a defect.
4. **Bounded contexts say where a word stops.** The same word may mean different things in two contexts; then it gets two entries, each naming its context. Never share a type across contexts to save typing.
5. **A phrase that does not map is a decision.** Do not pick a name quietly. Open a thread on the block (in Greenhouse) or a decision report (viz-explainer) with the candidate words as options, each tried against the sentences users actually say.
6. **Explain with a picture, not a page.** Any explanation of the vocabulary is a viz-explainer artifact: a vocabulary map for structure, a state explorer for one noun's lifecycle. No Markdown explainer files. The glossary itself stays a file because it is data; `just glossary` renders it.
7. **Agent is a Participant.** Nothing the agent does gets its own noun. If an agent action needs a new word, a person could issue the same command, and the word is theirs.

## Build sequence

1. **Read `docs/GLOSSARY.md`.** If the noun is there, use its word and stop.
2. **If it is not, search before you name.** Use web search and the DeepWiki MCP (`mcp__deepwiki`, ask it about `githubnext/chopin` and two shipped products in the same space) for what people already call this concept. Collect the candidate words and the sentence each product uses them in. Pick the word users say, not the word engineers say, and record the two runners-up under `Not:`.
3. **Draft the entry** in the format in `references/glossary-format.md`: definition in the user's words, context, the type that carries it, the events it appears in, synonyms it replaces, and one line `Seen in:` naming where the search found the word.
4. **Write the schema** for it in `packages/schema` in the same change. Entry and schema land together or not at all.
5. **If the noun touches more than one context**, or replaces an existing word, render the vocabulary map (`references/vocabulary-map.md`) so the change is visible before it is argued about.
6. **Run `scripts/check-glossary.sh docs/GLOSSARY.md packages`** and fix what it names.
7. **Say the sentence.** Write one line a user would say that uses the new word. If it sounds wrong in their mouth, the word is wrong.

## Explain mode

When asked to explain the domain or a term, do not write prose. Load `viz-explainer` and build:

- **Vocabulary map** (architecture-map kind): contexts as subgraphs, nouns as nodes, relationships as labelled edges, one step per noun with its definition as the caption and the glossary line as evidence. Starter spec in `references/vocabulary-map.md`; worked example in `assets/example-vocabulary-map.html`.
- **Lifecycle** (state-explorer kind) when the question is about one noun that has states.
- **Decision report** when the question is which word to use.

Hand over the file path and one line. The artifact is the explanation.

## Reference

- `references/glossary-format.md`: the entry format and the Greenhouse starter glossary.
- `references/vocabulary-map.md`: how to turn the glossary into a viz-explainer spec, with the Greenhouse spec.
- `scripts/check-glossary.sh`: fails when a command or event name in code has no glossary entry. Wire it as a `just` recipe and a pre-commit hook.
