// The session handbook at /handbook: the ideas (product engineering, Brooks twice, the ten basics), the Greenhouse
// repo and its eleven stages, the skills and hooks it gives your agent, how a harness works, and how to release and
// change a live product. Styled as the deck's kitchen order ticket: thermal paper, dashed tear rules, red ink for
// you, reverse print for the agent. Full width; columns fold to one on a phone.

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ext = (label, href) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;

const CSS = `
:root {
  --paper: #fbfaf6; --paper-2: #efede6;
  --ink: #1f1e24; --ink-2: #47464d; --ink-3: #66656b; --ink-4: #a6a5a9; --ink-5: #dddbd4;
  --you: #c4372a;
  --display: "Archivo", "Arial Narrow", sans-serif;
  --mono: "Spline Sans Mono", ui-monospace, Menlo, monospace;
  --tear: 1.5px dashed var(--ink-4);
  --rule: 2px dashed var(--ink);
  --pad-x: max(16px, env(safe-area-inset-left, 0px));
  --max: 1080px;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --paper: #17161b; --paper-2: #232228; --ink: #ecebe6; --ink-2: #c6c5c1; --ink-3: #9b9a9f; --ink-4: #66656b; --ink-5: #37363c; --you: #f0705f; color-scheme: dark;
} }
:root[data-theme="dark"] { --paper: #17161b; --paper-2: #232228; --ink: #ecebe6; --ink-2: #c6c5c1; --ink-3: #9b9a9f; --ink-4: #66656b; --ink-5: #37363c; --you: #f0705f; color-scheme: dark; }

* { box-sizing: border-box; }
html { scroll-padding-top: 64px; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--display); font-size: 17px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
::selection { background: var(--you); color: var(--paper); }
a { color: inherit; text-decoration: underline; text-decoration-style: dashed; text-decoration-color: var(--ink-4); text-underline-offset: 4px; }
a:hover { color: var(--you); text-decoration-color: currentColor; }
a:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
code { font-family: var(--mono); font-size: .84em; color: var(--ink); background: var(--paper-2); padding: 1px 5px; border-radius: 3px; overflow-wrap: anywhere; }
h1, h2, h3, h4 { margin: 0; font-family: var(--display); text-wrap: balance; color: var(--ink); }
h1 { font-size: clamp(2.6rem, 6vw, 4.2rem); font-weight: 800; font-stretch: 75%; line-height: 1; letter-spacing: -0.02em; }
h2 { font-size: clamp(1.9rem, 3.6vw, 2.6rem); font-weight: 800; font-stretch: 75%; line-height: 1.05; letter-spacing: -0.01em; }
h3 { font-size: 1.25rem; font-weight: 700; font-stretch: 87%; line-height: 1.25; }
h4 { font-size: 1.08rem; font-weight: 700; font-stretch: 87%; line-height: 1.3; }
p { margin: 0; color: var(--ink-2); max-width: 70ch; }
b, strong { color: var(--ink); font-weight: 650; }
ul { margin: 0; padding-left: 1.15em; display: grid; gap: 6px; color: var(--ink-2); max-width: 72ch; }
li::marker { color: var(--ink-4); }
.mono { font: 500 12.5px/1.3 var(--mono); letter-spacing: .07em; text-transform: uppercase; color: var(--ink-3); }
.lead { font-size: 1.15rem; line-height: 1.55; }
.small { font-size: 15.5px; }
.note { font: 400 13.5px/1.6 var(--mono); color: var(--ink-3); max-width: 90ch; }
.stack { display: grid; gap: 12px; align-content: start; min-width: 0; }

/* the ticket strip scrolls away; only the tab bar stays */
.wrapx { max-width: var(--max); margin: 0 auto; padding-left: var(--pad-x); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.kot-hd { border-bottom: var(--rule); }
.kot-hd .wrapx { display: flex; gap: 24px; align-items: baseline; justify-content: space-between; padding-top: 14px; padding-bottom: 10px; font: 500 12.5px/1 var(--mono); letter-spacing: .05em; text-transform: uppercase; }
.kot-hd .wrapx > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kot-hd .live { flex: none; box-shadow: inset 0 0 0 1.5px var(--ink); padding: 4px 8px; margin: -4px 0; }
.tabbar { position: sticky; top: 0; z-index: 5; background: var(--paper); border-bottom: var(--tear); }
.tabbar:has(.row:empty) { display: none; }
.tabbar .row { display: flex; gap: 4px; align-items: center; overflow-x: auto; scrollbar-width: none; padding-top: 8px; padding-bottom: 8px; }
.tabbar .row::-webkit-scrollbar { display: none; }
.tabbar button { appearance: none; flex: none; border: 0; border-radius: 4px; background: transparent; color: var(--ink-2); cursor: pointer; white-space: nowrap;
  font: 600 14px/1.2 var(--display); font-stretch: 90%; padding: 7px 10px; }
.tabbar button span { font: 500 11.5px/1 var(--mono); color: var(--ink-3); margin-right: 6px; }
.tabbar button:hover { color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink-4); }
.tabbar button:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }
.tabbar button[aria-selected="true"] { background: var(--ink); color: var(--paper); }
.tabbar button[aria-selected="true"] span { color: var(--ink-4); }
.tabbar .mode { margin-left: auto; font: 500 12px/1.2 var(--mono); letter-spacing: .04em; color: var(--ink-3); box-shadow: inset 0 0 0 1px var(--ink-4); }

main { padding-bottom: 72px; }
.hero { padding: 56px 0 40px; display: grid; gap: 18px; }
.hero .thesis { font-size: clamp(1.3rem, 2.2vw, 1.6rem); line-height: 1.3; color: var(--ink); max-width: 36ch; font-weight: 650; font-stretch: 87%; }
.hero .thesis + p { font-size: 1.1rem; max-width: 62ch; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 22px; align-items: center; font-size: 15px; color: var(--ink-2); }
.toc { list-style: none; margin: 18px 0 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 32px; border-top: var(--rule); }
.toc li { border-bottom: var(--tear); }
.toc a { display: grid; grid-template-columns: 2.4em minmax(0, 1fr); gap: 8px; padding: 9px 0; text-decoration: none; font-size: 16px; }
.toc a span { font: 500 12.5px/1.7 var(--mono); color: var(--ink-3); }
.toc a:hover span { color: var(--you); }
@media (max-width: 640px) { .toc { grid-template-columns: 1fr; } }

/* sections: eyebrow, heading, lede, then the body */
section { padding: 36px 0 48px; border-top: var(--rule); display: grid; gap: 28px; }
body.tabs-on section { border-top: 0; padding-top: 32px; }
.sec-hd { display: grid; gap: 10px; }
.sec-hd p { font-size: 1.15rem; line-height: 1.55; }
.sub { display: grid; gap: 14px; align-content: start; min-width: 0; }
.sub > h3 { padding-bottom: 8px; border-bottom: var(--tear); }
.sub > .basic-hd { display: flex; flex-wrap: wrap; gap: 4px 16px; align-items: baseline; justify-content: space-between; padding: 14px 0 8px; border-top: 2px solid var(--ink); }
.sub > .basic-hd h3 { order: -1; }

.grid { display: grid; column-gap: 32px; row-gap: 24px; grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr)); }
.grid.c3 { --cols: 3; }
.grid.c4, .grid.c5 { --cols: 2; }
@media (max-width: 900px) { .grid.c3 { --cols: 2; } }
@media (max-width: 640px) { .grid, .grid.c3, .grid.c4, .grid.c5 { --cols: 1; } }
.grid > .sub + .sub { margin-top: 0; }
#basics > .grid { --cols: 1; row-gap: 36px; }
.item { border-top: var(--tear); padding-top: 12px; min-width: 0; display: grid; gap: 6px; align-content: start; }
.item.key { border-top: 2px solid var(--ink); }
.item.you-line { border-top: 2px solid var(--you); }
.item p, .item li { font-size: 16px; line-height: 1.55; }
.item .n { font: 500 12.5px/1 var(--mono); color: var(--ink-3); }

/* who does it: red ink for you, reverse print for the agent */
.tag { display: inline-block; font: 500 11.5px/1 var(--mono); letter-spacing: .07em; text-transform: uppercase; padding: 4px 6px; border-radius: 3px; justify-self: start; vertical-align: middle; }
.tag.you { color: var(--you); box-shadow: inset 0 0 0 1.2px var(--you); }
.tag.agent { color: var(--paper); background: var(--ink); }
.tag.both { color: var(--ink-3); box-shadow: inset 0 0 0 1.2px var(--ink-4); }
.pair { display: grid; grid-template-columns: 1fr 1fr; }
.pair > div { padding: 4px 24px 0 0; display: grid; gap: 8px; align-content: start; min-width: 0; }
.pair > div + div { padding: 4px 0 0 24px; border-left: var(--tear); }
.pair p { font-size: 16px; line-height: 1.6; }
@media (max-width: 640px) { .pair { grid-template-columns: 1fr; } .pair > div + div { border-left: 0; padding: 14px 0 0; border-top: var(--tear); margin-top: 14px; } }

.checks { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 40px; max-width: none; }
.checks li { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 10px; padding: 13px 0; border-top: var(--tear); font-size: 17px; color: var(--ink); }
.checks li::before { content: ""; width: 16px; height: 16px; margin-top: 4px; border-radius: 3px; box-shadow: inset 0 0 0 1.5px var(--ink); }
.checks li small { display: block; color: var(--ink-3); font-size: 15px; line-height: 1.55; margin-top: 3px; }
@media (max-width: 760px) { .checks { grid-template-columns: 1fr; } }

.strip { display: grid; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 18px; }
.strip.c5 { --cols: 3; } .strip.c3 { --cols: 3; }
.strip > div { border-top: var(--tear); padding: 12px 0 0; display: grid; gap: 6px; align-content: start; min-width: 0; }
.strip > div.you { border-top: 2px solid var(--you); }
.strip > div.agent { border-top: 2px solid var(--ink); }
.strip .big { font: 800 2.2rem/1 var(--display); font-stretch: 75%; }
.strip > div.you .big { color: var(--you); }
.strip p { font-size: 15.5px; line-height: 1.5; }
@media (max-width: 760px) { .strip, .strip.c5, .strip.c3 { --cols: 2; } }
@media (max-width: 420px) { .strip, .strip.c5, .strip.c3 { --cols: 1; } }

.fractions { display: grid; grid-template-columns: 4fr 2fr 3fr 3fr; border-top: var(--rule); border-bottom: var(--tear); }
.fractions > div { padding: 18px 14px; min-width: 0; }
.fractions > div + div { border-left: var(--tear); }
.fractions strong { display: block; font: 800 clamp(2.4rem, 5vw, 3.6rem)/1 var(--display); font-stretch: 75%; letter-spacing: -0.02em; }
.fractions span { display: block; margin-top: 10px; font: 500 12px/1.35 var(--mono); color: var(--ink-3); text-transform: uppercase; letter-spacing: .06em; }
.fractions .agent-slice { background: var(--ink); }
.fractions .agent-slice strong, .fractions .agent-slice span { color: var(--paper); }
@media (max-width: 640px) { .fractions { grid-template-columns: 1fr 1fr; } .fractions > div:nth-child(3) { border-left: 0; border-top: var(--tear); } .fractions > div:nth-child(4) { border-top: var(--tear); } }

blockquote { margin: 0; padding: 4px 0 4px 18px; border-left: 3px solid var(--you); display: grid; gap: 6px; }
blockquote p { font-size: clamp(1.2rem, 2vw, 1.45rem); line-height: 1.35; color: var(--ink); font-weight: 650; font-stretch: 87%; }
blockquote cite { font: 400 13px/1.3 var(--mono); color: var(--ink-3); font-style: normal; }

pre { margin: 0; font: 400 13px/1.6 var(--mono); color: var(--ink); padding: 14px 16px; background: var(--paper-2); border-radius: 6px; overflow-x: auto; max-width: 100%; }
pre .c { color: var(--ink-3); }
pre.term { background: var(--ink); color: var(--paper); white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12.5px; }
.file { font: 400 12.5px/1.3 var(--mono); color: var(--ink-3); }

.tw { overflow-x: auto; max-width: 100%; }
table { width: 100%; border-collapse: collapse; }
th { font: 500 12px/1.2 var(--mono); letter-spacing: .07em; text-transform: uppercase; color: var(--ink-3); text-align: left; padding: 8px 14px 8px 0; border-bottom: var(--rule); vertical-align: bottom; }
td { padding: 10px 14px 10px 0; border-bottom: var(--tear); color: var(--ink-2); vertical-align: top; font-size: 15.5px; line-height: 1.5; }
td:first-child { color: var(--ink); font-weight: 650; }
table.min td { min-width: 9em; }
table.min td:first-child { min-width: 7em; }

.parts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 32px; }
@media (max-width: 640px) { .parts { grid-template-columns: 1fr; } }
.part { display: grid; align-content: start; min-width: 0; }
.part-hd { padding-bottom: 10px; border-bottom: var(--rule); display: grid; gap: 4px; }
.stage { padding: 12px 0; border-bottom: var(--tear); display: grid; gap: 5px; }
.stage .top { display: flex; gap: 10px; align-items: baseline; }
.stage .cp { font: 500 12.5px/1 var(--mono); color: var(--ink-3); flex: none; }
.stage p { font-size: 16px; line-height: 1.5; }
.stage .setup { font: 400 12.5px/1.55 var(--mono); color: var(--ink-3); }
.stage .reads { display: flex; flex-wrap: wrap; gap: 2px 14px; font-size: 14.5px; }

.ex q { font: 700 1.15rem/1.3 var(--display); font-stretch: 87%; color: var(--you); quotes: "“" "”"; }

.boxes { list-style: none; padding: 0; display: grid; gap: 0; }
.boxes li { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 10px; padding: 9px 0; border-top: var(--tear); font-size: 15.5px; line-height: 1.5; }
.boxes li::before { content: ""; width: 14px; height: 14px; margin-top: 4px; border-radius: 3px; box-shadow: inset 0 0 0 1.5px var(--ink); }

.ladder { display: grid; }
.ladder > div { display: grid; grid-template-columns: 2.4em minmax(0, 11em) minmax(0, 1fr); gap: 4px 18px; padding: 12px 0; border-top: var(--tear); align-items: baseline; }
.ladder > div:last-child { border-bottom: var(--tear); }
.ladder .n { font: 500 13px/1 var(--mono); color: var(--ink-3); }
.ladder b { font-size: 1.02rem; font-stretch: 87%; }
.ladder p { font-size: 15.5px; line-height: 1.55; }
.ladder.tight > div { grid-template-columns: 2em minmax(0, 1fr); }
.ladder.tight p { grid-column: 2; }
@media (max-width: 760px) { .ladder > div { grid-template-columns: 2.2em minmax(0, 1fr); } .ladder p { grid-column: 2; } }

body.tabs-on main > section:not(.is-active) { display: none; }
body.tabs-on .toc { display: none; }
.subnav { display: flex; flex-wrap: wrap; gap: 6px; margin-top: -6px; }
.subnav a { font: 400 12.5px/1.2 var(--mono); color: var(--ink-2); text-decoration: none; padding: 5px 8px; border-radius: 3px; box-shadow: inset 0 0 0 1px var(--ink-5); white-space: nowrap; }
.subnav a:hover { color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink-3); }
body:not(.tabs-on) .subnav, body:not(.tabs-on) .pager { display: none; }
.pager { display: flex; justify-content: space-between; gap: 24px; padding-top: 20px; border-top: var(--tear); }
.pager a { display: grid; gap: 4px; text-decoration: none; max-width: 48%; min-width: 0; }
.pager a .k { font: 500 12px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); }
.pager a .t { font: 700 1.15rem/1.25 var(--display); font-stretch: 87%; text-wrap: balance; }
.pager a:hover .t { color: var(--you); }
.pager a.next { text-align: right; margin-left: auto; }

footer { border-top: var(--rule); }
footer .wrapx { padding-top: 22px; padding-bottom: 36px; display: grid; gap: 6px; }
footer::after { content: ""; display: block; height: 12px; background: radial-gradient(circle at 8px 12px, var(--ink-4) 5px, transparent 5.5px) 0 0 / 16px 12px repeat-x; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`;

