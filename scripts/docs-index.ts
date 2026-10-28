// Builds docs/index.html: every page under docs/ (explainers, the architecture map, every plan), by title, grouped.
// `just docs` builds it and serves docs/ on http://localhost:8781.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../docs/', import.meta.url).pathname;
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : []; });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const pages = walk(root).filter((p) => !p.endsWith('/index.html') || p.includes('/architecture/')).map((p) => {
  const html = readFileSync(p, 'utf8');
  const raw = (/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? relative(root, p)).trim();
  const title = raw.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return { href: relative(root, p), title };
});
const groups: [string, (h: string) => boolean][] = [
  ['Explainers', (h) => h.startsWith('decisions/')],
  ['Architecture', (h) => h.startsWith('architecture/')],
  ['Stage plans', (h) => h.startsWith('plans/stages/')],
  ['Other plans', (h) => h.startsWith('plans/') && !h.startsWith('plans/stages/')],
];
const section = ([name, test]: [string, (h: string) => boolean]) => {
  const list = pages.filter((p) => test(p.href)).sort((a, b) => a.href.localeCompare(b.href));
  return list.length ? `<h2>${name}</h2><ul>${list.map((p) => `<li><a href="${esc(p.href)}">${esc(p.title)}</a><span>${esc(p.href)}</span></li>`).join('')}</ul>` : '';
};
writeFileSync(join(root, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Greenhouse docs</title>
<style>
:root{--ground:#f4f4f1;--page:#fff;--ink:#0e0d0a;--ink2:#47453f;--ink3:#605e56;--edge:rgba(0,0,0,.07);--accent:#06707e}
body{margin:0;background:var(--ground);color:var(--ink);font:15px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}
main{max-width:46rem;margin:2rem auto;padding:2.5rem 2rem;background:var(--page);border-radius:10px;box-shadow:0 1px 2px rgba(14,13,10,.06),0 8px 5px rgba(14,13,10,.03)}
h1{font:400 1.9rem/1.15 Lora,Georgia,serif;margin:0 0 .25rem}p{color:var(--ink2);margin:0 0 1.5rem}
h2{font:400 1.3rem/1.25 Lora,Georgia,serif;margin:1.75rem 0 .5rem}ul{list-style:none;margin:0;padding:0;border-top:1px solid var(--edge)}
li{display:flex;justify-content:space-between;gap:1rem;padding:.55rem 0;border-bottom:1px solid var(--edge)}
a{color:var(--ink);text-decoration:none}a:hover{color:var(--accent);text-decoration:underline;text-underline-offset:2px}
span{color:var(--ink3);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%}
@media (max-width:600px){main{margin:0;border-radius:0;padding:1.5rem 1rem}span{display:none}}
</style></head><body><main><h1>Greenhouse docs</h1><p>Every explainer, the architecture map and every plan. Built by <code>just docs</code>.</p>
${groups.map(section).join('\n')}
</main></body></html>
`);
console.log(`docs/index.html: ${pages.length} pages`);
