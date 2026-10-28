import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, Extension, useEditor, type Editor, type Range } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import Suggestion from '@tiptap/suggestion';
import type { PlanBody } from '@greenhouse/schema';
import { slugify } from '@greenhouse/schema/slug';
import './plan-editor.css';

// The Plan's text: a Tiptap editor. It saves the whole text (the editor's JSON) as EditPlan a moment after you stop
// typing, based on the edit it loaded; when someone else (or the agent) saves first, the newer text is shown instead.
// "/" opens the blocks menu; with `onAsk`, "/ask …" has the agent write into the plan.

export const WRITE_PREFIX = 'Write into the plan: '; // the agent recognises this question (packages/agent/src/loop.ts)
export const askedLine = (prompt: string) => `Asked the agent to write: ${prompt}`;

type Saved = { ok: true; edits: number } | { ok: false; stale: boolean; rejected: string };
type Item = { title: string; hint: string; keys: string[]; run: (editor: Editor, range: Range, query: string) => void };
type Menu = { items: Item[]; index: number; rect: DOMRect | null; query: string; pick: (item: Item) => void };

const BLOCKS: Item[] = [
  { title: 'Heading', hint: 'A section of the plan', keys: ['h', 'h2', 'heading', 'title'], run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 2 }).run() },
  { title: 'Subheading', hint: 'A part of a section', keys: ['h3', 'subheading'], run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 3 }).run() },
  { title: 'Bullet list', hint: 'Points in no order', keys: ['bullet', 'list', 'ul'], run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
  { title: 'Numbered list', hint: 'Steps in order', keys: ['numbered', 'ordered', 'ol', 'steps'], run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
  { title: 'Task list', hint: 'Things to do, with checkboxes', keys: ['task', 'todo', 'checkbox'], run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
  { title: 'Quote', hint: 'Someone else’s words', keys: ['quote', 'blockquote'], run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run() },
  { title: 'Code', hint: 'A snippet, a command, a shape', keys: ['code', 'snippet'], run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run() },
  { title: 'Divider', hint: 'A rule between parts', keys: ['divider', 'hr', 'rule'], run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
];

const parse = (content: string) => { try { return content ? (JSON.parse(content) as object) : ''; } catch { return ''; } };

export function PlanEditor({ body, onSave, onAsk, onComment }: { body: PlanBody; onSave: (content: string, basedOn: number) => Promise<Saved>; onAsk?: (prompt: string) => Promise<string | null>; onComment?: (blockId: string, question: string) => Promise<void> }) {
  const based = useRef(body.edits);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const askRef = useRef(onAsk); askRef.current = onAsk;
  const bodyRef = useRef(body); bodyRef.current = body;
  const saveRef = useRef<(editor: Editor) => Promise<boolean>>(async () => false);
  const [status, setStatus] = useState<{ kind: 'saved' | 'unsaved' | 'saving' | 'refused'; text?: string }>({ kind: 'saved' });
  const [menu, setMenu] = useState<Menu | null>(null);
  // Select text, press Comment: a Thread opens on the block you selected (named from its first words).
  const [bubble, setBubble] = useState<{ top: number; left: number; blockId: string; asking: boolean } | null>(null);
  const commentRef = useRef(onComment); commentRef.current = onComment;
  const menuRef = useRef(menu); menuRef.current = menu;

  const items = useMemo(() => {
    const ask: Item = {
      title: 'Ask the agent to write', hint: 'Type /ask, then what to write, and press Enter', keys: ['ask', 'agent', 'write', 'draft'],
      run: (e, r, query) => {
        const prompt = query.replace(/^\S+\s*/, '').trim();
        if (!prompt) { e.chain().focus().deleteRange(r).insertContent('/ask ').run(); return; }
        e.chain().focus().deleteRange(r).insertContent({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: askedLine(prompt) }] }).run();
        // Save first, so the agent reads the line it will replace; then ask.
        window.clearTimeout(timer.current);
        void saveRef.current(e).then((saved) => (saved ? askRef.current?.(prompt) : null)).then((refused) => { if (refused) setStatus({ kind: 'refused', text: refused }); });
      },
    };
    return onAsk ? [ask, ...BLOCKS] : BLOCKS;
  }, [onAsk !== undefined]);

  const slash = useMemo(() => Extension.create({
    name: 'slash',
    addProseMirrorPlugins() {
      return [Suggestion<Item, Item>({
        editor: this.editor, char: '/', allowSpaces: true,
        items: ({ query }) => {
          const word = query.toLowerCase().split(/\s+/)[0] ?? '';
          return items.filter((i) => !word || i.title.toLowerCase().startsWith(word) || i.keys.some((k) => k.startsWith(word)));
        },
        command: ({ editor, range, props }) => props.run(editor, range, menuRef.current?.query ?? ''),
        render: () => {
          const show = (p: { items: Item[]; query: string; clientRect?: (() => DOMRect | null) | null; command: (i: Item) => void }) =>
            setMenu((m) => ({ items: p.items, index: Math.min(m?.index ?? 0, Math.max(p.items.length - 1, 0)), rect: p.clientRect?.() ?? null, query: p.query, pick: p.command }));
          return {
            onStart: show, onUpdate: show, onExit: () => setMenu(null),
            onKeyDown: ({ event }) => {
              const m = menuRef.current;
              if (!m || m.items.length === 0) return false;
              if (event.key === 'ArrowDown') { setMenu({ ...m, index: (m.index + 1) % m.items.length }); return true; }
              if (event.key === 'ArrowUp') { setMenu({ ...m, index: (m.index + m.items.length - 1) % m.items.length }); return true; }
              if (event.key === 'Enter') { const item = m.items[m.index]; if (item) m.pick(item); return true; }
              if (event.key === 'Escape') { setMenu(null); return true; }
              return false;
            },
          };
        },
      })];
    },
  }), [items]);

  // Show the newest saved text (someone else's, or the agent's) in place of what is on screen.
  function takeLatest(editor: Editor) {
    const latest = bodyRef.current;
    if (latest.edits <= based.current) return;
    based.current = latest.edits;
    editor.commands.setContent(parse(latest.content), { emitUpdate: false });
  }

  async function save(editor: Editor): Promise<boolean> {
    const content = JSON.stringify(editor.getJSON());
    setStatus({ kind: 'saving' });
    const r = await onSave(content, based.current);
    dirty.current = false;
    if (r.ok) { based.current = r.edits; setStatus({ kind: 'saved' }); return true; }
    setStatus({ kind: 'refused', text: r.stale ? 'Someone saved first. Their text is shown; make your change again.' : r.rejected });
    if (r.stale) window.setTimeout(() => takeLatest(editor), 300); // the room's socket brings their edit in a moment
    return false;
  }
  saveRef.current = save;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TaskList, TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: onAsk ? 'Write the plan. Type / for blocks, or /ask to have the agent write.' : 'Write the plan. Type / for blocks.' }),
      slash,
    ],
    content: parse(body.content),
    editorProps: { attributes: { class: 'gh-plan-text', 'aria-label': 'Plan text', role: 'textbox', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: e }) => {
      dirty.current = true;
      setStatus({ kind: 'unsaved' });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void save(e), 700);
    },
  }, [slash]);

  // Someone else's save arrives over the room's socket: take it, unless you are mid-change (your save will be refused
  // and then show theirs).
  useEffect(() => {
    if (!editor || body.edits <= based.current || dirty.current) return;
    takeLatest(editor);
    setStatus({ kind: 'saved' });
  }, [editor, body.edits, body.content]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!editor) return;
    const onSelect = () => {
      const { from, to, empty, $from } = editor.state.selection;
      if (empty || !commentRef.current || to - from < 2) { setBubble((b) => (b?.asking ? b : null)); return; }
      const at = editor.view.coordsAtPos(from);
      const block = $from.depth > 0 ? $from.node(1) : undefined;
      const blockId = slugify((block?.textContent ?? '').split(/\s+/).slice(0, 6).join(' '), 40) || `block-${$from.index(0) + 1}`;
      setBubble({ top: at.top, left: at.left, blockId, asking: false });
    };
    editor.on('selectionUpdate', onSelect);
    return () => { editor.off('selectionUpdate', onSelect); };
  }, [editor]);

  return (
    <div className="gh-plan-editor">
      <EditorContent editor={editor} />
      <p className="gh-plan-status" role="status" aria-live="polite" data-save={status.kind}>
        {status.kind === 'saving' ? 'Saving…' : status.kind === 'unsaved' ? 'Unsaved changes' : status.kind === 'refused' ? status.text
          : body.edits === 0 ? 'Nothing written yet' : `Saved${body.by ? `, last edit by ${body.by}` : ''}`}
      </p>
      {bubble && (
        <div className="gh-comment-bubble" style={{ top: bubble.top - 44, left: bubble.left }}>
          {bubble.asking ? (
            <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get('question'); if (typeof q === 'string' && q.trim()) void commentRef.current?.(bubble.blockId, q.trim()).then(() => setBubble(null)); }}>
              <input name="question" autoFocus required aria-label="What should we decide" placeholder="What should we decide?" className="gh-input !h-7 !w-64"
                onKeyDown={(e) => { if (e.key === 'Escape') setBubble(null); }} />
              <button type="submit" className="gh-btn gh-btn-primary !h-7">Open</button>
            </form>
          ) : (
            <button type="button" className="gh-btn !h-7" onMouseDown={(e) => e.preventDefault()} onClick={() => setBubble({ ...bubble, asking: true })}>Comment</button>
          )}
        </div>
      )}
      {menu && menu.rect && (
        <div className="gh-slash" role="listbox" aria-label="Blocks" style={{ top: menu.rect.bottom + 6, left: menu.rect.left }}>
          {menu.items.length === 0 ? <p className="gh-slash-empty">No block called “{menu.query}”</p> : menu.items.map((item, i) => (
            <button key={item.title} type="button" role="option" aria-selected={i === menu.index} className="gh-slash-item"
              onMouseDown={(ev) => { ev.preventDefault(); menu.pick(item); }} onMouseEnter={() => setMenu({ ...menu, index: i })}>
              <span>{item.title}</span><span className="gh-slash-hint">{item.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