// Tabs, built from the contents list: one section at a time, a subnav when a section has four or more parts,
// previous/next at the foot, arrow keys, the hash kept in step. "One page" shows everything; the choice is remembered.
const TABS_JS = `
(function () {
  var links = [].slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  var tabs = links.map(function (a) {
    var id = a.getAttribute('href').slice(1), sec = document.getElementById(id);
    return sec ? { id: id, n: a.querySelector('span').textContent, t: a.textContent.replace(/^\\d+/, ''), short: a.dataset.short, sec: sec } : null;
  }).filter(Boolean);
  if (!tabs.length) return;
  var body = document.body, top = document.getElementById('tabbar'), row = top.querySelector('.row');
  var KEY = 'srp-handbook-mode';
  function readMode() { try { return localStorage.getItem(KEY) || 'tabs'; } catch (e) { return 'tabs'; } }
  function saveMode(m) { try { localStorage.setItem(KEY, m); } catch (e) {} }
  function below(el) { return el.getBoundingClientRect().top + window.scrollY - top.offsetHeight - 8; }

  tabs.forEach(function (tb, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'tab-' + tb.id;
    b.innerHTML = '<span>' + tb.n + '</span>' + tb.short;
    b.addEventListener('click', function () {
      if (body.classList.contains('tabs-on')) go(i, true);
      else window.scrollTo(0, below(tb.sec));
    });
    row.appendChild(b); tb.btn = b;
    tb.sec.setAttribute('role', 'tabpanel'); tb.sec.setAttribute('aria-labelledby', b.id);
    tb.pager = document.createElement('div'); tb.pager.className = 'pager'; tb.sec.appendChild(tb.pager);
  });
  var mode = document.createElement('button');
  mode.type = 'button'; mode.className = 'mode';
  mode.addEventListener('click', function () { setMode(body.classList.contains('tabs-on') ? 'page' : 'tabs'); });
  row.appendChild(mode);

  function subnav(tb) {
    if (tb.subnavDone) return; tb.subnavDone = true;
    var heads = [].slice.call(tb.sec.querySelectorAll('.sub > h3, .sub > .basic-hd > h3'));
    if (heads.length < 4) return;
    var nav = document.createElement('nav'); nav.className = 'subnav'; nav.setAttribute('aria-label', 'In this section');
    heads.forEach(function (h, k) {
      if (!h.id) h.id = tb.id + '-' + (k + 1);
      var a = document.createElement('a'); a.href = '#' + h.id; a.textContent = h.textContent.replace(/\\s+/g, ' ').trim();
      nav.appendChild(a);
    });
    tb.sec.querySelector('.sec-hd').insertAdjacentElement('afterend', nav);
  }

  var current = -1;
  function go(i, push) {
    i = Math.max(0, Math.min(tabs.length - 1, i));
    if (current === i && body.classList.contains('tabs-on')) return;
    tabs.forEach(function (tb, k) {
      var on = k === i;
      tb.sec.classList.toggle('is-active', on);
      tb.btn.setAttribute('aria-selected', on ? 'true' : 'false');
      tb.btn.tabIndex = on ? 0 : -1;
    });
    current = i;
    var tb = tabs[i];
    subnav(tb);
    tb.pager.innerHTML = '';
    if (i > 0) tb.pager.insertAdjacentHTML('beforeend', '<a class="prev" href="#' + tabs[i - 1].id + '"><span class="k">← Previous</span><span class="t">' + tabs[i - 1].t + '</span></a>');
    if (i < tabs.length - 1) tb.pager.insertAdjacentHTML('beforeend', '<a class="next" href="#' + tabs[i + 1].id + '"><span class="k">Next →</span><span class="t">' + tabs[i + 1].t + '</span></a>');
    if (push) { try { history.replaceState(null, '', '#' + tb.id); } catch (e) {} }
    tb.btn.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (push) window.scrollTo(0, below(tb.sec));
  }
  function indexFromHash() {
    var h = decodeURIComponent((location.hash || '').slice(1));
    for (var i = 0; i < tabs.length; i++) if (tabs[i].id === h) return i;
    for (var j = 0; j < tabs.length; j++) if (h && tabs[j].sec.querySelector('#' + CSS.escape(h))) return j;
    return 0;
  }
  function setMode(m) {
    saveMode(m);
    if (m === 'tabs') {
      body.classList.add('tabs-on'); mode.textContent = 'One page'; mode.title = 'Show every section on one page';
      current = -1; go(indexFromHash(), false);
      var h = decodeURIComponent((location.hash || '').slice(1)), el = h && document.getElementById(h);
      if (el) window.scrollTo(0, below(el));
    } else {
      body.classList.remove('tabs-on'); mode.textContent = 'Tabs'; mode.title = 'Show one section at a time';
      tabs.forEach(function (tb) { tb.sec.classList.remove('is-active'); tb.btn.removeAttribute('aria-selected'); tb.btn.tabIndex = 0; });
    }
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !body.classList.contains('tabs-on')) return;
    var id = decodeURIComponent(a.getAttribute('href').slice(1)), idx = -1;
    tabs.forEach(function (tb, k) { if (tb.id === id || tb.sec.querySelector('#' + CSS.escape(id))) idx = k; });
    if (idx < 0) return;
    e.preventDefault();
    go(idx, true);
    if (id !== tabs[idx].id) { var el = document.getElementById(id); if (el) window.scrollTo(0, below(el)); }
  });
  window.addEventListener('hashchange', function () { if (body.classList.contains('tabs-on')) go(indexFromHash(), false); });
  document.addEventListener('keydown', function (e) {
    if (!body.classList.contains('tabs-on') || e.altKey || e.metaKey || e.ctrlKey) return;
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowRight') go(current + 1, true);
    if (e.key === 'ArrowLeft') go(current - 1, true);
  });
  setMode(readMode());
})();
`;

const sec = (id, n, label, title, lead) => `
  <section id="${id}">
    <div class="sec-hd">
      <span class="mono">${n} · ${label}</span>
      <h2>${title}</h2>
      ${lead ? `<p>${lead}</p>` : ""}
    </div>`;

const table = (head, rows, cls = "") => `<div class="tw"><table class="${cls}">
      <thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>`;

const you = '<span class="tag you">you</span>';
const agent = '<span class="tag agent">agent</span>';
const both = '<span class="tag both">shared</span>';

