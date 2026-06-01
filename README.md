# Figseed

Figseed is a Figma plugin that turns a [shadcn/ui](https://ui.shadcn.com)
preset code into native Figma variables, styles, components, and app blocks.

Paste a preset code, generate once, and Figseed builds the design-system
surface around it:

- `Tailwind / Colors` with the Tailwind v4 OKLCH palette.
- `Tailwind / Primitives` with radius, spacing, typography, opacity, border,
  shadow, and blur tokens.
- `shadcn / Theme` with light values plus `dark-*` twin variables for Figma
  free-tier compatibility.
- Tailwind typography text styles and shadow, inner shadow, blur, and backdrop
  blur effect styles.
- A single `Figseed` page that hosts three regions: a Design System region for
  colors, type, spacing, radii, effects, opacity, border widths, and icons; a
  Components region with 58 shadcn-style sections (charts, forms, typography,
  data tables, sidebars, icon-backed controls, and common overlays); and a
  Blocks region with login, signup, and a shadcn-structured dashboard assembled
  from generated component instances.

Re-running with a different preset updates the same variables, styles, and
page in place.

## Usage

1. Build a preset at <https://ui.shadcn.com/create> and copy its code, such as
   `b0` or `bAhk2P`.
2. Run **Generate from preset...** in Figma, or use **Shuffle a random preset**.
3. Paste the code and generate.

## Privacy

Figseed runs offline. `manifest.json` declares
`networkAccess.allowedDomains: ["none"]`, so the plugin cannot make external
network requests. It does not use analytics, telemetry, CDNs, or third-party
services.

The plugin only writes to the file where you run it: the three variable
collections, generated text/effect styles, and the single `Figseed` page
(Design System, Components, and Blocks regions).

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

Useful scripts:

```bash
npm run watch
npm run test:coverage
node scripts/extract-themes.mjs
node scripts/gen-avatar-images.mjs
node scripts/gen-icons.mjs
node scripts/gen-plugin-icon.mjs
```

Load locally with **Plugins -> Development -> Import plugin from manifest...**
and select `manifest.json`.

See [AGENTS.md](./AGENTS.md) for architecture, commands, and constraints.

## Support

Open issues at <https://github.com/praveenjuge/figseed/issues>.

## License

[MIT](./LICENSE)
