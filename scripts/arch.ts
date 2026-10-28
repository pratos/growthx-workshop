// docs/ARCHITECTURE.md → docs/architecture/index.html, through the local viz-explainer skill.
//   bun scripts/arch.ts            check coverage, build the map
//   bun scripts/arch.ts --coverage only check that every apps/* and packages/* folder is named in the Mermaid block
//   bun scripts/arch.ts --check    fail if the built map is stale (CI, pre-commit)
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const doc = join(root, 'docs/ARCHITECTURE.md');
const outDir = join(root, 'docs/architecture');
const out = join(outDir, 'index.html');
const specOut = join(outDir, 'architecture.spec.json');
const builder = join(root, 'skills/viz-explainer/scripts/build.mjs');
const mode = process.argv[2] ?? 'build';

const md = readFileSync(doc, 'utf8');
const mermaid = /```mermaid\n([\s\S]*?)```/.exec(md)?.[1]?.trimEnd();
if (!mermaid) fail('docs/ARCHITECTURE.md has no ```mermaid block. The map is built from it.');

// Coverage: the map is plain language, so folders live in the "Where it lives" table. Every folder under apps/ or packages/
// must be in it, and every part named there must be a node in the map.
const units = ['apps', 'packages'].filter((d) => existsSync(join(root, d))).flatMap((d) => readdirSync(join(root, d), { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(root, d, e.name, 'package.json'))).map((e) => `${d}/${e.name}`));
const where = /## Where it lives[\s\S]*?\n(\|[^\n]*\|\n\|[-| ]+\|\n(?:\|[^\n]*\|\n?)+)/.exec(md)?.[1];
if (!where) fail('docs/ARCHITECTURE.md has no "## Where it lives" table mapping parts of the map to folders.');
const placed = where.trim().split('\n').slice(2).map((r) => r.split('|').slice(1, -1).map((c) => c.trim()));
const named = placed.flatMap(([, folders]) => [...(folders ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1]!));
const missing = units.filter((u) => !named.some((n) => n === u || n.startsWith(u + '/')));
if (missing.length) fail(`new addition not on the architecture map: ${missing.join(', ')}.\nAdd a row to "Where it lives" in docs/ARCHITECTURE.md naming the part of the map it belongs to (add a node in plain words if it is a new part, and a walkthrough step if a person meets it), then run just arch.`);
const labels = [...mermaid.matchAll(/\[\(?"([^"]+)"\)?\]/g)].map((m) => m[1]!.split(' · ')[0]!.trim());
const orphans = placed.map(([part]) => part!).filter((part) => !labels.includes(part));
if (orphans.length) fail(`"Where it lives" names parts that are not nodes in the map: ${orphans.join(', ')}.`);
const code = labels.filter((l) => /[/`$]|\.(ts|js|tsx|sql|json)\b|\(\)/.test(l));
if (code.length) fail(`the map is plain language; these labels read like code: ${code.join(', ')}.`);
if (mode === '--coverage') { console.log(`✓ architecture map places all ${units.length} apps and packages`); process.exit(0); }

// Walkthrough table → steps. Edges are FROM->TO; Pele names them L_FROM_TO_n in source order.
const question = /\*\*Question:\*\*\s*(.+)/.exec(md)?.[1]?.trim() ?? 'How does this system fit together?';
const table = /## Walkthrough[\s\S]*?\n(\|[^\n]*\|\n\|[-| ]+\|\n(?:\|[^\n]*\|\n?)+)/.exec(md)?.[1];
if (!table) fail('docs/ARCHITECTURE.md has no walkthrough table under "## Walkthrough".');
const seen = new Map<string, number>();
const edgeIds = new Map<string, string>();
for (const m of mermaid.matchAll(/^[ \t]*([A-Za-z0-9_]+)[ \t]+[^\n]*?(?:-->|\.->|==>)[ \t]*([A-Za-z0-9_]+)[ \t]*$/gm)) {
  const key = `${m[1]}->${m[2]}`; const n = seen.get(key) ?? 0; seen.set(key, n + 1);
  if (n === 0) edgeIds.set(key, `L_${m[1]}_${m[2]}_0`);
}
const rows = table.trim().split('\n').slice(2).map((r) => r.split('|').slice(1, -1).map((c) => c.trim()));
const steps = rows.map(([id, focus, edges, caption], i) => {
  if (!id || !caption) fail(`walkthrough row ${i + 1} needs a step id and a caption`);
  const es = (edges ?? '').split(/\s+/).filter(Boolean).map((e) => edgeIds.get(e) ?? fail(`step ${id}: edge ${e} is not in the Mermaid block`));
  return { id, caption, focus: (focus ?? '').split(/\s+/).filter(Boolean), edges: es };
});
if (steps.length > 8) fail(`the walkthrough has ${steps.length} steps; eight at most, split the map instead`);

const lastChange = Bun.spawnSync(['git', 'log', '-1', '--format=%cs', '--', 'docs/ARCHITECTURE.md'], { cwd: root }).stdout.toString().trim();
const spec = { kind: 'architecture-map', question, meta: { builtBy: 'just arch', builtAt: lastChange || 'uncommitted', source: 'docs/ARCHITECTURE.md' }, diagram: mermaid, steps };
const specText = JSON.stringify(spec, null, 2) + '\n';

if (mode === '--check') {
  const current = existsSync(specOut) ? readFileSync(specOut, 'utf8') : '';
  const built = existsSync(out) ? readFileSync(out, 'utf8') : '';
  if (current !== specText || !built.includes(question)) fail('docs/architecture/index.html is stale. Run just arch.');
  console.log('✓ architecture map is current'); process.exit(0);
}

mkdirSync(outDir, { recursive: true });
if (!existsSync(join(root, 'skills/viz-explainer/node_modules/pele'))) Bun.spawnSync(['bun', 'install'], { cwd: join(root, 'skills/viz-explainer'), stdout: 'ignore', stderr: 'ignore' });
writeFileSync(specOut, specText);
const r = Bun.spawnSync(['bun', builder, specOut, out], { cwd: root, stdout: 'pipe', stderr: 'pipe' });
process.stdout.write(r.stdout); process.stderr.write(r.stderr);
if (r.exitCode !== 0) fail('the map did not build; the lines above name the step or id that is wrong.');

function fail(msg: string): never { console.error(`✗ architecture: ${msg}`); process.exit(1); }
