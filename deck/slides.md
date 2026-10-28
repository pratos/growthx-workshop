<!-- .slide: class="statement" -->

# The engineering playbook for shipping with AI

<p class="subtitle">pratos · GrowthX</p>

<div class="howto" aria-label="How to move around this deck">
  <span class="desk"><kbd>→</kbd> next</span><span class="desk"><kbd>↓</kbd> aside</span><span class="desk"><kbd>G</kbd> go to any slide</span><span class="desk"><kbd>S</kbd> speaker notes</span>
  <span class="tap">swipe, or tap <kbd>‹</kbd> <kbd>›</kbd> to move</span><span class="tap">tap <kbd>#001 ▾</kbd> to jump to any slide</span>
</div>
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

<p class="subtitle fragment fade-in-then-semi-out">3/4th Head of AI @ NotYourIdea</p>
<p class="subtitle fragment fade-in-then-semi-out">1/4th Chronically Online</p>
<p class="subtitle fragment fade-in">…the organisers say I have 2 hours and 28 minutes left.</p>

Note:
Beat. Then: "fine. Here's the actual talk."
Cut from screen: header label "WHOAMI"
---
<!-- .slide: class="statement" data-part="Prompting vs engineering" -->

## There is no right way to do AI coding.

<h2 class="fragment fade-in">Every path leads to tech debt.</h2>

Note:
There are many things you can use, and every path leads to tech debt, because any code committed is tech debt. An arrow shot cannot be taken back. What changed is who shoots and how fast.
Bottom line, cut from screen: any code committed is tech debt. an arrow shot cannot be taken back. what changed is who shoots, and how fast.
---
<!-- .slide: class="meme-slide" -->

<img class="meme-image wide up" src="images/kot/midwit.png" alt="IQ bell curve meme" />

<div class="tile-row three" style="position:absolute;left:96px;right:96px;bottom:48px;margin:0">
  <div class="poster-tile fragment fade-in"><p>"just prompt it bro"</p></div>
  <div class="poster-tile fragment fade-in"><p>"12 parallel agents, 4 worktrees, an orchestrator, MCP for everything, 40k-token CLAUDE.md"</p></div>
  <div class="poster-tile fragment fade-in"><p>"just prompt it bro"<br><em>…with types, tests and a domain vocabulary</em></p></div>
</div>
---
<!-- .slide: class="statement" -->

## Agents are a new kind of teammate.

<p>You learned to write code a computer understands. Now set up work an agent understands.</p>

<p>Example: a one-command setup helps a new hire and an agent the same way.</p>

Note:
Bottom line, cut from screen: good agent experience still needs great developer experience underneath, and it needs updating as models change.
---
<!-- .slide: class="statement" -->

## North star

<div class="split">
  <div>
    <h3>previously</h3>
    <p>A new colleague can open a sensible PR in your codebase <strong>in a day</strong>.</p>
  </div>
  <div>
    <h3>now</h3>
    <p>Your agent can open a sensible PR in your codebase <strong>in five minutes</strong>.</p>
  </div>
</div>

Note:
Everything after this slide is in service of that one number. A day for a colleague meant: a README that works, a way to run it, someone to ask. Five minutes for an agent means all of that is written down and runnable without asking anyone.
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
<!-- .slide: class="exercise" data-section="Exercise · Prompting vs engineering" -->

## Turn a prompt into engineering

```ts
// slug.test.ts
import { expect, test } from "bun:test";
import { slugify } from "./slug";

test("punctuation", () => expect(slugify("Hello, World!")).toBe("hello-world"));
test("accents", () => expect(slugify("Crème brûlée")).toBe("creme-brulee"));
test("& is and", () => expect(slugify("Tom & Jerry")).toBe("tom-and-jerry"));
test("max 20, whole words", () => expect(slugify("The quick brown fox jumps")).toBe("the-quick-brown-fox"));
```

<div class="ladder">
  <div><span class="n">1</span><span>Fresh session: "write a slugify function in slug.ts". Run <code>bun test</code>.</span></div>
  <div><span class="n">2</span><span>Delete slug.ts. New session: "make slug.test.ts pass".</span></div>
  <div><span class="n">✓</span><span><strong>Done when</strong> run 2 passes on the first try. Note which case run 1 failed.</span></div>
</div>

