#!/usr/bin/env bash
# Fails when a command or event declared in code has no glossary entry listing it.
# usage: check-glossary.sh docs/GLOSSARY.md packages [more dirs…]
set -euo pipefail
glossary="${1:?glossary path}"; shift
[ -f "$glossary" ] || { echo "no glossary at $glossary"; exit 2; }
# names declared as defineCommand('Name'…) / defineEvent('Name'…) or Command/Event objects with name: 'Name'
names=$(grep -rhoE "define(Command|Event)\(\s*['\"][A-Z][A-Za-z]+['\"]" "$@" 2>/dev/null | grep -oE "['\"][A-Z][A-Za-z]+['\"]" | tr -d "'\"" | sort -u || true)
listed=$(grep -oE '`[A-Z][A-Za-z]+`' "$glossary" | tr -d '`' | sort -u)
banned=$(grep -iE '^Not:' "$glossary" | sed 's/^Not://I' | tr ',' '\n' | sed 's/^ *//; s/ *$//' | grep -v '^$' | sort -u || true)
rc=0
for n in $names; do
  grep -qx "$n" <<<"$listed" || { echo "✗ $n is declared in code but no glossary entry lists it"; rc=1; }
done
for b in $banned; do
  hits=$(grep -rnwI --include='*.ts' --include='*.tsx' -i "$b" "$@" 2>/dev/null | grep -v -i "GLOSSARY" | head -3 || true)
  [ -n "$hits" ] && { echo "✗ banned synonym '$b' used:"; echo "$hits" | sed 's/^/    /'; rc=1; }
done
[ $rc -eq 0 ] && echo "✓ glossary and code agree ($(wc -w <<<"$names" | tr -d ' ') names checked)"
exit $rc
