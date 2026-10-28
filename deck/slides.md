<!-- .slide: class="statement" -->

# The engineering playbook for shipping with AI

<p class="subtitle">pratos · GrowthX</p>

---
<!-- .slide: class="statement" -->

# Use Opus 5.5 at mid thinking.

Note:
Say it flat. Let it sit for two seconds. Click.

---
<!-- .slide: class="statement giant center" -->

# Fin.

<p class="subtitle fragment fade-in">:P</p>

Note:
Hold. Let them laugh or not. Press down for the thank you.

--
<!-- .slide: class="statement" -->

# thank you. i'm pratos.

<p class="subtitle fragment fade-in-then-semi-out">AI Fiend</p>
<p class="subtitle fragment fade-in-then-semi-out">3/4th Fractional Head of AI @ NotYourIdea</p>
<p class="subtitle fragment fade-in-then-semi-out">1/4th Chronically Online</p>
<p class="subtitle fragment fade-in">…the organisers say I have 2 hours and 28 minutes left.</p>

Note:
Beat. Then: "fine. Here's the actual talk."
Cut from screen: header label "WHOAMI"

---
<!-- .slide: class="statement" data-part="Prompting vs engineering" -->

## There is no right way to do AI coding.

<h2 class="fragment fade-in">Every path leads to tech debt.</h2>

<p class="kicker fragment fade-in">any code committed is tech debt. an arrow shot cannot be taken back. what changed is who shoots, and how fast.</p>

Note:
There are many things you can use, and every path leads to tech debt, because any code committed is tech debt. An arrow shot cannot be taken back. What changed is who shoots and how fast.

--
<!-- .slide: class="meme-slide btw-slide" -->

<img class="meme-image wide up" src="images/kot/midwit.png" alt="IQ bell curve meme" />

<div class="tile-row three" style="position:absolute;left:96px;right:96px;bottom:48px;margin:0">
  <div class="poster-tile fragment fade-in"><p>"just prompt it bro"</p></div>
  <div class="poster-tile fragment fade-in"><p>"12 parallel agents, 4 worktrees, an orchestrator, MCP for everything, 40k-token CLAUDE.md"</p></div>
  <div class="poster-tile fragment fade-in"><p>"just prompt it bro"<br><em>…with types, tests and a glossary</em></p></div>
</div>

---
<!-- .slide: class="statement" -->

## Agents are a new primitive.

<p class="subtitle">Machine empathy made you a good engineer for the computer. It now extends to agent empathy.</p>

<p class="kicker">good agent experience still needs great developer experience underneath, and it needs updating as models change.</p>

---
<!-- .slide: class="statement" -->

## Tonight is about you, not your team

<div class="split">
  <div>
    <h3>personal level · in scope</h3>
    <p>A very good bump in what one person can do. The basics pay off fastest here, because one person can change their own habits tomorrow.</p>
  </div>
  <div>
    <h3>team level · out of scope today</h3>
    <p>Huge variance in how teams do this. Left for another session; nothing here depends on a process change.</p>
  </div>
</div>

---
<!-- .slide: class="meme-slide" data-part="Everyone is a product engineer" -->

## Everyone is a product engineer

<img class="meme-image" src="images/kot/astronaut.png" alt="Two astronauts looking at Earth; the one behind holds a pistol: always has been" />

<p class="caption">wait, it's all product engineering? &nbsp;·&nbsp; always has been.</p>

---
<!-- .slide: class="statement" -->

## Features ≠ asks

<p class="subtitle">An ask is what someone typed in a ticket. A feature is the change in the user's day.</p>

<p class="kicker fragment fade-in">The agent will faithfully build the ask; translating it into the feature is yours.</p>

---
<!-- .slide: class="statement" -->

## Outcome over output

<p class="subtitle">"Any code that makes money is good code" is only half a joke.</p>

<p class="kicker fragment fade-in">If the measure is the outcome, then verifying the outcome, not the diff, is the work.</p>

---
<!-- .slide: class="statement" -->

## Intent is the input

<p class="subtitle">Prompts, plans, tests, types and docs are all the same thing.</p>

<p class="kicker fragment fade-in">ways of writing intent down so a second brain can act on it without you in the room.</p>

--
<!-- .slide: class="meme-slide btw-slide" -->

## your intent &nbsp;·&nbsp; what the agent built

<img class="meme-image tall" src="images/kot/mona-lisa.png" alt="Mona Lisa next to a child's crayon copy" />

<p class="caption">the agent faithfully built the ask. translating the ask into the feature was yours.</p>

---
<!-- .slide: class="section-slide" -->

# Ten tenets of a product engineer

<p class="subtitle">none of them are about tools</p>

Note:
I run a small workshop on what constitutes a product engineer. These are its ten tenets.

---
<!-- .slide: class="statement" data-section="Tenet 01 of 10" -->

## Understand the problem space

<p class="subtitle">The agent only knows the problem you managed to describe.</p>

<p class="kicker fragment fade-in">time spent here is the planning third of Brooks's schedule.</p>

