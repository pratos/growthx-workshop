---
name: slop-guard
description: Score prose for AI slop before it is written or shipped, in two layers. First Eric Tramel's slop-guard, a rule-based linter with no key and no network (colon density, triads, bullet runs, em dashes, closing aphorisms). Then the Jev scorer binary for what rules cannot see (voice, specificity, hollow structure), when a TYPESAFE_API_KEY is present. Use on any Markdown, doc, PR body, decision entry, UI copy, artifact captions or talk notes, and whenever a draft reads flat, generic, padded or oddly clipped.
---

# slop-guard

Two checks, run in this order, because they catch different things. The rules caught a set of artifact captions full of "First fact: resolved." fragments at 55 out of 100 while the judge model scored them clean; the judge catches a flat corporate voice the rules cannot see.

## Layer 1, rules (always)

```sh
just slop path/to/draft.md
```

runs `uvx --from slop-guard==0.5.0 sg -v --counts <file>`. Score 0 to 100, higher is cleaner, with a band (`clean`, `light`, `moderate`, …), each violation in context and one line of advice per rule. No key, no network, deterministic, so it also runs in CI and as a pre-commit hook. The same linter is available to the agent as an MCP server from the repo's `.mcp.json`.

## Layer 2, Jev (when a key exists)

The same `just slop` recipe then runs `tools/slop-jev/slop-jev <file>` if `TYPESAFE_API_KEY` is set or in `.dev.vars`. Index 0 to 100, lower is cleaner: under 40 passes, 40 to 61 warns, 62 blocks. Dimensions: specificity, cliche load, voice, hollow structure, hedging, fake depth, plus a dominant-issue diagnosis and a fix-first line.

To add the key, never paste it in chat. Ask the person to run:

```sh
just secret put TYPESAFE_API_KEY
```

It reads without echo into `.dev.vars`, which is gitignored. If the binary is missing, `just build-slop-jev` compiles it from `tools/slop-jev/src`.

## When

- Before writing any prose file over about 400 characters: docs, decisions, PR bodies, release notes, README sections.
- On the collected copy of an artifact (captions, option summaries, question) before `viz-explainer` builds it. Concatenate into one text file; both scorers need a few hundred characters to have an opinion.
- When a reviewer or the person says a draft reads weird, flat, generic or clipped.

## Act on it

1. Fix the rule violations first. They are specific and cheap.
2. Then the Jev fix-first line and its lowest two dimensions. Rerun. Stop when both pass and the advice repeats itself.
3. Read it aloud once. Neither scorer checks that a sentence is true or that it is one a person would say.

## What it does not do

Neither layer rewrites, checks facts, or runs on code. A clean score on a wrong sentence is still a wrong sentence.
