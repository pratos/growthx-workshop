# Greenhouse · design

The design language is GitHub Next's [Chopin](https://github.com/githubnext/chopin) (MIT, `apps/web/src/CHOPIN-LICENSE.md`): "a working document". Its tokens are copied into `apps/web/src/styles.css` as `--ch-*`; Greenhouse's own names (`--sea-ink`, `--lagoon`, `--line`…) point at them, so every page follows.

**Posture.** Calm, precise, collaborative. The plan document is the visual centre; navigation, chat and controls support it without competing.

**Layout.** The plan page is Chopin's workspace: Chat on the left, directly on the ground with no card of its own (360px), and the plan as a raised white sheet on the right. The sheet has a 40px title bar (plan id, counts, live status, who you are) and a views bar (Document, Decisions). The document keeps a 40.6rem (650px) prose measure with 3.75rem top and 3.5rem side padding (1.5rem at 600px or less). Below 1024px the sheet comes first and Chat follows.

**Colour.** A white page on a warm olive ground. Petrol is the one accent: primary actions, links, focus. Semantic colour for outcomes only: success for decided and live, warning for refusals. Chopin is light only, and so is Greenhouse.

**Type.** Inter for the interface and document body; Lora at weight 400 for document headings (`h1`, the sheet's `h2`). Chopin's fluid scale: `--ch-text-2xs` metadata to `--ch-text-2xl` titles.

**Shape and depth.** Radii 4/6/8/10px (grips, fields and cards, buttons and popovers, the page). Mostly flat; the sheet is the only raised surface, fields and cards take the resting shadow.

**Copy.** Sentence case. Never join metadata with a middle dot: separate pieces with spacing (`.gh-meta`) or drop them. No eyebrow labels above headings.

**Motion.** Only for arrival: a new thread, question or answer settles in over 200ms (opacity and a 4px lift, Chopin's ease-out). Buttons press to 0.97. Nothing moves under reduced motion.

**States.** Every component has its empty, loading, refused and done state in real copy: "No threads on this plan yet", "Queued. The agent takes questions in order.", "Resolving threads is not switched on for sam yet."
