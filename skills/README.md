# skills

Loaded by both Claude Code (`.claude/skills/*` symlinks) and pi (`.pi/skills/*` symlinks). Edit here; the symlinks follow.

| Skill | Fires when | Explains with |
|---|---|---|
| viz-explainer | architecture, lifecycles, event streams, decisions, agent traces | a Pele + anime.js HTML artifact (also a Greenhouse Artifact block) |
| ddd-vocabulary | any new noun, synonym, or "what does X mean" | a vocabulary map built by viz-explainer |
| event-sourcing | anything under packages/domain, new command/event/projection, changing a recorded event | an event-stream story, state explorer or decision report |
| scaffold | creating or restructuring a package, Worker, route, command, migration or deployment | the layout and checklist in its references |
| slop-guard | any prose over ~400 characters, artifact captions, PR bodies | a Jev score with a fix-first line (pi runs it as a hook) |

One-time: `cd skills/viz-explainer && bun install` restores Pele for the artifact builder.
Smoke test: `bun skills/viz-explainer/scripts/build.mjs <spec.json> out.html` and `skills/ddd-vocabulary/scripts/check-glossary.sh docs/GLOSSARY.md packages`.
