#!/usr/bin/env bash
# just new command Name | just new event Name  — the shape is right before any code exists, expect stub included.
# Declares into the Thread decider with Effect Schema fields, as packages/engine/src/kernel.ts expects; other contexts copy by hand.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; cd "$root"
kind="${1:?command|event}"; name="${2:?Name}"
[[ "$name" =~ ^[A-Z][A-Za-z]+$ ]] || { echo "Name must be PascalCase"; exit 2; }
grep -q "\`$name\`" docs/DOMAIN-VOCABULARY.md || { echo "✗ $name is not in docs/DOMAIN-VOCABULARY.md. Add the entry first (ddd-vocabulary), then scaffold."; exit 1; }
dec=packages/domain/src/thread/decider.ts
snap=$(sed -E 's/([a-z])([A-Z])/\1-\2/g' <<<"$name" | tr 'A-Z' 'a-z')
case "$kind" in
  command)
    grep -q "defineCommand('$name'" $dec && { echo "$name already declared"; exit 0; }
    printf "\nexport const %s = defineCommand('%s', { threadId: Id, by: ParticipantId });   // TODO fields: Effect Schema values (Id, Text, ParticipantId from @greenhouse/schema)\n" "$name" "$name" >> $dec
    cat >> packages/domain/src/thread/thread.expect.test.ts <<T

test('$name: TODO', () => {
  // expect.given(opened).when($name({ threadId: 't7', by: 'pratos' })).snapshot('$snap');
  // expect.given().when($name({ threadId: 't7', by: 'pratos' })).snapshot('$snap-rejected');
});
T
    echo "✓ $name declared in $dec and an expect stub added. Next: add it to ThreadCommand, add its case to decide() (reading command.data), fill the stub, run just test." ;;
  event)
    grep -q "defineEvent('$name'" $dec && { echo "$name already declared"; exit 0; }
    printf "\nexport const %s = defineEvent('%s', { threadId: Id, by: ParticipantId });   // TODO fields: Effect Schema values (Id, Text, ParticipantId from @greenhouse/schema)\n" "$name" "$name" >> $dec
    echo "✓ $name declared in $dec. Next: add it to ThreadEvent, handle it in evolve() if state changes, project it if a view needs it." ;;
  *) echo "usage: new.sh command|event Name"; exit 2 ;;
esac