Note:
Brooks's schedule comes up properly in a few minutes.

---
<!-- .slide: class="statement" data-section="Tenet 02 of 10" -->

## User, machine, fellow-dev… and agent empathy

<p class="subtitle">The next reader of your code is as likely to be a model as a colleague.</p>

---
<!-- .slide: class="statement" data-section="Tenet 03 of 10" -->

## Think in outcomes, not output

<p class="subtitle">Output is now nearly free.</p>

<p class="kicker fragment fade-in">measure yourself by it and the agent will happily bury you in it.</p>

---
<!-- .slide: class="statement" data-section="Tenet 04 of 10" -->

## Be comfortable with ambiguity

<p class="subtitle">Agents are not.</p>

<p class="kicker fragment fade-in">resolving ambiguity before you hand work over is the highest-leverage thing you do all day.</p>

Note:
Long-running agents will hit ambiguity. They can write reliable code, but is it right for the context?

---
<!-- .slide: class="statement" data-section="Tenet 05 of 10" -->

## Ship fast, think and act slowly

<p class="subtitle">Slow is smooth. Smooth is fast.</p>

<p class="kicker fragment fade-in">the agent supplies the fast; you supply the slow.</p>

---
<!-- .slide: class="statement" data-section="Tenet 06 of 10" -->

## Talk to users who use your product

<p class="subtitle">Or to your ideal customers. How well do you interview your users?</p>

<p class="kicker fragment fade-in">no agent can do this for you, and everything downstream depends on it.</p>

---
<!-- .slide: class="statement" data-section="Tenet 07 of 10" -->

## Always use your product

<p class="subtitle">Dogfood. The agent can run the tests; it cannot feel the friction.</p>

<p class="kicker fragment fade-in">that is the review only you can give.</p>

---
<!-- .slide: class="statement" data-section="Tenet 08 of 10" -->

## Connect the dots

<p class="subtitle">Across the codebase, the user's day and the business.</p>

<p class="kicker fragment fade-in">agents see one context window; you see the whole board.</p>

Note:
Your job is to make your own life easy: write the code, write the skills.

---
<!-- .slide: class="statement" data-section="Tenet 09 of 10" -->

## Use LLMs to augment your learning

<p class="subtitle">Ask the agent to explain why it did the thing.</p>

<p class="kicker fragment fade-in">the point is that you understand more at the end of the session, not less.</p>

---
<!-- .slide: class="statement" data-section="Tenet 10 of 10" -->

## Develop taste in code, design and UX

<p class="subtitle">Taste is what you review with.</p>

<p class="kicker fragment fade-in">without it, every agent suggestion looks equally fine.</p>

---
<!-- .slide: class="section-slide" -->

# The Mythical Man-Month

<p class="subtitle">Frederick P. Brooks Jr. · 1975</p>

---
<!-- .slide: class="statement" -->

## "Good cooking takes time. If you are made to wait, it is to serve you better, and to please you."

<p class="subtitle">Menu of Antoine's, New Orleans · the book's opening epigraph</p>

<p class="kicker fragment fade-in">agents collapsed the wait. the cooking still takes the time it takes; it moved into planning, testing and reading. spend none of it and you get the coin toss.</p>

Note:
Agents collapsed the wait. The cooking still takes the time it takes, it just moved from the keyboard into planning, testing and reading. If you spend none of it, you get the coin toss.

---
## Coding was already the smallest slice in 1975

<div class="fractions">
  <div><strong>1/3</strong><span>planning</span></div>
  <div class="agent-slice"><strong>1/6</strong><span>coding</span></div>
  <div><strong>1/4</strong><span>component test</span></div>
  <div><strong>1/4</strong><span>system test</span></div>
</div>

<p class="kicker">the other five sixths are still yours. treat the coding slice as the whole job and your estimate is off by six.</p>

Note:
Brooks's rule of thumb for a schedule. Agents shrink the coding sixth further. Component test includes early system test; system test means all components in hand.

---
## One surgeon. Not ten surgeons operating at once.

<table class="tight">
  <tr><th>role in Mills's team</th><th>filled by</th><th>at your desk</th></tr>
  <tr><td>Surgeon</td><td><span class="tag you">you</span></td><td>owns the problem, the design, the final call</td></tr>
  <tr><td>Copilot</td><td><span class="tag agent">agent</span></td><td>argues with the design, writes a lot of the code, does not own it</td></tr>
  <tr><td>Administrator</td><td><span class="tag you">you</span></td><td>environment, tooling, access: runs anywhere</td></tr>
  <tr><td>Editor</td><td><span class="tag agent">agent</span></td><td>docs, changelogs, the "why", kept current</td></tr>
  <tr><td>Program clerk</td><td><span class="tag agent">agent</span></td><td>review passes, skills, what was tried</td></tr>
  <tr><td>Toolsmith · tester</td><td><span class="tag both">shared</span></td><td>agents do the volume; you decide what passes</td></tr>
</table>

