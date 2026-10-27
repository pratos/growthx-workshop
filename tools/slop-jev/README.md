# slop-jev

The Jev half of the slop check, compiled to one binary. One call to TypeSafe's Jev System One model with seven typed questions (specificity, cliche load, voice, hollow structure, hedging, fake depth, dominant issue), a 0 to 100 slop index back, a fix-first line. No text generation to parse. Source is the user's pi extension of the same name, trimmed to the pure pipeline.

```sh
just build-slop-jev          # bun build --compile src/main.ts → ./slop-jev (gitignored, 60 MB)
./slop-jev draft.md          # needs TYPESAFE_API_KEY; fails open without it (exit 2) and prints the request it would send
./slop-jev draft.md --json
```

Pair it with Eric Tramel's rule-based `sg` (`uvx --from slop-guard sg`), which needs no key and catches structure (colon density, triads, bullet runs) that a judge model scores as fine. `just slop <file>` runs both.

Key entry: `just secret put TYPESAFE_API_KEY` reads it without echo into `.dev.vars` (gitignored). Never paste it into a chat.
