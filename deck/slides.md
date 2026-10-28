<!-- .slide: class="statement" -->

<div class="poster-label">GROWTHX · SHIPPING RELIABLE PRODUCTS</div>

# Use Opus 5.5 mid on Claude Code.

Note:
Use this file as the source of truth. New horizontal slides with `---`, vertical /btw slides with `--`.

Say it flat. Let it sit for two seconds. Click.

---
<!-- .slide: class="statement giant center" -->

# Fin.

<p class="subtitle fragment fade-in">😛</p>

Note:
Hold. Let them laugh or not. Click.

---
<!-- .slide: class="statement" -->

<div class="poster-label">WHOAMI</div>

# thank you. i'm pratos.

<p class="subtitle fragment fade-in-then-semi-out">AI Fiend</p>
<p class="subtitle fragment fade-in-then-semi-out">3/4th Fractional Head of AI @ NotYourIdea</p>
<p class="subtitle fragment fade-in-then-semi-out">1/4th Chronically Online</p>
<p class="subtitle fragment fade-in">…the organisers say I have 2 hours and 28 minutes left.</p>

Note:
Beat. Then: "fine. Here's the actual talk."

---
<!-- .slide: class="statement" -->

<div class="poster-label">THE THESIS</div>

## Agents made the typing cheap.

<h2 class="fragment fade-in">They did not make the thinking cheap.</h2>

<p class="kicker fragment fade-in">Everyone is a product engineer. The agent is your colleague. Your job is to make its life easier.</p>

Note:
Any code committed is tech debt. An arrow shot cannot be taken back. What changed is who shoots and how fast. In the rush we dropped the engineering practices that got us here. They were never about typing speed. They are about keeping a system legible to whoever works on it next, and the agent is now whoever works on it next.

---
<!-- .slide: class="statement" -->

<div class="poster-label">THE CHECK-IN · N = 12</div>

## Who is in the room

<div class="tile-row four">
  <div class="poster-tile fragment fade-in"><h3>9 of 12</h3><p>L3/L4, terminal every day</p></div>
  <div class="poster-tile fragment fade-in"><h3>7 of 12</h3><p>want parallel agents, automation, custom tooling</p></div>
  <div class="poster-tile fragment fade-in"><h3>3 of 12</h3><p>work in a large production codebase</p></div>
  <div class="poster-tile you fragment fade-in"><h3>5 of 12</h3><p>debug by pasting the error back, or starting over</p></div>
</div>

Note:
Six engineers, two growth, two founders, one PM, one data. The last tile is the one the whole evening is about.

---
<!-- .slide: class="meme-slide" -->

<div class="poster-label">HOW WE DEBUG TODAY</div>

## "paste the error back, or start over"

<img class="meme-image" src="images/kot/psyduck.webp" alt="Psyduck staring at a monitor, holding its head" />

<p class="caption">five of twelve. no judgement. this was me in March.</p>

---
<!-- .slide: class="statement" -->

<div class="poster-label">RUN OF SHOW · 19:30–22:00 IST</div>

## Two and a half hours, two agent runs, one ticket

<ul class="agenda">
  <li><span class="t">19:30</span><span>How coding agents work</span><span class="d">10 min · live</span></li>
  <li><span class="t">19:40</span><span>Prompting vs engineering · ten tenets</span><span class="d">15 min</span></li>
  <li><span class="t">19:55</span><span>Brooks, twice</span><span class="d">15 min · poll</span></li>
  <li class="hands"><span class="t">20:10</span><span>Run 1 · pi · fresh clone → passing expect test</span><span class="d">30 min · hands-on</span></li>
  <li><span class="t">20:40</span><span>Questions · break</span><span class="d">18 min</span></li>
  <li class="hands"><span class="t">20:58</span><span>Run 2 · Claude Code · UI → merge-ready PR</span><span class="d">25 min · hands-on</span></li>
  <li><span class="t">21:30</span><span>Durable and multiplayer: the harness in the cloud</span><span class="d">20 min</span></li>
  <li><span class="t">21:50</span><span>Released, then changed under real users</span><span class="d">7 min</span></li>
  <li><span class="t">21:57</span><span>You are the gardener</span><span class="d">3 min</span></li>
</ul>

Note:
Everything hands-on happens inside the two runs. Clone Greenhouse during the break if you haven't.

---
<!-- .slide: class="section-slide" -->

<div class="num">00</div>

# How coding agents work

<p class="subtitle">most of what feels like magic is six lines of plumbing</p>

---

<div class="poster-label">THE LOOP, HONESTLY</div>

## A harness is a program

```text
context = system prompt + AGENTS.md + skills + conversation + tool results
loop:
  reply  = model(context, tools)
  if reply has no tool call: break
  result = execute(reply.tool_call)       # shell, read, write, browser…
  context += reply + result               # this is where context grows
```


Note:
Assemble context, ask a model, execute whatever tool call comes back, feed the result in again until the model stops asking. That's it. Everything else is a decision the harness made for you.
Cut from screen: you decide: which tools exist · what needs approval · what gets compacted · what persists · who else can see the thread

---
<!-- .slide: class="meme-slide" -->

<div class="poster-label">CONTEXT ASSEMBLY</div>

## Everything the agent "knows", the harness put there

<img class="meme-image" src="images/kot/pepe-silvia.webp" alt="Pepe Silvia conspiracy board" />

<p class="caption">instructions files · loaded skills · tool results.</p>

Note:
Cut from screen: instructions files · loaded skills · tool results. skills are just files added to context on demand. this is why AGENTS.md and the living wiki matter.

---

<div class="poster-label">CONTEXT ECONOMICS</div>

<div class="live">live</div>

## The model remembers nothing. Every turn re-sends everything.

```text
[ system prompt + tool definitions ]   changes when: tool set changes, upgrade
[ CLAUDE.md · auto memory · rules   ]   changes when: session start, /clear, /compact
[ conversation · tool results        ]   changes when: every turn (appended at the end)

turn n:   [sys][ctx][msg1 … msg n-1] ← cache   [msg n] ← processed
/model:   [sys][ctx][msg1 … msg n  ] ← ALL recomputed. each model has its own cache.
```

<p class="kicker">the cache matches the <strong>prefix</strong>, exactly. change byte 1 and everything after it is recomputed.</p>

Note:
Live: tail a pi session log while it runs one tool call. Then /usage in Claude Code to show the hit ratio and the reason for the last miss.

--
<!-- .slide: class="btw-slide" -->

<div class="poster-label">/BTW</div>

## What breaks the cache, what keeps it