Note:
Surgeon: conceptual integrity lives in one head. Administrator: make things easy to run anywhere, for yourself and for the agent. Program clerk: review passes, skill and prompt writing, bookkeeping of what was tried. Toolsmith, tester, language lawyer: agents do the volume; you decide what counts as a passing test and which idioms are allowed.

---
## Brooks, applied to agents

<div class="ladder">
  <div><span class="n">1</span><span>Adding agent sessions to a confused task makes it more confused.</span></div>
  <div><span class="n">2</span><span>Explore in parallel. Commit serially.</span></div>
  <div><span class="n">3</span><span>Agents hide slippage well, because something always got produced.</span></div>
  <div><span class="n">4</span><span>Gold-plating is now cheap to generate. Leaving things out is human.</span></div>
  <div><span class="n">5</span><span>Plan to throw one away. It is finally affordable.</span></div>
</div>

Note:
Brooks's law. Adding people to a late project makes it later. Adding agent sessions to a confused task makes it more confused, because every session routes its questions through the same person: you are the communication overhead now.
On parallel agents. A position: parallel exploration, serial commitment. Threads that each implement a different option before you decide are cheap and worth it; that is Appleton's "making contact with reality", and it needs no branches or worktrees when each thread is its own implementation you compare. What Brooks rules out is several agents building the committed version of one ticket at once: it speeds up the sixth and multiplies the five sixths you still owe, each agent holds partial context, and the merge is where correct code becomes wrong. Many threads to explore, one thread to build, one inverted reviewer after.
One day at a time. "How does a project get to be a year late? One day at a time." Keep milestones small and visibly true or false.
The second system. The gold-plated version was always tempting; now it is also cheap to generate. The discipline of leaving things out is a human one.
Plan to throw one away. Let the agent build the first version to learn the problem, then throw it away on purpose rather than by accident.

---
<!-- .slide: class="section-slide" -->

# No Silver Bullet

<p class="subtitle">Essence and accident in software engineering · 1986</p>

---
## Accidental difficulty

<p class="subtitle"><span class="tag agent" style="margin-left:0">agent</span> takes most of this</p>

<ul class="plain">
  <li>syntax, boilerplate, glue code</li>
  <li>looking things up, remembering APIs</li>
  <li>mechanical refactors, test scaffolding</li>
  <li>translating between languages and formats</li>
</ul>

---
## Essential difficulty

<p class="subtitle"><span class="tag you" style="margin-left:0">you</span> still hold all four</p>

<ul class="plain">
  <li><strong>complexity</strong>: the shape of the data and its invariants</li>
  <li><strong>conformity</strong>: the messy world the software must match</li>
  <li><strong>changeability</strong>: what users will ask for next</li>
  <li><strong>invisibility</strong>: nobody sees the whole system, the agent included</li>
</ul>

---
<!-- .slide: class="statement" -->

## Agent complexity is hill climbing.

<p class="subtitle">Given a hard target the agent takes shortcuts, and it cannot reliably do well on things it cannot see.</p>

<p class="kicker fragment fade-in">No Silver Bullet is not pessimism. it is a to-do list: everything that shrinks the essence for a human also shrinks it for the agent.</p>

---
## Brooks's "promising attacks", thirty years on

<div class="ladder">
  <div><span class="n">1</span><span><strong>Buy, don't build.</strong> Boring, opinionated frameworks are the constraint an agent needs.</span></div>
  <div><span class="n">2</span><span><strong>Rapid prototyping.</strong> A rendered screen beats a paragraph of requirements.</span></div>
  <div><span class="n">3</span><span><strong>Grow, don't build.</strong> Plan, build, verify, feed it back. Let work compound.</span></div>
  <div><span class="n">4</span><span><strong>Great designers.</strong> The one role you cannot delegate. You are the gardener.</span></div>
</div>

Note:
Buy, don't build: boring, opinionated frameworks are slower to start and better to live in. Rails-style "one way to do the right thing" is exactly the constraint an agent needs. Read the docs for the platforms you deploy to; people get burned by serverless and cloud pricing when they let the agent configure it blind.
Rapid prototyping: align visually. Show me, don't tell me, no walls of text.
Grow, don't build: loops with forward and backward pressure. Let the work compound across sessions instead of starting from zero every time.
Great designers: Brooks's last hope was cultivating great designers. That is now the only role you cannot delegate.

---
<!-- .slide: class="statement" -->

## Keeping up without the FOMO

<p class="subtitle">"Everyone on the timeline is doing unbelievable things."</p>

<p class="kicker fragment fade-in">the gain any tool gives you is bounded by how much accident is left in your work. the essence is where the compounding happens, and none of it expires when the next tool ships.</p>

Note:
One check-in said it plainly: watching the timeline, it feels like everyone else is doing unbelievable things, and the question is what it takes to catch up. No Silver Bullet is the answer, and it is a kind one. Every tool on the timeline is an attack on accidental difficulty, and a good one. The essence (knowing what to build, the shape of the data, what correct means) is where the compounding happens.

