# Greenhouse · design

**Posture.** A working tool, used for an hour at a time while thinking. Calm, legible, dense enough to see a whole plan; nothing decorative competes with the words.

**Layout.** The plan page is two columns: the plan document (threads on blocks, open-a-thread at the bottom) and, at 380px on the right, the sessions panel, which stays in view while the plan scrolls. Below 1024px the panel moves under the plan.

**Colour.** The theme tokens in `apps/web/src/styles.css` (sea ink, lagoon, palm), light and dark. One accent, lagoon, marks the action you can take: Ask, Resolve, Sign up. Status uses pills, not colour alone.

**Type.** Manrope throughout; the plan id at 30px, thread text at 16px, everything secondary at 14px or smaller in `--sea-ink-soft`.

**Motion.** Only for arrival: a new question, answer or thread settles in over 180ms (opacity and a 4px lift, strong ease-out), once, never on refresh. Nothing moves under reduced motion. Buttons press to 0.97.

**States.** Every component has its empty, loading, refused and done state in real copy: "No threads on this plan yet", "Queued · the agent takes questions in order", "Resolving threads is not switched on for sam yet."
