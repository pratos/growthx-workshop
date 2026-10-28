# Shipping Reliable Products — deck

reveal.js (CDN) + markdown. `slides.md` is the source of truth.

- `---` new horizontal slide · `--` vertical /btw slide · `Note:` speaker notes (press `S`)
- memes live in `images/`; CSS in `theme.css`

Run locally (needs a server, `file://` won't fetch slides.md):

    python3 -m http.server 8765   # then open http://localhost:8765

Deploy (static, no build):

    npx wrangler pages deploy . --project-name growthx-reliable-products
