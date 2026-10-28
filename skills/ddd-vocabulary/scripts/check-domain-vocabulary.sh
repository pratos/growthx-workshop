#!/usr/bin/env bash
# Fails when a command or event declared in domain code has no domain vocabulary entry, or when a banned synonym is used as a
# domain identifier: a command/event name, a schema field, or an exported name in packages/domain or packages/schema.
# Generated files, node_modules, *.d.ts, tests, the kernel and UI code are out of scope: the rule is about domain words.
# usage: check-domain-vocabulary.sh docs/DOMAIN-VOCABULARY.md packages [apps …]
set -euo pipefail
vocab="${1:?domain vocabulary path}"; shift
[ -f "$vocab" ] || { echo "no domain vocabulary at $vocab"; exit 2; }
files=$(find "$@" -type f \( -name '*.ts' -o -name '*.tsx' \) \
  -not -path '*/node_modules/*' -not -name '*.d.ts' -not -name '*.test.ts' -not -name '*.gen.ts' -not -name 'kernel.ts' \
  \( -path '*packages/domain/*' -o -path '*packages/schema/*' \) 2>/dev/null || true)
[ -n "$files" ] || { echo "no domain files under: $*"; exit 2; }
names=$(grep -hoE "define(Command|Event)\(\s*['\"][A-Z][A-Za-z]+['\"]" $files | grep -oE "[A-Z][A-Za-z]+" | grep -vE '^(Command|Event)$' | sort -u || true)
listed=$(grep -oE '`[A-Z][A-Za-z]+`' "$vocab" | tr -d '`' | sort -u)
banned=$(grep -iE '^Not:' "$vocab" | sed 's/^Not://I' | tr ',' '\n' | sed 's/^ *//; s/ *$//' | tr 'A-Z' 'a-z' | grep -v '^$' | sort -u || true)
rc=0
for n in $names; do
  grep -qx "$n" <<<"$listed" || { echo "✗ $n is declared in code but no domain vocabulary entry lists it"; rc=1; }
done
# identifiers: declared names, their camelCase parts, and schema field keys inside define*( … z.object({ key: … }) )
idents=$(
  { grep -hoE "define(Command|Event)\([^)]*\)" $files | grep -oE "[a-zA-Z_]+:" | tr -d ':' ;
    grep -hoE "^export (const|type|interface|function) [A-Za-z_]+" $files | awk '{print $3}' ;
    echo "$names"; } | sed -E 's/([a-z])([A-Z])/\1 \2/g' | tr 'A-Z' 'a-z' | tr ' ' '\n' | sort -u)
for b in $banned; do
  if grep -qx "$b" <<<"$idents"; then
    where=$(grep -nwi "$b" $files | grep -vE "^\S+:\s*//" | head -2 | sed 's/^/    /')
    echo "✗ banned synonym '$b' used as a domain identifier:"; echo "$where"; rc=1
  fi
done
[ $rc -eq 0 ] && echo "✓ domain vocabulary and domain code agree ($(wc -w <<<"$names" | tr -d ' ') names checked)"
exit $rc