<div class="split">
  <div>
    <h3 class="you-h">breaks it</h3>
    <ul>
      <li>switching model, changing effort, toggling fast mode</li>
      <li>changing the loaded tool set (an MCP connecting, denying a whole tool)</li>
      <li>compaction, by design</li>
    </ul>
  </div>
  <div>
    <h3 class="agent-h">keeps it</h3>
    <ul>
      <li>editing files, invoking skills (appended)</li>
      <li>changing permission mode, /rewind</li>
      <li>spawning a subagent (its own cache)</li>
    </ul>
  </div>
</div>

<p class="kicker">pick model and effort at the top of a session and leave them. hence: <strong>Opus 5.5 mid. Fin.</strong></p>

Note:
Editing CLAUDE.md mid-session keeps the cache because it does not apply until the next /clear. Run /compact at a boundary between tasks, not mid-task.

--
<!-- .slide: class="btw-slide" -->

<div class="poster-label">/BTW</div>

## Token diet

<div class="tile-row three">
  <div class="poster-tile"><h3>Tool output is tokens</h3><p>A <code>just test</code> that prints 400 lines on success is a tax on every later turn. Quiet on success.</p></div>
  <div class="poster-tile"><h3>Defer the schemas</h3><p>MCP tool schemas loaded on demand: a connector costs a name, not a schema.</p></div>
  <div class="poster-tile"><h3>Research elsewhere</h3><p>DeepWiki or a throwaway session. Only the answer comes back, as a paragraph you read first.</p></div>
</div>

<p class="kicker mono">/context shows what is in the window · /usage shows the hit ratio and names the last miss</p>

---
<!-- .slide: class="section-slide" -->

<div class="num">01</div>

# Prompting vs engineering

<p class="subtitle">why basics, why now</p>

---
<!-- .slide: class="meme-slide" -->

<div class="poster-label">THERE IS NO RIGHT WAY TO DO AI CODING</div>

<img class="meme-image wide up" src="images/kot/midwit.webp" alt="IQ bell curve meme" />

<div class="tile-row three" style="position:absolute;left:96px;right:96px;bottom:48px;margin:0">
  <div class="poster-tile fragment fade-in"><p>"just prompt it bro"</p></div>
  <div class="poster-tile fragment fade-in"><p>"12 parallel agents, 4 worktrees, an orchestrator, MCP for everything, 40k-token CLAUDE.md"</p></div>
  <div class="poster-tile fragment fade-in"><p>"just prompt it bro"<br><em>…with types, tests and a glossary</em></p></div>
</div>

Note:
Every path leads to tech debt. The difference is whether the next reader, human or model, can still tell what the system is.

---
<!-- .slide: class="statement" -->

<div class="poster-label">A WORKING DEFINITION FOR THE DAY</div>

## An agent will cook.

<h2 class="fragment fade-in">Whether what comes out is edible depends on your intent.</h2>

<p class="kicker fragment fade-in">and intent is an engineering artefact.</p>

Note:
Machine empathy made you a good engineer for the computer. Agent empathy is the same muscle. Good agent experience needs great developer experience underneath it.

---
<!-- .slide: class="statement" -->

<div class="poster-label">SCOPE</div>

<div class="split" style="margin-top:120px">
  <div>
    <h3 class="agent-h">personal level · in scope</h3>
    <p>A very good bump in what one person can do. One person can change their own habits tomorrow.</p>
  </div>
  <div>
    <h3 class="you-h">team level · out of scope</h3>
    <p>Huge variance. Another session. Nothing tonight depends on a process change.</p>
  </div>
</div>

---
<!-- .slide: class="section-slide" -->

<div class="num">Pillar 01</div>

# Everyone is a product engineer

<p class="subtitle">features are not asks · any code that makes money is good code</p>

---
<!-- .slide: class="meme-slide" -->

<div class="poster-label">INTENT IS THE INPUT</div>

## your intent &nbsp;·&nbsp; what the agent built

<img class="meme-image tall" src="images/kot/mona-lisa.webp" alt="Mona Lisa next to a child's crayon copy" />

<p class="caption">the agent faithfully built the ask. translating the ask into the feature was yours.</p>

Note:
An ask is what someone typed in a ticket. A feature is the change in the user's day. Prompts, plans, tests, types and docs are all the same thing: intent written down so a second brain can act on it without you in the room.

---

<div class="poster-label">THE TEN TENETS</div>

## None of these are about tools

<div class="tile-row five">
  <div class="poster-tile fragment fade-in"><h3>01</h3><p>Understand the problem space</p></div>
  <div class="poster-tile fragment fade-in"><h3>02</h3><p>User, machine, fellow-dev… and <strong>agent</strong> empathy</p></div>
  <div class="poster-tile fragment fade-in"><h3>03</h3><p>Outcomes, not output</p></div>
  <div class="poster-tile fragment fade-in"><h3>04</h3><p>Be comfortable with ambiguity. Agents are not.</p></div>
  <div class="poster-tile fragment fade-in"><h3>05</h3><p>Ship fast, think and act slowly</p></div>
  <div class="poster-tile you fragment fade-in"><h3>06</h3><p>Talk to users who use your product</p></div>
  <div class="poster-tile fragment fade-in"><h3>07</h3><p>Always use your product</p></div>
  <div class="poster-tile fragment fade-in"><h3>08</h3><p>Connect the dots</p></div>
  <div class="poster-tile fragment fade-in"><h3>09</h3><p>Use LLMs to augment your learning</p></div>
  <div class="poster-tile fragment fade-in"><h3>10</h3><p>Develop taste</p></div>
</div>


Note:
Output is now nearly free; measure yourself by it and the agent buries you in it. Resolving ambiguity before handoff is the highest-leverage thing you do all day. Taste is what you review with; without it every suggestion looks equally fine.
Cut from screen: every one of them changes what the agent gets handed.

---
<!-- .slide: class="statement" -->

<div class="poster-label you">TENET 06 · THE EXTRA MINUTE</div>

## How well do you interview your users?

<p class="kicker">no agent can do this for you, and everything downstream depends on it.</p>

---
<!-- .slide: class="statement" -->

<div class="poster-label">ONE SENTENCE ON PARALLEL AGENTS</div>

## Explore in parallel. Commit serially.

<p class="subtitle fragment fade-in">many threads to explore · one thread to build · one inverted reviewer after</p>

Note:
Coding is one sixth of the job. A fan-out there speeds up the sixth and multiplies the five sixths you still owe. The merge is where correct code becomes wrong. Brooks will say why in a minute.

