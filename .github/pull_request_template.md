## What is now possible

<!-- One sentence, in the user's words. If you cannot write it, this is an ask, not a feature. -->

## Release checklist · docs/RELEASE.md

- [ ] **Is it right?** I used it today on real data; the signal to watch is: <!-- event, expected number in a week -->
- [ ] **Can you watch it?** It ships behind a flag, off: <!-- flag name -->; migrations only add
- [ ] **Can you undo it?** Flag off: `GH_REMOTE=1 just flag off <name>` · previous version: `just rollback api <version-id>`

## Checks

- [ ] `just test` and `just e2e` pass
- [ ] `just domain-vocabulary-check` passes; new words are in `docs/DOMAIN-VOCABULARY.md`
- [ ] Reviewed by a different model than the author: `just review main`