---
<!-- .slide: class="statement" -->

## Keep up with your own loop.

<p class="subtitle">How fast you get from intent to a verified change. Measure it on your repo, not on a demo.</p>

<p class="kicker fragment fade-in">one new tool a month, tried on a real ticket, kept only if the loop got faster.</p>

---
<!-- .slide: class="statement" -->

## Let go of the leaderboards.

<p class="subtitle">Model launches, other people's thirty-second clips. A harness is six lines of plumbing.</p>

<p class="kicker fragment fade-in">the unbelievable thing in the clip was usually the basics you already know, applied by someone who did not skip them.</p>

---
<!-- .slide: data-section="The playbook · 01 of 10" -->

## Make it run anywhere

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>A repo that runs locally with one command is the difference between a two-week onboarding and a two-hour one.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>If the agent cannot run the thing in its own environment, you become the test harness.</p>
  </div>
</div>

<p class="kicker mono">DX is agent DX</p>

Note:
Postgres locally, config in env files, no shared staging dependency for everyday work. Object storage behind a local stand-in (MinIO for S3), fixtures that seed a believable state. Twelve-factor is still the cheapest checklist. One team spent two to three weeks on a single problem: getting a repo to run on a laptop.

---
<!-- .slide: data-section="The playbook · 02 of 10" -->

## Types as the design language

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Picking the right shape of data is most of the design. Types hold the invariants you would otherwise carry in your head.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>A whole class of mistakes cannot be generated. The compiler is feedback in milliseconds, with no prompt.</p>
  </div>
</div>

<p class="kicker mono">make illegal states unrepresentable</p>

Note:
Application-specific invariants get their own types, not a comment. Anti-slop rules for your language live in the type config and lint config, not in a prompt the agent may skim.

---
<!-- .slide: data-section="The playbook · 03 of 10" -->

## Tests the agent can learn from

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Committed examples prove intent in a way prose cannot, and they survive you forgetting why.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Feedback in milliseconds beats feedback in a code review. The faster the loop, the better the agent climbs.</p>
  </div>
</div>

<p class="kicker mono">agents thrive on feedback</p>

Note:
No unit tests for their own sake. Three layers: expect tests at the library level, event-replay end-to-end through the domain, Stagehand for the few flows where the browser is the point. Expect tests are the legible kind: a human reads the output and says "yes, that". Example-based over clever.

---
<!-- .slide: data-section="The playbook · 04 of 10" -->

## Keep it simple, three times

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Simplicity makes the bus factor survivable, and the bus is now also "the model changed".</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Agents do well on well-trodden paths. Every unusual choice is a place the agent will confidently guess.</p>
  </div>
</div>

<p class="kicker mono">simple code · simple components · simple tech choices</p>

---
<!-- .slide: data-section="The playbook · 05 of 10" -->

## Review for understanding, not for approval

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Check the code matches the product and that you could still explain it. Stacked PRs. Ask questions.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Ask it why it did the thing. If it cannot explain the change, treat that as a finding.</p>
  </div>
</div>

<p class="kicker mono">your understanding ↔ the agent's</p>

Note:
Correct code can be wrong: a diff that passes every test can still contradict how the codebase works. Review agents fail predictably: missed bugs, missing context, nitpicks; tell them to skip the nitpicks. Model inversion: author with one model, review with a different one. Different blind spots.

--
<!-- .slide: class="meme-slide btw-slide" -->

## Model inversion: author with one, review with another

<img class="meme-image" src="images/kot/same-stupidity.png" alt="Man gesturing at a laptop: now see for yourself, he is doing same stupidity that he always does" />

<p class="caption">correct code can be wrong. every test passed. the vocabulary broke.</p>

---
<!-- .slide: data-section="The playbook · 06 of 10" -->

## One vocabulary, three speakers

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>The words in the code are the words in the conversation with the user. No translation layer where meaning leaks.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>The agent learns the domain from your identifiers. Name the concept once and it speaks it back to your user.</p>
  </div>
</div>

<p class="kicker mono">domain-driven design</p>

Note:
If Order, Booking and Reservation all mean the same thing, it will invent a fourth. Bounded contexts tell the agent where a word stops meaning what it meant. Put the glossary in the repo, next to the code. When a user's phrase does not map to a type, that is a design finding, not a naming chore.

--
<!-- .slide: class="meme-slide btw-slide" -->

## Order, Booking, Reservation… the agent invents a fourth

<img class="meme-image" src="images/kot/circles.png" alt="Factory worker watching a circle come down a triangle conveyor: i guess we doin circles now" />

<p class="caption">put the glossary in the repo, next to the code.</p>

---
<!-- .slide: data-section="The playbook · 07 of 10" -->

## Event sourcing: e2e without the browser

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Spreadsheets won because the data and its flow are visible. The log of what happened is the system of record.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>An e2e test is "replay these commands, expect these events". Deterministic, fast, legible.</p>
  </div>
</div>