// [section id, title in the contents, short label on its tab]
const TOC = [
  ["setup", "Before the session", "Setup"], ["framing", "Prompting vs engineering", "Framing"],
  ["product", "Everyone is a product engineer", "Product"], ["brooks", "The Mythical Man-Month, for one", "Man-Month"],
  ["silver", "No Silver Bullet", "Silver bullet"], ["basics", "The ten basics", "Basics"],
  ["agents", "Choosing your agent", "Agents"], ["greenhouse", "Greenhouse, the example", "Greenhouse"],
  ["stages", "The eleven stages", "Stages"], ["skills", "Skills, hooks, connectors", "Skills"],
  ["harness", "How a harness works", "Harness"], ["release", "From merge-ready to released", "Release"],
  ["live", "Changing a live product", "Live product"], ["gardener", "You are the gardener", "Gardener"],
  ["reference", "Words, places, reading", "Reference"],
];

const TENETS = [
  ["Understand the problem space", "The agent only knows the problem you managed to describe. Time spent here is the planning third of Brooks's schedule."],
  ["User, machine and fellow-dev empathy", "Add a fourth: agent empathy. The next reader of your code is as likely to be a model as a colleague."],
  ["Think in outcomes, not output", "Output is now nearly free. If you measure yourself by it, the agent will happily bury you in it."],
  ["Be comfortable with ambiguity", "Agents are not. Resolving ambiguity before you hand work over is the highest-leverage thing you do all day."],
  ["Ship fast, think and act slowly", "Slow is smooth, smooth is fast. The agent supplies the fast; you supply the slow."],
  ["Talk to the people who use your product", "Or your ideal customers. How well do you interview them? No agent can do this for you, and everything downstream depends on it."],
  ["Always use your product", "Dogfood. The agent can run the tests; it cannot feel the friction. That review is yours."],
  ["Connect the dots", "Across the codebase, the user's day and the business. Agents see one context window; you see the whole board."],
  ["Use LLMs to augment your learning", "Ask the agent why it did the thing. You should understand more at the end of a session, not less."],
  ["Develop taste in code, design and UX", "Taste is what you review with. Without it, every agent suggestion looks equally fine."],
];

const BASICS = [
  ["Make it run anywhere", "DX is agent DX",
    "A repo that runs with one command is the difference between a two-week onboarding and a two-hour one.",
    "If the agent can't run the thing in its own environment, you become the test harness. Every check routes through you.",
    ["A local stand-in for every cloud service, so nothing everyday depends on a shared staging box", "Config in env files; secrets never pasted", "Seed data that looks like a believable day", ext("Twelve-factor", "https://12factor.net") + " is still the cheapest checklist"],
    "<code>just up</code> runs both Workers with D1 and the Durable Object in miniflare; <code>just reset</code> seeds an admin, Sam and the agent; <code>just secret put NAME</code>; <code>just agent-ready</code> checks the lot."],
  ["Types as the design language", "Make illegal states unrepresentable",
    "Picking the shape of the data is most of the design. Types hold the invariants you'd otherwise carry in your head.",
    "A whole class of mistakes can't be generated. The compiler answers in milliseconds, with no prompt.",
    ["Application-specific invariants get their own types, not a comment", "Anti-slop rules live in the type and lint config, not in a prompt the agent may skim"],
    "One schema in <code>packages/schema</code> (Effect Schema) shared by web and API; type-aware oxlint rules in <code>.oxlintrc.json</code>."],
  ["Tests the agent can learn from", "Agents thrive on feedback",
    "Committed examples prove intent in a way prose can't, and they survive you forgetting why.",
    "Feedback in milliseconds beats feedback in review. The faster and more deterministic the loop, the better the agent climbs.",
    ["No unit tests for their own sake. Expect tests for the domain, a few browser tests where the browser is the point", "Expect tests snapshot the result as text a human reads and nods at", "The committed example is the documentation"],
    "Expect snapshots in <code>__expect__/*.snap.txt</code> (<code>just test</code>), Playwright in <code>e2e/</code> (<code>just e2e</code>)."],
  ["Keep it simple, three times", "Simple code, simple components, simple tech choices",
    "Simplicity makes the bus factor survivable, and the bus is now also “the model changed”.",
    "Agents do well on well-trodden paths. Every unusual choice is a place the agent will confidently guess.",
    [],
    "Two Workers, one D1, one Durable Object per plan, and an event log in one table rather than an event-store product."],
  ["Review for understanding, not approval", "Your understanding ↔ the agent's",
    "Check the code matches the product and that you could still explain it. Walk through it, stack small PRs, ask questions.",
    "Ask the agent why it did the thing. If it can't explain the change, that's a finding.",
    ["Correct code can be wrong: a diff that passes every test can still contradict how the codebase is meant to work", "Review agents miss context and nitpick. Tell them to skip nitpicks; real bugs are rare", "Model inversion: author with one model, review with another. Different blind spots"],
    "<code>just review</code> reviews your branch with the model that didn't write it (Claude Code ↔ pi), vocabulary first."],
  ["One vocabulary, three speakers", "Domain-driven design",
    "The words in the code are the words you use with the user. No translation layer for meaning to leak through.",
    "The agent learns the domain from your identifiers. If three words mean one thing, it invents a fourth.",
    ["Bounded contexts say where a word stops meaning what it meant", "Keep the glossary in the repo, next to the code", "A user's phrase with no type behind it is a design finding"],
    "<code>docs/DOMAIN-VOCABULARY.md</code> lists each word and its banned synonyms; <code>just domain-vocabulary-check</code> fails on them."],
  ["Event sourcing: end to end without a browser", "Make the data visible",
    "Spreadsheets won because the data and its flow are visible. An event log gives a service the same property.",
    "Browser tests are slow and flaky for an agent to iterate on. With a log, end to end is “replay these commands, expect these events”.",
    ["The snapshot is the event stream, reviewed like a story", "Checks over the log let the agent verify its own work", "Keep the browser for flows where the browser is the point"],
    "<code>packages/engine</code> is the log; <code>just replay gh-12</code> prints a plan's stream as a story."],
  ["Keep a living wiki", "Codebase context",
    "The decisions not in the code are the ones that get argued again. Write the why down once.",
    "Agent instructions, skills and notes are a wiki whether you call it that or not. Feed post-mortems back so the next session starts smarter.",
    [],
    "A short <code>CLAUDE.md</code>; the detail in <code>skills/</code>, loaded on demand; the why in <code>docs/decisions/</code>."],
  ["Read the docs", "No substitute",
    "For your tools and the platforms you deploy to. The agent's knowledge is a snapshot; yours can be current.",
    "Point it at the real docs. Guesswork about pricing or defaults is how a weekend project becomes an invoice.",
    [],
    "Cloudflare's own skills are vendored in <code>skills/vendor/</code>, and the DeepWiki MCP in <code>.mcp.json</code> answers questions about any public repo from its source."],
  ["Climb the trust ladder", "Earn autonomy one rung at a time",
    "What you don't know, you find out by experimenting. Clarity of thought isn't always there on day one.",
    "Agents can see screens and drive browsers now, so they can check their own work. Let them, in a sandbox, first.",
    ["A small, vanilla agent", "Add skills and plugins: your conventions", "Add connectors (MCP): your systems", "Run in the cloud, unattended"],
    "Hooks fence the agent in: <code>stage-guard</code> limits edits to the plan's files, and <code>just deploy</code> refuses while a migration is pending."],
];

const PARTS = [
  ["01", "Ship an empty product, early", [
    ["cp-00", "Scaffold", "The app runs on your laptop: a web Worker and an API Worker talking to each other.", null,
      [["just manual", "https://just.systems/man/en/"], ["Claude Code skills", "https://docs.claude.com/en/docs/claude-code/skills"]]],
    ["cp-01", "First deploy", "Merge a pull request and GitHub puts the site online. Then roll it back.", "bunx wrangler login · a free Cloudflare account",
      [["Workers", "https://developers.cloudflare.com/workers/"], ["Service bindings", "https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/"], ["Rollbacks", "https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/"]]],
  ]],
  ["02", "Agree on the words first", [
    ["cp-02", "Design", "A shared vocabulary, an architecture map and the events. A check rejects banned words.", null,
      [["Ubiquitous language", "https://martinfowler.com/bliki/UbiquitousLanguage.html"], ["No Silver Bullet", "https://en.wikipedia.org/wiki/No_Silver_Bullet"]]],
    ["cp-03", "Engine and identity", "Every change is saved as an event. Sign-up and sign-in work.", "just reset",
      [["Event sourcing", "https://martinfowler.com/eaaDev/EventSourcing.html"], ["Effect docs", "https://effect.website/docs"], ["D1", "https://developers.cloudflare.com/d1/"]]],
  ]],
  ["03", "Build the product", [
    ["cp-04", "Admin", "An admin dashboard, and your first test that drives a real browser.", "just e2e-install",
      [["Playwright", "https://playwright.dev/docs/intro"], ["Hono", "https://hono.dev"]]],
    ["cp-05", "Plan document", "Comment on a plan and turn the thread into a decision, live in two tabs. A second model reviews your change.", "just reset · a second agent for just review",
      [["Durable Objects", "https://developers.cloudflare.com/durable-objects/"], ["TanStack Start", "https://tanstack.com/start"]]],
    ["cp-06", "Sessions and agent", "Ask the agent inside a session and it answers.", "just agent-serve in a second terminal · API key optional",
      [["pi and pi-durable", "https://github.com/earendil-works/pi"]]],
    ["cp-07", "UI", "Redesign the plan page with design skills. Click the page to leave a note; the agent fixes it.", "just up · the Agentation toolbar shows in dev",
      [["Impeccable", "https://github.com/pbakaus/impeccable"], ["Emil Kowalski's skills", "https://github.com/emilkowalski/skills"], ["Agentation", "https://github.com/benjitaylor/agentation"]]],
  ]],
  ["04", "Trust it, then release it", [
    ["cp-08", "Agent failures", "Turn the ways the agent goes wrong into tests.", null,
      [["Expect tests", "https://blog.janestreet.com/the-joy-of-expect-tests/"]]],
    ["cp-09", "End to end", "Seven tests click through the whole product in a browser.", "just e2e-install once",
      [["Playwright", "https://playwright.dev/docs/intro"]]],
    ["cp-10", "Release", "Ship behind a flag and turn it on for yourself, with no redeploy.", "bunx wrangler login",
      [["Feature toggles", "https://martinfowler.com/articles/feature-toggles.html"]]],
  ]],
];

const SKILL_EXAMPLES = [
  ["Add a reason to a decision", "event-sourcing", "The command, the event, the projection and an expect test, the way the rest of the domain is built. If the event already exists, it climbs the versioning ladder instead of editing the past."],
  ["What's the difference between a block and a section?", "ddd-vocabulary", "The answer comes from DOMAIN-VOCABULARY.md: “section” is a banned word for Block, and the check fails on it."],
  ["Plan this ticket", "create-plan", "A plan page with phases, the files each phase touches and its checks: the same format as the stage plans."],
  ["Explain how a comment becomes a decision", "viz-explainer", "A small interactive diagram you step through, instead of a wall of text."],
  ["Make the plan page feel better", "impeccable · emil-design-eng", "A design critique and specific fixes: hierarchy, type, spacing, motion (cp-07)."],
  ["Is this repo ready for an agent?", "agent-ready", "A ✓/✗ checklist: one command to start, seeded logins, health checks, each with its fix."],
];

