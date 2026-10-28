---
name: accident-or-essence
description: Sort your last ten prompts to coding agents into accidental and essential difficulty (Brooks, No Silver Bullet), from local history only. Use when the person asks "accident or essence", "sort my last asks", or runs the No Silver Bullet exercise.
---

# accident-or-essence

1. Run `scripts/last-asks.sh 10` (add `--here` to keep only prompts from this folder). It reads `~/.claude/history.jsonl` and `~/.codex/history.jsonl` and prints numbered prompts. Nothing leaves the machine.
2. Mark each prompt **A** or **E**, one line each: `3. E · the shape of the data: which fields a Decision keeps`.
   - **A, accidental:** syntax, boilerplate, glue, looking things up, mechanical refactors, converting formats, fixing a build.
   - **E, essential:** the shape of the data and its invariants; matching the messy world; what users will need next; what nobody can see of the system.
   A prompt that mixes both is E. Judge by what the prompt asks, not by how hard it was.
3. End with exactly two lines:
   - `E: <count> of 10`
   - `Could be a test or a type:` the one E prompt whose intent could live in a test, type or domain-vocabulary entry instead, and which file it would go in.

Do not quote prompts outside the person's terminal, and do not write them to a file unless asked.
