# anime.js recipes (animejs@4.5.0)

Only three things animate in a viz-explainer, all of them state changes: which step is current, which nodes are in focus, and an edge being drawn in the order it happens. Everything else is a CSS class toggle. If you want a fourth animation, load the `animate` skill and let it say no.

UMD global on cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/animejs/4.5.0/anime.umd.min.js` exposes `anime.animate`, `anime.createTimeline`, `anime.stagger`, `anime.utils`, `anime.svg`.

## Reduced motion

```js
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const D = reduced ? 0 : 1;   // multiply every duration by D
```

With `D = 0` every step applies instantly. The artifact must read correctly that way; motion is never the only cue.

## Focus a set of nodes

```js
function focus(svg, ids) {
  const all = svg.querySelectorAll('.pele-node, .pele-cluster');
  const on = ids.map(id => svg.querySelector(`[data-id="${id}"]`)).filter(Boolean);
  anime.animate(all, { opacity: ids.length ? 0.35 : 1, duration: 180 * D, ease: 'outQuad' });
  anime.animate(on,  { opacity: 1, duration: 180 * D, ease: 'outQuad' });
  on.forEach(el => el.classList.add('is-focus'));
}
```

`is-focus` is a CSS class in the template that thickens the stroke with `--pele-accent`. Opacity is animated because it is composite-only; stroke changes are left to CSS so they are instant.

## Draw an edge in order

```js
function drawEdge(svg, edgeId, delay = 0) {
  const path = svg.querySelector(`.pele-edge[data-id="${edgeId}"] path`);
  if (!path) return;
  const [drawable] = anime.svg.createDrawable(path);
  return anime.animate(drawable, { draw: ['0 0', '0 1'], duration: 420 * D, delay, ease: 'inOutQuad' });
}
```

## A step as a timeline

```js
function playStep(svg, step) {
  const tl = anime.createTimeline({ defaults: { ease: 'outQuad' } });
  focus(svg, step.focus ?? []);
  (step.edges ?? []).forEach((e, i) => tl.add(drawEdge(svg, e, i * 120 * D)));
  return tl;
}
```

Steps are interruptible: pressing next while a timeline runs calls `tl.complete()` before the next one starts. Never queue.

## What not to do

- No entrance animation for the diagram itself. It is there when the page opens.
- No looping or pulsing. A focused node is a stroke, not a heartbeat.
- No animating `stroke-width`, `fill` or layout properties; opacity and `draw` only.
- No scale from 0, no bounce, no spring on a diagram. Those are for things people touch.