<p class="kicker mono">make the data visible</p>

Note:
Browser e2e is slow, flaky and expensive for an agent to iterate on. Pair event sourcing with the expect idiom: the snapshot is the event stream, reviewed like a story. Audits over the log let the agent verify its own work. Keep the browser for the flows where it is the point.

---
<!-- .slide: data-section="The playbook · 08 of 10" -->

## Keep a living wiki

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>The decisions that are not in the code are the ones that get re-litigated. Write down the why once.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Instructions, skills and notes are a living wiki whether you call it that or not. Feed it back.</p>
  </div>
</div>

<p class="kicker mono">codebase context</p>

Note:
Feed user feedback and post-mortems back in so the next session starts smarter.

---
<!-- .slide: data-section="The playbook · 09 of 10" -->

## Read the docs

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>For the tools you use and the platforms you deploy to. The agent's knowledge is a snapshot; yours can be current.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Point it at the actual docs. Guessing a platform's pricing is how a weekend project becomes an invoice.</p>
  </div>
</div>

<p class="kicker mono">no substitute</p>

---
<!-- .slide: data-section="The playbook · 10 of 10" -->

## Climb the trust ladder

<div class="ladder">
  <div><span class="n">1</span><span>small, vanilla agent. <em>start here.</em></span></div>
  <div><span class="n">2</span><span>add plugins and skills: your conventions</span></div>
  <div><span class="n">3</span><span>add connectors (MCP): your systems</span></div>
  <div><span class="n">4</span><span>deploy to the cloud, unattended</span></div>
</div>

<p class="kicker">building your own small harness, even a toy one, is the fastest way to see what a coding agent does.</p>

Note:
You: what you know, you know. What you don't, you don't, and there are unknown unknowns. Clarity of thought is not always there; experimenting is how you work it out.
Agent: agents can see screens and drive computers now, so they can verify their own work. Let them, in a sandbox, before you let them touch anything with consequences.

---
<!-- .slide: class="section-slide" -->

# Picking your tool

<p class="subtitle">for your platform, not the leaderboard</p>

---
<!-- .slide: class="statement" data-section="Picking your tool" -->

## pi

<p class="subtitle">Small, vanilla, hackable harness.</p>

<p class="kicker">For someone who wants to understand what a coding agent does, and build up plugins, skills and connectors one rung at a time.</p>

---
<!-- .slide: class="statement" data-section="Picking your tool" -->

## Claude Code

<p class="subtitle">Terminal-first agent with skills, hooks and subagents.</p>

<p class="kicker">For someone who lives in a repo and a shell, wants long autonomous runs and a way to encode conventions.</p>

---
<!-- .slide: class="statement" data-section="Picking your tool" -->

## Codex

<p class="subtitle">Cloud sandboxes plus a CLI.</p>

<p class="kicker">For someone who wants parallel tasks running away from their laptop, each in its own environment.</p>

---
<!-- .slide: class="statement" data-section="Picking your tool" -->

## AmpCode

<p class="subtitle">Editor-integrated agent with shared threads.</p>

<p class="kicker">For someone who wants the agent inside the editor and a record of sessions to go back to.</p>

---
<!-- .slide: class="section-slide" -->

# My setup

<p class="subtitle">press down for the desk</p>

--
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
Cut from screen: header label "THE SPEAKER'S DESK · 2 MIN"

---
<!-- .slide: class="section-slide" -->

# Building Greenhouse

<p class="subtitle">a planning room in the spirit of GitHub Next's Chopin · press down for the demo</p>

Note:
One small repo that does everything the playbook asks, so each practice can be shown running instead of described.

--
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
Cut from screen: header label "GREENHOUSE · THE DEMO · 01 SCAFFOLD · cp-00"

--
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
Cut from screen: header label "GREENHOUSE · THE DEMO · 01 SCAFFOLD · cp-00"

--
<!-- .slide: class="statement" -->

## Where does the agent's loop live?

<p class="subtitle fragment fade-in">A multiplayer coding agent on pi-durable. One plan, many people, one agent in the room.</p>

<p class="kicker fragment fade-in">the loop needs one owner and a checkpoint store. the browser, a Worker, a Durable Object or a Container: pick one.</p>

Note:
Minute 6 to 9. Say the planning question out loud before the agent hears it. Open the plan room at http://localhost:3000/plans/gh-12 and show the Blocks the agent drafted; the question is a Thread on one Block.
Cut from screen: header label "GREENHOUSE · THE DEMO · 02 PLAN THE PRODUCT"

--
## The plan is a page you look at, not a wall of Markdown

```sh
just plan docs/plans/2026-10-28-resolve-thread.plan.json
```

<p>Every choice is a decision report you click, every new screen is the real component in all its states.</p>
<p>Code appears only as contracts, fifteen lines at most; the builder refuses more.</p>
<p>Plans orient. They do not bind.</p>

<p class="kicker mono"><a href="../docs/plans/2026-10-28-resolve-thread.plan.html">plan: docs/plans/2026-10-28-resolve-thread.plan.html</a></p>

