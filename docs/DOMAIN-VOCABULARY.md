# Domain vocabulary

The ubiquitous language. The person says it, the code says it, the agent says it back. A noun appears here and in code before it appears anywhere else: commands and events in `packages/domain/src/<context>/decider.ts`, views and ids in `packages/schema`. `just domain-vocabulary-check` fails a build that disagrees with this file. A context's `Not:` words are banned in the files under its `Paths:`; a context without `Paths:` bans them everywhere.

## Context: Planning
Paths: packages/domain/src/thread, packages/domain/src/upcast, packages/domain/src/index.ts, packages/schema

### Artifact
An interactive page the agent built, embedded in a Block. A decision report, a state explorer, a trace.
Example: "The agent attached a decision report to the retries Block; step through it before you resolve."
Carried by: `Artifact` schema · Events: `ArtifactAttached` · Commands: `AttachArtifact`
Not: widget, page, embed, iframe

### Block
One unit of a Plan: prose, an artifact or research. Edits to a Block are events; last writer wins per block.
Example: "Sam edited the retries Block while Ana was still replying on its Thread."
Carried by: `Block` schema · Events: `BlockEdited` · Commands: `EditBlock`
Not: section, paragraph, cell, node

### Decision
How a Thread ended: who decided, when, what was chosen, and the Block it changed. Stays attached to the Block as the Plan keeps changing.
Example: "The Decision on the retries Block says wrapper, by Pratos, on 28 October."
Carried by: `Decision` schema · Events: `DecisionRecorded` · Commands: `ResolveThread`
Not: resolution, verdict, outcome, choice, conclusion

### Exploration
An agent thread implementing one option and reporting back into the Plan. Explorations are compared; one is chosen by a Decision.
Example: "Request an Exploration of the client and one of the wrapper, then compare what each reports."
Carried by: `Exploration` schema · Events: `ExplorationStarted`, `ExplorationReported` · Commands: `RequestExploration`
Not: experiment, spike, branch, worktree

### Plan
A document tied to one repo. Everything that happens to it is one stream of events, held by one PlanRoom.
Example: "Fork the gh-12 Plan so we can try the other retry policy without touching this one."
Carried by: `PlanView` schema · Events: `PlanForked` · Commands: `ForkPlan`
Not: document, doc, page, spec

### Reply
A message appended to an open Thread by a Participant.
Example: "The agent's Reply says the wrapper is one place to change."
Carried by: part of `Thread` · Events: `ReplyPosted` · Commands: `Reply`
Not: comment, message, response, answer

### Thread
A comment thread anchored to exactly one Block. Opens, collects Replies, ends in a Decision. Cannot be resolved twice.
Example: "Open a Thread on the retries Block: client or wrapper?"
Carried by: `Thread` schema · Events: `ThreadOpened`, `ThreadResolved` · Commands: `OpenThread`, `ResolveThread`
Not: discussion, conversation, comment chain, issue, ticket

## Context: Agent work
Paths: packages/domain/src/session, packages/schema

### Session
Where Participants ask the agent, inside one Plan. Started by one Participant; others join; only the starter ends it. One stream per Session. Becomes the agent's Thread when the comment thread is renamed after the workshop.
Example: "Pratos started a Session on plan gh-12, and Sam and Ana joined to ask about retries."
Carried by: `SessionView` schema · Events: `SessionStarted`, `ParticipantJoined`, `SessionEnded` · Commands: `StartSession`, `JoinSession`, `EndSession`
Not: chat, conversation, call, meeting, workspace

### Run
One Ask, from queued to its result (pi-durable's word). One Run at a time per Session; others queue in order. Any Participant in the Session can steer a running Run; only whoever started it finishes it, or fails it with a reason.
Example: "Sam's question is queued behind Pratos's Run; Ana steered the running one to keep the wrapper sync."
Carried by: `Run` schema · Events: `RunQueued`, `RunStarted`, `RunSteered`, `RunFinished`, `RunFailed` · Commands: `Ask`, `StartRun`, `Steer`, `FinishRun`, `FailRun`
Not: job, task, prompt

## Context: Working together

### Participant
A person or an agent in a plan room. Same commands, same rights. The agent holds no command a person cannot issue, and signs in with its own Account.
Example: "Every Participant in the Session, the agent included, can steer a running Run."
Carried by: `ParticipantId` schema · Events: `ParticipantJoined` · Commands: none of its own; every command carries `by`, set from the sign-in
Not: user, member, bot, assistant, actor, author

## Context: Identity
Paths: packages/domain/src/account

### Account
How a Participant signs in: an email, a name, a password hash, and whether they are an admin. One stream per email, so two sign-ups for one email cannot both win.
Example: "Sam signed up with sam@greenhouse.test, so a second sign-up with that email is refused."
Carried by: `Account` schema · Events: `AccountOpened` · Commands: `SignUp`, `OpenAccount` (seeds and `just user-add`)
Not: profile, login, identity, credentials

### Sign-in
One live sign-in on one device: the hash of a token, and when it expires. Signing out ends that one only. Never called a session: that word is agent work.
Example: "Sam signed out on the laptop; the Sign-in on the phone still works."
Carried by: the `sign_ins` table · Events: `SignedIn`, `SignedOut` · Commands: `SignIn`, `SignOut`
Not: cookie, login, session

## Context map

One line per relationship: upstream → downstream, the pattern, what crosses, and why the two stay separate.

- Identity → every context: open host with a published language. Only the signed-in Account's id crosses, as the `ParticipantId` in every command's `by`; passwords and Sign-ins never leave Identity.
- Working together → Planning, Agent work: shared kernel. Participant and `by` mean the same thing in both; change them only with both contexts' tests green.
- Planning ↔ Agent work: partnership. Both live in one PlanRoom and ship together, but neither imports the other's types: a Thread ends in a Decision on one Block, a Session holds Runs and decides nothing. The rename after the workshop makes the Session the agent's Thread; it does not merge them.
- Agent work → pi-durable: conformist. Run is pi-durable's word, taken as is; an anticorruption layer goes in the day the two words diverge.

## Verbs

Open, Reply, Resolve, Edit, Attach, Request, Fork, Start, Join, Ask, Steer, Finish, Fail, End, Sign up, Sign in, Sign out. Imperative in a command, past tense in an event. No other verbs name a command.
