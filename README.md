# Figseed

Generate a [shadcn/ui](https://ui.shadcn.com) design system inside Figma from a
preset code. Paste a code, hit Generate, and Figseed materializes Tailwind v4
colors, primitive tokens, and a light/dark theme as native Figma variables —
with theme colors aliased back to the Tailwind palette where possible.

> Status: 1.0 release candidate. See [PUBLISHING.md](./PUBLISHING.md) for the
> Figma Community submission checklist.

## Usage

1. Build a preset at <https://ui.shadcn.com/create> and copy its short code
   (e.g. `b0`, `bAhk2P`).
2. Open the plugin in Figma and run **Generate from preset…**, or pick one of
   the curated presets, or hit **Shuffle a random preset**.
3. Paste the code and hit **Generate**.

Figseed creates three variable collections — `Tailwind / Colors`,
`Tailwind / Primitives`, and `shadcn / Theme` (light values plus `dark-*`
twins) — plus a set of Figma effect styles for the Tailwind shadow and blur
scales (`Shadow/*`, `Inner Shadow/*`, `Blur/*`, `Backdrop Blur/*`). It then
rebuilds a `Design System` page and a `Components` page wired to those
variables and styles. Re-running with a different preset updates everything in
place.

## Privacy

Figseed runs fully offline. The manifest declares
`networkAccess.allowedDomains: ["none"]`, so the plugin cannot make network
requests. Nothing about your file, your selection, or the preset code you
paste leaves your machine. No analytics, no telemetry, no third-party
services.

The plugin only writes to the file you run it in: variables in the
`Tailwind / Colors`, `Tailwind / Primitives`, and `shadcn / Theme`
collections, shadow/blur effect styles, and nodes on the `Design System` and
`Components` pages.

## Support

- Found a bug or have a feature request? Open an issue at
  <https://github.com/praveenjuge/figseed/issues>.
- For everything else, ping the maintainer on the
  [GitHub repo](https://github.com/praveenjuge/figseed).

## Develop

```bash
npm install
npm run build       # → dist/code.js + dist/ui.html
npm run watch       # rebuild on changes
npm run typecheck
npm test
```

To load the plugin locally in Figma desktop:
**Plugins → Development → Import plugin from manifest…**, then pick
`manifest.json`.

See [AGENTS.md](./AGENTS.md) for project layout and conventions, and
[PUBLISHING.md](./PUBLISHING.md) for the Community submission flow.

## Roadmap

- [x] Variables
- [x] Components
- [x] Design System
- [x] Icons
- [x] Fonts
- [ ] Blocks
- [ ] Charts

## License

[MIT](./LICENSE)
