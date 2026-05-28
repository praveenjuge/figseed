# Figseed

Generate a [shadcn/ui](https://ui.shadcn.com) design system inside Figma from a
preset code. Paste a code, hit Generate, and Figseed materializes Tailwind v4
colors, primitive tokens, and a light/dark theme as native Figma variables —
with theme colors aliased back to the Tailwind palette where possible.

## Usage

1. Build a preset at <https://ui.shadcn.com/create> and copy its short code
   (e.g. `b0`, `bAhk2P`).
2. In Figma desktop: **Plugins → Development → Import plugin from manifest…**
   and pick `manifest.json` from this repo.
3. Run **Figseed**, paste the code, and hit Generate.

Figseed creates three variable collections — `Tailwind / Colors`,
`Tailwind / Primitives`, and `shadcn / Theme` (light values plus `dark-*`
twins) — then rebuilds a `Design System` page and a `Components` page wired to
those variables. Re-running with a different preset updates everything in
place.

The plugin runs fully offline. No network requests are made.

## Develop

```bash
npm install
npm run build       # → dist/code.js + dist/ui.html
npm run watch       # rebuild on changes
npm run typecheck
```

See [AGENTS.md](./AGENTS.md) for project layout and conventions.
