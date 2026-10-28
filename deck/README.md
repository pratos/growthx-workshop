# Shipping Reliable Products — deck

reveal.js (CDN) + markdown. `slides.md` is the source of truth.

- `---` new horizontal slide · `--` vertical /btw slide · `Note:` speaker notes (press `S`)
- memes: originals in `images/`, the 1-bit thermal-print plates the deck uses in `images/kot/` (each `.webp.json` holds the Codex prompt that made it); CSS in `theme.css`
- each slide is an order ticket: the header (order number, item) is built from a slide's `poster-label` or section `num` by the script in `index.html`, so keep writing those; they never render in place
- regenerate a plate: `echo "<prompt from its .json>" | codex exec --skip-git-repo-check -s workspace-write -i images/<original> -`, then `cwebp -resize 1400 0 -q 82`

Run locally (needs a server, `file://` won't fetch slides.md):

    python3 -m http.server 8765   # then open http://localhost:8765

Deploy (static, no build):

    npx wrangler pages deploy . --project-name growthx-reliable-products