---
<!-- .slide: class="section-slide" -->

<div class="num">Pillar 02 · 03</div>

# Brooks, twice

<p class="subtitle">The Mythical Man-Month (1975) · No Silver Bullet (1986)</p>

---
<!-- .slide: class="statement" -->

<div class="poster-label">THE BOOK'S OPENING EPIGRAPH</div>

## "Good cooking takes time. If you are made to wait, it is to serve you better, and to please you."

<p class="subtitle">Menu of Antoine's, New Orleans</p>

<p class="kicker fragment fade-in">agents collapsed the wait. the cooking still takes the time it takes. it moved from the keyboard into planning, testing and reading.</p>

---

<div class="poster-label">ESTIMATION AND OPTIMISM · CHAPTER TWO</div>

## Coding was already the smallest slice in 1975

<div class="fractions">
  <div><strong>1/3</strong><span>planning</span></div>
  <div class="agent-slice"><strong>1/6</strong><span>coding</span></div>
  <div><strong>1/4</strong><span>component test</span></div>
  <div><strong>1/4</strong><span>system test</span></div>
</div>


Note:
Optimism and bad estimation sink software, and they are the same thing. Agents give us even less reason to pause.
Cut from screen: treat the coding slice as the whole job and your estimate is off by a factor of six before you start.

---

<div class="poster-label">THE SURGICAL TEAM · CHAPTER THREE · REMAPPED</div>

## One surgeon. Not ten surgeons operating at once.

<table class="tight">
  <tr><th>role</th><th>filled by</th><th>at your desk</th></tr>
  <tr><td>Surgeon</td><td><span class="tag you">you</span></td><td>owns the problem, the design, the final call</td></tr>
  <tr><td>Copilot</td><td><span class="tag agent">agent</span></td><td>knows the design, argues with it, writes most of the code. does not own it</td></tr>
  <tr><td>Administrator</td><td><span class="tag you">you</span></td><td>environment, tooling, access. make it run anywhere</td></tr>
  <tr><td>Editor</td><td><span class="tag agent">agent</span></td><td>docs, changelogs, the "why", kept current</td></tr>
  <tr><td>Program clerk</td><td><span class="tag agent">agent</span></td><td>review passes, skills, bookkeeping of what was tried</td></tr>
  <tr><td>Toolsmith · tester · lawyer</td><td><span class="tag both">shared</span></td><td>agents do the volume; you decide what counts as passing</td></tr>
</table>

---
<!-- .slide: class="statement" -->

<div class="poster-label">BROOKS'S LAW, 2026 EDITION</div>

## Adding agent sessions to a confused task makes it more confused.

<p class="kicker fragment fade-in">every session routes its questions through the same person. <strong>you are the communication overhead now.</strong></p>

Note:
Also from the book: "How does a project get to be a year late? One day at a time." Agents hide slippage well because something always got produced. Plan to throw one away is finally affordable: let the agent build v1 to learn the problem, then throw it away on purpose.

---

<div class="poster-label">NO SILVER BULLET · 1986</div>

## Agents are the strongest attack on accident we have seen. The essence did not move.

<div class="split">
  <div>
    <h3 class="agent-h">accidental difficulty</h3>
    <ul>
      <li>syntax, boilerplate, glue</li>
      <li>looking things up, remembering APIs</li>
      <li>mechanical refactors, test scaffolding</li>
      <li>translating between languages and formats</li>
    </ul>
  </div>
  <div>
    <h3 class="you-h">essential difficulty</h3>
    <ul>
      <li><strong>complexity</strong>: the shape of the data and its invariants</li>
      <li><strong>conformity</strong>: the messy world the software must match</li>
      <li><strong>changeability</strong>: what users will ask for next</li>
      <li><strong>invisibility</strong>: nobody sees the whole system. not the agent either</li>
    </ul>
  </div>
</div>

Note:
Agent complexity is hill climbing. Given a hard target it takes shortcuts, and it cannot do well on things it cannot see. So No Silver Bullet is a to-do list: everything that shrinks the essence for a human shrinks it for the agent.

---

<div class="poster-label">KEEPING UP WITHOUT THE FOMO</div>

## "everyone on the timeline is doing unbelievable things"

<div class="split">
  <div>
    <h3 class="agent-h">keep up with</h3>
    <p>Your own loop: intent → verified change. Measure it on your repo, not a demo. One new tool a month, on a real ticket, kept only if the loop got faster.</p>
  </div>
  <div>
    <h3 class="you-h">let go of</h3>
    <p>Leaderboards, launches, thirty-second clips. The unbelievable thing in the clip was usually the basics, applied by someone who did not skip them.</p>
  </div>
</div>

Note:
Cut from screen: the gain any tool can give you is bounded by how much accident is left in your work.

---
<!-- .slide: class="statement" -->

<div class="poster-label you">CHAT POLL · 2 MINUTES</div>

## Estimate GH-12 with the fractions.

<p class="subtitle">"Resolve a comment thread into a decision." Command, two events, a projection, a resolve button, one browser flow.</p>

<p class="kicker fragment fade-in">write a number of hours in chat. we come back to it at 21:57.</p>

---
<!-- .slide: class="section-slide" -->

<div class="num">Run 1 · 30 min · hands-on</div>

# pi: fresh clone → passing expect test

<p class="subtitle">git clone … && just up</p>

---

<div class="poster-label">GH-12 · THE REAL TICKET · BOTH RUNS</div>

## Resolve a comment thread into a decision

<div class="tile-row three">
  <div class="poster-tile agent"><h3>Domain · Run 1</h3><p><code>ResolveThread</code> → <code>ThreadResolved</code>, <code>DecisionRecorded</code>. Decision-log projection. Expect test read as a story.</p></div>
  <div class="poster-tile agent"><h3>UI · Run 2</h3><p>Resolve action on the thread, one-line "what was decided", marker on the block. One Stagehand flow.</p></div>
  <div class="poster-tile you"><h3>Review</h3><p>A different model, against GLOSSARY.md. There is a planted bug. We'll see if it survives.</p></div>
</div>

<p class="kicker mono">invariant: a decision references exactly one thread and one block. a resolved thread cannot be resolved twice.</p>

Note:
This is Chopin's "decision ownership" problem as one ticket. Done means: expect and e2e green, Stagehand green, glossary updated, PR with walkthrough, release checklist attached. And the GH-12 plan, inside Greenhouse, shows the decision that chose the modelling.

---

<div class="poster-label">THE SPEAKER'S DESK · 2 MIN</div>

<div class="live">live</div>

