# Glossary

The ubiquitous language. The person says it, the code says it, the agent says it back. A noun appears here and in `packages/schema` before it appears anywhere else. `just glossary-check` fails a build that disagrees with this file.

## Context: Planning

### Artifact
An interactive page the agent built, embedded in a Block. A decision report, a state explorer, a trace.
Carried by: `Artifact` schema · Events: `ArtifactAttached` · Commands: `AttachArtifact`
Not: widget, page, embed, iframe

### Block
One unit of a Plan: prose, an artifact or research. Edits to a Block are events; last writer wins per block.
Carried by: `Block` schema · Events: `BlockEdited` · Commands: `EditBlock`
Not: section, paragraph, cell, node

### Decision
How a Thread ended: who decided, when, what was chosen, and the Block it changed. Stays attached to the Block as the Plan keeps changing.
Carried by: `Decision` schema · Events: `DecisionRecorded` · Commands: `ResolveThread`
Not: resolution, verdict, outcome, choice, conclusion

### Exploration
An agent thread implementing one option and reporting back into the Plan. Explorations are compared; one is chosen by a Decision.
Carried by: `Exploration` schema · Events: `ExplorationStarted`, `ExplorationReported` · Commands: `RequestExploration`
Not: experiment, spike, branch, worktree

### Plan
A document tied to one repo. Everything that happens to it is one stream of events, held by one PlanRoom.
Carried by: `PlanView` schema · Events: `PlanForked` · Commands: `ForkPlan`
Not: document, doc, page, spec

### Reply
A message appended to an open Thread by a Participant.
Carried by: part of `Thread` · Events: `ReplyPosted` · Commands: `Reply`
Not: comment, message, response, answer

### Thread
A comment thread anchored to exactly one Block. Opens, collects Replies, ends in a Decision. Cannot be resolved twice.
Carried by: `Thread` schema · Events: `ThreadOpened`, `ThreadResolved` · Commands: `OpenThread`, `ResolveThread`
Not: discussion, conversation, comment chain, issue, ticket

## Context: Identity

### Participant
A person or an agent in a plan room. Same commands, same rights. The agent holds no command a person cannot issue.
Carried by: `ParticipantId` schema · Events: none yet · Commands: none; every command carries `by`
Not: user, member, bot, assistant, actor, author

## Verbs

Open, Reply, Resolve, Edit, Attach, Request, Fork. Imperative in a command, past tense in an event. No other verbs name a command.