Note:
Minute 9 to 13. Run `/create_plan GH-12` in Claude Code; it writes the plan JSON and the hook builds the page. Open it: scroll the summary, open the decision and point at the locked choice, then the three states of the resolve component. Say: the plan tells the agent where to look and what must be true; the tests tell it when it is done.
Cut from screen: header label "GREENHOUSE · THE DEMO · 02 PLAN THE PRODUCT · cp-04"

--
## The glossary lives next to the code

<p><code>docs/GLOSSARY.md</code>: Thread, Decision, Participant, each with the events and commands that carry it.</p>
<p>Every entry lists its banned synonyms. Decision, not resolution, verdict, outcome.</p>
<p>A noun appears there and in <code>packages/schema</code> before it appears anywhere else.</p>

Note:
Minute 13 to 16. `cat docs/GLOSSARY.md` and point at the "Not:" line under Decision. Then ask pi "add resolve thread" and watch the names it picks; the ddd-vocabulary skill makes it search first.
Cut from screen: The agent searches the web before it names: how Linear, GitHub and Chopin say it.
Cut from screen: header label "GREENHOUSE · THE DEMO · 03 ONE VOCABULARY · cp-01"

--
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
Cut from screen: header label "GREENHOUSE · THE DEMO · 03 ONE VOCABULARY · cp-01"

--
## Hono at the edge. Effect behind it.

<p>Schema decodes at the boundary; nothing unknown gets past the handler.</p>
<p><code>decide</code>, <code>evolve</code> and <code>project</code> are pure functions in <code>packages/domain</code>.</p>
<p>Flags, PlanRooms and Commands are services with Layers; one ManagedRuntime per env.</p>

<p class="kicker mono"><a href="../docs/architecture/index.html#record">map: docs/architecture/index.html#record</a></p>

Note:
Minute 20 to 25. Open apps/api/src/services.ts and scroll: Flags.layer against D1, Flags.layerTest against a list; PlanRooms.layer against the namespace, PlanRooms.layerTest against a Map. Then packages/domain/src/thread/decider.ts, the ResolveThread case: the flag gate, the state check, two events.
Cut from screen: Test layers swap D1 and the Durable Object for memory. The tests do not know.
Cut from screen: A rejection is a typed error, not a thrown string.
Cut from screen: header label "GREENHOUSE · THE DEMO · 04 THE BACKEND · cp-02 · cp-03"

--
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
Cut from screen: header label "GREENHOUSE · THE DEMO · 04 THE BACKEND · cp-02"

--
<!-- .slide: class="btw-slide" -->

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
Cut from screen: header label "/BTW · 04 THE BACKEND · cp-03"

--
<div class="live">live</div>

## Build the plan page under skills

<p>Claude Code with <code>impeccable</code> for the craft and Emil's <code>animate</code> for the motion, on <code>/plans/gh-12</code>.</p>
<p>One Agentation note on the resolve action: pin it in the browser, the agent reads it from the toolbar.</p>
<p>The flags admin panel: the same components, the flags table, default off.</p>

Note:
Minute 32 to 37. Open http://localhost:3000/plans/gh-12 with the Agentation toolbar on, leave one note on the resolve button, and let Claude Code pick it up. Then open the flags panel and show resolve-thread off. Point at skills/manifest.json: the sha is bumped on purpose, never the morning of.
Cut from screen: Skills are vendored at a pinned commit in skills/manifest.json.
Cut from screen: header label "GREENHOUSE · THE DEMO · 05 COMPONENTS · cp-05"

--
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
Cut from screen: header label "GREENHOUSE · THE DEMO · 05 COMPONENTS · cp-08"

--
<!-- .slide: class="btw-slide" -->

## kill -9, then the same command

<p>One request id. SQLite checkpoints after every step.</p>
<p>Kill the process mid tool call.</p>
<p>The same command resumes from the last checkpoint; the tool reruns.</p>
<p>A third run answers from the store. No model call.</p>

Note:
Minute 41 to 45. Start the agent in packages/agent with one request id, wait for "tool started", `kill -9` it, run the same command and watch it resume. Run it a third time and point at the answer arriving with no model call in the log. The recorded fallback is in demo/.
Cut from screen: header label "/BTW · 05 COMPONENTS · packages/agent"

--
<!-- .slide: class="statement" -->

## One owner per stream is a Durable Object.

<h2 class="fragment fade-in">A checkpointed agent loop needs exactly that owner.</h2>

<p class="kicker fragment fade-in">D1, R2 and Workers cost nothing idle and deploy in seconds.</p>

Note:
Minute 45 to 48. Three sentences, three clicks. Point back at plan-room.ts: the object that owns the event log is the object that knows when it changed, and the same shape holds a pi-durable session.
Cut from screen: header label "GREENHOUSE · THE DEMO · 06 WHY CLOUDFLARE"

--
## Flags default off, in decide()

```sh
GH_REMOTE=1 just flag user resolve-thread pratos
```