## cmux: four panes, one workspace

<div class="tile-row four">
  <div class="poster-tile"><h3>pi</h3><p>small, vanilla, hackable. the harness you can read.</p></div>
  <div class="poster-tile"><h3>Claude Code</h3><p>long runs, skills, hooks, subagents.</p></div>
  <div class="poster-tile"><h3>logs</h3><p>the session file, tailed. context in, tool call out.</p></div>
  <div class="poster-tile"><h3>browser</h3><p>Greenhouse, Agentation toolbar on.</p></div>
</div>

Note:
Cut from screen: dotfiles · keybindings · global AGENTS.md

---

<div class="poster-label">RUN 1 · THE SCRIPT</div>

<div class="live">live</div>

## Nobody at the keyboard

```text
just up                 # nix develop + process-compose: db, minio, mail, api, web
just plan GH-12         # a plan room opens. the agent drafts blocks.
just explore GH-12      # two threads: one event or two? both get implemented.
                        # → decision report in the plan. click one. it is recorded.
just new command ResolveThread
just new event ThreadResolved
just new projection DecisionLog
just test               # expect (ms) → event-replay e2e (s), running in the background
```


Note:
Attendees clone alongside. If just up is over three minutes on their machine they watch Run 1 and follow along in Run 2.
Cut from screen: the decision comes back as an interactive report, not a three-option prompt. pick one, then the domain half.

--
<!-- .slide: class="btw-slide" -->

<div class="poster-label">/BTW · GREENHOUSE</div>

## A planning room, in the spirit of GitHub Next's Chopin

```text
Plan         — a document tied to a repo; a stream of events
Block        — a unit of the plan: prose, artifact, or research
Thread       — a comment thread anchored to one block
Decision     — how a thread ended: who, when, what, which block
Exploration  — an agent thread implementing one option, reporting back
Participant  — a person or an agent; same commands, same rights

EditBlock → BlockEdited      OpenThread → ThreadOpened      Reply → ReplyPosted
ResolveThread → ThreadResolved → DecisionRecorded
RequestExploration → ExplorationStarted … ExplorationReported
```


Note:
Chopin names three gaps: plans are not interactive, decisions have no owner, agents explain in text when a picture would do. Greenhouse is the smallest cut that still proves the point.
Cut from screen: decisions are events, so event sourcing is the model, not a flourish. the ticket for Greenhouse gets planned inside Greenhouse.

--
<!-- .slide: class="btw-slide" -->

<div class="poster-label">/BTW · THE STACK</div>

## Good enough. Boring on purpose.

<table class="tight">
  <tr><th>layer</th><th>choice</th><th>practice it shows</th></tr>
  <tr><td>runtime</td><td>Bun + TypeScript</td><td>run anywhere</td></tr>
  <tr><td>backend · schema</td><td>Effect, Effect Schema shared across API, UI, MCP, tests</td><td>types as design language · one vocabulary</td></tr>
  <tr><td>db · events</td><td>Postgres + Drizzle, one append-only events table</td><td>make the data visible</td></tr>
  <tr><td>realtime · agent</td><td>Durable Object per plan, pi-durable session per room</td><td>event sourcing · trust ladder</td></tr>
  <tr><td>frontend</td><td>TanStack Start, shadcn/ui, block-level Markdown, no CRDT</td><td>simple components</td></tr>
  <tr><td>local · deploy</td><td>Nix + process-compose · Alchemy on Cloudflare</td><td>DX is agent DX · read the docs</td></tr>
</table>

Note:
Cut from screen: every unusual choice is a place where the agent will confidently guess.

--
<!-- .slide: class="btw-slide" -->

<div class="poster-label">/BTW · THE JUSTFILE</div>

## If a thing is not a recipe here, the agent will invent its own way to do it

```text
just up · just test · just test:ui
just new command|event|projection|route <Name>
just plan <ticket> · just explore <ticket>
just trace <session-id> · just replay <stream-id>
just review · just deploy
```

Note:
Cut from screen: the justfile is the contract between you, the agent and the sandbox.

---
<!-- .slide: class="meme-slide" -->

<div class="poster-label">ONE VOCABULARY, THREE SPEAKERS</div>

## Order, Booking, Reservation… the agent invents a fourth

<img class="meme-image" src="images/kot/circles.webp" alt="Factory worker watching a circle come down a triangle conveyor: i guess we doin circles now" />

<p class="caption">put the glossary in the repo, next to the code.</p>

Note:
DDD's ubiquitous language: the words in the code are the words in the conversation with the user. When a user's phrase does not map to a type, that is a design finding, not a naming chore. Watch for it in the review: the planted bug is a vocabulary bug.
Cut from screen: the agent learns the domain from your identifiers. put the glossary in the repo, next to the code, where both of you read it.

---

<div class="poster-label">TESTS THE AGENT CAN LEARN FROM</div>

## Three layers. No unit tests for their own sake.

<div class="tile-row three">
  <div class="poster-tile agent"><h3>expect · ms</h3><p>command + starting stream in, events out, as a snapshot a human reads like a story. simulated clock.</p></div>
  <div class="poster-tile agent"><h3>event-replay e2e · s</h3><p>commands through the real API against local Postgres. assert on the stream. no browser.</p></div>
  <div class="poster-tile you"><h3>Stagehand · min</h3><p>the three or four flows where the browser is the point. natural-language steps.</p></div>
</div>


Note:
Do not write: unit tests of a function the types already constrain, mocks of your own modules, browser tests for things the event log already proves.
Cut from screen: feedback in milliseconds beats feedback in a code review. the faster and more deterministic the loop, the better the agent climbs.

---
<!-- .slide: class="statement" -->

<div class="poster-label">QUESTIONS · ROUND ONE</div>

## while the e2e replay runs

<p class="subtitle">then 10 minutes. the Stagehand flow stays on screen.</p>

---
<!-- .slide: class="section-slide" -->

<div class="num">Run 2 · 25 min · hands-on</div>

# Claude Code: UI → merge-ready PR

<p class="subtitle">impeccable · animation skills · one Stagehand flow · just review</p>

---

<div class="poster-label">RUN 2 · THE SCRIPT</div>

<div class="live">live</div>

## Show me, don't tell me