const HOOKS = [
  ["Before every edit", "stage-guard", "Refuses an edit to a file the stage's plan doesn't list, so the agent can't wander.", "scripts/hooks/stage-guard.sh",
    "Stage cp-05 is being built here, and its plan\ndoes not list: apps/web/src/routes/settings.tsx\nBuild only what the plan says."],
  ["After every edit", "arch-hook", "Rebuilds the architecture map and plan pages. Stops the agent if a new package isn't on the map.", "scripts/hooks/arch-hook.sh", null],
  ["When a session starts", "agent-ready", "Tells the agent what the repo is still missing. Never blocks.", "skills/agent-ready/scripts/hook.sh", null],
  ["Before every commit", "pre-commit", "The same plan guard, for people and pi too. Rebuilds the map when ARCHITECTURE.md changes.", "scripts/git-hooks/pre-commit",
    "Override for one commit:\nSTAGE_GUARD=off git commit …"],
];

const WORDS = [
  ["Stage", "One step of the build (cp-00 to cp-10), with its own branch and pull request."],
  ["Plan", "In the workshop, a stage's contract: phases, files, checks (<code>just next</code>). In Greenhouse, the document people and the agent write together."],
  ["Skill", "Instructions the agent loads when your request matches. Advice."],
  ["Hook", "A script that runs on its own at a set moment. A guarantee."],
  ["Harness", "The program around the model: builds the context, runs the tools, decides what's remembered."],
  ["Worker", "A Cloudflare program. Greenhouse is two: web and API."],
  ["Event", "A fact that happened, like <code>DecisionRecorded</code>. The app's state is built from them."],
  ["Projection", "A view computed from events: the decision log, the list of open threads."],
  ["Flag", "A switch that turns a feature on for some people without a deploy."],
  ["Model inversion", "Reviewing with a different model than the one that wrote the code."],
];

const REPO = [
  ["docs/CHECKPOINTS.md", "Every stage, its demo and its setup"],
  ["docs/plans/stages/", "Each stage's plan, as a page"],
  ["docs/WORKFLOW.md", "One task end to end, nine steps"],
  ["docs/RELEASE.md", "The release checklist, with commands"],
  ["docs/RUNBOOK.md", "Day-to-day commands; <code>just reset</code> when local state is odd"],
  ["docs/DOMAIN-VOCABULARY.md", "The only words allowed for domain concepts"],
  ["docs/ARCHITECTURE.md", "What calls what; <code>just arch</code> turns it into a map"],
  ["skills/README.md", "Every skill, and when it fires"],
  ["just --list", "Every runnable thing"],
];

const READING = [
  ["Brooks", [["The Mythical Man-Month", "https://en.wikipedia.org/wiki/The_Mythical_Man-Month"], ["No Silver Bullet", "https://en.wikipedia.org/wiki/No_Silver_Bullet"]], "1975 and 1986. The schedule rule is chapter two; the surgical team, chapter three."],
  ["Planning", [["Maggie Appleton, Planning with Agents", "https://maggieappleton.com/planning-agents"], ["GitHub Next, Chopin", "https://githubnext.com/projects/chopin"]], "Plans as boundary objects; the planning room Greenhouse is modelled on."],
  ["Domain and events", [["Ubiquitous language", "https://martinfowler.com/bliki/UbiquitousLanguage.html"], ["Event sourcing", "https://martinfowler.com/eaaDev/EventSourcing.html"], ["Oskar Dudycz on event versioning", "https://event-driven.io/en/simple_events_versioning_patterns/"], ["Greg Young, Versioning in an Event Sourced System", "https://leanpub.com/esversioning"]], ""],
  ["Tests", [["Jane Street, expect tests", "https://blog.janestreet.com/the-joy-of-expect-tests/"], ["Playwright", "https://playwright.dev/docs/intro"], ["Stagehand", "https://github.com/browserbase/stagehand"]], ""],
  ["Harness and context", [["Claude Code: prompt caching", "https://code.claude.com/docs/en/prompt-caching"], ["Claude Code: sessions", "https://code.claude.com/docs/en/sessions"], ["pi", "https://github.com/earendil-works/pi"], ["disler/durable-pi", "https://github.com/disler/durable-pi"]], ""],
  ["Release", [["Feature toggles", "https://martinfowler.com/articles/feature-toggles.html"], ["OpenFeature", "https://openfeature.dev"], ["Workers gradual deployments", "https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/"], ["Workers rollbacks", "https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/"]], ""],
  ["Bug reports", [["Sentry User Feedback", "https://docs.sentry.io/product/user-feedback/"], ["PostHog session replay", "https://posthog.com/session-replay"], ["Jam", "https://jam.dev"]], ""],
  ["Tools", [["cmux", "https://github.com/manaflow-ai/cmux"], ["Agentation", "https://github.com/benjitaylor/agentation"], ["DeepWiki", "https://deepwiki.com"], ["Mobbin", "https://mobbin.com"], ["Claude in Chrome", "https://claude.com/chrome"]], ""],
];