<p>The gate is the first line of <code>ResolveThread</code> in the decider. Not in the web Worker.</p>
<p>You first. Then a named slice: the people you interviewed.</p>
<p>Then a percentage by stable hash: <code>just flag pct NAME 5</code>, then 25. Same person, same bucket.</p>

Note:
Minute 48 to 53. `just deploy` first, about a minute including the smoke. Then the flag command above, use the resolve action live on prod, and point at `bucket()` in services.ts: FNV over flag and participant, mod 100.
Cut from screen: header label "GREENHOUSE · THE DEMO · 07 SHIP BEHIND A FLAG · cp-07"

--
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
Cut from screen: header label "GREENHOUSE · THE DEMO · 07 SHIP BEHIND A FLAG · cp-07"

---
<!-- .slide: class="statement" data-part="Workflow and release" -->

## From merge-ready to released

<p class="subtitle">A green PR is the middle of the job, not the end.</p>

<p class="kicker fragment fade-in">one task end to end, then a release checklist with product fit, a staged rollout and a rollback path.</p>

---
## One task, end to end

<div class="strip">
  <div class="you"><span class="n">1</span><b>Interview</b><span class="tag you">you</span></div>
  <div class="you"><span class="n">2</span><b>Name it</b><span class="tag you">you</span></div>
  <div class="you"><span class="n">3</span><b>Estimate</b><span class="tag you">you</span></div>
  <div class="both"><span class="n">4</span><b>Plan as a boundary object</b><span class="tag both">shared</span></div>
  <div class="agent"><span class="n">5</span><b>Scaffold, build in the loop</b><span class="tag agent">agent</span></div>
  <div class="you"><span class="n">6</span><b>Dogfood</b><span class="tag you">you</span></div>
  <div class="both"><span class="n">7</span><b>Review inverted</b><span class="tag both">shared</span></div>
  <div class="you"><span class="n">8</span><b>Release staged</b><span class="tag you">you</span></div>
  <div class="both"><span class="n">9</span><b>Feed it back</b><span class="tag both">shared</span></div>
</div>

Note:
1 Interview: talk to the user who asked, or the one who would. Write the feature, not the ask.
2 Name it: new nouns go in the glossary and the schema first. If a word has no type, stop here.
3 Estimate: Brooks's fractions. The coding sixth is the agent's; budget the other five sixths for yourself.
4 Plan: just plan. Open decisions come back as built artifacts and explored threads, not prose questions.
4b Scaffold: just new … so the shape is right before any code exists. 5 Build: domain first, UI second, each with its own test layer.
6 Dogfood: the Stagehand flow proves it works; only you can tell whether it feels right.
7 Review inverted: a different model, the glossary in context, walkthrough attached.
8 Release staged: yourself, then a slice, then everyone, with the way back decided in advance.
9 Feed it back: what the release taught goes into docs/decisions and the skills.

---
## Release checklist

<div class="tile-row three">
  <div class="poster-tile"><h3>Product fit</h3><p>the user's sentence · dogfooded today · vocabulary intact · signal defined</p></div>
  <div class="poster-tile"><h3>Staged rollout</h3><p>behind a flag · you first · 1% → 100% in steps you watch · additive migrations · a watch window</p></div>
  <div class="poster-tile"><h3>Rollback path</h3><p>decided before deploy · flag off first · previous version pinned · events never deleted</p></div>
</div>

<p class="kicker">short on purpose. a checklist nobody finishes protects nobody.</p>

Note:
Lives in the repo as docs/RELEASE.md; the PR template links it.
The user's sentence: one line, in the user's words, of what is now possible. If you cannot write it, you built an ask. Signal defined: which event tells you it is used, and what number you expect in a week.
Behind a flag, default off in prod. You first: flag on for your account, run the Stagehand flow against prod. Workers versions split traffic 1% to 100%. Migrations add; nothing dropped or renamed in the same release. Watch errors and the usage event for a stated time.
Rollback command written in the PR, not improvised. Flag off kills the behaviour in seconds. Workers rollback is one command; know the version id. Rollback never deletes events: rebuild a bad projection with just replay, compensate a bad command with a new event. Postmortem goes in decisions before the retry.

---
<!-- .slide: class="statement" data-part="Changing what people already use" -->

## Four questions a live product asks

<div class="ladder">
  <div><span class="n">1</span><span>How do I change events people already recorded?</span></div>
  <div><span class="n">2</span><span>Is this a flag or a version?</span></div>
  <div><span class="n">3</span><span>What rollout can I actually watch?</span></div>
  <div><span class="n">4</span><span>Can the agent reproduce a user's bug?</span></div>
</div>

Note:
Everything before this assumed a clean slate. Real products have users mid-task, data in old shapes and opinions about your changes. Four things the agent will get wrong unless the basics are in place first.

---
## You do not change the past