<div class="tile-row four">
  <div class="poster-tile agent fragment fade-in"><h3>1 · artifact first</h3><p>a self-contained HTML mock of the resolve action, before any real UI. Agentation notes on it.</p></div>
  <div class="poster-tile agent fragment fade-in"><h3>2 · build under skills</h3><p>impeccable for craft, Emil's skills for the motion. Mobbin for "how do shipped apps do this".</p></div>
  <div class="poster-tile agent fragment fade-in"><h3>3 · Stagehand</h3><p>open a plan, comment, resolve, see the decision in the log.</p></div>
  <div class="poster-tile you fragment fade-in"><h3>4 · just review</h3><p>a different model. the glossary in context. walkthrough attached to the PR.</p></div>
</div>

Note:
Cut from screen: a rendered screen is a far better requirements document than a paragraph, for both of you.

---
<!-- .slide: class="meme-slide" -->

<div class="poster-label">REVIEW FOR UNDERSTANDING, NOT FOR APPROVAL</div>

## Model inversion: author with one, review with another

<img class="meme-image" src="images/kot/same-stupidity.webp" alt="Man gesturing at a laptop: now see for yourself, he is doing same stupidity that he always does" />

<p class="caption">correct code can be wrong. the first pass named the event <code>ThreadClosed</code>. every test passed. the vocabulary broke.</p>

Note:
Review agents fail in predictable ways: missed bugs, missing context, nitpicks, more runs producing more "bugs". Tell them to skip the nitpicks. The two models have different blind spots; that is the whole trick. Ask the agent to tell you why it did the thing. If it cannot explain the change, that is a finding.

---

<div class="poster-label">THE PLAYBOOK · TEN BASICS, NONE NEW</div>

## Each one written twice: for you, for the agent

<div class="tile-row five">
  <div class="poster-tile"><h3>01</h3><p>Make it run anywhere</p></div>
  <div class="poster-tile"><h3>02</h3><p>Types as the design language</p></div>
  <div class="poster-tile"><h3>03</h3><p>Tests the agent can learn from</p></div>
  <div class="poster-tile"><h3>04</h3><p>Keep it simple, three times</p></div>
  <div class="poster-tile"><h3>05</h3><p>Review for understanding</p></div>
  <div class="poster-tile"><h3>06</h3><p>One vocabulary, three speakers</p></div>
  <div class="poster-tile"><h3>07</h3><p>Event sourcing: e2e without the browser</p></div>
  <div class="poster-tile"><h3>08</h3><p>Keep a living wiki</p></div>
  <div class="poster-tile"><h3>09</h3><p>Read the docs</p></div>
  <div class="poster-tile"><h3>10</h3><p>Climb the trust ladder</p></div>
</div>


Note:
You just watched 1 through 9 run. 10 is the next section. The companion page has the depth for each.
Cut from screen: if the agent cannot run the thing in its own environment, you become the test harness.

---

<div class="poster-label">10 · THE TRUST LADDER</div>

## Earn autonomy one rung at a time

<div class="ladder">
  <div><span class="n">1</span><span>small, vanilla agent. <em>start here.</em></span></div>
  <div><span class="n">2</span><span>add plugins and skills: your conventions</span></div>
  <div><span class="n">3</span><span>add connectors (MCP): your systems</span></div>
  <div><span class="n">4</span><span>deploy to the cloud, unattended</span></div>
</div>

Note:
Cut from screen: building your own small harness, even a toy one, is still the fastest way to understand what a coding agent is actually doing.

---
<!-- .slide: class="statement" -->

<div class="poster-label">QUESTIONS · ROUND TWO</div>

## usually about tools

--
<!-- .slide: class="btw-slide" -->

<div class="poster-label">/BTW · PICK THE TOOL FOR YOUR PLATFORM, NOT THE LEADERBOARD</div>

<table class="tight">
  <tr><th>tool</th><th>shape</th><th>fits an individual who…</th></tr>
  <tr><td>pi</td><td>small, vanilla, hackable harness</td><td>wants to understand what a coding agent does, one rung at a time</td></tr>
  <tr><td>Claude Code</td><td>terminal-first; skills, hooks, subagents</td><td>lives in a repo and a shell, wants long autonomous runs</td></tr>
  <tr><td>Codex</td><td>cloud sandboxes plus a CLI</td><td>wants parallel tasks away from the laptop, each in its own env</td></tr>
  <tr><td>Amp</td><td>editor-integrated, shared threads</td><td>wants the agent in the editor and a record to go back to</td></tr>
</table>

<div class="tile-row four" style="margin-top:22px">
  <div class="poster-tile"><h3>platform first</h3><p>can it run your stack in its own sandbox?</p></div>
  <div class="poster-tile"><h3>harness ownership</h3><p>how much of the loop do you want to see?</p></div>
  <div class="poster-tile"><h3>legibility</h3><p>can you get the "why" out afterwards?</p></div>
  <div class="poster-tile"><h3>model inversion</h3><p>keep a second model around to review.</p></div>
</div>

---
<!-- .slide: class="section-slide" -->

<div class="num">20 min</div>

# Durable and multiplayer

<p class="subtitle">the harness in the cloud</p>

---
<!-- .slide: class="statement" -->

<div class="poster-label">TWO KINDS OF DURABILITY</div>

## Claude Code resumes a <em>conversation</em>.

<h2 class="fragment fade-in">pi-durable resumes a <em>run</em>.</h2>

<p class="kicker fragment fade-in">on your laptop the first is usually enough. for an agent triggered by a webhook, unattended, the second is the whole point.</p>

---

<div class="poster-label">THE TABLE IS THE SLIDE</div>

<table class="tight">
  <tr><th></th><th>pi (vanilla)</th><th>Claude Code</th><th>pi-durable</th></tr>
  <tr><td>transcript</td><td>session file, reopen later</td><td>JSONL, saved continuously; <code>--resume</code>, <code>/branch</code>, <code>--fork-session</code></td><td>committed entries in a store: SQLite, JSONL, memory</td></tr>
  <tr><td>killed mid tool call</td><td>result lost; re-prompt</td><td>marked cut off; model told to check before rerunning</td><td>resumes from last checkpoint; <code>replay: 'safe'</code> tools rerun</td></tr>
  <tr><td>same prompt twice</td><td>runs twice</td><td>runs twice</td><td>same <code>requestId</code> → same answer, no rerun</td></tr>
  <tr><td>second device</td><td>no</td><td>Remote Control attaches to a running session</td><td><code>viewState</code>: a subscribable view; any client rebuilds the screen</td></tr>
  <tr><td>what does not survive</td><td>anything in flight</td><td>background subagents and Bash</td><td>nothing is exactly-once. checkpointed, not transactional</td></tr>
  <tr><td>status</td><td>stable</td><td>stable, documented</td><td>experimental; pin the lockfile</td></tr>
</table>

---

