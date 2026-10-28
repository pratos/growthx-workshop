// plan.json → plan.html. Validates the plan's rules, renders prose, embeds viz-explainer artifacts and live UI blocks,
// and carries the source JSON inside the page so an agent can read the HTML alone.
//   bun build.mjs docs/plans/2026-10-28-resolve-thread.plan.json            → writes the .html next to it
//   bun build.mjs <plan.json> <out.html>
//   bun build.mjs <plan.json> --check                                       → validate only
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const vizDir = [join(here, '..', '..', 'viz-explainer')].find((d) => existsSync(join(d, 'scripts', 'build.mjs')));
const { load } = await import(join(vizDir ?? join(here, '..', '..', 'viz-explainer'), 'scripts', 'load.mjs'));
const { marked } = await load('marked', '18.1.2', here);

const [planPath, second] = process.argv.slice(2);
if (!planPath) { console.error('usage: build.mjs <plan.json> [out.html | --check]'); process.exit(2); }
const checkOnly = second === '--check';
const outPath = checkOnly ? null : (second ?? planPath.replace(/\.plan\.json$|\.json$/, '') + '.plan.html');
const plan = JSON.parse(readFileSync(planPath, 'utf8'));

// ---------- rules ----------
const errors = [], warnings = [];
const need = (cond, msg) => { if (!cond) errors.push(msg); };
const STATUSES = ['draft', 'final', 'implementing', 'done'];
const CONTRACT_MAX = 15, PHASE_CODE_WARN = 40;

need(typeof plan.title === 'string' && plan.title.trim(), 'title is required');
need(STATUSES.includes(plan.status), `status must be one of ${STATUSES.join(', ')}`);
need(typeof plan.summary === 'string' && plan.summary.trim(), 'summary is required: what we are building and why, in two or three sentences');
need(Array.isArray(plan.phases) && plan.phases.length > 0, 'at least one phase is required');
need(Array.isArray(plan.notDoing) && plan.notDoing.length > 0, 'notDoing is required: name what is out of scope');

const diagrams = new Map((plan.diagrams ?? []).map((d) => [d.id, d]));
for (const d of plan.diagrams ?? []) need(d.id && d.spec, `diagram ${d.id ?? '?'} needs an id and a viz-explainer spec`);

for (const d of plan.decisions ?? []) {
  need(d.id && d.question, 'every decision needs an id and a question');
  if (plan.status !== 'draft') need(d.chosen, `decision "${d.question}" has no chosen option; a ${plan.status} plan has no open questions`);
  if (d.viz) need(d.viz.kind === 'decision-report', `decision "${d.id}": its viz must be a decision-report`);
}

