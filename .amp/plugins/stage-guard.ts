// Amp's version of the Claude Code stage guard (scripts/hooks/stage-guard.sh): on a workshop branch (.stage exists),
// refuse an edit to a file the stage's plan does not list. The rule itself is `bun scripts/stage.ts guard <file>`,
// shared with the Claude Code hook and the pre-commit hook, so all three agree. GH_AMP_DEBUG=1 logs each edit call.
import type { PluginAPI } from '@ampcode/plugin';
import { appendFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const EDIT_TOOLS = new Set(['edit_file', 'create_file', 'apply_patch', 'undo_edit']);

// The paths an edit call touches: a path field on the input, or the file headers of a patch.
function pathsOf(event: Record<string, unknown>): string[] {
  const input = (event.input ?? event.args ?? event.arguments ?? event.params ?? {}) as Record<string, unknown>;
  const one = input.path ?? input.file_path ?? input.filePath;
  if (typeof one === 'string') return [one];
  const patch = input.patchText ?? input.patch ?? input.input ?? input.diff;
  if (typeof patch !== 'string') return [];
  return [...patch.matchAll(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/gm)].map((m) => m[1].trim());
}

export default function (amp: PluginAPI) {
  amp.on('tool.call', async (event) => {
    const e = event as unknown as Record<string, unknown>;
    if (!EDIT_TOOLS.has(String(e.tool)) || !existsSync(`${root}.stage`)) return { action: 'allow' };
    if (process.env.GH_AMP_DEBUG === '1') appendFileSync(`${root}.amp/guard.log`, `${JSON.stringify(e)}\n`);
    for (const file of pathsOf(e)) {
      const r = spawnSync('bun', ['scripts/stage.ts', 'guard', file], { cwd: root, encoding: 'utf8' });
      if (r.status === 2) return { action: 'reject-and-continue', message: (r.stderr || r.stdout).trim() };
    }
    return { action: 'allow' };
  });
}
