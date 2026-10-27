# Glossary format

`docs/GLOSSARY.md` is data, so its shape is fixed. One entry per noun or verb, alphabetical within a context. The check script parses the `##` headings and the `Not:` line.

```md
# Glossary

## Context: Planning

### Decision
How a Thread ended: who decided, when, what was chosen, and the Block it changed.
Carried by: `Decision` schema · Events: `DecisionRecorded` · Commands: `ResolveThread`
Not: outcome, resolution, verdict, choice

### Thread
A comment thread anchored to exactly one Block. Opens, collects Replies, ends in a Decision.
Carried by: `Thread` schema · Events: `ThreadOpened`, `ReplyPosted`, `ThreadResolved` · Commands: `OpenThread`, `Reply`, `ResolveThread`
Not: discussion, comment chain, conversation
```

Rules for an entry:

- The definition is one or two sentences a user would nod at. No implementation words.
- `Carried by` names the schema. `Events` and `Commands` list every stem that uses the word; the check script cross-references these.
- `Not:` lists the synonyms this word replaces. Any of them appearing as an identifier is a defect.
- A word with two meanings gets two entries under two contexts. Never one entry with "or".

## Greenhouse starter glossary

Seven nouns and the commands and events that use them. This is the whole model.

| Word | Definition | Events | Commands |
|---|---|---|---|
| Plan | A document tied to a repo; one stream of events | `PlanForked` | `ForkPlan` |
| Block | A unit of the plan: prose, artifact or research | `BlockEdited`, `ArtifactAttached` | `EditBlock`, `AttachArtifact` |
| Thread | A comment thread anchored to one Block | `ThreadOpened`, `ReplyPosted`, `ThreadResolved` | `OpenThread`, `Reply`, `ResolveThread` |
| Decision | How a Thread ended: who, when, what, which Block | `DecisionRecorded` | (recorded by `ResolveThread`) |
| Exploration | An agent thread implementing one option, reporting back | `ExplorationStarted`, `ExplorationReported` | `RequestExploration` |
| Artifact | An agent-built interactive thing embedded in a Block | `ArtifactAttached` | `AttachArtifact` |
| Participant | A person or an agent; same commands, same rights | | |

Banned synonyms, so the agent never reaches for them: discussion, comment chain, resolution, verdict, outcome, task, note, page, section, widget, bot, assistant, user (say Participant or person).