let uiTouched = false, componentCount = 0;
for (const [i, ph] of (plan.phases ?? []).entries()) {
  const where = `phase ${i + 1} (${ph.name ?? ph.id ?? '?'})`;
  need(ph.id && ph.name && ph.goal, `${where} needs id, name and goal`);
  need(Array.isArray(ph.changes) && ph.changes.length > 0, `${where} lists no changes`);
  need(ph.verify && Array.isArray(ph.verify.automated) && Array.isArray(ph.verify.manual), `${where} needs verify.automated and verify.manual (either may be empty, both must exist)`);
  if (ph.diagram) need(diagrams.has(ph.diagram), `${where} refers to diagram "${ph.diagram}", which is not in diagrams`);
  let codeLines = 0;
  for (const c of ph.changes ?? []) {
    need(c.file && c.intent, `${where}: every change needs a file and a one-sentence intent`);
    if (c.intent && c.intent.split(/(?<=[.!?])\s/).length > 2) warnings.push(`${where}, ${c.file}: intent is more than two sentences; say what must be true, not how`);
    // UI is product code people use: components and styles anywhere, HTML only inside app or package source (not docs or talk pages).
    const f = c.file ?? '';
    if (/\.(tsx|jsx|vue|svelte|css)$/.test(f) || (/\.html$/.test(f) && /(^|\/)(apps|packages|src)\//.test(f)) || /(^|\/)(web|ui|components)\//.test(f)) uiTouched = true;
    if (c.contract) {
      const n = String(c.contract.code ?? '').trimEnd().split('\n').length;
      codeLines += n;
      need(n <= CONTRACT_MAX, `${where}, ${c.file}: contract is ${n} lines; plans carry contracts (signatures, schemas, a migration, an interface), at most ${CONTRACT_MAX} lines. Move the implementation out.`);
    }
  }
  if (codeLines > PHASE_CODE_WARN) warnings.push(`${where}: ${codeLines} lines of contract code; if a reader needs this much code the phase is too big`);
  for (const comp of ph.components ?? []) { componentCount++; need(comp.name && (comp.html || comp.states?.length), `${where}: component needs a name and html or states`); }
  for (const v of [...(ph.verify?.automated ?? []), ...(ph.verify?.manual ?? [])]) need(v.cmd || v.text, `${where}: every verification item needs cmd (automated) or text (manual)`);
}
if (uiTouched && componentCount === 0) warnings.push('the plan changes UI files but shows no component; add an inline component (with its states) to the phase that builds it');
if (uiTouched && !plan.design) warnings.push('the plan changes UI files but has no design block; add the tokens the components use');

// ---------- word budgets: a plan is read at 240 words a minute, so every field earns its words
const words = (s) => String(s ?? '').replace(/`[^`]*`/g, 'x').split(/\s+/).filter(Boolean).length;
const BUDGET = { summary: 50, current: 50, endState: 40, approach: 35, discovery: 25, discoveries: 5, notDoing: 15, why: 35, goal: 25, intent: 15, check: 15, option: 15, caption: 15, component: 20, total: 1000 };
const over = (label, text, max) => { const n = words(text); if (n > max) warnings.push(`${label} is ${n} words; budget ${max}`); };
for (const k of ['summary', 'current', 'endState', 'approach']) over(k, plan[k], BUDGET[k]);
if ((plan.discoveries ?? []).length > BUDGET.discoveries) warnings.push(`${plan.discoveries.length} discoveries; keep the ${BUDGET.discoveries} that change a decision`);
(plan.discoveries ?? []).forEach((x, i) => over(`discovery ${i + 1}`, x, BUDGET.discovery));
(plan.notDoing ?? []).forEach((x, i) => over(`not doing ${i + 1}`, x, BUDGET.notDoing));
for (const d of plan.decisions ?? []) {
  over(`decision ${d.id}: why`, d.why, BUDGET.why);
  for (const o of d.viz?.options ?? []) over(`decision ${d.id}, option ${o.id}: summary`, o.summary, BUDGET.option);
  for (const s of d.viz?.steps ?? []) over(`decision ${d.id}, step ${s.id}: caption`, s.caption, BUDGET.caption);
}
for (const dg of plan.diagrams ?? []) for (const s of dg.spec?.steps ?? []) over(`diagram ${dg.id}, step ${s.id}: caption`, s.caption, BUDGET.caption);
for (const ph of plan.phases ?? []) {
  over(`phase ${ph.id}: goal`, ph.goal, BUDGET.goal);
  for (const c of ph.changes ?? []) over(`phase ${ph.id}, ${c.file}: intent`, c.intent, BUDGET.intent);
  for (const v of ph.verify?.manual ?? []) over(`phase ${ph.id}: manual check`, v.text, BUDGET.check);
  for (const comp of ph.components ?? []) over(`phase ${ph.id}, component ${comp.name}: notes`, comp.notes, BUDGET.component);
}
// What a reader meets with every disclosure closed: decided reports are collapsed, open ones are not.
const visible = [plan.summary, plan.current, plan.endState, plan.approach, ...(plan.discoveries ?? []), ...(plan.notDoing ?? []),
  ...(plan.decisions ?? []).flatMap((d) => [d.question, d.why, ...(d.chosen ? [] : (d.viz?.options ?? []).map((o) => o.summary))]),
  ...(plan.phases ?? []).flatMap((ph) => [ph.name, ph.goal, ...ph.changes.map((c) => c.intent), ...[...ph.verify.automated, ...ph.verify.manual].map((v) => v.text)]),
  ...(plan.references ?? [])].reduce((n, s) => n + words(s), 0);
if (visible > BUDGET.total) warnings.push(`the page reads ${visible} words with reports closed; budget ${BUDGET.total}. Cut repetition before cutting facts.`);
const readMinutes = Math.max(1, Math.round(visible / 240));

if (errors.length) { for (const e of errors) console.error(`✗ ${e}`); process.exit(1); }
for (const w of warnings) console.warn(`! ${w}`);
if (checkOnly) { console.log(`✓ ${basename(planPath)}: ${plan.phases.length} phases, ${(plan.decisions ?? []).length} decisions, ${diagrams.size} diagrams`); process.exit(0); }

// ---------- rendering ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = (s) => marked.parse(String(s ?? ''), { gfm: true });
const mdi = (s) => marked.parseInline(String(s ?? ''), { gfm: true });
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const tmp = mkdtempSync(join(tmpdir(), 'plan-'));
function vizFrame(spec, label) {
  if (!vizDir) return `<p class="note">viz-explainer is not installed next to this skill; the diagram "${esc(label)}" is in the plan JSON.</p>`;
  const sp = join(tmp, `${slug(label)}.json`), op = join(tmp, `${slug(label)}.html`);
  writeFileSync(sp, JSON.stringify(spec));
  const r = spawnSync('bun', [join(vizDir, 'scripts', 'build.mjs'), sp, op], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stdout + r.stderr); console.error(`✗ diagram "${label}" did not build`); process.exit(1); }
  return `<iframe class="viz" title="${esc(spec.question ?? label)}" allow="fullscreen" allowfullscreen srcdoc="${esc(readFileSync(op, 'utf8'))}"></iframe>`;
}

const tokens = plan.design?.tokens ?? {};
const tokenCss = [
  ...Object.entries(tokens.color ?? {}).map(([k, v]) => `--${k}: ${v};`),
  ...Object.entries(tokens.radius ?? {}).map(([k, v]) => `--radius-${k}: ${typeof v === 'number' ? v + 'px' : v};`),
  ...(tokens.space ?? []).map((v, i) => `--space-${i + 1}: ${v}px;`),
  tokens.font?.sans ? `--font: ${tokens.font.sans};` : '', tokens.font?.mono ? `--mono: ${tokens.font.mono};` : '',
].filter(Boolean).join(' ');

let frameId = 0;
function componentFrame(html, css, height) {
  const id = `c${++frameId}`;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{${tokenCss}} *{box-sizing:border-box} html,body{overflow:hidden} body{margin:0;padding:20px;font:15px/1.5 var(--font, ui-sans-serif, system-ui, sans-serif);background:var(--bg, #fffcf0);color:var(--fg, #100f0f)} ${css ?? ''}</style></head><body>${html}<script>new ResizeObserver(()=>parent.postMessage({frameHeight:Math.ceil(document.body.getBoundingClientRect().height)},'*')).observe(document.body)<\/script></body></html>`;
  return `<iframe class="component" data-frame="${id}" sandbox="allow-scripts" style="height:${height ?? 160}px" srcdoc="${esc(doc)}"></iframe>`;
}
function component(c) {
  const states = c.states?.length ? c.states : [{ label: 'default', html: c.html }];
  return `<figure class="component-block">
    <figcaption><b>${esc(c.name)}</b>${c.notes ? ` · ${mdi(c.notes)}` : ''}</figcaption>
    <div class="states">${states.map((s) => `<div class="state"><div class="state-label"><span>${esc(s.label)}</span><button type="button" class="full" aria-label="Show ${esc(s.label)} full screen">full screen</button></div>${componentFrame(s.html, c.css, c.height)}</div>`).join('')}</div>
    <details><summary>markup</summary><pre><code>${esc(states.map((s) => `<!-- ${s.label} -->\n${s.html}`).join('\n\n') + (c.css ? `\n\n/* css */\n${c.css}` : ''))}</code></pre></details>
  </figure>`;
}

function designBlock(d) {
  const t = d.tokens ?? {};
  const swatches = Object.entries(t.color ?? {}).map(([k, v]) => `<div class="swatch"><span style="background:${esc(v)}"></span><b>${esc(k)}</b><code>${esc(v)}</code></div>`).join('');
  const type = (t.type ?? []).map((x) => `<div class="type-row"><span class="type-meta">${esc(x.name)} · ${x.size}/${x.lineHeight ?? 1.4} · ${x.weight ?? 400}</span><span style="font-family:${esc(t.font?.sans ?? 'inherit')};font-size:${x.size}px;font-weight:${x.weight ?? 400};line-height:${x.lineHeight ?? 1.4}">${esc(x.sample ?? 'The plan room records what happened.')}</span></div>`).join('');
  const space = (t.space ?? []).map((v) => `<div class="space-row"><span class="bar" style="width:${v * 2}px"></span><code>${v}px</code></div>`).join('');
  const radius = Object.entries(t.radius ?? {}).map(([k, v]) => `<div class="radius"><span style="border-radius:${typeof v === 'number' ? v + 'px' : esc(v)}"></span><code>${esc(k)} ${esc(v)}</code></div>`).join('');
  return `<section id="design"><h2>Design language</h2>${d.notes ? md(d.notes) : ''}
    ${swatches ? `<h3>Colour</h3><div class="swatches">${swatches}</div>` : ''}
    ${type ? `<h3>Type</h3><div class="type">${type}</div>` : ''}
    ${space ? `<h3>Space</h3><div class="space">${space}</div>` : ''}
    ${radius ? `<h3>Radius</h3><div class="radii">${radius}</div>` : ''}
    ${(d.components ?? []).map(component).join('')}
  </section>`;
}

const count = (ph) => { const all = [...ph.verify.automated, ...ph.verify.manual]; return [all.filter((v) => v.done).length, all.length]; };
const totals = plan.phases.reduce((a, ph) => { const [d, n] = count(ph); return [a[0] + d, a[1] + n]; }, [0, 0]);

function phase(ph, i) {
  const [d, n] = count(ph);
  const state = n && d === n ? 'done' : d ? 'in progress' : 'not started';
  const changes = ph.changes.map((c) => `<li class="change"><code class="file">${esc(c.file)}</code><div class="intent">${mdi(c.intent)}</div>${c.contract ? `<pre class="contract"><code class="lang-${esc(c.contract.lang ?? '')}">${esc(c.contract.code)}</code></pre>` : ''}</li>`).join('');
  const check = (v, kind) => `<li class="check ${v.done ? 'is-done' : ''}"><input type="checkbox" disabled ${v.done ? 'checked' : ''} aria-label="${v.done ? 'done' : 'not done'}"><span>${kind === 'auto' ? `<code>${esc(v.cmd)}</code>${v.text ? ` · ${mdi(v.text)}` : ''}` : mdi(v.text)}</span></li>`;
  return `<section class="phase" id="${esc(ph.id)}">
    <header class="phase-head"><h2><span class="phase-num">Phase ${i + 1}</span> ${esc(ph.name)}</h2><span class="pill pill-${slug(state)}">${state} · ${d}/${n}</span></header>
    ${md(ph.goal)}
    ${ph.diagram ? vizFrame(diagrams.get(ph.diagram).spec, ph.diagram) : ''}
    <h3>Changes</h3><ul class="changes">${changes}</ul>
    ${(ph.components ?? []).length ? `<h3>Components</h3>${ph.components.map(component).join('')}` : ''}
    <h3>Done when</h3>
    <div class="verify"><div><h4>Automated</h4><ul class="checks">${ph.verify.automated.map((v) => check(v, 'auto')).join('') || '<li class="none">none</li>'}</ul></div>
    <div><h4>By hand</h4><ul class="checks">${ph.verify.manual.map((v) => check(v, 'manual')).join('') || '<li class="none">none</li>'}</ul></div></div>
    ${ph.notes ? `<div class="phase-notes">${md(ph.notes)}</div>` : ''}
  </section>`;
}

function decision(d) {
  const chosen = d.chosen ? (d.options ?? []).find((o) => o.id === d.chosen)?.label ?? d.chosen : null;
  return `<article class="decision" id="decision-${esc(d.id)}">
    <h3>${esc(d.question)}</h3>
    ${chosen ? `<p class="chosen">Chosen: <b>${esc(chosen)}</b>${d.by ? ` · ${esc(d.by)}` : ''}${d.at ? ` · ${esc(d.at)}` : ''}</p>` : `<p class="open">Not decided yet. A final plan has no open questions.</p>`}
    ${d.why ? md(d.why) : ''}
    ${d.viz ? (d.chosen
      ? `<details class="report"><summary>Compare the ${(d.viz.options ?? []).length} options</summary>${vizFrame({ ...d.viz, decision: { optionId: d.chosen, label: chosen, by: { name: d.by ?? 'unknown' }, at: d.at ?? '' } }, `decision-${d.id}`)}</details>`
      : vizFrame(d.viz, `decision-${d.id}`)) : ''}
  </article>`;
}

const nav = [
  ['summary', 'Summary'], ['current', 'Where we are'], ['end', 'Where we end up'], ['not', 'Not doing'],
  ...(plan.approach ? [['approach', 'Approach']] : []),
  ...((plan.decisions ?? []).length ? [['decisions', 'Decisions']] : []),
  ...(plan.design ? [['design', 'Design language']] : []),
  ...plan.phases.map((ph, i) => [ph.id, `${i + 1}. ${ph.name}`, count(ph)]),
  ...((plan.references ?? []).length ? [['references', 'References']] : []),
];

const source = relative(process.cwd(), planPath);
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(plan.title)}</title>
<script>
  // Frames report their own height; listen before any of them load, and match by sender, not by a label.
  addEventListener('message', (e) => {
    const h = e.data && e.data.frameHeight; if (!h) return;
    for (const f of document.querySelectorAll('iframe')) if (f.contentWindow === e.source && !f.classList.contains('is-expanded')) f.style.height = Math.min(Math.max(h + 4, 60), 2400) + 'px';
  });