<div class="ladder">
  <div><span class="n">0</span><span><strong>Avoid it.</strong> Keep streams short-lived where you can.</span></div>
  <div><span class="n">1</span><span><strong>Simple mapping.</strong> Nullable new fields, defaults, old JSON names kept.</span></div>
  <div><span class="n">2</span><span><strong>Upcast on read.</strong> DecisionRecorded.v1 reads as .v2.</span></div>
  <div><span class="n">3</span><span><strong>New event type.</strong> The meaning changed, not the shape.</span></div>
  <div><span class="n">4</span><span><strong>Migrate.</strong> Last resort, in two phases.</span></div>
</div>

<p class="kicker">asked to "add a rationale to decisions", the agent will edit the schema in place and break every replay. tell it to climb from the bottom.</p>

Note:
An event-sourced product evolves by changing how events are read, not what was written. Least invasive first.
Avoid: a plan lives as long as the work does; a thread opens and resolves within days. Frequent event changes usually mean the model, not the schema, is wrong.
Upcast: a small function between the store and the domain, registered per event type, tested with an expect test whose input is a real old event from prod.
New event type: old projections keep working; new ones handle both.
Migrate: rewrite a stream as a one-off job that itself emits events. Ship code that reads both, migrate, remove the old path.
The event-sourcing skill makes the ladder explicit and makes the expect tests the gate.

---
## Versions decide which code. Flags decide which behaviour.

<div class="split">
  <div>
    <h3>roll back a version</h3>
    <p>when the code is broken. Workers gradual deployments split traffic between two uploaded versions.</p>
  </div>
  <div>
    <h3>flip a flag</h3>
    <p>when the feature is wrong. One version serves all traffic; the flag picks the behaviour.</p>
  </div>
</div>

<p class="kicker">every new command ships behind a flag, default off, checked in one place. a flag older than two releases is a lint error.</p>

Note:
Code against OpenFeature, the CNCF vendor-neutral flag API, so the provider is swappable. On Cloudflare, Flagship is the native flag service on OpenFeature, evaluated locally in the Worker; closed beta at the time of writing, so have a fallback. For one person: a flags table in your own Postgres keyed by user id behind an OpenFeature provider you write in an afternoon, or PostHog flags.

---
## A rollout you can watch

<div class="ladder">
  <div><span class="n">1</span><span><strong>You.</strong> Flag on for your account in prod. Dogfood for a day.</span></div>
  <div><span class="n">2</span><span><strong>A named slice.</strong> The users you interviewed. Tell them it is on.</span></div>
  <div><span class="n">3</span><span><strong>A percentage.</strong> 5, 25, 100, each with a watch window.</span></div>
  <div><span class="n">4</span><span><strong>The code version.</strong> Separately, 1% to 100%. A different day.</span></div>
  <div><span class="n">5</span><span><strong>Data last.</strong> Additive first; drops a release later.</span></div>
</div>

Note:
At each percentage step, watch two things: error rate, and the usage event you defined in the release checklist. Two knobs, moved on different days if you can. Migrations ship before the code that needs them; drops and renames ship a release after the code that stopped using them.

---
## Bugs the agent can reproduce

<div class="ladder">
  <div><span class="n">1</span><span>One report button. The user types a sentence; the system attaches the rest.</span></div>
  <div><span class="n">2</span><span><code>just replay &lt;stream-id&gt;</code> rebuilds exactly what the user saw.</span></div>
  <div><span class="n">3</span><span>The agent writes the failing expect test first, then the fix.</span></div>
  <div><span class="n">4</span><span>Reply with what changed. Users who see a fix send the next bug.</span></div>
</div>

<p class="kicker">a bug report is a repro you did not have to write.</p>

Note:
The button files a ReportFiled event: the user's note, session id, plan and block, the last few events, console errors, a screenshot. Off the shelf: Sentry User Feedback, PostHog replay and surveys, Jam. For "this looks wrong" from you or a designer, Agentation beats a bug tracker: the note arrives with the selector. Report count per release goes on the dashboard next to the usage event.

---
<!-- .slide: data-part="Estimation" -->

## Estimate your own ticket. Then time it.

<div class="ladder">
  <div><span class="n">1</span><span>Pick something real you will build this week, small enough for an evening.</span></div>
  <div><span class="n">2</span><span>Write the feature, not the ask: who is better off, and how would you know.</span></div>
  <div><span class="n">3</span><span>Estimate each slice in hours: plan, code, component test, system test.</span></div>
  <div><span class="n">4</span><span>Mark each slice <span class="tag you">you</span> or <span class="tag agent">agent</span>.</span></div>
  <div><span class="n">5</span><span>Build it with the agent. Log the actual hours per slice.</span></div>
</div>

<p class="kicker">compare estimate and actual, slice by slice. where did the five sixths go?</p>

Note:
Everyone picks their own ticket instead of a shared CRUD example. Brooks's fractions are the starting guess: plan a third, code a sixth, test half. The point is the comparison afterwards: most people find coding shrank and the other slices did not. Bring the numbers back; the delta is the lesson.

--
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
Cut from screen: header label "LINKS · QUESTIONS"
