# AGENTS.md

Figseed is a Figma plugin that turns a [shadcn/ui](https://ui.shadcn.com)
preset code into native Figma variables (Tailwind colors, primitives, light/
dark theme) plus a generated Design System and Components page.

## Commands

```bash
npm install
npm run build      # one-shot esbuild → dist/code.js + dist/ui.html
npm run watch      # rebuild on changes
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run test:coverage  # vitest run --coverage (enforces thresholds)
node scripts/extract-themes.mjs  # regenerate src/data/themes.json from shadcn-ui/
```

After changes, run `npm run typecheck`, `npm test`, and `npm run build`. Tests
live in `test/` (Vitest), mirroring `src/`; the Figma plugin API is faked by
`test/figma-mock.ts` so the generator and page builders run under Node. There
is no linter. Load the plugin in Figma desktop via **Plugins → Development →
Import plugin from manifest…** and pick `manifest.json`.

## Layout

```
src/
  code.ts            # plugin sandbox entry (figma.* APIs, QuickJS)
  ui.ts / ui.html    # iframe UI
  messages.ts        # sandbox ↔ UI message contract
  preset.ts          # shadcn preset codec mirror (validate + decode)
  registry.ts        # local resolver, mirrors shadcn buildRegistryTheme
  colors/            # Tailwind table, OKLCH→sRGB, alias matcher
  primitives.ts      # radius/spacing/typography token tables
  generator/         # builds Figma collections, modes, variables
  designSystem/      # rebuilds the "Design System" page
  componentsPage/    # rebuilds the "Components" page (shadcn primitives)
  data/themes.json   # snapshot of shadcn's apps/v4/registry/themes.ts
scripts/
  build.mjs          # esbuild runner
  extract-themes.mjs # regenerates src/data/themes.json from shadcn-ui/
manifest.json        # Figma plugin manifest
shadcn-ui/           # local clone, git-ignored, reference only
```

## Hard constraints

- **Sandbox target is ES2017.** `src/code.ts` runs in Figma's QuickJS sandbox.
  `scripts/build.mjs` already disables optional chaining, nullish coalescing,
  and logical assignment via esbuild `supported`. Do not raise the target and
  do not assume modern syntax in sandbox code.
- **No network.** `manifest.json` sets `networkAccess.allowedDomains: ["none"]`
  and the iframe origin is `null`. Everything must work offline; do not add
  `fetch`, CDNs, or analytics.
- **Idempotent generation.** Re-running with a different preset must reuse
  existing collections/variables and update values in place. Don't create
  duplicate collections or rename existing variables.
- **Single-mode collections.** `shadcn / Theme` uses one mode with `dark-*`
  twin variables (Figma free tier is 1-mode only). Don't switch to multi-mode.
- **Alias-first colors.** Theme colors that match a Tailwind OKLCH shade must
  be written as variable aliases, not literal colors. Use the matcher in
  `src/colors/` rather than re-implementing the lookup.
- **Mirror shadcn behavior.** `preset.ts` and `registry.ts` mirror shadcn's
  `decodePreset` / `buildRegistryTheme` (chart-color overrides, menu-accent
  transform, radius override). Keep them in sync with `shadcn-ui/` when
  regenerating themes.

## Conventions

- TypeScript strict mode with `noUncheckedIndexedAccess`. Handle `undefined`
  from index access explicitly.
- Keep sandbox (`code.ts` and its imports) free of DOM APIs; keep UI (`ui.ts`)
  free of `figma.*` APIs. They communicate only through `messages.ts`.
- `dist/` is build output, do not hand-edit.
- Conventional Commits for messages.