<div class="poster-label">PI-DURABLE, PICKED APART</div>

## Three packages, two files, one store

```ts
export const serviceStatus = defineTool({
  name: "service_status",
  replay: "safe",                    // rerun after a crash; no side effects
  async execute(input, context) { /* 10s */ return { checkout: "degraded" }; },
});

const storage = openNodeSqliteStorage("./agent.sqlite");   // one process owns this
const harness = createHarness({ storage, tools: [serviceStatus], model });
const root = await harness.root(context, { conversationId: ROOT });
harness.resume();                                           // pick up anything mid-flight

await root.submit(context, { requestId: "incident-106", text: "Checkout status?", whenBusy: "steer" });
for await (const view of root.viewState(context)) render(view.entries, view.runningTools);
```

---

<div class="poster-label">THE DEMOS · RECORDED FALLBACK EXISTS</div>

<div class="live">live</div>

<div class="tile-row four" style="margin-top:70px">
  <div class="poster-tile agent fragment fade-in"><h3>kill -9</h3><p>start incident-106, wait for "tool started", kill the process, run the same command.</p></div>
  <div class="poster-tile agent fragment fade-in"><h3>two clients</h3><p>a terminal and a browser on one <code>viewState</code>.</p></div>
  <div class="poster-tile agent fragment fade-in"><h3>in the cloud</h3><p>a Durable Object per session is the store.</p></div>
  <div class="poster-tile you fragment fade-in"><h3>webhook</h3><p>a PR opened starts a review session. sandbox, agent, webhook. the finale.</p></div>
</div>


Note:
If 21:30 arrives and Run 2 is not done, skip the live multiplayer and play the five-minute recording. The release segment is a promise on the listing and does not get cut.
Cut from screen: multiplayer with zero extra code: two people subscribed to one root, either able to submit. a plan room is a durable session with people in it.
Cut from screen: same id, resumes, tool reruns, answer lands. third run: saved answer, no tool call.
Cut from screen: type in one, watch the other. close the browser mid-run, reopen, it rebuilds.
Cut from screen: a Container per session runs the repo and just. one owner per object, free.

---
<!-- .slide: class="section-slide" -->

<div class="num">7 min</div>

# Released, then changed under real users

<p class="subtitle">a green PR is the middle of the job, not the end</p>

---

<div class="poster-label">THE WORKFLOW · ONE TASK END TO END</div>

<div class="strip">
  <div class="you"><span class="n">1</span><b>Interview</b><span class="tag you">you</span></div>
  <div class="you"><span class="n">2</span><b>Name it</b><span class="tag you">you</span></div>
  <div class="you"><span class="n">3</span><b>Estimate</b><span class="tag you">you</span></div>
  <div class="both"><span class="n">4</span><b>Plan as a boundary object</b><span class="tag both">shared</span></div>
  <div class="agent"><span class="n">4b</span><b>Scaffold</b><span class="tag agent">agent</span></div>
  <div class="agent"><span class="n">5</span><b>Build in the loop</b><span class="tag agent">agent</span></div>
  <div class="you"><span class="n">6</span><b>Dogfood</b><span class="tag you">you</span></div>
  <div class="both"><span class="n">7</span><b>Review inverted</b><span class="tag both">shared</span></div>
  <div class="you"><span class="n">8</span><b>Release staged</b><span class="tag you">you</span></div>
</div>

<p class="kicker">9 · feed it back: what the release taught goes into docs/decisions and the skills. the next session starts smarter.</p>

Note:
Count the oxblood. Coding is one box out of nine.

---

<div class="poster-label">RELEASE CHECKLIST · docs/RELEASE.md</div>

## Short on purpose. A checklist nobody finishes protects nobody.

<div class="tile-row three">
  <div class="poster-tile you"><h3>product fit</h3><p>the user's sentence · dogfooded today · vocabulary intact · signal defined (which event, what number in a week)</p></div>
  <div class="poster-tile ink"><h3>staged rollout</h3><p>behind a flag, default off · you first · Workers versions 1% → 100% in steps you can watch · migrations additive · watch window</p></div>
  <div class="poster-tile agent"><h3>rollback path</h3><p>decided before deploy · flag off is step one · previous version pinned · events are facts, never deleted · postmortem in decisions</p></div>
</div>

---

<div class="poster-label">THE FOUR QUESTIONS A LIVE PRODUCT ASKS · ONE MINUTE EACH</div>

<div class="tile-row four" style="margin-top:70px">
  <div class="poster-tile fragment fade-in"><h3>events already recorded</h3><p>you do not change the past.</p></div>
  <div class="poster-tile fragment fade-in"><h3>flags vs versions</h3><p>versions decide which <em>code</em> runs.</p></div>
  <div class="poster-tile fragment fade-in"><h3>rollouts you can watch</h3><p>you → a named slice (the people from tenet 6) → 5 / 25 / 100 → the code version separately → data last.</p></div>
  <div class="poster-tile fragment fade-in"><h3>bugs the agent can reproduce</h3><p>one report button.</p></div>
</div>

Note:
Depth is on the companion page. The talk only names them.
Cut from screen: climb the ladder: avoid → simple mapping → upcast on read → new event type → migrate. the agent will edit the schema in place unless told.
Cut from screen: flags decide which behaviour. roll back a version when code is broken; flip a flag when the feature is wrong. OpenFeature.
Cut from screen: it carries the stream. just replay rebuilds what the user saw. failing expect test first, then the fix.

---
<!-- .slide: class="section-slide" -->

<div class="num">60 min · live</div>

# Greenhouse · the demo

<p class="subtitle">seven beats · one repo · minute 0 to 60</p>

Note:
Minute 0. The whole hour is in this repo; every beat has a tag and a `just demo cp-NN` twin from docs/RUNBOOK.md. Say the order once: scaffold, plan, vocabulary, backend, components, why Cloudflare, flags.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 01 SCAFFOLD · cp-00</div>

## The layout is the first thing the agent reads

```text
apps/api          Hono Worker: /healthz, /readyz, commands in, events out. PlanRoom Durable Object.
apps/web          TanStack Start Worker. Reaches the api over the API service binding only.
packages/schema   the vocabulary as types
packages/domain   decide, evolve, project. Expect tests read as a story.
docs/             GLOSSARY, ARCHITECTURE, RELEASE, CHECKPOINTS, RUNBOOK, decisions/
skills/           ours in place; third-party vendored at pinned commits
justfile          every runnable thing is a recipe
```

<p class="kicker mono"><a href="../docs/architecture/index.html#open">map: docs/architecture/index.html#open</a></p>