</script>
<style>${readFileSync(join(here, '..', 'assets', 'plan.css'), 'utf8')}</style>
</head>
<body>
<div class="layout">
<nav class="toc" aria-label="Plan sections">
  <p class="toc-title">${esc(plan.title)}</p>
  <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${totals[1]}" aria-valuenow="${totals[0]}"><span style="width:${totals[1] ? (100 * totals[0]) / totals[1] : 0}%"></span></div>
  <p class="progress-label">${totals[0]} of ${totals[1]} checks done</p>
  <ol>${nav.map(([id, label, c]) => `<li><a href="#${esc(id)}">${esc(label)}</a>${c ? `<span class="toc-count">${c[0]}/${c[1]}</span>` : ''}</li>`).join('')}</ol>
</nav>
<main>
  <header class="plan-head">
    <h1>${esc(plan.title)}</h1>
    <p class="byline">${plan.ticket ? `<b>${esc(plan.ticket)}</b> · ` : ''}${esc(plan.date ?? '')} · <span class="pill pill-${esc(plan.status)}">${esc(plan.status)}</span>${plan.author ? ` · ${esc(plan.author)}` : ''} · ${readMinutes} min read · built from <code>${esc(source)}</code></p>
  </header>
  <section id="summary" class="lede">${md(plan.summary)}</section>
  <section id="current"><h2>Where we are</h2>${md(plan.current ?? '')}${(plan.discoveries ?? []).length ? `<ul class="discoveries">${plan.discoveries.map((x) => `<li>${mdi(x)}</li>`).join('')}</ul>` : ''}</section>
  <section id="end"><h2>Where we end up</h2>${md(plan.endState ?? '')}</section>
  <section id="not"><h2>Not doing</h2><ul>${plan.notDoing.map((x) => `<li>${mdi(x)}</li>`).join('')}</ul></section>
  ${plan.approach ? `<section id="approach"><h2>Approach</h2>${md(plan.approach)}${plan.approachDiagram && diagrams.has(plan.approachDiagram) ? vizFrame(diagrams.get(plan.approachDiagram).spec, plan.approachDiagram) : ''}</section>` : ''}
  ${(plan.decisions ?? []).length ? `<section id="decisions"><h2>Decisions</h2>${plan.decisions.map(decision).join('')}</section>` : ''}
  ${plan.design ? designBlock(plan.design) : ''}
  ${plan.phases.map(phase).join('')}
  ${(plan.references ?? []).length ? `<section id="references"><h2>References</h2><ul>${plan.references.map((r) => `<li>${mdi(r)}</li>`).join('')}</ul></section>` : ''}
  <footer>Edit <code>${esc(source)}</code>, not this page. It is rebuilt from the JSON.</footer>
