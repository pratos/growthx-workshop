# Release checklist

Three questions before anything reaches people. The pull request asks them too.

## 1 · Is it right?

- [ ] **The user's sentence.** One line, in their words, of what is now possible. If you cannot write it, you built an ask.
- [ ] **You used it today**, on real data: `just up`, then the flow from `docs/TESTING.md`.
- [ ] **One signal** says it is used: the event to count, and the number you expect in a week.

## 2 · Can you watch it?

Off by default, then you, then small steps. Watch errors and the signal for a day at each step.

```sh
GH_REMOTE=1 just flag off NAME                 # how it ships
GH_REMOTE=1 just flag user NAME <you>          # you first
GH_REMOTE=1 just flag user NAME <them>         # the people you interviewed
GH_REMOTE=1 just flag pct NAME 5               # then 25, then just flag on NAME
```

- [ ] **Migrations only add.** They ship before the code that needs them, applied by hand (`docs/DEPLOY.md`). Drops and renames wait a release.

## 3 · Can you undo it?

Two ways back, written in the PR before you ship:

| When | Do | Takes |
|---|---|---|
| The feature is wrong | `GH_REMOTE=1 just flag off NAME` | seconds, no deploy |
| The code is broken | `just rollback api <version-id>` (and `web`) | one command; `/healthz` shows the live `version.id` |

Events are facts and are never deleted: a bad projection is rebuilt, a bad command is answered with a new event. Anything that went wrong gets a note in `docs/decisions/` before the retry.