Note:
Minute 0 to 3. Type `ls` then `ls apps packages`; point at the two Workers and the two packages. Then `cat justfile | head -40`: if it is not a recipe here, the agent invents its own way.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 01 SCAFFOLD · cp-00</div>

<div class="live">live</div>

## Health before login

```sh
just up                                  # api + web locally, D1 and DO in miniflare
```

<p>Two Workers. The web Worker reaches the api over the <code>API</code> service binding and nothing else.</p>
<p><code>/healthz</code> answers before anyone has logged in.</p>
<p><code>/readyz</code> touches each dependency and names the one that fails.</p>
<p><code>/login</code> comes after that.</p>

Note:
Minute 3 to 6. Run `just up`, open http://localhost:3000/healthz and point at the two versions, web and api, coming through the binding. Then `/login`. If the laptop is slow, `just demo cp-00` runs the two curls.

---
<!-- .slide: class="statement" -->

<div class="poster-label">GREENHOUSE · THE DEMO · 02 PLAN THE PRODUCT</div>

## Where does the agent's loop live?

<p class="subtitle fragment fade-in">A multiplayer coding agent on pi-durable. One plan, many people, one agent in the room.</p>

<p class="kicker fragment fade-in">the loop needs one owner and a checkpoint store. the browser, a Worker, a Durable Object or a Container: pick one.</p>

Note:
Minute 6 to 9. Say the planning question out loud before the agent hears it. Open the plan room at http://localhost:3000/plans/gh-12 and show the Blocks the agent drafted; the question is a Thread on one Block.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 02 PLAN THE PRODUCT · cp-04</div>

## The plan is a report you click, not a wall of Markdown

```sh
just artifact docs/decisions/gh-12.spec.json docs/decisions/gh-12.html
```

<p>Each option has a diagram, a cost and the Block it changes.</p>
<p>Clicking one records a Decision on the Thread.</p>
<p>Plans orient. They do not bind.</p>

Note:
Minute 9 to 13. Run `/create_plan GH-12` in Claude Code and let the Markdown scroll for ten seconds, then open docs/decisions/gh-12.html and click an option. Point at the Decision appearing on the Block. Say: the plan tells the agent where to look, the tests tell it when it is done.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 03 ONE VOCABULARY · cp-01</div>

## The glossary lives next to the code

<p><code>docs/GLOSSARY.md</code>: Thread, Decision, Participant, each with the events and commands that carry it.</p>
<p>Every entry lists its banned synonyms. Decision, not resolution, verdict, outcome.</p>
<p>A noun appears there and in <code>packages/schema</code> before it appears anywhere else.</p>

Note:
Minute 13 to 16. `cat docs/GLOSSARY.md` and point at the "Not:" line under Decision. Then ask pi "add resolve thread" and watch the names it picks; the ddd-vocabulary skill makes it search first.
Cut from screen: The agent searches the web before it names: how Linear, GitHub and Chopin say it.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 03 ONE VOCABULARY · cp-01</div>

<div class="live">live</div>

## The check that catches ThreadClosed

```sh
just glossary-check                      # cp-01
```

<p>On <code>main</code> it passes.</p>
<p>On <code>wrong/cp-01</code> the first pass named the event <code>ThreadClosed</code> with a <code>verdict</code>. Every test passed.</p>
<p>The check fails the build. A second model fails the review the same way.</p>

Note:
Minute 16 to 20. Run `just glossary-check` on main, then `git checkout wrong/cp-01 && just glossary-check` and point at the two names it rejects. Come back with `git checkout main`. If there is time, start `HEAD_REF=wrong/cp-01 just review cp-02` and let it run in the background pane.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 04 THE BACKEND · cp-02 · cp-03</div>

## Hono at the edge. Effect behind it.

<p>Schema decodes at the boundary; nothing unknown gets past the handler.</p>
<p><code>decide</code>, <code>evolve</code> and <code>project</code> are pure functions in <code>packages/domain</code>.</p>
<p>Flags, PlanRooms and Commands are services with Layers; one ManagedRuntime per env.</p>

<p class="kicker mono"><a href="../docs/architecture/index.html#record">map: docs/architecture/index.html#record</a></p>

Note:
Minute 20 to 25. Open apps/api/src/services.ts and scroll: Flags.layer against D1, Flags.layerTest against a list; PlanRooms.layer against the namespace, PlanRooms.layerTest against a Map. Then packages/domain/src/thread/decider.ts, the ResolveThread case: the flag gate, the state check, two events.
Cut from screen: Test layers swap D1 and the Durable Object for memory. The tests do not know.
Cut from screen: A rejection is a typed error, not a thrown string.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 04 THE BACKEND · cp-02</div>

<div class="live">live</div>

## The test is a story a person can read

```text
given  ThreadOpened       t7 on b3 by pratos "retries in the client or the wrapper?"
       ReplyPosted        t7 by agent "wrapper: one place to change"
when   ResolveThread      t7 by pratos decision "wrapper"
then   ThreadResolved     t7 by pratos
       DecisionRecorded   t7 on b3 by pratos decision "wrapper"
```

<p class="kicker">command plus starting stream in, events out. simulated clock. no mocks of our own modules.</p>

Note:
Minute 25 to 28. Run `just test`, then `cat packages/domain/src/thread/__expect__/resolve.snap.txt`. Ask pi for a test and watch it reach for a mock; point at the snapshot and say this is the test it should have written.

--
<!-- .slide: class="btw-slide" -->

<div class="poster-label">/BTW · 04 THE BACKEND · cp-03</div>

## Changing a recorded event

```text
v1 stream as recorded
  DecisionRecorded   t7 on b3 by pratos decision "wrapper"
read through upcast
  DecisionRecorded   t7 on b3 by pratos decision "wrapper" rationale "wrapper: one place to change"
```

<p>Events are facts. <code>packages/domain/src/upcast</code> reads v1 as v2; nothing on disk changes.</p>

Note:
Minute 28 to 32. Ask Claude Code to "add rationale to decisions" and watch it edit the schema in place; stop it. Then `cat packages/domain/src/upcast/__expect__/*.snap.txt`. Point at the AGENTS.md line about repos/effect and the oxlint ignore.
Cut from screen: The Effect source sits at repos/effect, read-only. The agent reads it before it writes Effect code, and never imports from it.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 05 COMPONENTS · cp-05</div>

<div class="live">live</div>

## Build the plan page under skills