Note:
Checked with Claude Code on Opus, 2026-10-28. Run 1, "write a slugify function in slug.ts": 3 of 4 pass. It even guessed & as "and". It failed "max 20, whole words" and returned "the-quick-brown-fox-jumps". Run 2, "make slug.test.ts pass": 4 of 4 on the first try.
The point is not that the model is weak. Slugify is easy for it. The 20-character rule is a decision only you can make, and the test is where you write it down. Complexity was never the failure; unstated intent was.
Setup for people online: an empty folder, bun installed (or nix shell nixpkgs#bun), and this file saved as slug.test.ts.
---
<!-- .slide: class="meme-slide" data-part="Everyone is a product engineer" -->

## Everyone is a product engineer

<img class="meme-image" src="images/kot/astronaut.png" alt="Two astronauts looking at Earth; the one behind holds a pistol: always has been" />

<p class="caption">wait, it's all product engineering? &nbsp;·&nbsp; always has been.</p>
---
<!-- .slide: class="statement" -->

## Outcome over output

<p class="subtitle">"Any code that makes money is good code" is only half a joke.</p>

Note:
Bottom line, cut from screen: If the measure is the outcome, then verifying the outcome, not the diff, is the work.
---
<!-- .slide: class="statement" -->

## Intent is the input

<p>Prompts, plans, tests, types and docs all say what you want.</p>

Note:
Bottom line, cut from screen: ways of writing intent down so a second brain can act on it without you in the room.
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

Note:
Brooks's schedule comes up properly in a few minutes.
Bottom line, cut from screen: time spent here is the planning third of Brooks's schedule.
---
<!-- .slide: class="statement" data-section="Tenet 02 of 10" -->

## User, machine, fellow-dev… and agent empathy

<p class="subtitle">The next reader of your code is as likely to be a model as a colleague.</p>
---
<!-- .slide: class="statement" data-section="Tenet 03 of 10" -->

## Think in outcomes, not output

<p class="subtitle">Output is now nearly free.</p>

Note:
Bottom line, cut from screen: measure yourself by it and the agent will happily bury you in it.
---
<!-- .slide: class="statement" data-section="Tenet 04 of 10" -->

## Be comfortable with ambiguity

<p class="subtitle">Agents are not.</p>

Note:
Long-running agents will hit ambiguity. They can write reliable code, but is it right for the context?
Bottom line, cut from screen: resolving ambiguity before you hand work over is the highest-leverage thing you do all day.
---
<!-- .slide: class="statement" data-section="Tenet 05 of 10" -->

## Ship fast, think and act slowly

<p class="subtitle">Slow is smooth. Smooth is fast.</p>

Note:
Bottom line, cut from screen: the agent supplies the fast; you supply the slow.
---
<!-- .slide: class="statement" data-section="Tenet 06 of 10" -->

## Talk to users who use your product

<p class="subtitle">Or to your ideal customers. How well do you interview your users?</p>

Note:
Bottom line, cut from screen: no agent can do this for you, and everything downstream depends on it.
---
<!-- .slide: class="statement" data-section="Tenet 07 of 10" -->

## Always use your product

<p class="subtitle">Dogfood. The agent can run the tests; it cannot feel the friction.</p>

Note:
Bottom line, cut from screen: that is the review only you can give.
---
<!-- .slide: class="statement" data-section="Tenet 08 of 10" -->

## Connect the dots

<p class="subtitle">Across the codebase, the user's day and the business.</p>

Note:
Your job is to make your own life easy: write the code, write the skills.
Bottom line, cut from screen: agents see one context window; you see the whole board.
---
<!-- .slide: class="statement" data-section="Tenet 09 of 10" -->

## Use LLMs to augment your learning

<p class="subtitle">Ask the agent to explain why it did the thing.</p>

Note:
Bottom line, cut from screen: the point is that you understand more at the end of the session, not less.
---
<!-- .slide: class="statement" data-section="Tenet 10 of 10" -->

## Develop taste in code, design and UX

<p class="subtitle">Taste is what you review with.</p>

Note:
Bottom line, cut from screen: without it, every agent suggestion looks equally fine.
---
<!-- .slide: class="exercise" data-section="Exercise · Ten tenets" -->

## Score yourself on the ten

<div class="tenets scorer">
  <div><span class="n">01</span><span class="t">Understand the problem space</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
  <div><span class="n">02</span><span class="t">User, machine, dev and agent empathy</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
  <div><span class="n">03</span><span class="t">Outcomes, not output</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
  <div><span class="n">04</span><span class="t">Be comfortable with ambiguity</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
  <div><span class="n">05</span><span class="t">Ship fast, think slowly</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
  <div><span class="n">06</span><span class="t">Talk to your users</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
  <div><span class="n">07</span><span class="t">Use your product</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
  <div><span class="n">08</span><span class="t">Connect the dots</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
  <div><span class="n">09</span><span class="t">Learn with LLMs</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
  <div><span class="n">10</span><span class="t">Develop taste</span><span class="pts"><button type="button" data-v="0">0</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button></span></div>
</div>

<p class="score-line"><span class="key">0 · not last month &nbsp; 1 · sometimes &nbsp; 2 · every week</span><span class="total">your score <b>–</b> / 20</span></p>

Note:
Click 0, 1 or 2 for each tenet; the total adds up on the slide. Scores stay in the viewer's own browser (localStorage), nothing is sent anywhere, so it is private by design. Online: ask people to score on growthx-deck.tarp.sh, then pick their lowest tenet and do it once this week; it's done when it's on their calendar. Example for 06: one user call. For 07: one real task done in your own product.
---
<!-- .slide: class="section-slide" -->

# The Mythical Man-Month

<p class="subtitle">Frederick P. Brooks Jr. · 1975</p>
---
<!-- .slide: class="statement" -->

## "Good cooking takes time. If you are made to wait, it is to serve you better, and to please you."

<p class="subtitle">Menu of Antoine's, New Orleans · the book's opening epigraph</p>

Note:
Agents collapsed the wait. The cooking still takes the time it takes, it just moved from the keyboard into planning, testing and reading. If you spend none of it, you get the coin toss.
Bottom line, cut from screen: agents collapsed the wait. the cooking still takes the time it takes; it moved into planning, testing and reading. spend none of it and you get the coin toss.
---
## Coding was already the smallest slice in 1975

<div class="fractions">
  <div><strong>1/3</strong><span>planning</span></div>
  <div class="agent-slice"><strong>1/6</strong><span>coding</span></div>
  <div><strong>1/4</strong><span>component test</span></div>
  <div><strong>1/4</strong><span>system test</span></div>
</div>

Note:
Brooks's rule of thumb for a schedule. Agents shrink the coding sixth further. Component test includes early system test; system test means all components in hand.
Bottom line, cut from screen: the other five sixths are still yours. treat the coding slice as the whole job and your estimate is off by six.

---
## One surgeon, a team of helpers

<div class="ladder">
  <div><span class="n">1</span><span><strong>You</strong> own the problem, the design and the final call.</span></div>
  <div><span class="n">2</span><span><strong>The agent</strong> writes most of the code, the docs and the first review.</span></div>
  <div><span class="n">3</span><span><strong>Testing is shared.</strong> The agent writes the tests. You decide what counts as passing.</span></div>
</div>

Note:
Surgeon: conceptual integrity lives in one head. Administrator: make things easy to run anywhere, for yourself and for the agent. Program clerk: review passes, skill and prompt writing, bookkeeping of what was tried. Toolsmith, tester, language lawyer: agents do the volume; you decide what counts as a passing test and which idioms are allowed.
---
## Brooks, fifty years later

<div class="ladder">
  <div><span class="n">1</span><span>Five agents on a fuzzy task means five sets of questions for you.</span></div>
  <div><span class="n">2</span><span>Let agents try options side by side. Build the winner with one.</span></div>
  <div><span class="n">3</span><span>Agents always produce something, so slipping is easy to miss.</span></div>
  <div><span class="n">4</span><span>Extra features cost nothing to generate. Saying no is still your job.</span></div>
  <div><span class="n">5</span><span>A throwaway first version is cheap now. Build one on purpose.</span></div>
</div>

Note:
Brooks's law. Adding people to a late project makes it later. Adding agent sessions to a confused task makes it more confused, because every session routes its questions through the same person: you are the communication overhead now.
On parallel agents. A position: parallel exploration, serial commitment. Threads that each implement a different option before you decide are cheap and worth it; that is Appleton's "making contact with reality", and it needs no branches or worktrees when each thread is its own implementation you compare. What Brooks rules out is several agents building the committed version of one ticket at once: it speeds up the sixth and multiplies the five sixths you still owe, each agent holds partial context, and the merge is where correct code becomes wrong. Many threads to explore, one thread to build, one inverted reviewer after.
One day at a time. "How does a project get to be a year late? One day at a time." Keep milestones small and visibly true or false.
The second system. The gold-plated version was always tempting; now it is also cheap to generate. The discipline of leaving things out is a human one.
Plan to throw one away. Let the agent build the first version to learn the problem, then throw it away on purpose rather than by accident.
---
<!-- .slide: class="exercise" data-section="Exercise · The Mythical Man-Month" -->

## Where did your last PR's time go?

<div class="pr-hours">
  <label><span>plan</span><input type="number" inputmode="decimal" min="0" step="0.5" data-k="plan" placeholder="0"><em>h</em></label>
  <label><span>code</span><input type="number" inputmode="decimal" min="0" step="0.5" data-k="code" placeholder="0"><em>h</em></label>
  <label><span>test</span><input type="number" inputmode="decimal" min="0" step="0.5" data-k="test" placeholder="0"><em>h</em></label>
  <label><span>review and fix</span><input type="number" inputmode="decimal" min="0" step="0.5" data-k="review" placeholder="0"><em>h</em></label>
</div>

<p class="pr-result">Fill in your last PR. <span class="out"></span></p>

Note:
Ten minutes, no setup: everyone has a last PR. People type hours on the slide; the bar and the code share update live and stay in their own browser (localStorage), nothing is sent. Rough hours are fine; the point is the ratio. Ask the room to post their code ÷ total in chat. Expect most answers well under 1/6 for code and a fat review-and-fix slice: the agent shrank the coding sixth, and the five sixths stayed, mostly as review and rework. Anyone above 1/2 for code usually skipped planning or tests; ask them which.
---
<!-- .slide: class="section-slide" -->

# No Silver Bullet

<p class="subtitle">Essence and accident in software engineering · 1986</p>
---
## Accidental difficulty

<p class="subtitle"><span class="tag agent" style="margin-left:0">agent</span> takes most of this</p>

<ul class="plain">
  <li>typing out code and boilerplate</li>
  <li>looking up how an API works</li>
  <li>mechanical changes across many files</li>
  <li>converting between formats</li>
</ul>
---
## Essential difficulty

<p class="subtitle"><span class="tag you" style="margin-left:0">you</span> still hold all four</p>

<ul class="plain">
  <li><strong>The data:</strong> its shape and the rules it must keep</li>
  <li><strong>The real world:</strong> the messy rules your software must match</li>
  <li><strong>Change:</strong> what users will ask for next</li>
  <li><strong>The whole picture:</strong> nobody sees all of it, the agent included</li>
</ul>
---
<!-- .slide: class="statement" -->

## Agents climb toward what you can measure.

<p>Give it a test and it will pass the test, sometimes by cutting corners.</p>

<p>It can't aim at what it can't see. So make the goal visible.</p>

Note:
Bottom line, cut from screen: No Silver Bullet is not pessimism. it is a to-do list: everything that shrinks the essence for a human also shrinks it for the agent.
---
## Brooks's four fixes still work

<div class="ladder">
  <div><span class="n">1</span><span><strong>Use boring tools.</strong> The agent knows them well.</span></div>
  <div><span class="n">2</span><span><strong>Show, don't tell.</strong> A screen beats a paragraph of requirements.</span></div>
  <div><span class="n">3</span><span><strong>Grow it in small steps.</strong> Build, check, learn, repeat.</span></div>
  <div><span class="n">4</span><span><strong>Have taste.</strong> Deciding what good looks like is still your job.</span></div>
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

Note:
One check-in said it plainly: watching the timeline, it feels like everyone else is doing unbelievable things, and the question is what it takes to catch up. No Silver Bullet is the answer, and it is a kind one. Every tool on the timeline is an attack on accidental difficulty, and a good one. The essence (knowing what to build, the shape of the data, what correct means) is where the compounding happens.
Bottom line, cut from screen: the gain any tool gives you is bounded by how much accident is left in your work. the essence is where the compounding happens, and none of it expires when the next tool ships.
---
<!-- .slide: class="statement" -->

## Keep up with your own loop.

<p class="subtitle">How fast you get from intent to a verified change. Measure it on your repo, not on a demo.</p>

Note:
Bottom line, cut from screen: one new tool a month, tried on a real ticket, kept only if the loop got faster.
---
<!-- .slide: class="statement" -->

## Let go of the leaderboards.

<p>New models, viral demos. Every coding agent is a short loop around a model.</p>

<p>The clip usually shows the basics, done well.</p>

Note:
Bottom line, cut from screen: the unbelievable thing in the clip was usually the basics you already know, applied by someone who did not skip them.
---
<!-- .slide: class="exercise" data-section="Exercise · No Silver Bullet" -->

## Your last ten asks: accident or essence?

```text
accidental   syntax · boilerplate · glue · lookups · refactors · format conversion
essential    the data's shape · the messy world · what changes next · what nobody sees
```

```sh
d=~/.claude/skills/accident-or-essence; mkdir -p $d/scripts && cd $d
curl -fsSO https://growthx-deck.tarp.sh/skills/accident-or-essence/SKILL.md
curl -fsS https://growthx-deck.tarp.sh/skills/accident-or-essence/scripts/last-asks.sh -o scripts/last-asks.sh
```

<div class="ladder">
  <div><span class="n">1</span><span>In Claude Code, in your repo: "accident or essence on my last ten asks".</span></div>
  <div><span class="n">✓</span><span><strong>Done when</strong> you post its last line, E out of 10, in chat.</span></div>
</div>

Note:
The skill reads your last ten typed prompts from ~/.claude/history.jsonl and ~/.codex/history.jsonl on your own machine; the script sends nothing anywhere, and the agent sees only those ten. It marks each A or E with the two lines above and names the one E prompt that could have been a test, a type or a domain-vocabulary entry instead. Same skill in the Greenhouse repo: skills/accident-or-essence.
Expect most asks to be A, and the E ones to be where the agent's output needed the most rework.
---
<!-- .slide: data-section="Exercise · Estimation" class="exercise" -->

## Estimate your own ticket. Then time it.

<div class="ladder">
  <div><span class="n">1</span><span>Pick something real you will build this week, small enough for an evening.</span></div>
  <div><span class="n">2</span><span>Write the feature, not the ask: who is better off, and how would you know.</span></div>
  <div><span class="n">3</span><span>Estimate each slice in hours: plan, code, component test, system test.</span></div>
  <div><span class="n">4</span><span>Mark each slice <span class="tag you">you</span> or <span class="tag agent">agent</span>.</span></div>
  <div><span class="n">5</span><span>Build it with the agent. Log the actual hours per slice.</span></div>
</div>

Note:
Everyone picks their own ticket instead of a shared CRUD example. Brooks's fractions are the starting guess: plan a third, code a sixth, test half. The point is the comparison afterwards: most people find coding shrank and the other slices did not. Bring the numbers back; the delta is the lesson.
Bottom line, cut from screen: compare estimate and actual, slice by slice. where did the five sixths go?
---
<!-- .slide: data-section="The playbook · 01 of 10" -->

## Make it run anywhere

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>A new teammate on a fresh laptop: one command and it runs.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>If the agent can't run it, you end up running it for the agent.</p>
  </div>
</div>

Note:
Postgres locally, config in env files, no shared staging dependency for everyday work. Object storage behind a local stand-in (MinIO for S3), fixtures that seed a believable state. Twelve-factor is still the cheapest checklist. One team spent two to three weeks on a single problem: getting a repo to run on a laptop.
Bottom line, cut from screen: DX is agent DX.
---
<!-- .slide: data-section="The playbook · 02 of 10" -->

## Decide the shape of your data

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Write it down once, as types. Example: an order can't be paid without a payment date.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Wrong shapes fail before anyone reviews them.</p>
  </div>
</div>

Note:
Application-specific invariants get their own types, not a comment. Anti-slop rules for your language live in the type config and lint config, not in a prompt the agent may skim.
Bottom line, cut from screen: make illegal states unrepresentable.
---
<!-- .slide: data-section="The playbook · 03 of 10" -->

## Tests are examples of what you want

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>A test shows what done looks like, and still explains it when you've forgotten why.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>It finds out it's done in seconds, without asking you.</p>
  </div>
</div>

Note:
No unit tests for their own sake. Three layers: expect tests at the library level, event-replay end-to-end through the domain, Stagehand for the few flows where the browser is the point. Expect tests are the legible kind: a human reads the output and says "yes, that". Example-based over clever.
Bottom line, cut from screen: agents thrive on feedback.
---
<!-- .slide: data-section="The playbook · 04 of 10" -->

## Keep it simple

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Simple code survives people leaving and models changing.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Agents are best at the common way. Every unusual choice is a guess.</p>
  </div>
</div>

Note:
Bottom line, cut from screen: simple code · simple components · simple tech choices.
---
<!-- .slide: data-section="The playbook · 05 of 10" -->

## Review to understand, not to approve

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Can you still explain the change? If not, it's not done.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Ask it why it did it. If it can't explain, treat that as a bug.</p>
  </div>
</div>

Note:
Correct code can be wrong: a diff that passes every test can still contradict how the codebase works. Review agents fail predictably: missed bugs, missing context, nitpicks; tell them to skip the nitpicks. Model inversion: author with one model, review with a different one. Different blind spots.
Bottom line, cut from screen: your understanding ↔ the agent's.
--
<!-- .slide: class="meme-slide btw-slide" data-section="The playbook · 05 of 10" -->

## Model inversion: author with one, review with another

<img class="meme-image" src="images/kot/same-stupidity.png" alt="Man gesturing at a laptop: now see for yourself, he is doing same stupidity that he always does" />

<p class="caption">correct code can be wrong. every test passed. the vocabulary broke.</p>
---
<!-- .slide: data-section="The playbook · 06 of 10" -->

## One word for one thing

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>The same word in the code, the screen and when you talk to users.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>If your code says Order, Booking and Reservation, the agent will add a fourth.</p>
  </div>
</div>

Note:
If Order, Booking and Reservation all mean the same thing, it will invent a fourth. Bounded contexts tell the agent where a word stops meaning what it meant. Put the domain vocabulary in the repo, next to the code. When a user's phrase does not map to a type, that is a design finding, not a naming chore.
Bottom line, cut from screen: domain-driven design.
---
<!-- .slide: data-section="The playbook · 07 of 10" -->

## Keep a log of what happened

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Like a bank statement: every change is a line you can read back.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Test by replaying the log: these steps in, these results out. No browser.</p>
  </div>
</div>

Note:
Browser e2e is slow, flaky and expensive for an agent to iterate on. Pair event sourcing with the expect idiom: the snapshot is the event stream, reviewed like a story. Audits over the log let the agent verify its own work. Keep the browser for the flows where it is the point.
Bottom line, cut from screen: make the data visible.
---
<!-- .slide: data-section="The playbook · 08 of 10" -->

## Keep a living wiki

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>Decisions that aren't written down get argued again. Write down the why once.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Its instructions and skills are that wiki. Add what each release teaches you.</p>
  </div>
</div>

Note:
Feed user feedback and post-mortems back in so the next session starts smarter.
Bottom line, cut from screen: codebase context.
---
<!-- .slide: data-section="The playbook · 09 of 10" -->

## Read the docs

<div class="split">
  <div>
    <span class="tag you" style="margin-left:0">you</span>
    <p>For the tools you use and where you deploy. Your knowledge can be current; the model's can't.</p>
  </div>
  <div>
    <span class="tag agent" style="margin-left:0">agent</span>
    <p>Point it at the real docs. Guessed pricing is how a side project becomes a big bill.</p>
  </div>
</div>

Note:
Bottom line, cut from screen: no substitute.
---
<!-- .slide: data-section="The playbook · 10 of 10" -->

## Climb the trust ladder

<div class="ladder stair">
  <div><span class="n">1</span><span>small, vanilla agent. <em>start here.</em></span></div>
  <div><span class="n">2</span><span>add plugins and skills: your conventions</span></div>
  <div><span class="n">3</span><span>add connectors (MCP): your systems</span></div>
  <div><span class="n">4</span><span>deploy to the cloud, unattended</span></div>
</div>

Note:
You: what you know, you know. What you don't, you don't, and there are unknown unknowns. Clarity of thought is not always there; experimenting is how you work it out.
Agent: agents can see screens and drive computers now, so they can verify their own work. Let them, in a sandbox, before you let them touch anything with consequences.
Bottom line, cut from screen: building your own small harness, even a toy one, is the fastest way to see what a coding agent does.
---
<!-- .slide: class="exercise" data-section="Exercise · The playbook" -->

## Copy the agent-ready skill into your repo

```sh
cd <your repo>; d=.claude/skills/agent-ready; u=https://growthx-deck.tarp.sh/skills/agent-ready
for f in SKILL.md references/checklist.md scripts/check.sh scripts/hook.sh; do curl -fsS --create-dirs -o $d/$f $u/$f; done
bash $d/scripts/check.sh
```

<div class="ladder">
  <div><span class="n">1</span><span>Run the three lines above in your own repo.</span></div>
  <div><span class="n">2</span><span>Read the ✗ lines. Each one is a basic from the playbook, with its fix.</span></div>
  <div><span class="n">✓</span><span><strong>Done when</strong> you post the last line, agent-ready: N gaps, in chat.</span></div>
</div>

Note:
The skill is Greenhouse's skills/agent-ready, served from the deck site: SKILL.md, the checklist, check.sh and the hook script. check.sh only reads files and runs just --summary; it changes nothing. Tested today on an empty Node repo: 11 gaps. Greenhouse itself: 0.
The hook only runs if you register it in .claude/settings.json; the skill works without it. Pi users: put it in .pi/skills/agent-ready instead.
---
<!-- .slide: data-part="Where the agent's knowledge comes from" -->

## Where the agent's knowledge comes from

<div class="ladder">
  <div><span class="n">1</span><span><strong>Paste it in.</strong> Easy. Long pastes get slow, and get skimmed.</span></div>
  <div><span class="n">2</span><span><strong>Search your documents.</strong> Finds similar text, mixes up similar things.</span></div>
  <div><span class="n">3</span><span><strong>Skills.</strong> Instructions loaded only when the task needs them.</span></div>
  <div><span class="n">4</span><span><strong>Look it up live.</strong> Always fresh. You pay every time.</span></div>
  <div><span class="n">5</span><span><strong>Train it into the model.</strong> Permanent. Slow and costly to change.</span></div>
</div>

<p class="kicker mono">after Jack Morris, "Stuffing Context is not Memory, Updating Weights is" · AI Engineer Code 2025</p>

Note:
Source: youtube.com/watch?v=Jty4s9-Jb78 and its chapter page on ai.engineer. Morris's argument: putting documents in context does not give the model durable knowledge; training it into the weights does. Numbers from the talk page, worth checking against the video before quoting: Llama 8B on one H100 drops from about 10,000 to 130 output tokens per second going from 1k to 128k context per user; Chroma's context-rot results show degradation around 10,000 tokens of irrelevant context.
Retrieval: an embedding takes five lines of code but is not a privacy boundary (text can be reconstructed from it), and a general embedding puts Visa and Mastercard next to each other.
Weights: training on one 10-K until the loss hit zero still left the model unable to write a poem about the company. Memorising the sequence is not knowing the subject. Generated examples (synthetic continued pretraining, self-study) do better. LoRA learns less and forgets less; memory layers learn almost as much with almost no forgetting.
His closing view: training and retrieval will coexist, for example a training update daily and retrieval on every request.
Skills are our addition to his list, not his.
---
## Skills are context on demand

<div class="split">
  <div>
    <h3>always loaded</h3>
    <p>A name and one paragraph per skill. Greenhouse's seven: about 550 words.</p>
  </div>
  <div>
    <h3>loaded when needed</h3>
    <p>The full instructions behind them: about 6,100 words.</p>
  </div>
</div>

Note:
Greenhouse's own skills: agent-ready, create-plan, ddd-vocabulary, event-sourcing, scaffold, slop-guard, viz-explainer. Word counts are from their SKILL.md files today: about 550 words of descriptions, about 6,100 words of SKILL.md bodies; references load on top of that only when a skill points the agent at them.
Why it beats pasting the docs in: the description is what the agent sees on every turn, so it stays small and the cache stays warm; the body arrives only for the task that needs it. Why it beats retrieval: the skill author decides what is relevant, not a similarity score. Hooks make a skill enforceable: agent-ready runs on session start and after edits.
Bottom line, cut from screen: a skill teaches the agent your way of doing things, and costs one paragraph until it fires.
---
<!-- .slide: class="exercise" data-section="Exercise · Knowledge" -->

## Write a skill in five lines

<pre><code class="nohighlight"># .claude/skills/commit-style/SKILL.md
&#45;&#45;&#45;
name: commit-style
description: Use when writing a git commit message in this repo.
&#45;&#45;&#45;
Subject: imperative, under 60 characters. Body: why, not what.</code></pre>

<div class="ladder">
  <div><span class="n">1</span><span>Save the file above in your repo.</span></div>
  <div><span class="n">2</span><span>Make any small change. Fresh session: "commit this".</span></div>
  <div><span class="n">✓</span><span><strong>Done when</strong> the commit subject is imperative and under 60 characters, without you naming the skill.</span></div>
</div>

Note:
Claude Code loads skills from .claude/skills; pi from .pi/skills; other harnesses have their own folder. The description line is what the agent sees every turn; the last line is what it reads only when committing. git log -1 --format=%s | wc -c checks the length.
---
<!-- .slide: class="section-slide" data-part="An agent-ready repo" -->

# An agent-ready repo

<p class="subtitle">nine checks, one command: just agent-ready</p>

Note:
Everything in this section is one skill in the repo: skills/agent-ready. A checklist, a script that checks it, and two hooks. The agent can run it on any repo, including yours tomorrow.
---
## A .gitignore for every stack

```text
node        node_modules/   dist/
wrangler    .wrangler/      .dev.vars*
python      .venv/   __pycache__/   .pytest_cache/
next.js     .next/
rust        target/
```

Note:
Start from github.com/github/gitignore for each language and framework in the repo. Build output and caches cost tokens and mislead the agent; ignored secrets never reach a commit. The check detects each stack from its marker file (package.json, wrangler.jsonc, pyproject.toml, next.config, Cargo.toml) and looks for these entries.
Bottom line, cut from screen: the agent greps everything you do not ignore.
---
## One shared toolbox

```sh
nix develop        # every tool, same version, for you and the agent
```

<p>Nothing gets installed on your laptop. A new clone gets exactly the same versions.</p>

Note:
The tool list is Greenhouse's flake.nix; flake.lock is committed. The agent's sandbox gets the same versions as your laptop. direnv with use flake enters the shell when you cd in.
---
## Give the agent the command-line tools

<div class="ladder">
  <div><span class="n">1</span><span><strong>wrangler</strong> for Cloudflare.</span></div>
  <div><span class="n">2</span><span><strong>flyctl</strong> for Fly.</span></div>
  <div><span class="n">3</span><span><strong>docker</strong> for containers.</span></div>
  <div><span class="n">4</span><span><strong>psql</strong> for Postgres.</span></div>
</div>

Note:
The check reads the repo: a wrangler config needs wrangler pinned, fly.toml needs flyctl in the flake, a Dockerfile or compose file needs docker, Postgres in code needs postgresql. Greenhouse uses D1, so only wrangler applies.
Bottom line, cut from screen: the agent works through CLIs. a dashboard step is a step it hands back to you.
---
## Back to a clean start in one command

```sh
just reset         # wipe local data, load the test data
```

<p>Test data, not just empty tables. Greenhouse loads an admin, a user called Sam, and the agent.</p>

Note:
The check wants four recipes: up, test, seed, reset. Greenhouse has all four; packages/db/seed.ts writes the three accounts as events, so the seed goes through the same engine as the app.
---
## Three seeded logins

```text
admin@greenhouse.test     the admin
sam@greenhouse.test       a regular user
agent@greenhouse.test     the agent
```

<p>The agent signs in with these, the same way a person does.</p>

Note:
Never seed these in a remote database; never put real credentials in an example file. Greenhouse: users and sessions tables, PBKDF2 password hashes, /auth/sign-up, /auth/sign-in, /auth/sign-out, /auth/me. The agent signs in like any Participant, with its own local account. Production accounts come from GH_REMOTE=1 just user-add, which asks for the password.
Bottom line, cut from screen: an admin and a regular user test both sides of every permission check.
---
## Anything an admin can click, the agent can call

<div class="ladder">
  <div><span class="n">1</span><span>Not signed in: refused.</span></div>
  <div><span class="n">2</span><span>Signed in as Sam: refused.</span></div>
  <div><span class="n">3</span><span>Signed in as the admin: allowed. Same result as the admin page.</span></div>
</div>

Note:
Greenhouse: GET /flags and PUT /flags/:name in apps/api/src/flags-admin.ts behind requireAdmin, the one gate for admin actions. $API is the api Worker's URL. Production is not migrated yet (0002_accounts is applied by hand), so until the next deploy the live flags endpoint is still open. agent-ready.json tells the check that /flags is the admin API.
Bottom line, cut from screen: the agent administers with curl and checks the result in the page.
---
## A browser the agent can drive

<p><strong>Claude in Chrome</strong> or <strong>Stagehand</strong>: open the page, run the flow, read the console.</p>
<p><strong>Agentation</strong>: a note pinned on an element reaches the agent with its selector.</p>

Note:
Greenhouse has stagehand-browse and agentation installed as skills. The check passes when a skill or MCP named for a browser, Chrome, Playwright or Stagehand is installed.
Bottom line, cut from screen: the agent checks its own screen instead of asking you for a screenshot.
---
## The checklist is a skill with hooks

```text
$ just agent-ready
✓ gitignore · toolbox · command-line tools
✓ one-command start, test, seed, reset
✓ test logins · admin API · health check · browser
agent-ready: 0 gaps
```

<p>It runs at the start of every session, and again when you change the setup files.</p>

Note:
Abridged from the real output on Greenhouse main. This morning it reported four gaps: no flake.lock, no seeded users, no env example, no sign-in. All four are fixed on main now. Files: skills/agent-ready/SKILL.md, references/checklist.md, scripts/check.sh, scripts/hook.sh; hooks in .claude/settings.json. Neither hook blocks; both add the open gaps to the agent's context. Overrides in agent-ready.json.
---
<!-- .slide: class="statement" -->

## Also worth giving the agent

<div class="ladder">
  <div><span class="n">1</span><span><code>just --list</code> as the menu: every runnable thing, one comment line each.</span></div>
  <div><span class="n">2</span><span>Quiet tools: nothing on success, one line per failure.</span></div>
  <div><span class="n">3</span><span>Logs from a CLI: <code>wrangler tail</code>, <code>fly logs</code>.</span></div>
  <div><span class="n">4</span><span>Fixed local ports, written in the README.</span></div>
  <div><span class="n">5</span><span>A recorded fallback for anything slow or flaky.</span></div>
</div>

Note:
Not checked by the script; listed at the end of references/checklist.md.
---
<!-- .slide: class="exercise" data-section="Exercise · An agent-ready repo" -->

## Let the agent close one gap

```text
"use agent-ready: fix the smallest gap, then run the check again"
```

<div class="ladder">
  <div><span class="n">1</span><span>In the repo where you installed the skill, fresh session, paste the line above.</span></div>
  <div><span class="n">2</span><span>Read the diff before you accept it.</span></div>
  <div><span class="n">✓</span><span><strong>Done when</strong> check.sh reports one gap fewer than your first run.</span></div>
</div>

Note:
Builds on the playbook exercise, where they installed the skill. Good first gaps: a missing .gitignore entry, an .env.example with the test logins, a just reset recipe. Sign-in and admin routes are real work; skip them in ten minutes. If the agent asks you for a password, that is the gap the checklist is about.
---
<!-- .slide: class="section-slide" -->

# Picking your tool

<p class="subtitle">for your platform, not the leaderboard</p>
---
<!-- .slide: class="statement" data-section="Picking your tool" -->

## pi

<p class="subtitle">Small, vanilla, hackable harness.</p>

Note:
Bottom line, cut from screen: For someone who wants to understand what a coding agent does, and build up plugins, skills and connectors one rung at a time.
---
<!-- .slide: class="statement" data-section="Picking your tool" -->

## Claude Code

<p class="subtitle">Terminal-first agent with skills, hooks and subagents.</p>

Note:
Bottom line, cut from screen: For someone who lives in a repo and a shell, wants long autonomous runs and a way to encode conventions.
---
<!-- .slide: class="statement" data-section="Picking your tool" -->

## Codex

<p class="subtitle">Cloud sandboxes plus a CLI.</p>

Note:
Bottom line, cut from screen: For someone who wants parallel tasks running away from their laptop, each in its own environment.
---
<!-- .slide: class="statement" data-section="Picking your tool" -->

## AmpCode

<p class="subtitle">Editor-integrated agent with shared threads.</p>

Note:
Bottom line, cut from screen: For someone who wants the agent inside the editor and a record of sessions to go back to.
---
<!-- .slide: data-section="Picking your tool" -->

## Same question, three ways

<textarea class="pele-src" hidden>
xychart-beta
    title "What the model had to read (thousand tokens)"
    x-axis ["Claude Code, tools", "pi, tools", "pi, code mode"]
    y-axis "thousand tokens" 0 --> 500
    bar [463, 479, 15]
</textarea>

<p>Tools: every file goes into the model. Code mode: it writes a script and only the answer comes back.</p>

Note:
Run on 2026-10-28 against the same filesystem MCP server and 40 JSON files of 50 orders each (160 KB). Answer: FR, 27,029,595 cents; JP is close behind, so eyeballing gets it wrong.
Claude Code, Opus 5.5, MCP tools called directly: 7 turns, about 463 thousand tokens read, $1.96. pi, GPT-5.6 sol, MCP tools called directly: 11 tool calls, about 479 thousand tokens, $0.59. pi, same model, code mode: 3 calls, about 15 thousand tokens, $0.04.
Why: when the agent calls a tool directly, every file it reads lands in its context. In code mode it writes a small script that reads the files and adds them up; only the final numbers come back. Same answer, a thirtieth of the reading.
The fair comparison is the two pi rows: same model, only code mode changes. Claude Code ran on a different model because pi's Anthropic login had expired.
Rerun it: files, MCP config and prompt are at growthx-deck.tarp.sh/mcp-test/.
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

<p class="subtitle">eleven stages, one pull request each · press down</p>

Note:
main is stage cp-00, the scaffold. The workshop builds on it as a stack of branches, cp-01 to cp-10, each the one before plus one thing you can demo. Every branch has a draft PR against the one below it (cp-01's against main), so the PR shows only that stage, and its description is the stage's plan. Two sites: greenhouse-demo.tarp.sh, which GitHub redeploys on every merge to main, and greenhouse.tarp.sh, the finished product, deployed from cp-10 with just deploy prod. Repo: github.com/pratos/growthx-workshop (private). Build a stage yourself: check out the stage before; its .stage file names the next one, just next prints that plan, a hook keeps your agent to the files the plan lists, and just stage-check runs the plan's checks. Then compare with the stage's PR.
--
<!-- .slide: data-section="Building Greenhouse" -->
## Eleven stages, one pull request each

<div class="tenets stack-list">
  <div><span class="n">00</span><span>Scaffold</span></div>
  <div><span class="n">01</span><span>First deploy, and the way back</span></div>
  <div><span class="n">02</span><span>Name it, draw it, model it</span></div>
  <div><span class="n">03</span><span>The engine, and signing in</span></div>
  <div><span class="n">04</span><span>Admin, and the first browser test</span></div>
  <div><span class="n">05</span><span>The plan, written in an editor</span></div>
  <div><span class="n">06</span><span>Chat with the agent, and the agent writes</span></div>
  <div><span class="n">07</span><span>Make it look and feel right</span></div>
  <div><span class="n">08</span><span>When the agent fails</span></div>
  <div><span class="n">09</span><span>Tests a person would walk through</span></div>
  <div><span class="n">10</span><span>Release behind a switch</span></div>
</div>

<p>main is the scaffold. Each stage is the one before, plus one thing you can demo. To build one yourself: <code>just next</code>, then <code>just stage-check</code>.</p>

Note:
Read the list top to bottom: ground first (scaffold, deploy), then words and design, then the engine and admin, then the product (plan document, agent), then polish (UI, failures, end-to-end tests), then release. Everything any product needs comes before the product itself.
--
<!-- .slide: class="stage" data-cp="cp-00" -->
## Scaffold: it runs on a fresh laptop

<div class="ladder">
  <div><span class="n">1</span><span>One shared toolbox and one list of commands.</span></div>
  <div><span class="n">2</span><span>Two Workers, the website and the server, each saying "I'm up".</span></div>
  <div><span class="n">3</span><span>Guard rails: a lint rule, an architecture map, the agent-ready check.</span></div>
</div>

<p class="demo"><span>demo</span><code>just up</code>, then open <code>/healthz</code>: both versions, before anyone logs in.</p>

Note:
main (stage cp-00). `just step 0` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. No deploy, no product words, no tables yet. Plan: docs/plans/stages/cp-00-scaffold.plan.html.
Setup: Nix (nix develop or direnv), then just install, just up. No secrets, no database yet.
--
<!-- .slide: data-cp="cp-00" -->
## AGENTS.md is the first thing the agent reads

<div class="ladder">
  <div><span class="n">1</span><span><strong>What this is.</strong> A planning room: people and an agent write a plan together.</span></div>
  <div><span class="n">2</span><span><strong>Where to look.</strong> Read the vocabulary before naming anything. Every command is in the justfile.</span></div>
  <div><span class="n">3</span><span><strong>Rules no linter can check.</strong> Ask about a feature switch before adding a command. Never print a secret.</span></div>
</div>

<p>168 words. Detail lives in skills, loaded when needed.</p>

Note:
Greenhouse's AGENTS.md, summarised on screen; open it live if there is time. It is 168 words on purpose: Claude Code's docs say to keep this file under 200 lines, because it is loaded into every session and longer files are followed less reliably. Multi-step procedures go into skills instead.
Who reads it: AGENTS.md is an open format (agents.md, now under the Linux Foundation's Agentic AI Foundation) read by Codex, Cursor, Copilot's coding agent, Amp, Jules, Gemini CLI and many others; pi reads AGENTS.md or CLAUDE.md. Claude Code reads CLAUDE.md, and since v2.1.277 reads AGENTS.md when there is no CLAUDE.md. Greenhouse makes CLAUDE.md a symlink to AGENTS.md, so every tool reads the same file.
Nesting: an AGENTS.md inside a sub-folder applies to that folder; the nearest one wins, and what you type in chat overrides all of them.
The folder layout is the second thing: apps/api the server, apps/web the website, packages/domain the rules, docs the vocabulary and plans, justfile every command.
Sources: code.claude.com/docs/en/memory, agents.md.
--
<!-- .slide: data-cp="cp-00" -->
<div class="live">live</div>

## Health before login

```sh
just up            # start everything on your laptop
```

<p><code>/healthz</code> says it's up, and which version.</p>

<p><code>/readyz</code> checks the database too.</p>

<p>Then sign-in: the admin, Sam, and the agent.</p>

Note:
Minute 3 to 6. Run `just up`, open http://localhost:3000/healthz and point at the two versions, web and api, coming through the binding. Then `/login`. If the laptop is slow, `just demo cp-00` runs the two curls.
Cut from screen: header label "GREENHOUSE · THE DEMO · 01 SCAFFOLD · cp-00"
--
<!-- .slide: class="stage" data-cp="cp-01" -->
## First deploy, and the way back

<div class="ladder">
  <div><span class="n">1</span><span>Merge into main and GitHub deploys the server, then the website.</span></div>
  <div><span class="n">2</span><span>Every deploy first checks you're logged in to the right Cloudflare account, and checks cost and security.</span></div>
  <div><span class="n">3</span><span>Any failed check stops the deploy before it touches anything.</span></div>
</div>

<p class="demo"><span>demo</span>Merge into main, watch <code>greenhouse-demo.tarp.sh/healthz</code> change, then roll back.</p>

Note:
PR #2, branch cp-01-first-deploy. `just step 1` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. Migrations stay a separate, deliberate act. A newcomer follows docs/DEPLOY.md to a first live deploy. Plan: cp-01-first-deploy. Every deploy runs scripts/cf-account.sh (stops on the wrong Cloudflare login) and scripts/cf-audit.ts (Durable Object cost and security checks); any ✗ stops it.
Setup: gh auth login and bunx wrangler login; GitHub secret CLOUDFLARE_API_TOKEN (docs/DEPLOY.md). Merge into main deploys greenhouse-demo.tarp.sh.
--
<!-- .slide: class="stage" data-cp="cp-02" -->
## Name it, draw it, model it

<div class="ladder">
  <div><span class="n">1</span><span>Every word the product uses, once, with the words it bans.</span></div>
  <div><span class="n">2</span><span>A map of the plan room, and the events it records.</span></div>
  <div><span class="n">3</span><span>A look borrowed from GitHub Next's Chopin: warm ground, white page, one accent.</span></div>
</div>

<p class="demo"><span>demo</span>The vocabulary check fails when someone exports a banned word like <code>Verdict</code>.</p>

Note:
PR #3, branch cp-02-design. `just step 2` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. Words first, because every later name comes from them. No engine code yet. Plan: cp-02-design. Design language: Chopin's (MIT, attributed): warm olive ground, white page, petrol accent, Inter plus Lora, light only.
Setup: Nothing new; the plans and the decision report are pages.
--
<!-- .slide: data-cp="cp-02" -->
## What we're building

<img class="app-shot" src="images/shots/app-plan.webp" alt="The Greenhouse plan workspace: chat with the agent on the left, the plan gh-12 on the right with a thread on block b3 and a Resolve button">

<p class="why">A plan your team writes together. Comments end in decisions. An agent sits beside it and answers.</p>

Note:
The real app, running locally (screenshot taken today). Left: Chat. A Session with the agent; it answers one question at a time, in order, and anyone in the session can steer. Right: the plan gh-12 as a raised sheet with two views, Plan and Decisions. Block b3 has a Thread, "retries in the client or the wrapper?", with a Resolve field. Below: open a thread on any block. The Live pill means the room's socket is connected. The design follows Chopin's design language (MIT, attributed in the repo).
--
<!-- .slide: data-cp="cp-02" -->
## Where should the agent live?

<p class="why">Greenhouse's agent answers questions for everyone working on a plan. So it has to keep going when someone closes their laptop, and serve two people at once.</p>

<table class="choice">
  <tr><th></th><th>your browser tab</th><th class="pick">a room on Cloudflare ✓</th><th>a container</th></tr>
  <tr><td>you close the laptop</td><td>it stops</td><td class="pick">keeps going</td><td>keeps going</td></tr>
  <tr><td>two people ask at once</td><td>no, one tab each</td><td class="pick">yes, one room</td><td>hard</td></tr>
  <tr><td>nobody is using it</td><td>free</td><td class="pick">almost free, it sleeps</td><td>you pay while it runs</td></tr>
</table>

<p class="why">We chose the room. The plan showed these options side by side, and we clicked one.</p>

Note:
This is the decision report in docs/decisions/agent-loop.html, made in cp-02 while planning. Open it if there is time: each option has a diagram, and the rows are the questions a person would ask.
What "the room" means: one Durable Object per plan on Cloudflare. It holds the plan, its comments and the agent's chat sessions, and every open tab is connected to it (cp-05, cp-06). It sleeps when nobody is connected and costs almost nothing.
Honest detail: the agent's thinking loop runs as its own process, just agent-serve, which signs in like a person and works through the room's API. The conversation and its state live in the room, so the process can be killed and restarted and picks up where it was.
The report also compares crashes and running code: the browser loses everything on a crash and has no shell; a container can run the repo's tests directly but only resumes if its disk survives. Nothing in Greenhouse runs in a container.
--
<!-- .slide: data-cp="cp-02" class="shots" -->
## The plan is a page you click, not a wall of text

<div class="shot-pair">
  <figure><img src="images/shots/plan-top.webp" alt="The resolve-thread plan page: title, status, progress 8 of 10 checks, and a contents rail"><figcaption>The plan: what's true today, where we end up, progress</figcaption></figure>
  <figure><img src="images/shots/plan-states.webp" alt="The new resolve component drawn in three states: open, refused, decided"><figcaption>A new screen, in every state, before it's built</figcaption></figure>
</div>
Note:
Minute 9 to 13. Open the GH-12 plan page, docs/plans/2026-10-28-resolve-thread.plan.html (the resolve-comment feature). Scroll the summary, open its decision, "When someone resolves a comment, do we save one record or two?", and point at the locked choice, then the three states of the resolve component. Say: the plan tells the agent where to look and what must be true; the tests tell it when it is done.
Cut from screen: header label "GREENHOUSE · THE DEMO · 02 PLAN THE PRODUCT · cp-01"
Bottom line, cut from screen: plan: docs/plans/2026-10-28-resolve-thread.plan.html
Screenshots are the real docs/plans/2026-10-28-resolve-thread.plan.html, captured today. Open it live if there is time: the decision report and the state explorer are clickable.
--
<!-- .slide: data-cp="cp-02" -->
## The domain vocabulary lives next to the code

<p>One file lists every word the app uses, and what it means.</p>

<p>Each word lists the words not to use. Decision, not resolution, verdict or outcome.</p>

Note:
Minute 13 to 16. `cat docs/DOMAIN-VOCABULARY.md` and point at the "Not:" line under Decision. Then ask pi "add resolve thread" and watch the names it picks; the ddd-vocabulary skill makes it search first.
Cut from screen: The agent searches the web before it names: how Linear, GitHub and Chopin say it.
Cut from screen: header label "GREENHOUSE · THE DEMO · 03 ONE VOCABULARY · cp-02"
--
<!-- .slide: class="stage" data-cp="cp-03" -->
## The engine, and signing in

<div class="ladder">
  <div><span class="n">1</span><span>A small event engine every later part uses.</span></div>
  <div><span class="n">2</span><span>Sign up, sign in, sign out, each saved as an event.</span></div>
  <div><span class="n">3</span><span>Too many sign-in attempts are slowed down.</span></div>
</div>

<img class="stage-shot" src="images/shots/app-home.webp" alt="Greenhouse home page: signed in as Admin, open or start a plan, the plans list">

<p class="demo"><span>demo</span>Sign up at <code>/signup</code> and land signed in. Then read the sign-up story test.</p>

Note:
PR #4, branch cp-03-engine-identity. `just step 3` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. Engine: appends that refuse stale writes, projections in the same write, one database port. Sign-in by bearer token or cookie. agent-ready now reports one gap: the admin API, which cp-04 adds. Plan: cp-03-engine-identity. Sign-in and sign-up are rate-limited.
Setup: just reset seeds the admin, Sam and the agent locally. Demo site: just migrate-remote demo, then just user-add for yourself.
--
<!-- .slide: class="stage" data-cp="cp-04" -->
## Admin, and the first browser test

<div class="ladder">
  <div><span class="n">1</span><span>A dashboard, every account, and the event log with passwords masked.</span></div>
  <div><span class="n">2</span><span>Admins add accounts and flip feature switches from the page.</span></div>
  <div><span class="n">3</span><span>Every admin page is an API call first, behind one check.</span></div>
</div>

<img class="stage-shot" src="images/shots/app-admin.webp" alt="Admin dashboard: accounts, signed in now, flags, events recorded">

<p class="demo"><span>demo</span>Add an account from the page. Sam is refused with a reason. Then <code>just e2e admin</code>.</p>

Note:
PR #5, branch cp-04-admin. `just step 4` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. Not signed in: 401. Sam: 403. Admin: data. The first Playwright test. Plan: cp-04-admin. Admins add accounts from /admin/accounts (POST /admin/accounts).
Setup: just e2e-install once (Chromium). Demo site: just migrate-remote demo, and make yourself an admin with just user-add. Admins can also add accounts from the page.
--
<!-- .slide: class="stage" data-cp="cp-05" -->
## The plan, written in an editor

<div class="ladder">
  <div><span class="n">1</span><span>Write the plan in a real editor. Type / for headings, lists, tasks.</span></div>
  <div><span class="n">2</span><span>Every save is an event. Others' saves arrive live in your tab.</span></div>
  <div><span class="n">3</span><span>Comment on a block, resolve it into a decision, behind a switch.</span></div>
</div>

<img class="stage-shot" src="images/shots/app-slash.webp" alt="The plan editor with the slash menu open: Ask the agent to write, Heading, lists, Task list, Quote, Code, Divider">

<p class="demo"><span>demo</span>Two tabs: type in one, it appears in the other.</p>

Note:
PR #6, branch cp-05-plan-document. `just step 5` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. A first pass naming the event ThreadClosed with a verdict passes its own tests, fails the vocabulary check, and just review main reports it. Fallback: just demo cp-05. Plan: cp-05-plan-document. Tiptap editor. Text is saved as events: EditPlan becomes PlanEdited, refused if it was based on an older edit; autosaves; others' saves arrive live; / opens a blocks menu. Home lists plans and opens or starts one. Plan rooms need a sign-in.
Setup: just reset adds the resolve-thread flag. Claude Code or pi signed in for just review. Demo site: just flag user resolve-thread <you>.
--
<!-- .slide: data-cp="cp-05" -->
## A request in, facts out

<textarea class="pele-src" hidden>
flowchart LR
    P["Pratos: resolve this thread, we chose the wrapper"] --> R{"Is the thread open?<br/>Is the feature on for Pratos?"}
    R -- "no" --> X["Refused, with a reason"]
    R -- "yes" --> E1["ThreadResolved"]
    R -- "yes" --> E2["DecisionRecorded: wrapper"]
    E1 --> L[("the log")]
    E2 --> L
</textarea>

<p>The rules decide. What they decide is written down as facts, and never edited.</p>

Note:
Event sourcing, Greenhouse edition. The command is ResolveThread; the rules live in packages/domain/src/thread/decider.ts. Two checks: the thread must be open, and the resolve-thread flag must be on for that participant. Pass both and two events are appended: ThreadResolved and DecisionRecorded. Fail either and nothing is written; the person gets the reason.
Bank-statement analogy: you do not edit last month's statement to fix a mistake, you add a correcting line.
--
<!-- .slide: data-cp="cp-05" -->
## Today's state is the history, replayed

<textarea class="pele-src" hidden>
stateDiagram-v2
    direction LR
    [*] --> none
    none --> open: ThreadOpened
    open --> open: ReplyPosted
    open --> resolved: ThreadResolved
</textarea>

<p>Replay the events and you get the thread. Resolving twice can't happen: there is no arrow for it.</p>

Note:
ThreadState in the decider is one of none, open (on exactly one block) or resolved. Each event moves it along; a reply leaves it open. Resolving a resolved thread is refused by the rules and can't be represented in the type.
Why it matters for the agent: a test is just "these events happened, this command arrives, expect these events". No database, no browser, milliseconds. just replay gh-12 prints a real plan's history as this kind of story.
--
<!-- .slide: data-cp="cp-05" -->
<div class="live">live</div>

## The test is a story a person can read

```text
given  ThreadOpened       t7 on b3 by pratos "retries in the client or the wrapper?"
       ReplyPosted        t7 by agent "wrapper: one place to change"
when   ResolveThread      t7 by pratos decision "wrapper"
then   ThreadResolved     t7 by pratos
       DecisionRecorded   t7 on b3 by pratos decision "wrapper"
```

Note:
Minute 25 to 28. Run `just test`, then `cat packages/domain/src/thread/__expect__/resolve.snap.txt`. Ask pi for a test and watch it reach for a mock; point at the snapshot and say this is the test it should have written.
Cut from screen: header label "GREENHOUSE · THE DEMO · 04 THE BACKEND · cp-03"
Bottom line, cut from screen: command plus starting stream in, events out. simulated clock. no mocks of our own modules.
--
<!-- .slide: class="btw-slide" data-cp="cp-05" -->

## Old records, new shape

<p>Saved history is never edited.</p>

<p>Old entries are read in the new shape when they're loaded.</p>

<p>Example: old decisions get an empty reason field.</p>

Note:
Minute 28 to 32. Ask Claude Code to "add rationale to decisions" and watch it edit the schema in place; stop it. Then `cat packages/domain/src/upcast/__expect__/*.snap.txt`. Point at the AGENTS.md line about repos/effect and the oxlint ignore.
Cut from screen: The Effect source sits at repos/effect, read-only. The agent reads it before it writes Effect code, and never imports from it.
Cut from screen: header label "/BTW · 04 THE BACKEND · cp-04"
--
<!-- .slide: data-cp="cp-05" class="statement" -->

## One room per plan

<p>Everyone working on a plan, people and the agent, talks to the same room on Cloudflare.</p>

<p>It keeps running when everyone closes their laptops.</p>

Note:
Minute 45 to 48. Three sentences, three clicks. Point back at plan-room.ts: the object that owns the event log is the object that knows when it changed, and the same shape holds a pi-durable session.
Cut from screen: header label "GREENHOUSE · THE DEMO · 06 WHY CLOUDFLARE"
Bottom line, cut from screen: the plan room is that object. its sockets hibernate when nobody is talking.
--
<!-- .slide: data-cp="cp-05" -->
<div class="live">live</div>

## Two tabs, one plan, live

<p>Type in one tab. It appears in the other. No refresh.</p>

Note:
Minute 37 to 41. Two tabs on /plans/gh-12 side by side; open a Thread in one, watch it land in the other. Then apps/api/src/plan-room.ts: acceptWebSocket, getWebSockets, broadcast after the insert. If the socket misbehaves, `just demo cp-08`.
Cut from screen: header label "GREENHOUSE · THE DEMO · 05 COMPONENTS · cp-08"
Bottom line, cut from screen: map: docs/architecture/index.html#share
--
<!-- .slide: data-cp="cp-05" -->
<div class="live">live</div>

## The check that catches a wrong word

```sh
just domain-vocabulary-check
```

<p>Asked to add "resolve thread", the agent named it ThreadClosed. Every test passed.</p>

<p>The check fails it. A second model's review catches it too.</p>

Note:
Minute 16 to 20. Explain the mistake out loud: the agent named the event ThreadClosed with a verdict, and every test passed. Live: on the branch where the agent wrote "resolve thread", run `just domain-vocabulary-check` and point at the names it rejects. If there is time, start `just review main` in the background pane. Fallback: `just demo cp-05` makes the ThreadClosed version in a throwaway worktree and shows both checks catching it.
Cut from screen: header label "GREENHOUSE · THE DEMO · 03 ONE VOCABULARY · cp-02"
--
<!-- .slide: data-cp="cp-05" -->

## The review a second model writes

```sh
just review main                    # written with one model, reviewed by another
scripts/review.sh main --prompt     # what the reviewer is sent
```

<p>The reviewer reads the vocabulary first.</p>

<p>Every test passes. The review still finds the wrong word.</p>

Note:
Model inversion, live. The script diffs the branch against main, skips snapshots and the lockfile, and asks for vocabulary violations, correct-but-wrong code, at most two real bugs, and one question before merge. Author with Claude Code and it reviews with pi instead.
Recorded fallback: demo/review-fallback.md. It ends with the question: how are streams that already hold ThreadResolved and DecisionRecorded read after this change?
Bottom line, cut from screen: correct code can be wrong.
--
<!-- .slide: class="stage" data-cp="cp-06" -->
## Chat with the agent, and the agent writes

<div class="ladder">
  <div><span class="n">1</span><span>Start a session beside the plan and ask the agent.</span></div>
  <div><span class="n">2</span><span>Type /ask in the plan and the agent writes into it, credited to the agent.</span></div>
  <div><span class="n">3</span><span>It edits the plan the way a person does, so a stale edit is refused and retried.</span></div>
</div>

<p class="demo"><span>demo</span><code>/ask a three step rollout plan</code>. A second later: "Written by the agent" in the plan.</p>

Note:
PR #7, branch cp-06-sessions-agent. `just step 6` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. The agent is a Participant: same API, same rights. It answers in words, no tools yet, on pi-durable. Plan: cp-06-sessions-agent. The agent edits through EditPlan, the same command a person uses, so a stale agent write is refused and retried exactly like a person's. For real answers run just secret put ANTHROPIC_API_KEY (agent-serve reads .dev.vars); without one a faux model answers and says so.
Setup: just agent-serve in a second terminal. Optional: just secret put ANTHROPIC_API_KEY for real answers; without one a faux model answers.
--
<!-- .slide: data-cp="cp-06" class="btw-slide" -->

## Kill the agent mid-task. Start it again.

<div class="ladder">
  <div><span class="n">1</span><span>It saves after every step.</span></div>
  <div><span class="n">2</span><span>Start the same command: it picks up where it stopped.</span></div>
  <div><span class="n">3</span><span>Run it a third time: it answers from what it saved. No model call.</span></div>
</div>

Note:
Minute 41 to 45. Start the agent in packages/agent with one request id, wait for "tool started", `kill -9` it, run the same command and watch it resume. Run it a third time and point at the answer arriving with no model call in the log. The recorded fallback is in demo/.
Cut from screen: header label "/BTW · 05 COMPONENTS · packages/agent"
--
<!-- .slide: class="stage" data-cp="cp-07" -->
## Make it look and feel right

<div class="ladder">
  <div><span class="n">1</span><span>Impeccable critiques the working page first.</span></div>
  <div><span class="n">2</span><span>Chopin's workspace: chat on the left, the plan as a raised sheet with Plan and Decisions views.</span></div>
  <div><span class="n">3</span><span>Emil's animate skill decides the motion; Agentation carries notes.</span></div>
</div>

<p class="demo"><span>demo</span>Before and after of the plan page. Pin one note in the browser; the agent fixes it live.</p>

Note:
PR #8, branch cp-07-ui. `just step 7` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. The process is the lesson: critique, then classes, then pages. No new palette or font. Plan: cp-07-ui.
Setup: just up; the Agentation toolbar shows in dev.
--
<!-- .slide: data-cp="cp-07" -->
<div class="live">live</div>

## Build the plan page under skills

<p>Claude Code builds the page using a design skill and an animation skill.</p>

<p>Pin a note on a button in the browser. The agent picks it up and fixes it.</p>

Note:
Minute 32 to 37. Open http://localhost:3000/plans/gh-12 with the Agentation toolbar on, leave one note on the resolve button, and let Claude Code pick it up. Then open the flags panel and show resolve-thread off. Point at skills/manifest.json: the sha is bumped on purpose, never the morning of.
Cut from screen: Skills are vendored at a pinned commit in skills/manifest.json.
Cut from screen: header label "GREENHOUSE · THE DEMO · 05 COMPONENTS · cp-05"
--
<!-- .slide: class="stage" data-cp="cp-08" -->
## When the agent fails

<div class="ladder">
  <div><span class="n">1</span><span>After three failed tries, the agent's run ends with the reason.</span></div>
  <div><span class="n">2</span><span>Nobody waits on a run that will never finish.</span></div>
  <div><span class="n">3</span><span>Each failure is told as a test that reads like a story.</span></div>
</div>

<p class="demo"><span>demo</span>A question the model can't answer ends as a failed bubble. The next question still gets answered.</p>

Note:
PR #9, branch cp-08-agent-failures. `just step 8` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. FailRun and RunFailed. Three stories: the domain, the agent loop, pi-durable after a restart. Plan: cp-08-agent-failures.
Setup: Nothing new; just test.
--
<!-- .slide: class="stage" data-cp="cp-09" -->
## Tests a person would walk through

<div class="ladder">
  <div><span class="n">1</span><span>Four flows in a real browser, with the real agent answering.</span></div>
  <div><span class="n">2</span><span>Sign up, a comment to a decision, two people with the agent, signed out.</span></div>
  <div><span class="n">3</span><span>Every bug found is a failing test before it's a fix.</span></div>
</div>

<p class="demo"><span>demo</span><code>just e2e</code>: seven tests, green, in a real browser.</p>

Note:
PR #10, branch cp-09-e2e. `just step 9` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. The agent runs on a fake, deterministic model in tests: free and repeatable. Plan: cp-09-e2e.
Setup: just e2e-install once, then just e2e locally.
--
<!-- .slide: class="stage" data-cp="cp-10" -->
## Release behind a switch

<div class="ladder">
  <div><span class="n">1</span><span>The screen asks the same switch the rules ask.</span></div>
  <div><span class="n">2</span><span>Three questions before shipping: is it right, can you watch it, can you undo it.</span></div>
  <div><span class="n">3</span><span>The way back is used once before anyone else sees it.</span></div>
</div>

<p class="demo"><span>demo</span><code>just deploy prod</code> to greenhouse.tarp.sh. Resolve appears for you with no deploy, then goes again.</p>

Note:
PR #11, branch cp-10-release. `just step 10` opens this stage in its own folder, prints what it added since the stage before, and runs its demo. docs/RELEASE.md's three questions, each a phase. Plan: cp-10-release.
Setup: bunx wrangler login; just migrate-remote prod; just deploy prod to greenhouse.tarp.sh; just user-add and just flag user resolve-thread <you> with GH_REMOTE=1.
--
<!-- .slide: data-cp="cp-10" -->
## New features ship switched off

<p>Turn it on for yourself first.</p>

<p>Then the people you interviewed. Then 5%, 25%, everyone.</p>

<p>The same person always lands in the same group.</p>

Note:
Minute 48 to 53. `just deploy` first, about a minute including the smoke. Then the flag command above, use the resolve action live on prod, and point at `bucket()` in services.ts: FNV over flag and participant, mod 100.
Cut from screen: header label "GREENHOUSE · THE DEMO · 07 SHIP BEHIND A FLAG · cp-07"
--
<!-- .slide: data-cp="cp-10" -->
<div class="live">live</div>

## Two ways back

<div class="ladder">
  <div><span class="n">1</span><span><strong>The feature is wrong:</strong> switch it off. Seconds, no deploy.</span></div>
  <div><span class="n">2</span><span><strong>The code is broken:</strong> roll back to the last version.</span></div>
</div>

Note:
Minute 53 to 58. `curl https://greenhouse-api.prthamesh-sarang.workers.dev/healthz` and point at version.label and version.id. Flip the flag off and show the resolve action gone without a deploy; then `just rollback api <id>` with the id from `bunx wrangler deployments list`. Minute 58 to 60 hands back to the close.
Cut from screen: header label "GREENHOUSE · THE DEMO · 07 SHIP BEHIND A FLAG · cp-07"
Bottom line, cut from screen: map: docs/architecture/index.html#release
---
<!-- .slide: class="statement" data-part="Workflow and release" -->

## Merged is halfway

<p>A green PR is the middle of the job, not the end.</p>

Note:
Bottom line, cut from screen: one task end to end, then a release checklist with product fit, a staged rollout and a rollback path.
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
2 Name it: new nouns go in the domain vocabulary and the schema first. If a word has no type, stop here.
3 Estimate: Brooks's fractions. The coding sixth is the agent's; budget the other five sixths for yourself.
4 Plan: just plan. Open decisions come back as built artifacts and explored threads, not prose questions.
4b Scaffold: just new … so the shape is right before any code exists. 5 Build: domain first, UI second, each with its own test layer.
6 Dogfood: the Stagehand flow proves it works; only you can tell whether it feels right.
7 Review inverted: a different model, the domain vocabulary in context, walkthrough attached.
8 Release staged: yourself, then a slice, then everyone, with the way back decided in advance.
9 Feed it back: what the release taught goes into docs/decisions and the skills.
---
## Before you ship: three questions

<p class="why">Example: shipping the Resolve button in Greenhouse.</p>

<table class="choice release">
  <tr><th>ask</th><th>what it means for Resolve</th></tr>
  <tr><td><strong>Is it right?</strong></td><td>You can write the user's sentence: "I can close a comment with what we decided." You resolved a real thread today.</td></tr>
  <tr><td><strong>Can you watch it?</strong></td><td>It ships switched off. On for you, then the people you interviewed, then 5%, 25%, everyone. Count decisions recorded each day.</td></tr>
  <tr><td><strong>Can you undo it?</strong></td><td>Wrong feature: switch it off, seconds, no deploy. Broken code: roll back to the last version. Both written in the PR first.</td></tr>
</table>
Note:
Lives in the repo as docs/RELEASE.md; the PR template links it.
The user's sentence: one line, in the user's words, of what is now possible. If you cannot write it, you built an ask. Signal defined: which event tells you it is used, and what number you expect in a week.
Behind a flag, default off in prod. You first: flag on for your account, run the Stagehand flow against prod. Workers versions split traffic 1% to 100%. Migrations add; nothing dropped or renamed in the same release. Watch errors and the usage event for a stated time.
Rollback command written in the PR, not improvised. Flag off kills the behaviour in seconds. Workers rollback is one command; know the version id. Rollback never deletes events: rebuild a bad projection with just replay, compensate a bad command with a new event. Postmortem goes in decisions before the retry.
Bottom line, cut from screen: short on purpose. a checklist nobody finishes protects nobody.
---
<!-- .slide: class="statement" data-part="Changing what people already use" -->

## Four questions a live product asks

<div class="ladder">
  <div><span class="n">1</span><span>How do I change data people already saved?</span></div>
  <div><span class="n">2</span><span>Is this a flag or a version?</span></div>
  <div><span class="n">3</span><span>What rollout can I actually watch?</span></div>
  <div><span class="n">4</span><span>Can the agent reproduce a user's bug?</span></div>
</div>

Note:
Everything before this assumed a clean slate. Real products have users mid-task, data in old shapes and opinions about your changes. Four things the agent will get wrong unless the basics are in place first.
---
## Saved history doesn't change

<div class="ladder">
  <div><span class="n">1</span><span><strong>Avoid it.</strong> Keep records short-lived where you can.</span></div>
  <div><span class="n">2</span><span><strong>Add, don't rename.</strong> New fields get a default.</span></div>
  <div><span class="n">3</span><span><strong>Translate on read.</strong> Old entries load in the new shape.</span></div>
  <div><span class="n">4</span><span><strong>New meaning, new name.</strong> Don't reuse the old one.</span></div>
  <div><span class="n">5</span><span><strong>Rewrite history.</strong> Last resort.</span></div>
</div>

Note:
An event-sourced product evolves by changing how events are read, not what was written. Least invasive first.
Avoid: a plan lives as long as the work does; a thread opens and resolves within days. Frequent event changes usually mean the model, not the schema, is wrong.
Upcast: a small function between the store and the domain, registered per event type, tested with an expect test whose input is a real old event from prod.
New event type: old projections keep working; new ones handle both.
Migrate: rewrite a stream as a one-off job that itself emits events. Ship code that reads both, migrate, remove the old path.
The event-sourcing skill makes the ladder explicit and makes the expect tests the gate.
Bottom line, cut from screen: asked to "add a rationale to decisions", the agent will edit the schema in place and break every replay. tell it to climb from the bottom.
---
## Version or switch?

<div class="split">
  <div>
    <h3>roll back the version</h3>
    <p>when the code is broken.</p>
  </div>
  <div>
    <h3>flip the switch</h3>
    <p>when the feature is wrong.</p>
  </div>
</div>

Note:
Code against OpenFeature, the CNCF vendor-neutral flag API, so the provider is swappable. On Cloudflare, Flagship is the native flag service on OpenFeature, evaluated locally in the Worker; closed beta at the time of writing, so have a fallback. For one person: a flags table in your own Postgres keyed by user id behind an OpenFeature provider you write in an afternoon, or PostHog flags.
Bottom line, cut from screen: every new command ships behind a flag, default off, checked in one place. a flag older than two releases is a lint error.
---
## A rollout you can watch

<textarea class="pele-src" hidden>
flowchart LR
    A[You] --> B[People you interviewed] --> C[5%] --> D[25%] --> E[Everyone]
</textarea>

<p>Watch errors and usage for a day at each step.</p>

Note:
At each percentage step, watch two things: error rate, and the usage event you defined in the release checklist. Two knobs, moved on different days if you can. Migrations ship before the code that needs them; drops and renames ship a release after the code that stopped using them.
---
## Bugs the agent can reproduce

<div class="ladder">
  <div><span class="n">1</span><span>One report button. The user types a sentence; the app attaches the rest.</span></div>
  <div><span class="n">2</span><span>Replaying the log rebuilds exactly what the user saw.</span></div>
  <div><span class="n">3</span><span>The agent writes a failing test first, then the fix.</span></div>
</div>

Note:
The button files a ReportFiled event: the user's note, session id, plan and block, the last few events, console errors, a screenshot. Off the shelf: Sentry User Feedback, PostHog replay and surveys, Jam. For "this looks wrong" from you or a designer, Agentation beats a bug tracker: the note arrives with the selector. Report count per release goes on the dashboard next to the usage event.
Bottom line, cut from screen: a bug report is a repro you did not have to write.
---
<!-- .slide: class="exercise" data-section="Exercise · Changing what people already use" -->

## Ask the agent to change the past

```text
"add a nullable note field to <your main table>"
```

<div class="ladder">
  <div><span class="n">1</span><span>Ask exactly that, in a fresh session, with no other guidance.</span></div>
  <div><span class="n">2</span><span>Run git status before you accept anything.</span></div>
  <div><span class="n">✓</span><span><strong>Done when</strong> you can say yes or no: did it add a new migration file, or edit an existing one?</span></div>
</div>

Note:
Editing an existing migration or a recorded event in place is the failure; a new additive migration is the pass. Reject the change either way. If it edited in place, the fix is one line in your agent instructions: never edit an applied migration.
---
<!-- .slide: data-part="Questions" -->

## Thank you

<div class="contact-grid">
  <a class="poster-tile contact-card" href="#"><h3>Starter repo</h3><p>github.com/…/greenhouse</p></a>
  <a class="poster-tile contact-card" href="https://growthx-workshop.tarp.sh"><h3>The playbook</h3><p>growthx-workshop.tarp.sh</p></a>
  <a class="poster-tile contact-card" href="https://x.com/pratos_"><h3>X</h3><p>x.com/pratos_</p></a>
  <a class="poster-tile contact-card" href="https://www.linkedin.com/in/pratos/"><h3>LinkedIn</h3><p>linkedin.com/in/pratos</p></a>
</div>

Note:
Leave this up. Fill in the repo link and the companion page URL before the dry run.
Cut from screen: header label "LINKS · QUESTIONS"
Bottom line, cut from screen: pratos

