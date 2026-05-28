# Figseed

Generate a [shadcn/ui](https://ui.shadcn.com) design system inside Figma from a
preset code. Paste a code, hit Generate, and the plugin materializes Tailwind v4
colors, primitive tokens, and a light/dark theme — all as native Figma
variables, with theme colors aliased back to the Tailwind palette where
possible.

## How it works

1. The user builds a preset at <https://ui.shadcn.com/create> and copies its
   short code (e.g. `b0`, `bAhk2P`).
2. Figseed decodes the code locally — same bit-pack scheme as shadcn's
   `decodePreset` — and looks up the matching theme entry from a bundled JSON
   snapshot of `apps/v4/registry/themes.ts`. It then mirrors shadcn's
   `buildRegistryTheme` to apply chart-color overrides, the menu-accent
   transformation, and the radius override.
3. The plugin populates three Figma variable collections:

   | Collection              | Modes   | Contents                                                                                                                                                                                                                                                                                                                                                     |
   | ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | `Tailwind / Colors`     | Default | Every Tailwind family (red…rose + slate, gray, zinc, neutral, stone, mauve, olive, mist, taupe) at 50–950 plus `black`, `white`, `transparent`.                                                                                                                                                                                                              |
   | `Tailwind / Primitives` | Default | radius, border-width, opacity, blur, skew, breakpoint, container, spacing, font sizes, font families, font weights, tracking, leading, font styles.                                                                                                                                                                                                          |
   | `shadcn / Theme`        | Default | Light values under their plain name (`background`, `primary`, `chart-1`…) and dark values under `dark-<name>` (`dark-background`, `dark-primary`…), plus `radius` / `dark-radius`. Designers swap themes by binding to the `dark-*` variants — keeping the collection on a single mode so it works on the free Figma tier where collections are 1-mode only. |

4. Theme color values are matched against the Tailwind OKLCH table (using the
   same normalization shadcn uses). When a value matches a Tailwind shade,
   Figseed creates a variable alias instead of a literal color — so updating
   `red/600` once cascades through every theme variable that references it.

The plugin is **idempotent**: re-running with a different preset reuses the
existing collections and updates values in place. It runs **fully offline** —
no network requests are made (Figma plugin iframes have a `null` origin and
ui.shadcn.com doesn't send `Access-Control-Allow-Origin`, so a direct fetch
would be blocked anyway).

## Development

```bash
npm install
npm run build       # one-shot build → dist/code.js + dist/ui.html
npm run watch       # rebuild on changes
npm run typecheck   # tsc --noEmit
```

In Figma desktop: **Plugins → Development → Import plugin from manifest…** and
pick `manifest.json` from this repo.

## Project layout

```
src/
  code.ts        # plugin sandbox entry (figma.* APIs)
  ui.ts          # iframe UI (input box + status)
  ui.html        # iframe shell, picks up Figma theme colors
  messages.ts    # message contract between sandbox and UI
  registry.ts    # local resolver (mirrors shadcn buildRegistryTheme)
  preset.ts      # mirror of shadcn's preset codec (validate + decode)
  colors.ts      # Tailwind color table, OKLCH→sRGB, alias matcher
  primitives.ts  # radius/spacing/typography token tables
  generator.ts   # builds Figma collections, modes, and variables
  data/themes.json   # snapshot of shadcn's apps/v4/registry/themes.ts
manifest.json    # Figma plugin manifest
scripts/
  build.mjs          # esbuild runner (sandbox bundle is es2017 for QuickJS)
  extract-themes.mjs # one-off: regenerates src/data/themes.json
```

`shadcn-ui/` is a clone of <https://github.com/shadcn-ui/ui> kept locally for
reference and is git-ignored.

## Roadmap

- Apply the generated theme variables to a starter component sheet (buttons,
  cards, inputs) so designers immediately see the system in action.
- Optional: emit the matching DTCG `Default.tokens.json` for round-tripping
  with Tokens Studio / Variables2CSS workflows.
- Refresh `src/data/themes.json` when shadcn ships new themes
  (`node scripts/extract-themes.mjs` from this repo while `shadcn-ui/` is the
  upstream clone).