export function handbookPage() {
  const toc = TOC.map(([id, t, short], i) => `<li><a href="#${id}" data-short="${esc(short)}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(t)}</a></li>`).join("");

  const tenets = TENETS.map(([t, d], i) => `
      <div class="item"><span class="n">${String(i + 1).padStart(2, "0")}</span><h4>${esc(t)}</h4><p>${esc(d)}</p></div>`).join("");

  const basics = BASICS.map(([title, sub, y, a, bullets, here], i) => `
      <div class="sub">
        <div class="basic-hd"><span class="mono">${String(i + 1).padStart(2, "0")} · ${esc(sub)}</span><h3>${esc(title)}</h3></div>
        <div class="pair">
          <div>${you}<p>${esc(y)}</p></div>
          <div>${agent}<p>${esc(a)}</p></div>
        </div>
        ${bullets.length ? `<ul>${bullets.map(b => `<li>${b.startsWith("<a") ? b : esc(b)}</li>`).join("")}</ul>` : ""}
        <p class="note">In Greenhouse: ${here}</p>
      </div>`).join("");

  const parts = PARTS.map(([n, title, stages]) => `
      <div class="part">
        <div class="part-hd"><span class="mono">Part ${n}</span><h3>${esc(title)}</h3></div>
        ${stages.map(([cp, name, build, setup, reads]) => `
        <div class="stage">
          <div class="top"><span class="cp">${cp}</span><h4>${esc(name)}</h4></div>
          <p>${esc(build)}</p>
          ${setup ? `<span class="setup">+ ${esc(setup)}</span>` : ""}
          <div class="reads">${reads.map(([l, h]) => ext(l, h)).join("")}</div>
        </div>`).join("")}
      </div>`).join("");

  const skillExamples = SKILL_EXAMPLES.map(([say, name, get]) => `
      <div class="item ex"><q>${esc(say)}</q><span class="tag agent">${esc(name)}</span><p>${esc(get)}</p></div>`).join("");

  const hooks = HOOKS.map(([when, name, what, file, out]) => `
      <div class="item key">
        <span class="mono">${esc(when)}</span>
        <h3>${esc(name)}</h3>
        <p>${esc(what)}</p>
        ${out ? `<pre class="term">${esc(out)}</pre>` : ""}
        <span class="file">${esc(file)}</span>
      </div>`).join("");

  const reading = READING.map(([topic, links, note]) => [esc(topic), links.map(([l, h]) => ext(l, h)).join(" · ") + (note ? `<br><span class="small">${esc(note)}</span>` : "")]);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Shipping Reliable Products</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=Spline+Sans+Mono:wght@400;500&display=swap">
<style>${CSS}</style>
</head>
<body>
<header class="kot-hd"><div class="wrapx"><span>Shipping reliable products · handbook</span><span class="live">11 stages</span></div></header>
<div class="tabbar" id="tabbar" role="tablist" aria-label="Sections"><div class="row wrapx"></div></div>
<main class="wrapx">
  <div class="hero">
    <span class="mono">GrowthX · AI coding session · handbook</span>
    <h1>Shipping reliable products</h1>
    <div class="stack">
      <p class="thesis">Agents made the typing cheap. They did not make the thinking cheap.</p>
      <p>This is everything from the session in one place: the engineering basics that let you and the agent beside you get through the problems that still show up, and Greenhouse, a repo where you build each of them yourself in eleven stages.</p>
      <div class="legend"><span>${you} what stays with you</span><span>${agent} what the agent needs from you</span></div>
    </div>
    <ol class="toc">${toc}</ol>
  </div>

  ${sec("setup", "01", "Before the session", "Set up once, about 30 minutes", "More if Nix is new to you. If <code>just up</code> or <code>just test</code> isn't green by 19:00, post the error in the event chat and keep going: you can still follow along.")}
    <ul class="checks">
      <li><span>A terminal on macOS or Linux<small>Windows: WSL2.</small></span></li>
      <li><span>git with your name and email, and GitHub auth<small><code>gh auth login</code> or an SSH key.</small></span></li>
      <li><span>One coding agent, signed in and run once<small>${ext("Claude Code", "https://docs.claude.com/en/docs/claude-code/overview")}: <code>npm install -g @anthropic-ai/claude-code</code>, then <code>claude</code>. Or ${ext("pi", "https://pi.dev")}: <code>curl -fsSL https://pi.dev/install.sh | sh</code>, then <code>pi</code> and <code>/login</code>.</small></span></li>
      <li><span>${ext("Nix", "https://determinate.systems/nix-installer/")}, which brings Bun, Node and just<small><code>curl -fsSL https://install.determinate.systems/nix | sh -s -- install</code>. No Nix? Install ${ext("Bun", "https://bun.sh")} and ${ext("just", "https://just.systems")} yourself.</small></span></li>
      <li><span>The Greenhouse repo, with <code>just up</code> and <code>just test</code> green<small>The link comes the morning of. No Docker or database to install.</small></span></li>
      <li><span>Nice to have: both Claude Code and pi<small><code>just review</code> checks your change with the model that didn't write it. Also run <code>just e2e-install</code> early so browser tests don't wait on a download.</small></span></li>
    </ul>
    <p class="note">Optional: ${ext("cmux", "https://github.com/manaflow-ai/cmux")} (macOS) for a desk built for agents, ${ext("Claude in Chrome", "https://claude.com/chrome")}, an ${ext("Amp", "https://ampcode.com")} account for afterwards. Not needed: knowing Effect, TanStack, event sourcing or Durable Objects. The basics carry you; the stack is where they're shown.</p>
  </section>

  ${sec("framing", "02", "Framing", "Prompting vs engineering", "There's no right way to do AI coding. Every path leads to tech debt, because any committed code is tech debt: an arrow shot can't be taken back. What changed is who shoots, and how fast.")}
    <div class="grid c3">
      <div class="item key"><h3>The practices we dropped</h3><p>In the rush, a lot of engineering practice got quietly dropped. Those practices were never about typing speed. They keep a system legible to whoever works on it next, and whoever works on it next is now the agent.</p></div>
      <div class="item key"><h3>Agent empathy</h3><p>Agents are a new primitive. Machine empathy, what made you good at working with computers, now extends to agents. A good agent experience still needs a great developer experience underneath, updated as models change.</p></div>
      <div class="item you-line"><h3>Scope: you, not your team</h3><p>This is about what one person can do, where the basics pay off fastest: you can change your own habits tomorrow. Team process varies hugely and nothing here depends on changing it.</p></div>
    </div>
    <blockquote><p>An agent will cook. Whether what comes out is edible depends on your intent, and intent is an engineering artefact.</p></blockquote>
  </section>

  ${sec("product", "03", "Pillar one", "Everyone is a product engineer", "Features are not asks. Any code that makes money is good code. Your job is the outcome, and the agent only knows the outcome you managed to write down.")}
    <div class="grid c3">
      <div class="item key"><h3>Features ≠ asks</h3><p>An ask is what someone typed in a ticket. A feature is the change in the user's day. The agent will faithfully build the ask; turning it into the feature is your job.</p></div>
      <div class="item key"><h3>Outcome over output</h3><p>If the measure is the outcome, then verifying the outcome, not the diff, is the work.</p></div>
      <div class="item key"><h3>Intent is the input</h3><p>Prompts, plans, tests, types and docs are the same thing: ways of writing intent down so a second brain can act on it without you in the room.</p></div>
    </div>
    <div class="sub">
      <h3>The ten tenets of a product engineer</h3>
      <p class="small">None of them is about tools. Every one changes what the agent gets handed.</p>
      <div class="grid c5">${tenets}
      </div>
    </div>
  </section>

  ${sec("brooks", "04", "Pillar two · Brooks, 1975", "The Mythical Man-Month, read by one person", "The book is about teams. Almost every chapter still applies when the team is you and a few agent sessions.")}
    <blockquote><p>Good cooking takes time. If you are made to wait, it is to serve you better, and to please you.</p><cite>Menu of Antoine's, New Orleans · the book's epigraph</cite></blockquote>
    <p class="lead">Agents collapsed the wait. The cooking still takes as long as it takes; it moved from the keyboard into planning, testing and reading. Spend none of that time and you get a coin toss.</p>
    <div class="sub">
      <h3>Estimation: optimism is the bug</h3>
      <p class="small">Brooks's claim: optimism and bad estimation sink software, and they're the same thing. His rule of thumb for a schedule:</p>
      <div class="fractions">
        <div><strong>1/3</strong><span>planning</span></div>
        <div class="agent-slice"><strong>1/6</strong><span>coding · the agent's slice</span></div>
        <div><strong>1/4</strong><span>component and early system test</span></div>
        <div><strong>1/4</strong><span>system test, all parts in hand</span></div>
      </div>
      <p>Coding was already the smallest slice in 1975, and agents shrink it further. The other five sixths are still yours. Treat the coding slice as the whole job and your estimate is off by six before you start.</p>
    </div>
    <div class="sub">
      <h3>The surgical team, recast</h3>
      <p class="small">Harlan Mills's proposal: one surgeon owns the design, and specialists keep the surgeon's hands free. Not ten surgeons operating at once.</p>
      ${table(["Role", "Filled by", "At your desk"], [
        ["Surgeon", you, "Owns the problem, the design and the final call. Conceptual integrity lives in one head."],
        ["Copilot", agent, "Knows the design, argues with it, writes much of the code. Doesn't own it."],
        ["Administrator", you, "Environment, tooling, access. Make it easy to run anywhere, for you and the agent."],
        ["Editor", agent, "Docs, comments, changelogs: the why behind a change, kept current."],
        ["Program clerk", agent, "Review passes, skill and prompt writing, a record of what was tried."],
        ["Toolsmith, tester, language lawyer", both, "Agents do the volume; you decide what counts as a passing test and which idioms are allowed."],
      ], "min")}
    </div>
    <div class="grid c5">
      <div class="item"><h4>Brooks's law</h4><p>Adding people to a late project makes it later. Adding agent sessions to a confused task makes it more confused: every session's questions route through you. You're the communication overhead now.</p></div>
      <div class="item"><h4>Parallel agents</h4><p>Explore in parallel, commit serially. Threads that each try a different option before you decide are cheap and worth it. Several agents building the committed version of one ticket at once is what Brooks rules out: it speeds up the sixth and multiplies the five sixths you still owe.</p></div>
      <div class="item"><h4>One day at a time</h4><p>“How does a project get to be a year late? One day at a time.” Agents hide slippage, because something always got produced. Keep milestones small and visibly true or false.</p></div>
      <div class="item"><h4>The second system</h4><p>The gold-plated version was always tempting; now it's cheap to generate too. Leaving things out is a human discipline.</p></div>
      <div class="item"><h4>Plan to throw one away</h4><p>Finally affordable. Let the agent build a first version to learn the problem, then throw it away on purpose rather than by accident.</p></div>
    </div>
  </section>

  ${sec("silver", "05", "Pillar three · Brooks, 1986", "No Silver Bullet", "Brooks split the difficulty of software into essence and accident, and predicted no single technique would give a tenfold gain. Coding agents are the strongest attack on accident yet. The essence didn't move.")}
    <div class="pair">
      <div>${agent}<h3>Accidental difficulty</h3><p>The agent takes most of this:</p><ul><li>Syntax, boilerplate, glue code</li><li>Looking things up, remembering APIs</li><li>Mechanical refactors, test scaffolding</li><li>Translating between languages and formats</li></ul></div>
      <div>${you}<h3>Essential difficulty</h3><p>You still hold all four:</p><ul><li>Complexity: the shape of the data and its invariants</li><li>Conformity: the messy world the software must match</li><li>Changeability: what users will ask for next</li><li>Invisibility: nobody sees the whole system, the agent included</li></ul></div>
    </div>
    <p class="lead">Agents hill-climb. Given a hard target they take shortcuts, and they can't do well on what they can't see. So No Silver Bullet isn't pessimism, it's a to-do list: whatever shrinks the essence for a person shrinks it for the agent.</p>
    <div class="sub">
      <h3>Brooks's promising attacks, thirty years on</h3>
      <div class="grid c4">
        <div class="item key"><h4>Buy, don't build</h4><p>Boring, opinionated frameworks are slower to start and better to live in. “One way to do the right thing” is the constraint an agent needs. Read your platform's docs; people get burned by cloud pricing when the agent configures it blind.</p></div>
        <div class="item key"><h4>Rapid prototyping</h4><p>Align visually. Show, don't tell, no walls of text. A rendered screen is a better requirements document than a paragraph, for both of you.</p></div>
        <div class="item key"><h4>Grow, don't build</h4><p>Loops with pressure both ways: plan, build, verify, feed back what you learned. Let work compound across sessions instead of starting from zero.</p></div>
        <div class="item you-line"><h4>Great designers</h4><p>Brooks's last hope was cultivating great designers. That's now the one role you can't delegate.</p></div>
      </div>
    </div>
    <div class="sub">
      <h3>Keeping up without the FOMO</h3>
      <p>Watching the timeline, it can feel like everyone else is doing unbelievable things. No Silver Bullet is the kind answer: every tool there attacks accidental difficulty, and the gain any one tool gives you is capped by how much accident is left in your work. The essence (knowing what to build, the shape of the data, what correct means) is where the compounding happens, and none of it expires when the next tool ships.</p>
      <div class="pair">
        <div><h4>Keep up with</h4><p>Your own loop: how fast you get from intent to a verified change, measured on your repo, not a demo. One new tool a month, tried on a real ticket, kept only if the loop got faster.</p></div>
        <div><h4>Let go of</h4><p>Leaderboards, model launches, other people's thirty-second clips. The unbelievable thing in the clip was usually the basics you already know, applied by someone who didn't skip them.</p></div>
      </div>
    </div>
  </section>

  ${sec("basics", "06", "Playbook", "The ten basics that carry you and your agent", "None of them is new. Each is written twice, what it does for you and what it does for the agent you hand your codebase to, and then where Greenhouse does it, so you can see it running.")}
    <div class="grid">${basics}
    </div>
  </section>

  ${sec("agents", "07", "Choosing your agent", "Pick for your platform, not the leaderboard", "There's no right tool. For one person the choice turns on where your code runs, how much of the harness you want to own, and what you need to be able to inspect afterwards.")}
    ${table(["Tool", "Shape", "Fits someone who…"], [
      [ext("pi", "https://pi.dev"), "Small, vanilla, hackable harness", "wants to understand what a coding agent does, and add skills and connectors one rung at a time"],
      [ext("Claude Code", "https://docs.claude.com/en/docs/claude-code/overview"), "Terminal-first agent with skills, hooks and subagents", "lives in a repo and a shell, wants long runs and a way to encode conventions"],
      [ext("Codex", "https://github.com/openai/codex"), "Cloud sandboxes plus a CLI", "wants parallel tasks running away from the laptop, each in its own environment"],
      [ext("Amp", "https://ampcode.com"), "Editor-integrated agent with shared threads", "wants the agent in the editor and a record of sessions to go back to"],
    ], "min")}
    <div class="grid c4">
      <div class="item key"><h4>Platform first</h4><p>Where does the code run, and can the agent run it there too? A tool that can execute your stack in its own sandbox stops you being the test harness.</p></div>
      <div class="item key"><h4>Harness ownership</h4><p>How much of the loop do you want to see and change? A small harness teaches the mechanics; a big one does more out of the box and hides more.</p></div>
      <div class="item key"><h4>Legibility</h4><p>Can you get the why out afterwards? Threads, transcripts, plans and diffs you can read later matter more than a benchmark score.</p></div>
      <div class="item key"><h4>Model inversion</h4><p>Whatever you author with, keep a second model to review with. Some tools make that easier than others.</p></div>
    </div>
    <div class="sub">
      <h3>A desk that helps</h3>
      <div class="grid">
        <pre><span class="c">// one workspace per repo, a pane per role</span>
┌──────────────────────────┬──────────────────────────┐
│ author agent             │ reviewer agent           │
│ the stage's plan         │ just review              │
├──────────────────────────┼──────────────────────────┤
│ just up · logs           │ browser pane             │
│ api · web · agent-serve  │ the app · Agentation     │
└──────────────────────────┴──────────────────────────┘</pre>
        <div class="stack">
          <p><b>Panes are roles, not parallel builders.</b> Author, reviewer, logs, browser. Exploration threads run elsewhere and report back; two agents never build the committed version of one ticket at once.</p>
          <p><b>Notifications beat tmux.</b> One agent works at a time, but a pane that rings when it needs you beats one you forgot while reading logs. ${ext("cmux", "https://github.com/manaflow-ai/cmux")} (macOS, <code>brew install cmux</code>) does this, with an embedded browser pane.</p>
          <p><b>The browser pane is for showing.</b> Run Agentation there: point at what looks wrong, copy the structured note, paste it to the agent.</p>
        </div>
      </div>
    </div>
  </section>

  ${sec("greenhouse", "08", "The runnable example", "Greenhouse", "One small repo that does everything the playbook asks, so each practice runs instead of being described. A planning room in the spirit of GitHub Next's " + ext("Chopin", "https://githubnext.com/projects/chopin") + ": people and an agent write a plan together, and every decision in it is owned, dated and attached to the part of the plan it changed.")}
    <div class="grid c3">
      <div class="item key"><h4>Why not a CRUD app</h4><p>Chopin names three gaps in planning with agents: plans aren't interactive, decisions have no owner, and agents explain in text when a picture would do. Decisions are events, so event sourcing is the natural model. A plan room with people and an agent in it is the multiplayer harness, so the agent demo and the product are the same code.</p></div>
      <div class="item key"><h4>The smallest honest cut</h4><p>Block-level plans (each edit is an event; no character-level co-editing), comment threads, a decision log, sessions where people ask the agent, and an agent that acts through the same commands as a person. Left out: live text editing, presence cursors, research blocks.</p></div>
      <div class="item you-line"><h4>The agent is a Participant</h4><p>It holds no command a person can't issue, and signs in with its own account. That's also how you keep it honest.</p></div>
    </div>
    <div class="sub">
      <h3>The domain: a plan room</h3>
      <div class="grid">
        <pre><span class="c">// the words, as the person, the code and the agent all say them</span>
Plan         a document tied to a repo; one stream of events
Block        a unit of the plan: prose or an artifact
Thread       a comment thread anchored to one block
Reply        one message in a thread
Decision     how a thread ended: who, when, what, which block
Session      where participants ask the agent, inside a plan
Run          one question to the agent, queued to answered
Participant  a person or an agent; same commands, same rights</pre>
        <pre><span class="c">// commands anyone issues      // events that get recorded</span>
OpenThread     ─────────▶  ThreadOpened
Reply          ─────────▶  ReplyPosted
ResolveThread  ─────────▶  ThreadResolved ──▶ DecisionRecorded
StartSession   ─────────▶  SessionStarted
JoinSession    ─────────▶  ParticipantJoined
Ask            ─────────▶  RunQueued … RunFinished | RunFailed
Steer          ─────────▶  RunSteered
OpenAccount    ─────────▶  AccountOpened</pre>
      </div>
      <p class="small">Three speakers, one vocabulary: you say “resolve this thread”, the code says <code>ResolveThread</code>, and the agent, reading the repo, says it back. Each word, its examples and its banned synonyms are in <code>docs/DOMAIN-VOCABULARY.md</code>.</p>
    </div>
    <div class="sub">
      <h3>The stack: good enough, boring on purpose</h3>
      ${table(["Layer", "Choice", "Why it's enough", "Shows"], [
        ["Runtime", "Bun + TypeScript", "One toolchain for scripts, server and tests; the loop stays in milliseconds.", "run anywhere"],
        ["Web", "TanStack Start, its own Worker, Tailwind", "File-based routes the agent can navigate without a map. Reaches the API only through a service binding.", "simple components"],
        ["API", "Hono at the edge, Effect behind it", "Hono is the HTTP door; services, typed errors and schemas live in Effect, so a failure can't go unhandled.", "types as design"],
        ["Schema", "Effect Schema, shared", "One definition of Decision used by web, API and tests. The words can't drift between layers.", "one vocabulary"],
        ["Events", "Own engine, one table", "Append, read, project, upcast. No event-store product. Adapters for D1, SQLite and PGlite.", "event sourcing"],
        ["Realtime", "One Durable Object per plan", "The plan's stream lives in one object; every open tab subscribes over a WebSocket.", "event sourcing"],
        ["Data", "D1", "Accounts, flags and summaries. Migrations are plain SQL, applied by hand, never on deploy.", "make data visible"],
        ["Sign-in", "Accounts as an event stream", "Cookie sessions in Hono. No third-party dashboard to configure out of band.", "simple choices"],
        ["Flags", "A D1 table and <code>just flag</code>", "Off, on for one person, a percentage, on. No vendor.", "staged release"],
        ["Agent", "pi-durable", "A durable pi session per plan room with SQLite checkpoints. Without a model key a stand-in model answers, so tests are free.", "legibility"],
        ["Tests", "bun expect tests, Playwright", "Snapshots a person reads; seven browser tests for the journeys where the browser is the point.", "tests that teach"],
        ["Lint", "oxlint (type-aware), tsc", "Rules in config, not in a prompt the agent may skim.", "types as design"],
        ["Local", "Nix flake + just + miniflare", "One <code>just up</code> on a fresh laptop or in an agent's sandbox.", "DX is agent DX"],
        ["Deploy", "wrangler, GitHub Actions", "Every merge to <code>main</code> deploys the demo site; prod by hand with <code>just deploy prod</code>.", "read the docs"],
      ], "min")}
    </div>
    <div class="grid">
      <div class="sub">
        <h3>Repo layout</h3>
        <pre>greenhouse/
├── flake.nix            <span class="c"># bun, node, just: one env everywhere</span>
├── justfile             <span class="c"># the only commands anyone, or any agent, needs</span>
├── apps/
│   ├── web/             <span class="c"># TanStack Start; plans, threads, sessions, admin</span>
│   ├── api/             <span class="c"># Hono + Effect; PlanRoom Durable Object; migrations</span>
│   └── checkin/         <span class="c"># this page and the check-in form</span>
├── packages/
│   ├── domain/          <span class="c"># commands, events, projections; __expect__/</span>
│   ├── engine/          <span class="c"># the event log and its adapters</span>
│   ├── schema/          <span class="c"># shared Effect Schemas</span>
│   ├── agent/           <span class="c"># the pi-durable agent and its tools</span>
│   └── db/              <span class="c"># seeds, printed as SQL by the engine</span>
├── e2e/                 <span class="c"># Playwright journeys</span>
├── skills/              <span class="c"># loaded by Claude Code and pi</span>
├── scripts/             <span class="c"># hooks, scaffolding, stage tools</span>
├── docs/                <span class="c"># vocabulary, architecture, plans, decisions</span>
└── CLAUDE.md            <span class="c"># short; the detail lives in skills/</span></pre>
      </div>
      <div class="sub">
        <h3>Recipes you'll use</h3>
        <p class="small">A justfile is the contract between you, the agent and the sandbox. If something isn't a recipe, the agent invents its own way to do it.</p>
        <pre>just up                    <span class="c"># api + web locally, D1 and DO in miniflare</span>
just test                  <span class="c"># expect tests (ms), then api tests</span>
just e2e [filter]          <span class="c"># Playwright against the local app</span>
just reset                 <span class="c"># fresh local state, migrated and seeded</span>
just new command Name      <span class="c"># scaffold a command and its expect test</span>
just replay gh-12          <span class="c"># a plan's stream, printed as a story</span>
just review                <span class="c"># the other model reviews your branch</span>
just flag user NAME you    <span class="c"># a feature on, just for you</span>
just agent-serve           <span class="c"># the agent, answering in sessions</span>
just agent-demo            <span class="c"># kill it mid-tool; run again; it resumes</span>
just next · stage-check    <span class="c"># the stage's plan, then its checks</span>
just step N                <span class="c"># any finished stage, in its own folder</span>
just deploy prod           <span class="c"># stops if a migration is pending</span></pre>
      </div>
    </div>
  </section>

  ${sec("stages", "09", "The eleven stages", "From an empty app to a release", "Each stage ends with something you can demo. Every stage is the same four steps; the <span class=\"mono\">+</span> line is the extra setup it needs, and the links are what to read if you want more.")}
    <div class="strip">
      <div class="you"><span class="big">1</span><h3>Read the plan</h3>${you}<p><code>just next</code> prints what to build and which files to touch.</p></div>
      <div class="agent"><span class="big">2</span><h3>Build with your agent</h3>${agent}<p>A hook stops it editing files the plan doesn't list.</p></div>
      <div><span class="big">3</span><h3>Check</h3>${both}<p><code>just stage-check</code> runs the plan's checks.</p></div>
      <div class="you"><span class="big">4</span><h3>Compare</h3>${you}<p>Open the stage's pull request. How did yours differ? Behind? <code>just step N</code> catches you up.</p></div>
    </div>
    <div class="parts">${parts}
    </div>
    <div class="sub">
      <h3>The worked ticket: resolve a comment thread into a decision (GH-12, cp-05)</h3>
      <p>In a plan, someone opens a thread on a block: “should retries live in the client or the wrapper?” People and the agent reply. Without this ticket, the thread just stops. With it, the thread ends in a decision: who decided, when, what was chosen and which block it changed, and that decision stays attached to the block as the plan keeps changing.</p>
      <div class="grid c4">
        <div class="item key"><span class="n">Domain</span><p><code>ResolveThread</code> records <code>ThreadResolved</code> and <code>DecisionRecorded</code>; the decision log updates. Rules: a decision names exactly one thread and one block, and a thread can't be resolved twice. The expect test reads as a story.</p></div>
        <div class="item key"><span class="n">UI</span><p>A resolve action on the thread, a one-line “what was decided” field, and the decision in the log. One browser journey: open a plan, comment, resolve, see the decision.</p></div>
        <div class="item you-line"><span class="n">The trap</span><p>A first pass that names the event <code>ThreadClosed</code> passes every test and breaks the vocabulary. <code>just review</code>, with the vocabulary in context, is what catches it: correct code that is wrong.</p></div>
        <div class="item key"><span class="n">Done means</span><p>Expect and e2e green, the vocabulary updated, the PR opened with the agent's walkthrough and the release checklist, the feature behind a flag that starts off.</p></div>
      </div>
      <p class="note">The modelling question to explore before you build: one event (<code>ThreadResolved</code> carrying the decision) or two (<code>ThreadResolved</code> then <code>DecisionRecorded</code>, so a thread can close without one)? Try both, compare the streams, then pick. Greenhouse went with two.</p>
    </div>
  </section>

  ${sec("skills", "10", "Skills, hooks, connectors", "What the agent knows, can't skip, and can reach", "Skills tell the agent how to think, hooks make sure it does, and connectors give it somewhere to look. Claude Code and pi load the same set from <code>skills/</code>.")}
    <div class="sub">
      <h3>Skills: you just ask</h3>
      <p class="small">A skill is a folder of instructions the agent loads when your request matches. You don't call one. A skill nobody triggers is a document nobody reads, so each says when it fires.</p>
      <div class="grid c3">${skillExamples}
      </div>
      ${table(["Skill", "From", "Guards", "Fires when"], [
        ["event-sourcing", "this repo", "Commands validate, events are facts, projections are pure, every rule has an expect test; the event-versioning ladder", "anything under <code>packages/domain</code>"],
        ["ddd-vocabulary", "this repo", "New nouns go in the vocabulary and a schema before code", "a new type, table, event, route or UI label"],
        ["create-plan", "this repo", "Plans as pages: decisions as reports you click, UI as real components, code only as contracts", "“plan this”, any change over one phase"],
        ["viz-explainer", "this repo", "Explain with a small interactive diagram, never a wall of Markdown", "architecture, lifecycles, decisions, what the agent did"],
        ["scaffold", "this repo", "Two Workers, health before login, every runnable thing a recipe, flags default off, migrations by hand", "a new package, Worker, route, recipe or deploy change"],
        ["agent-ready", "this repo", "Can an agent clone, run, seed, sign in and browse this alone?", "setup, and on every session start"],
        ["slop-guard", "this repo", "Prose slop in docs, PR bodies and UI copy, scored 0–100", "any prose over a paragraph"],
        ["accident-or-essence", "this repo", "Marks your last ten prompts accident or essence", "the No Silver Bullet exercise"],
        ["impeccable", ext("pbakaus/impeccable", "https://github.com/pbakaus/impeccable"), "UI craft: hierarchy, spacing, type, the AI-generated look", "any change to the web app"],
        ["animate, review-animations, emil-design-eng, …", ext("emilkowalski/skills", "https://github.com/emilkowalski/skills"), "Motion and component choices that feel right, not merely present", "a transition, dialog or toast"],
        ["cloudflare, wrangler, durable-objects, …", ext("cloudflare/skills", "https://github.com/cloudflare/skills"), "Read the platform's docs before touching config; never guess a limit or a price", "any Worker, binding or deploy change"],
        ["agentation", ext("benjitaylor/agentation", "https://github.com/benjitaylor/agentation"), "Turns your on-page notes into fixes, found by selector", "an annotation arrives"],
      ], "min")}
      <p class="note">Third-party skills are pinned to a commit in <code>skills/manifest.json</code>, so an update upstream can't change behaviour the morning you need it.</p>
    </div>
    <div class="sub">
      <h3>Hooks: some of them say no</h3>
      <p class="small">Skills are advice the agent may ignore. Hooks are scripts that run by themselves at a set moment.</p>
      <div class="grid c4">${hooks}
      </div>
    </div>
    <div class="sub">
      <h3>Planning as a boundary object</h3>
      <p>Maggie Appleton's ${ext("Planning with Agents", "https://maggieappleton.com/planning-agents")} names the problem: the agent writes about 4,500 words a minute and you read about 240, so the plan arrives as a wall of Markdown you skim and approve. Her remedy: a plan is “a weak resource for ad hoc activity”, not a contract, and it should be a boundary object that serves your way of seeing as well as the agent's. “The agent can and should do 1000x more work to make the human more effective.”</p>
      ${table(["In the repo", "What the agent produces", "Instead of"], [
        ["create-plan · <code>just plan FILE \"why\"</code>", "A plan page: phases, the files each touches, its checks, and every open decision as a report you click.", "A multiple-choice interview nobody finishes"],
        ["viz-explainer decision report", "The options side by side: what each touches, what it risks, the resulting event streams.", "“Option A, B or C?” in prose"],
        ["viz-explainer state explorer", "A stream's states and transitions as a diagram you click through, so a missing transition shows.", "Reading a reducer to find the gap"],
        ["<code>just plan-history</code> · <code>plan-diff</code>", "Every version of a plan: who changed it, through which agent, and why.", "A plan nobody remembers agreeing to"],
      ], "min")}
      <p class="note">Rules worth stealing: never ask in prose what could be a rendered choice; never present an option nobody has tried; every decision carries who and when; plans orient, they don't bind; the agent, not you, pays the cost of being understood.</p>
    </div>
    <div class="sub">
      <h3>Connectors the agent reaches for</h3>
      ${table(["Tool", "What it is", "Use it for"], [
        [ext("DeepWiki MCP", "https://deepwiki.com"), "Answers questions about any public GitHub repo from its source, with citations. Configured in <code>.mcp.json</code>.", "“How does pi-durable resume a tool call?” answered from the code, not memory."],
        [ext("Agentation", "https://github.com/benjitaylor/agentation"), "Click an element, add a note, copy structured Markdown with selectors. Shows in dev; also an MCP.", "Show-me review: point at the wrong padding instead of describing it."],
        [ext("Claude in Chrome", "https://claude.com/chrome"), "Lets the agent drive your real Chrome, with your sign-ins.", "Dogfooding from the agent's side: open the deployed app, use it, report what it saw."],
        [ext("Mobbin", "https://mobbin.com"), "A library of real app screens and flows.", "“How do three shipped apps let you resolve a thread?” Inspiration from products, not model priors."],
      ], "min")}
    </div>
  </section>

  ${sec("harness", "11", "Under the hood", "How a coding harness works", "Most of what feels like magic is a few lines of plumbing. A harness assembles context, asks a model, runs whatever tool call comes back, and feeds the result in again until the model stops asking.")}
    <div class="grid">
      <pre><span class="c">// the whole loop</span>
context = system prompt + CLAUDE.md + skills + conversation + tool results
loop:
  reply = model(context, tools)
  if reply has no tool call: break
  result = execute(reply.tool_call)   <span class="c">// shell, read, write, browser…</span>
  context += reply + result           <span class="c">// this is where context grows</span>

<span class="c">you decide: which tools exist, what needs approval, what gets compacted,</span>
<span class="c">            what persists between sessions, who else can see the thread</span></pre>
      <div class="grid">
        <div class="item key"><h4>Context assembly</h4><p>Everything the agent “knows” was put there by the harness. Skills are just files added on demand, which is why a good CLAUDE.md and skills matter so much.</p></div>
        <div class="item key"><h4>Tools and permissions</h4><p>The model only asks; the harness executes. The trust ladder is literally a permission table.</p></div>
        <div class="item key"><h4>Durability</h4><p>Two different things share the word: a transcript you can reopen, and a run that survives being killed mid tool call. See below.</p></div>
        <div class="item key"><h4>Legibility</h4><p>Every turn, call and result is a record. A harness that keeps them can be audited and replayed, the same idea as the event log.</p></div>
      </div>
    </div>
    <div class="sub">
      <h3>Context economics: tokens, caching, compaction</h3>
      <p>The model remembers nothing between requests, so every turn resends the whole conversation, and cost grows with the square of session length unless the harness is careful. Three mechanisms keep it survivable, all decided by the harness, not the model.</p>
      <pre><span class="c">// one request, stable parts first, volatile last</span>
[ system prompt + tool definitions ]   changes when: the tool set changes, an upgrade
[ CLAUDE.md · memory · rules       ]   changes when: session start, /clear, /compact
[ conversation · tool results      ]   changes when: every turn (appended at the end)

<span class="c">// the cache matches the PREFIX exactly: change byte 1 and everything after is recomputed</span>
turn n:  [sys][ctx][msg1 … msg n-1] ← read from cache   [msg n] ← processed
/model:  [sys][ctx][msg1 … msg n  ] ← all recomputed: each model has its own cache</pre>
      <div class="grid c3">
        <div class="item"><h4>Caching</h4><p>Cached tokens bill at a fraction of the input rate. The cache lives for minutes of inactivity, so the first turn back after a break is slow: the prefix expired.</p></div>
        <div class="item"><h4>What breaks it</h4><p>Switching model, changing effort on most models, toggling fast mode, changing the loaded tool set, compaction (by design), upgrading. Pick model and effort at the start and leave them.</p></div>
        <div class="item"><h4>What keeps it</h4><p>Editing files and invoking skills (both appended), changing permission mode, <code>/rewind</code>, spawning a subagent (its own cache). An edited CLAUDE.md loads on the next <code>/clear</code>, <code>/compact</code> or restart.</p></div>
        <div class="item"><h4>Compaction</h4><p>Swaps history for a summary, then reloads CLAUDE.md, memory, recent files and invoked skills. Run <code>/compact</code> between tasks, not mid-task; after a long break it's the most expensive command you have.</p></div>
        <div class="item"><h4>Token diet</h4><p>Tool output is tokens: a test run that prints 400 lines on success taxes every later turn. Send research to DeepWiki or a throwaway session and bring back a paragraph.</p></div>
        <div class="item"><h4>Where to look</h4><p><code>/context</code> shows what's in the window; <code>/usage</code> shows the cache hit ratio. A status line can show cache reads against cache writes live: reads high, writes low means it's working.</p></div>
      </div>
      <div class="pair">
        <div><h4>Rules for your sessions</h4><p>Model and effort chosen before the first prompt. CLAUDE.md short and stable; the detail in skills. Recipes quiet on success. Snapshots short, because they get read back into context. Reviews in their own session.</p></div>
        <div><h4>Rules for your own harness</h4><p>Order the prompt stable to volatile and cache after the stable part. Never rewrite history; append. Compact by summarising into a new entry and keep the old ones. What one session learned goes into a file the next one loads.</p></div>
      </div>
    </div>
    <div class="sub">
      <h3>Two kinds of durability</h3>
      <p>Claude Code gives you a resumable conversation; pi-durable gives you a resumable run. On your laptop the first is usually enough. For an agent that runs unattended in the cloud, the second is the point.</p>
      ${table(["", "pi (vanilla)", "Claude Code", "pi-durable"], [
        ["Transcript", "Session file on disk, reopen later", "Saved continuously; <code>--continue</code>, <code>--resume</code>, <code>/branch</code>, <code>--fork-session</code>", "Committed entries in a store: SQLite, JSONL or memory"],
        ["Killed mid tool call", "Tool result lost; you re-prompt", "The call is marked cut off; the model checks whether it took effect before rerunning", "Resumes from the last checkpoint. Tools marked <code>replay: \"safe\"</code> rerun; others are reported as interrupted"],
        ["Same prompt twice", "Runs twice", "Runs twice", "A reused <code>requestId</code> returns the existing answer"],
        ["Second device", "No", "Remote Control attaches a phone or browser to a running session", "<code>viewState</code>: a live view of entries, running tools and queued inputs"],
        ["Message while busy", "Queued", "Queued as the next turn", "A follow-up, or <code>whenBusy: \"steer\"</code> to join at the next tool round"],
        ["What doesn't survive", "Anything in flight", "Background subagents and shells end with the process", "Nothing is exactly-once. One process must own each store"],
      ], "min")}
    </div>
    <div class="sub">
      <h3>pi-durable, picked apart</h3>
      <div class="grid">
        <pre><span class="c">// tools.ts — slow, and safe to replay after a crash (trimmed)</span>
export const serviceStatus = defineTool({
  name: "service_status",
  parameters: Type.Object({}),
  replay: "safe",
  execute: async (_args, api, context) => {
    <span class="c">// waits 8 s, one second at a time, honouring context.abortSignal</span>
    return { checkout: "degraded" };
  },
});

<span class="c">// demo.ts — open the store, resume, submit (trimmed)</span>
const storage = await openStorage();          <span class="c">// one SQLite file, one owner</span>
const harness = await Harness.open(storage, { models, registry }, context);
const root = await harness.root(context, { agent: { model, instructions } });
harness.resume();                             <span class="c">// continue what was mid-flight</span>
await root.submit(
  { type: "input", content: QUESTION, requestId: REQUEST_ID },  <span class="c">// same id = same answer</span>
  context,
);</pre>
        <div class="stack">
          <div class="item key"><h4>Try the kill</h4><p>Run <code>just agent-demo</code>. When the tool starts, <code>kill -9</code> it and run it again: same request id, it resumes from the checkpoint, reruns the tool whose result never landed, and answers. Run it a third time and the saved answer comes back with no tool call. <code>just agent-watch</code> in a second terminal prints each entry as it's committed; <code>just agent-reset</code> starts over.</p></div>
          <div class="item key"><h4>What's committed</h4><p>Entries, in order: the submission, each model turn, each tool round and its result. A crash between tool start and result leaves the result uncommitted, so recovery restarts the tool rather than guessing.</p></div>
          <div class="item key"><h4>Multiplayer for free</h4><p>A terminal and a web page both subscribed to <code>viewState</code> of one root: type in one, watch the other. That's how Greenhouse sessions work: one agent, one run at a time, many people watching and steering.</p></div>
          <p class="file">The repo's version: packages/agent (README, src/demo.ts, src/tools.ts)</p>
        </div>
      </div>
    </div>
    <div class="sub">
      <h3>Build your own, one rung at a time</h3>
      <div class="strip c5">
        <div><span class="big">1</span><h4>Single-player, local</h4><p>Vanilla pi against the repo. Watch the loop in the logs: context in, tool call out, result back.</p></div>
        <div><span class="big">2</span><h4>Skills and recipes as tools</h4><p>Add files to context and watch behaviour change. That's the whole skills story in one diff.</p></div>
        <div class="agent"><span class="big">3</span><h4>Make it durable</h4><p>pi-durable with a SQLite store; kill it mid tool call; add a second client on <code>viewState</code>. The repo has this.</p></div>
        <div><span class="big">4</span><h4>Put it in the cloud</h4><p>A Durable Object per session as the store (it already has SQLite and one owner); a sandbox runs the repo and <code>just</code>.</p></div>
        <div><span class="big">5</span><h4>Trigger it from a webhook</h4><p>A PR opened starts a review session: sandbox, agent, webhook, legible end to end.</p></div>
      </div>
      <p class="note">Prior art: ${ext("disler/durable-pi", "https://github.com/disler/durable-pi")} builds the multi-device network (a backend per device, a hub, a web client and a TUI on the same frames, fork at any entry, jobs that pause for approval).</p>
    </div>
  </section>

  ${sec("release", "12", "Workflow and release", "From merge-ready to released", "A green PR is the middle of the job, not the end. The same nine steps for every change, then three questions before anything reaches people. Both live in the repo: <code>docs/WORKFLOW.md</code> and <code>docs/RELEASE.md</code>.")}
    <div class="strip c5">
      <div class="you"><span class="big">1</span><h4>Interview</h4>${you}<p>Talk to whoever asked, or would. Write the feature, not the ask.</p></div>
      <div class="you"><span class="big">2</span><h4>Name it</h4>${you}<p>New nouns in the vocabulary and schema first. No type, stop here.</p></div>
      <div class="you"><span class="big">3</span><h4>Estimate</h4>${you}<p>The coding sixth is the agent's; budget the other five for yourself.</p></div>
      <div><span class="big">4</span><h4>Plan</h4>${both}<p>A page you look at, decisions you click. <code>/create_plan</code>.</p></div>
      <div class="agent"><span class="big">5</span><h4>Build</h4>${agent}<p>Shape first, domain with its stories, then the screen and its test.</p></div>
      <div class="you"><span class="big">6</span><h4>Dogfood</h4>${you}<p>Use it on real data. Tests prove it works; only you know if it feels right.</p></div>
      <div><span class="big">7</span><h4>Review, inverted</h4>${both}<p>A different model, vocabulary first. <code>just review main</code>.</p></div>
      <div class="you"><span class="big">8</span><h4>Release, staged</h4>${you}<p>Off, you, a few, everyone, with the way back written down.</p></div>
      <div><span class="big">9</span><h4>Feed it back</h4>${both}<p>What the release taught goes in <code>docs/decisions/</code> and the skill that would have caught it.</p></div>
    </div>
    <div class="grid c3">
      <div class="sub"><h3>1 · Is it right?</h3><ul class="boxes">
        <li><span><b>The user's sentence.</b> One line, in their words, of what's now possible. Can't write it? You built an ask.</span></li>
        <li><span><b>You used it today</b>, on real data: <code>just up</code>, then the flow in <code>docs/TESTING.md</code>.</span></li>
        <li><span><b>One signal</b> says it's used: the event to count, and the number you expect in a week.</span></li>
        <li><span><b>Vocabulary intact.</b> No new noun in code that's missing from the vocabulary and the UI copy.</span></li>
      </ul></div>
      <div class="sub"><h3>2 · Can you watch it?</h3>
        <pre>GH_REMOTE=1 just flag off NAME          <span class="c"># how it ships</span>
GH_REMOTE=1 just flag user NAME you     <span class="c"># you first</span>
GH_REMOTE=1 just flag user NAME them    <span class="c"># people you interviewed</span>
GH_REMOTE=1 just flag pct NAME 5        <span class="c"># 25, then on</span></pre>
        <ul class="boxes">
          <li><span><b>A watch window</b> at each step: errors and the signal, for a day.</span></li>
          <li><span><b>Migrations only add</b>, ship before the code that needs them, applied by hand. Drops and renames wait a release.</span></li>
        </ul></div>
      <div class="sub"><h3>3 · Can you undo it?</h3>
        ${table(["When", "Do"], [
          ["The feature is wrong", "<code>GH_REMOTE=1 just flag off NAME</code>: seconds, no deploy"],
          ["The code is broken", "<code>just rollback api &lt;version-id&gt;</code> (and <code>web</code>); <code>/healthz</code> shows the live version"],
        ])}
        <ul class="boxes">
          <li><span><b>Written in the PR</b> before you ship, not improvised.</span></li>
          <li><span><b>Events are never deleted.</b> A bad projection is rebuilt; a bad command is answered with a new event.</span></li>
          <li><span><b>A note in <code>docs/decisions/</code></b> before the retry.</span></li>
        </ul></div>
    </div>
  </section>

  ${sec("live", "13", "Changing what people already use", "The four questions a live product asks", "Everything before this assumed a clean slate. Real products have users mid-task, data in old shapes and opinions about your changes. These are four things the agent gets wrong unless the basics are in place first.")}
    <div class="sub">
      <h3>1 · Changing events people already recorded</h3>
      <p>The log is a record of facts, and you don't change the past. An event-sourced product evolves by changing how events are read, not what was written. Tell the agent to climb this ladder from the bottom.</p>
      <div class="ladder">
        <div><span class="n">0</span><b>Avoid it</b><p>Keep streams short-lived where you can. A thread opens and resolves within days; frequent event changes usually mean the model, not the schema, is wrong.</p></div>
        <div><span class="n">1</span><b>Simple mapping</b><p>New optional fields are nullable, new required ones get defaults, a renamed field keeps its old JSON name. No code beyond the schema.</p></div>
        <div><span class="n">2</span><b>Upcast on read</b><p>A small function between the store and the domain turns an old event into the new shape. Greenhouse does this for <code>DecisionRecorded</code>: v1 has no rationale, so it's read with the last reply as one. See <code>packages/domain/src/upcast</code>, tested against a real v1 stream.</p></div>
        <div><span class="n">3</span><b>New event type</b><p>When the meaning changed, not the shape, it's a new fact with a new name. Old projections keep working; new ones handle both.</p></div>
        <div><span class="n">4</span><b>Transform or migrate</b><p>Rewrite a stream into a new one as a one-off job that itself emits events. Last resort, in two phases: ship code that reads both, migrate, remove the old path.</p></div>
      </div>
      <p class="note">Why it matters: asked to “add a rationale to decisions”, an agent will happily edit the event schema in place and break every replay of every plan. The event-sourcing skill spells out the ladder (skills/event-sourcing/references/changing-events.md) and makes the expect tests the gate.</p>
    </div>
    <div class="grid c3">
      <div class="sub">
        <h3>2 · Flags: behaviour, not code</h3>
        <p><b>Versions</b> decide which code runs; <b>flags</b> decide which behaviour runs inside one version. Roll back a version when the code is broken; flip a flag when the feature is wrong.</p>
        <ul>
          <li>Every new command ships behind a flag, default off</li>
          <li>The check lives in one place, the command handler, never sprinkled through the UI</li>
          <li>A flag older than two releases is debt: remove it</li>
        </ul>
        <p class="note">Greenhouse keeps flags in a D1 table behind <code>just flag</code>. If you outgrow that, code against ${ext("OpenFeature", "https://openfeature.dev")} so the provider is swappable.</p>
      </div>
      <div class="sub">
        <h3>3 · Rollouts you can watch</h3>
        <div class="ladder tight">
          <div><span class="n">a</span><b>You</b><p>On for your account in prod. Run the journey. Dogfood for a day.</p></div>
          <div><span class="n">b</span><b>A named slice</b><p>The people who asked, or who you interviewed. Tell them it's on.</p></div>
          <div><span class="n">c</span><b>A percentage</b><p>5, 25, 100, with a watch window on errors and the signal.</p></div>
          <div><span class="n">d</span><b>The code</b><p>Separately, ${ext("gradual deployments", "https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/")} move a Worker version from 1% to 100%.</p></div>
          <div><span class="n">e</span><b>Data last</b><p>Additive migrations before the code; drops and renames a release after.</p></div>
        </div>
      </div>
      <div class="sub">
        <h3>4 · Bugs the agent can reproduce</h3>
        <p>A bug report is a repro you didn't have to write. Design it to carry enough for the agent to reproduce without a call.</p>
        <ul>
          <li><b>One button</b>, always visible. The user types a sentence; the system attaches the session, the plan and block, the last few events, console errors, a screenshot</li>
          <li><b>The agent</b> rebuilds what the user saw from the stream (<code>just replay</code>), writes the failing expect test first, then the fix</li>
          <li><b>Off the shelf</b> is fine: ${ext("Sentry User Feedback", "https://docs.sentry.io/product/user-feedback/")}, ${ext("PostHog replay", "https://posthog.com/session-replay")}, ${ext("Jam", "https://jam.dev")}. What matters is that the report arrives with context</li>
          <li><b>Design feedback</b> goes through Agentation instead: the note arrives with the selector</li>
          <li><b>Close the loop</b>: reply with what changed. Users who see their bug fixed send the next one</li>
        </ul>
      </div>
    </div>
  </section>

  ${sec("gardener", "14", "Close", "You are the gardener", "The agent grows the code. The basics are how you shape what grows: the soil it runs in, the trellis of types and tests, the names on the labels. None of that is new. What's new is that growing is no longer the bottleneck, so the shaping is the job.")}
    <div class="sub">
      <h3>Exercise: estimate a small app</h3>
      <p class="small">Pick a small app that does one thing with AI: a note-taker that tags entries, a form that summarises uploads. Alone or with a friend:</p>
      <div class="strip">
        <div class="you"><span class="big">1</span><h4>Write the feature</h4><p>Not the ask: who is better off, and how would you know?</p></div>
        <div><span class="big">2</span><h4>Estimate with the fractions</h4><p>Put coding at one sixth. What do the other five sixths contain?</p></div>
        <div><span class="big">3</span><h4>Mark each piece</h4><p>${you} or ${agent}. Notice which pile the essence lands in.</p></div>
        <div class="agent"><span class="big">4</span><h4>Name the first test</h4><p>The one the agent needs to verify its own work without you.</p></div>
      </div>
      <p class="note">Then ask your agent to run the accident-or-essence skill on your last ten prompts. How many were essence?</p>
    </div>
  </section>

  ${sec("reference", "15", "Reference", "Words, places, reading", "")}
    <div class="grid">
      ${table(["Word", "Means"], WORDS.map(([k, v]) => [esc(k), v]))}
      ${table(["In the repo", "For"], REPO.map(([k, v]) => [`<code>${esc(k)}</code>`, v]))}
    </div>
    <div class="sub">
      <h3>Reading</h3>
      ${table(["Topic", "Sources"], reading)}
    </div>
  </section>
</main>
<footer><div class="wrapx">
  <span class="mono">Shipping reliable products · GrowthX AI coding session</span>
  <p class="small">Greenhouse's code, plans and skills are in the repo you cloned; this page is the map.</p>
</div></footer>
<script>${TABS_JS}</script>
</body>
</html>`;
}
