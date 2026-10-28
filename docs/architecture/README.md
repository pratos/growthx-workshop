# Architecture maps

One viz-explainer artifact per checkpoint, plus one for the system on `main`. Each is built from the `.spec.json` beside it with `just artifact docs/architecture/<name>.spec.json docs/architecture/<name>.html`; the build fails if a step names a node or edge that Pele did not render. Evidence on every step is a path that exists at that tag.

| Artifact | Question it answers |
|---|---|
| [cp-00.html](cp-00.html) | What runs at cp-00, and how do the two Workers talk? |
| [cp-01.html](cp-01.html) | How does cp-01 keep one vocabulary across the glossary, the code and the web? |
| [cp-02.html](cp-02.html) | How does a command become events and a snapshot in packages/domain? |
| [cp-03.html](cp-03.html) | How does cp-03 read a v1 DecisionRecorded as v2 without rewriting it? |
| [cp-04.html](cp-04.html) | How does a plan question become a recorded decision at cp-04? |
| [cp-05.html](cp-05.html) | What does a resolve on the plan page travel through at cp-05? |
| [cp-06.html](cp-06.html) | How does cp-06 catch correct code that is wrong? |
| [cp-07.html](cp-07.html) | How does cp-07 release, flag and roll back the two Workers? |
| [cp-08.html](cp-08.html) | How does a second tab see an append at cp-08? |
| [overall.html](overall.html) | What is Greenhouse today, and what talks to what? |

Where a map draws a dashed edge, the code at that tag does not make the call yet: the Durable Object does not run `upcast` (cp-03 and `main`), and no host turns a chosen option into `ResolveThread` (cp-04).
