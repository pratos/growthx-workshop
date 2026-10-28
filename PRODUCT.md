# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
About 12 attendees of the GrowthX "Shipping Reliable Products" workshop: mostly L3/L4 engineers who live in the terminal, plus two growth people, two founders, one PM and one data person (check-in, N = 12). They sit in a room watching a projector for 2.5 hours (19:30–22:00 IST) while pratos presents, with two hands-on agent runs in the middle.

## Product Purpose
The deck in `deck/` is the visual aid for that live talk, projected at 1280x720. It is projected live only; it is not sent out afterwards, so slides may lean on the speaker and the speaker notes (`Note:` in `deck/slides.md`) carry the detail. Success: the room follows the argument, the jokes land, and the two runs start on time.

## Positioning
Thesis of the talk: agents made the typing cheap, not the thinking. Engineering practice (intent, types, tests, domain vocabulary, event sourcing, a justfile) is how you make the agent's life easier. Runs live against the Greenhouse planning-room repo.

## Operating Context
reveal.js 5.1 from CDN, markdown source of truth in `deck/slides.md`, theme in `deck/theme.css`. `---` horizontal slides, `--` vertical "/btw" asides, speaker view on `S`. Several slides are marked `live` (demo happens in a terminal). Companion page: `reliable-products-workshop.html`, deployed at growthx-workshop.tarp.sh.

## Capabilities and Constraints
- Static, no build step; served by any static server.
- Copy may be trimmed where speaker notes already carry it; every cut is listed for the presenter.
- Human vs agent must stay visually distinct (previously oxblood vs teal); the device and colours are open.

## Brand Commitments
- Presenter voice: dry, lower-case, self-deprecating ("Fin.", "/btw").
- Six memes are part of the talk's humour; they stay recognisable but are restyled into one consistent style with Codex image generation.

## Evidence on Hand
Check-in numbers (9/12, 7/12, 3/12, 5/12) are real. Meme source images in `deck/images/`. No testimonials or metrics beyond these.

## Product Principles
1. The speaker is the content; the slide is the cue.
2. One idea per slide on screen.
3. Every concept is shown on the real repo, not described.