<p>Claude Code with <code>impeccable</code> for the craft and Emil's <code>animate</code> for the motion, on <code>/plans/gh-12</code>.</p>
<p>One Agentation note on the resolve action: pin it in the browser, the agent reads it from the toolbar.</p>
<p>The flags admin panel: the same components, the flags table, default off.</p>

Note:
Minute 32 to 37. Open http://localhost:3000/plans/gh-12 with the Agentation toolbar on, leave one note on the resolve button, and let Claude Code pick it up. Then open the flags panel and show resolve-thread off. Point at skills/manifest.json: the sha is bumped on purpose, never the morning of.
Cut from screen: Skills are vendored at a pinned commit in skills/manifest.json.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 05 COMPONENTS · cp-08</div>

<div class="live">live</div>

## Two tabs, one Durable Object

<p>Every open tab holds a hibernating WebSocket on the plan's object.</p>
<p>An append broadcasts to all of them. Nothing polls.</p>
<p>The browser reaches the socket through the web Worker, which proxies the upgrade over the binding.</p>

```sh
bun scripts/ws-check.ts <api url>
```

<p class="kicker mono"><a href="../docs/architecture/index.html#share">map: docs/architecture/index.html#share</a></p>

Note:
Minute 37 to 41. Two tabs on /plans/gh-12 side by side; open a Thread in one, watch it land in the other. Then apps/api/src/plan-room.ts: acceptWebSocket, getWebSockets, broadcast after the insert. If the socket misbehaves, `just demo cp-08`.

--
<!-- .slide: class="btw-slide" -->

<div class="poster-label">/BTW · 05 COMPONENTS · packages/agent</div>

## kill -9, then the same command

<p>One request id. SQLite checkpoints after every step.</p>
<p>Kill the process mid tool call.</p>
<p>The same command resumes from the last checkpoint; the tool reruns.</p>
<p>A third run answers from the store. No model call.</p>

Note:
Minute 41 to 45. Start the agent in packages/agent with one request id, wait for "tool started", `kill -9` it, run the same command and watch it resume. Run it a third time and point at the answer arriving with no model call in the log. The recorded fallback is in demo/.

---
<!-- .slide: class="statement" -->

<div class="poster-label">GREENHOUSE · THE DEMO · 06 WHY CLOUDFLARE</div>

## One owner per stream is a Durable Object.

<h2 class="fragment fade-in">A checkpointed agent loop needs exactly that owner.</h2>

<p class="kicker fragment fade-in">D1, R2 and Workers cost nothing idle and deploy in seconds.</p>

Note:
Minute 45 to 48. Three sentences, three clicks. Point back at plan-room.ts: the object that owns the event log is the object that knows when it changed, and the same shape holds a pi-durable session.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 07 SHIP BEHIND A FLAG · cp-07</div>

## Flags default off, in decide()

```sh
GH_REMOTE=1 just flag user resolve-thread pratos
```

<p>The gate is the first line of <code>ResolveThread</code> in the decider. Not in the web Worker.</p>
<p>You first. Then a named slice: the people you interviewed.</p>
<p>Then a percentage by stable hash: <code>just flag pct NAME 5</code>, then 25. Same person, same bucket.</p>

Note:
Minute 48 to 53. `just deploy` first, about a minute including the smoke. Then the flag command above, use the resolve action live on prod, and point at `bucket()` in services.ts: FNV over flag and participant, mod 100.

---

<div class="poster-label">GREENHOUSE · THE DEMO · 07 SHIP BEHIND A FLAG · cp-07</div>

<div class="live">live</div>

## The code version is a separate dial

```sh
GH_REMOTE=1 just flag off resolve-thread
just rollback api <version-id>
```

<p><code>/healthz</code> carries a <code>label</code> from <code>git describe</code> for people and an <code>id</code> for rollback.</p>
<p>Flag off is step one: seconds, no deploy.</p>
<p>Rollback is step two: the previous id, pinned.</p>

<p class="kicker mono"><a href="../docs/architecture/index.html#release">map: docs/architecture/index.html#release</a></p>

Note:
Minute 53 to 58. `curl https://greenhouse-api.prthamesh-sarang.workers.dev/healthz` and point at version.label and version.id. Flip the flag off and show the resolve action gone without a deploy; then `just rollback api <id>` with the id from `bunx wrangler deployments list`. Minute 58 to 60 hands back to the close.

---
<!-- .slide: class="section-slide" -->

<div class="num">09</div>

# You are the gardener

<p class="subtitle">the agent grows the code. the basics are how you shape what grows.</p>

Note:
The soil it runs in, the trellis of types and tests, the names on the labels. None of that is new. Growing is no longer the bottleneck, so the shaping is the job.

---

<div class="poster-label">ESTIMATION EXERCISE · TAKE IT HOME</div>

## Pick a small CRUD app that does one thing with AI

<div class="ladder" style="margin-top:28px">
  <div><span class="n">1</span><span>write the <strong>feature</strong>, not the ask: who is better off, and how would you know</span></div>
  <div><span class="n">2</span><span>estimate with Brooks's fractions. coding at one sixth. what is in the other five?</span></div>
  <div><span class="n">3</span><span>mark each piece <span class="tag you">you</span> or <span class="tag agent">agent</span>. notice where the essence lands</span></div>
  <div><span class="n">4</span><span>name the first test the agent would need to verify its own work without you</span></div>
</div>

<p class="kicker fragment fade-in">now look at the number you typed in chat at 20:08.</p>

---
<!-- .slide: class="statement" -->

<div class="poster-label">TAKEAWAYS</div>

## Opus 5.5 mid on Claude Code.

<p class="subtitle fragment fade-in">plus a glossary, three kinds of tests, a justfile, a flag, and a second model that disagrees with the first.</p>

<p class="kicker fragment fade-in">Fin. for real this time.</p>

---

<div class="poster-label">LINKS · QUESTIONS</div>

## Thank you

<div class="contact-grid">
  <a class="poster-tile contact-card" href="#"><h3>Starter repo</h3><p>github.com/…/greenhouse</p></a>
  <a class="poster-tile contact-card" href="#"><h3>The playbook</h3><p>reliable-products-workshop · companion page</p></a>
  <a class="poster-tile contact-card" href="https://x.com/pratos_"><h3>X</h3><p>x.com/pratos_</p></a>
  <a class="poster-tile contact-card" href="https://www.linkedin.com/in/pratos/"><h3>LinkedIn</h3><p>linkedin.com/in/pratos</p></a>
</div>

<p class="kicker mono">pratos · AI Fiend</p>

Note:
Leave this up. Fill in the repo link and the companion page URL before the dry run.