</main>
</div>
<script type="application/json" id="plan">${JSON.stringify(plan).replace(/</g, '\\u003c')}</script>
<script>
  // Full screen for a component state or a diagram. When the browser refuses (embeds, automation, some policies),
  // the frame expands to fill the window instead; Esc or the close button returns it.
  const close = Object.assign(document.createElement('button'), { className: 'expanded-close', textContent: 'Close · Esc', hidden: true });
  document.body.append(close);
  let open = null;
  const expand = (f, on) => {
    if (open && open !== f) expand(open, false);
    f.classList.toggle('is-expanded', on); document.body.classList.toggle('has-expanded', on); close.hidden = !on; open = on ? f : null;
    f.contentWindow?.postMessage({ expanded: on }, '*');
  };
  const goFull = (f) => document.fullscreenElement ? document.exitFullscreen() : f.requestFullscreen().catch(() => expand(f, true));
  close.onclick = () => open && expand(open, false);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) expand(open, false); });
  document.addEventListener('click', (e) => { const b = e.target.closest('button.full'); if (b) goFull(b.closest('.state').querySelector('iframe')); });
  addEventListener('message', (e) => {
    const want = e.data && e.data.fullscreen; if (!want) return;
    const f = [...document.querySelectorAll('iframe')].find((x) => x.contentWindow === e.source); if (!f) return;
    if (want === 'expand') expand(f, true); else if (want === 'exit' && open === f) expand(f, false);
  });
  const links = [...document.querySelectorAll('.toc a')]; const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) links.forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id)); }, { rootMargin: '-20% 0px -70% 0px' });
  targets.forEach((t) => io.observe(t));
</script>
</body>
</html>
`;
writeFileSync(outPath, html);
rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${basename(planPath)} → ${outPath} · ${visible} words, ${readMinutes} min read${warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? 's' : ''})` : ''}`);
