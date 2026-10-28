# Domain vocabulary

The ubiquitous language. The person says it, the code says it, the agent says it back. A noun appears here and in `packages/schema` before it appears anywhere else. `just domain-vocabulary-check` fails a build that disagrees with this file.

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

## Context: Agent work

### Session
Where Participants ask the agent, inside one Plan. Started by one Participant; others join; only the starter ends it. One stream per Session. Becomes the agent's Thread when the comment thread is renamed after the workshop.
Carried by: `SessionView` schema · Events: `SessionStarted`, `ParticipantJoined`, `SessionEnded` · Commands: `StartSession`, `JoinSession`, `EndSession`
Not: chat, conversation, call, meeting, workspace

### Run
One Ask, from queued to its result (pi-durable's word). One Run at a time per Session; others queue in order. Any Participant in the Session can steer a running Run; only whoever started it finishes it, or fails it with a reason.
Carried by: `Run` schema · Events: `RunQueued`, `RunStarted`, `RunSteered`, `RunFinished`, `RunFailed` · Commands: `Ask`, `StartRun`, `Steer`, `FinishRun`, `FailRun`
Not: job, task, prompt

## Context: Working together

### Participant
A person or an agent in a plan room. Same commands, same rights. The agent holds no command a person cannot issue, and signs in with its own Account.
Carried by: `ParticipantId` schema · Events: `ParticipantJoined` · Commands: none of its own; every command carries `by`, set from the sign-in
Not: user, member, bot, assistant, actor, author

## Context: Identity

### Account
How a Participant signs in: an email, a name, a password hash, and whether they are an admin. One stream per email, so two sign-ups for one email cannot both win.
Carried by: `Account` schema · Events: `AccountOpened` · Commands: `SignUp`, `OpenAccount` (seeds and `just user-add`)
Not: profile, login, identity, credentials

### Sign-in
One live sign-in on one device: the hash of a token, and when it expires. Signing out ends that one only. Never called a session: that word is agent work.
Carried by: the `sign_ins` table · Events: `SignedIn`, `SignedOut` · Commands: `SignIn`, `SignOut`
Not: cookie, login

## Verbs

Open, Reply, Resolve, Edit, Attach, Request, Fork, Start, Join, Ask, Steer, Finish, Fail, End, Sign up, Sign in, Sign out. Imperative in a command, past tense in an event. No other verbs name a command.
