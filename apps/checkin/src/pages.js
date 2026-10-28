import { QUESTIONS, LEVELS, MAX_SCORE, scoreOf, levelOf } from "./questions.js";

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const HEAD = title => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,750&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>${CSS}</style>
</head>
<body>`;

/* Layout: one narrow reading column; questions as fieldsets with a sticky submit bar; results reuse the same column. */
const CSS = `
:root {
  --bg: #F2F5F6; --surface: #FFFFFF; --ink: #15212A; --muted: #586771; --line: #D6DEE2;
  --accent: #0D6B66; --accent-soft: #DDF0EE; --warn: #B45309; --warn-soft: #FDF0DF;
  --font-display: "Bricolage Grotesque", "Avenir Next", system-ui, sans-serif;
  --font-body: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0E1417; --surface: #151D21; --ink: #E4EBEE; --muted: #93A2AA; --line: #26333A;
    --accent: #45C3B6; --accent-soft: #143A37; --warn: #F0A54A; --warn-soft: #3A2A15;
    color-scheme: dark;
  }
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html { padding-block: env(safe-area-inset-top, 0px) env(safe-area-inset-bottom, 0px); }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--font-body); font-size: 16px; line-height: 1.55; }
.wrap {
  max-width: 680px; margin: 0 auto;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
  padding-block: 40px 120px;
  display: grid; gap: 28px;
}
header { display: grid; gap: 10px; }
.eyebrow { font-family: var(--font-mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
h1 { font-family: var(--font-display); font-weight: 750; font-size: clamp(2rem, 6vw, 2.75rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; text-wrap: balance; }
h2 { font-family: var(--font-display); font-weight: 600; font-size: 1.5rem; line-height: 1.15; margin: 0; text-wrap: balance; }
.lede { margin: 0; color: var(--muted); max-width: 58ch; }
.small { font-size: 13px; color: var(--muted); margin: 0; }

form { display: grid; gap: 14px; }
fieldset { margin: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); padding: 18px 18px 14px; display: grid; gap: 10px; min-width: 0; }
fieldset.missing { border-color: var(--warn); background: linear-gradient(var(--warn-soft), var(--surface) 60px); }
legend { float: left; width: 100%; padding: 0; display: flex; gap: 10px; align-items: baseline; font-weight: 600; font-size: 1.02rem; line-height: 1.35; }
legend + * { clear: both; }
.qnum { font-family: var(--font-mono); font-weight: 500; font-size: 12px; color: var(--muted); flex: none; min-width: 2.2em; font-variant-numeric: tabular-nums; }
.hint { font-size: 13px; color: var(--muted); margin: -4px 0 0 calc(2.2em + 10px); }
.opts { display: grid; gap: 6px; }
.opt { display: flex; gap: 10px; align-items: flex-start; padding: 9px 12px; border: 1px solid var(--line); border-radius: 7px; cursor: pointer; transition: border-color .12s, background .12s; }
.opt:hover { border-color: var(--accent); }
.opt input { margin: 4px 0 0; accent-color: var(--accent); flex: none; }
.opt:has(input:checked) { border-color: var(--accent); background: var(--accent-soft); }
.opt:has(input:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
.opt span { min-width: 0; }
.opt small { display: block; color: var(--muted); font-size: 13px; }
textarea { width: 100%; font: inherit; font-size: 15px; line-height: 1.5; padding: 10px 12px; border-radius: 7px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); resize: vertical; min-height: 96px; }
textarea:hover { border-color: var(--accent); }
textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-color: var(--accent); }
.count { font-family: var(--font-mono); font-size: 12px; color: var(--muted); text-align: right; font-variant-numeric: tabular-nums; }
.quotes { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.quotes li { padding: 10px 14px; border-left: 2px solid var(--accent); background: var(--bg); border-radius: 0 6px 6px 0; overflow-wrap: anywhere; white-space: pre-line; }

.bar {
  position: sticky; bottom: 0;
  margin-inline: calc(-1 * max(16px, env(safe-area-inset-left, 0px)));
  padding: 12px max(16px, env(safe-area-inset-right, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--line);
  display: flex; gap: 14px; align-items: center; justify-content: space-between; flex-wrap: wrap;
}
.progress { display: flex; gap: 10px; align-items: center; font-family: var(--font-mono); font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
.track { width: 120px; height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
.track i { display: block; height: 100%; width: 0; background: var(--accent); transition: width .2s; }
button, .btn { font: inherit; font-weight: 600; font-size: 15px; border-radius: 7px; border: 1px solid var(--accent); background: var(--accent); color: var(--surface); padding: 10px 18px; cursor: pointer; text-decoration: none; display: inline-block; }
.btn.ghost { background: transparent; color: var(--accent); }
button:disabled { opacity: .6; cursor: progress; }
button:focus-visible, .btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.note { font-size: 13px; color: var(--warn); }

.panel { border: 1px solid var(--line); border-radius: 10px; background: var(--surface); padding: 22px; display: grid; gap: 12px; }

/* results */
.stats { display: flex; flex-wrap: wrap; gap: 10px 28px; align-items: baseline; }
.stat b { font-family: var(--font-display); font-weight: 750; font-size: 2.2rem; line-height: 1; display: block; font-variant-numeric: tabular-nums; }
.stat span { font-size: 13px; color: var(--muted); }
.verdict { padding: 14px 16px; border-radius: 8px; background: var(--accent-soft); }
.verdict strong { display: block; margin-bottom: 4px; }
.rows { display: grid; gap: 8px; }
.row { display: grid; grid-template-columns: minmax(0, 15em) minmax(0, 1fr) 5.5em; gap: 4px 12px; align-items: center; font-size: 14px; }
.row .lab { min-width: 0; }
.row .fill { height: 14px; border-radius: 0 4px 4px 0; background: transparent; position: relative; }
.row .fill::before { content: ""; position: absolute; inset: 6px 0 auto; height: 2px; background: var(--line); }
.row .fill i { position: relative; display: block; height: 100%; border-radius: 0 4px 4px 0; background: var(--accent); min-width: 2px; }
.row .n { font-family: var(--font-mono); font-size: 13px; text-align: right; font-variant-numeric: tabular-nums; color: var(--muted); white-space: nowrap; }
.row .n b { color: var(--ink); font-weight: 500; }
.row:hover .lab { color: var(--accent); }
@media (max-width: 520px) { .row { grid-template-columns: minmax(0, 1fr) 5.5em; } .row .fill { grid-column: 1 / -1; grid-row: 2; } }
.days { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font-size: 13px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); text-decoration: none; font-variant-numeric: tabular-nums; }
.chip[aria-current="true"] { border-color: var(--accent); background: var(--accent-soft); }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } }
`;

export function formPage() {
  const fieldsets = QUESTIONS.map((q, i) => {
    if (q.type === "text") {
      return `<fieldset id="fs-${q.id}">
      <legend><span class="qnum">${String(i + 1).padStart(2, "0")}/${QUESTIONS.length}</span><label for="${q.id}">${esc(q.text)}</label></legend>
      ${q.hint ? `<p class="hint">${esc(q.hint)}</p>` : ""}
      <textarea id="${q.id}" name="${q.id}" maxlength="${q.maxLength}" rows="4" placeholder="e.g. How to get an agent to work on our existing codebase without breaking things"></textarea>
      <span class="count" id="${q.id}-count">0 / ${q.maxLength}</span>
    </fieldset>`;
    }
    const type = q.multi ? "checkbox" : "radio";
    const opts = q.options.map((o, j) => `
      <label class="opt" for="${q.id}-${j}">
        <input type="${type}" id="${q.id}-${j}" name="${q.id}" value="${j}">
        <span>${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ""}</span>
      </label>`).join("");
    return `<fieldset id="fs-${q.id}">
      <legend><span class="qnum">${String(i + 1).padStart(2, "0")}/${QUESTIONS.length}</span><span>${esc(q.text)}</span></legend>
      ${q.hint ? `<p class="hint">${esc(q.hint)}</p>` : ""}
      <div class="opts">${opts}</div>
    </fieldset>`;
  }).join("");

  const meta = JSON.stringify(QUESTIONS.map(q => ({
    id: q.id, multi: !!q.multi, text: q.type === "text", optional: !!q.optional, max: q.maxLength || 0,
    none: q.options ? q.options.findIndex(o => o.none) : -1,
  })))
    .replace(/</g, "\\u003c");

  return HEAD("AI Coding Check-in") + `
<div class="wrap">
  <header>
    <div class="eyebrow">GrowthX · AI coding session</div>
    <h1>Where are you with AI coding?</h1>
    <p class="lede">Ten quick questions, about two minutes. There are no wrong answers.</p>
    <p class="small">Anonymous: we don't ask for or store your name, email or IP address.</p>
  </header>

  <form id="quiz" novalidate>
    ${fieldsets}
    <div class="bar">
      <div class="progress"><div class="track"><i id="prog"></i></div><span id="progtxt">0 of ${QUESTIONS.filter(q => !q.optional).length}</span></div>
      <span class="note" id="note" hidden></span>
      <button type="submit" id="submit">Submit</button>
    </div>
  </form>

  <section class="panel" id="thanks" hidden aria-live="polite">
    <div class="eyebrow">Submitted</div>
    <h2>Thanks, you're in.</h2>
    <p class="small">Your answers were saved anonymously. You can close this page.</p>
    <div class="actions"><button type="button" class="btn ghost" id="edit">Change my answers</button></div>
  </section>
</div>

<script>
const QS = ${meta};
const DRAFT = "aicl-draft-v2", DONE = "aicl-done-v2";
const form = document.getElementById("quiz");
const note = document.getElementById("note");
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};

const REQUIRED = QS.filter(q => !q.optional);

function answers() {
  const out = {};
  for (const q of QS) {
    if (q.text) {
      const t = document.getElementById(q.id).value.trim();
      if (t) out[q.id] = t;
      continue;
    }
    const picked = [...form.querySelectorAll('input[name="' + q.id + '"]:checked')].map(el => +el.value);
    if (picked.length) out[q.id] = picked;
  }
  return out;
}

function update() {
  const a = answers();
  const done = REQUIRED.filter(q => a[q.id]).length;
  document.getElementById("prog").style.width = (done / REQUIRED.length * 100) + "%";
  document.getElementById("progtxt").textContent = done + " of " + REQUIRED.length;
  for (const q of QS) if (q.text) document.getElementById(q.id + "-count").textContent = document.getElementById(q.id).value.length + " / " + q.max;
  for (const q of QS) if (a[q.id]) document.getElementById("fs-" + q.id).classList.remove("missing");
  store.set(DRAFT, JSON.stringify(a));
}

function showThanks() {
  form.hidden = true;
  document.getElementById("thanks").hidden = false;
}

// Resubmitting from this browser replaces the earlier answers (matched by a random cookie on the server)
document.getElementById("edit").addEventListener("click", () => {
  document.getElementById("thanks").hidden = true;
  form.hidden = false;
  document.getElementById("submit").textContent = "Update my answers";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

if (store.get(DONE)) showThanks();
try {
  const saved = JSON.parse(store.get(DRAFT) || "null");
  if (saved) for (const [id, v] of Object.entries(saved)) {
    if (typeof v === "string") {
      const el = document.getElementById(id);
      if (el) el.value = v;
      continue;
    }
    for (const j of v) {
      const el = document.getElementById(id + "-" + j);
      if (el) el.checked = true;
    }
  }
} catch (e) {}
update();

let typing;
form.addEventListener("input", e => {
  if (e.target.tagName !== "TEXTAREA") return;
  clearTimeout(typing);
  typing = setTimeout(update, 250);
});

form.addEventListener("change", e => {
  const q = QS.find(q => q.id === e.target.name);
  // "Nothing yet" on the multi-select clears the others, and vice versa
  if (q && q.multi && q.none >= 0 && e.target.checked) {
    const boxes = form.querySelectorAll('input[name="' + q.id + '"]');
    if (+e.target.value === q.none) boxes.forEach((b, j) => { if (j !== q.none) b.checked = false; });
    else boxes[q.none].checked = false;
  }
  update();
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  const a = answers();
  const missing = REQUIRED.filter(q => !a[q.id]);
  if (missing.length) {
    missing.forEach(q => document.getElementById("fs-" + q.id).classList.add("missing"));
    note.textContent = missing.length + " question" + (missing.length > 1 ? "s" : "") + " left";
    note.hidden = false;
    document.getElementById("fs-" + missing[0].id).scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const btn = document.getElementById("submit");
  btn.disabled = true;
  btn.textContent = "Submitting…";
  note.hidden = true;
  try {
    const res = await fetch("/api/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(a) });
    if (!res.ok) throw new Error(await res.text());
    // Keep the answers as the draft so "Change my answers" opens them pre-filled
    store.set(DONE, "1");
    showThanks();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    note.textContent = "Couldn't submit. Check your connection and try again.";
    note.hidden = false;
    btn.disabled = false;
    btn.textContent = store.get(DONE) ? "Update my answers" : "Submit";
  }
});
</script>
</body>
</html>`;
}

function bars(items, denom) {
  return `<div class="rows">${items.map(it => {
    const pct = denom ? Math.round(it.count / denom * 100) : 0;
    return `<div class="row" title="${esc(it.label)}: ${it.count} (${pct}%)">
      <span class="lab">${esc(it.label)}</span>
      <div class="fill"><i style="width:${denom ? it.count / denom * 100 : 0}%"></i></div>
      <span class="n"><b>${it.count}</b> · ${pct}%</span>
    </div>`;
  }).join("")}</div>`;
}

function advice(byLevel, n) {
  const share = byLevel.map(c => c / n);
  // Pitch at the median participant's level; robust to ties and small rooms
  let seen = 0, modeIdx = 0;
  while (seen + byLevel[modeIdx] < n / 2) seen += byLevel[modeIdx++];
  const mode = LEVELS[modeIdx];
  const below = share.slice(0, modeIdx).reduce((x, y) => x + y, 0);
  const above = share.slice(modeIdx + 1).reduce((x, y) => x + y, 0);
  const pc = x => Math.round(x * 100) + "%";
  let text;
  if (share[0] >= .15 && share[3] >= .15) text = `The room is split: ${pc(share[0])} are L1 and ${pc(share[3])} are L4. Pitch the core at L${mode.n}, pair L4s with L1s for the hands-on part, and give L4s a stretch exercise.`;
  else if (above > below && modeIdx < 3) text = `Pitch the core at L${mode.n} ${mode.name} and plan stretch segments at L${mode.n + 1}: ${pc(above)} are above it.`;
  else if (below > 0 && modeIdx > 0) text = `Pitch the core at L${mode.n} ${mode.name}. Recap L${mode.n - 1} basics early for the ${pc(below)} below it.`;
  else text = `Pitch the session at L${mode.n} ${mode.name}.`;
  return { text, mode };
}

export function resultsPage(rows, days, day) {
  const n = rows.length;
  const dayChips = days.length > 1 || day ? `<div class="days" aria-label="Filter by day">
      <a class="chip" href="/results" aria-current="${!day}">All days</a>
      ${days.map(d => `<a class="chip" href="/results?day=${d.day}" aria-current="${d.day === day}">${d.day} · ${d.count}</a>`).join("")}
    </div>` : "";
  const csvHref = "/results.csv" + (day ? `?day=${day}` : "");

  let body;
  if (!n) {
    body = `<section class="panel"><h2>No responses yet</h2><p class="small">Share the form link with participants. Responses show up here as soon as they submit; reload to update.</p></section>`;
  } else {
    const scores = rows.map(scoreOf);
    const byLevel = [0, 0, 0, 0];
    for (const s of scores) byLevel[levelOf(s).n - 1]++;
    const avg = scores.reduce((a, b) => a + b, 0) / n;
    const { text, mode } = advice(byLevel, n);

    const levelBars = bars(LEVELS.map((l, i) => ({ label: `L${l.n} ${l.name} (${l.min}–${l.max})`, count: byLevel[i] })), n);

    const perQuestion = QUESTIONS.map((q, i) => {
      if (q.type === "text") {
        const texts = rows.map(r => r[q.id]).filter(Boolean).reverse();
        return `<section class="panel">
        <div class="eyebrow">${String(i + 1).padStart(2, "0")}/${QUESTIONS.length} · free text · ${texts.length} of ${n} answered</div>
        <h2 style="font-size:1.15rem">${esc(q.text)}</h2>
        ${texts.length ? `<ul class="quotes">${texts.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p class="small">No answers yet.</p>`}
      </section>`;
      }
      const counts = q.options.map(() => 0);
      for (const r of rows) for (const j of r[q.id]) counts[j]++;
      return `<section class="panel">
        <div class="eyebrow">${String(i + 1).padStart(2, "0")}/${QUESTIONS.length}${q.multi ? " · multi-select, % of respondents" : ""}</div>
        <h2 style="font-size:1.15rem">${esc(q.text)}</h2>
        ${bars(q.options.map((o, j) => ({ label: o.label, count: counts[j] })), n)}
      </section>`;
    }).join("");

    body = `
    <section class="panel">
      <div class="stats">
        <div class="stat"><b>${n}</b><span>response${n === 1 ? "" : "s"}</span></div>
        <div class="stat"><b>${avg.toFixed(1)}</b><span>average score of ${MAX_SCORE}</span></div>
      </div>
      <div class="verdict"><strong>Suggested pitch</strong>${esc(text)}<p class="small" style="margin-top:6px">Focus for L${mode.n}: ${esc(mode.focus)}</p></div>
      <div class="eyebrow" style="margin-top:6px">Level mix</div>
      ${levelBars}
      <p class="small">Levels come from 8 scored questions, 0–3 points each (role and goal aren't scored; for tools, the highest one counts). Participants don't see their level.</p>
    </section>
    ${perQuestion}`;
  }

  return HEAD("AI Coding Check-in Results") + `
<div class="wrap">
  <header>
    <div class="eyebrow">Host view · anonymous responses</div>
    <h1>Who's in the room</h1>
    <div class="actions">
      <a class="btn" href="${esc(day ? "/results?day=" + day : "/results")}">Refresh</a>
      <a class="btn ghost" href="${esc(csvHref)}">Download CSV</a>
    </div>
    ${dayChips}
  </header>
  ${body}
</div>
</body>
</html>`;
}

export function resultsCsv(rows, dayList) {
  const cell = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const header = ["day", ...QUESTIONS.map(q => q.id), "score", "level"];
  const lines = rows.map((r, i) => {
    const s = scoreOf(r);
    return [dayList[i], ...QUESTIONS.map(q => q.type === "text" ? (r[q.id] || "") : r[q.id].map(j => q.options[j].label).join("; ")), String(s), "L" + levelOf(s).n];
  });
  return [header, ...lines].map(l => l.map(cell).join(",")).join("\n") + "\n";
}
