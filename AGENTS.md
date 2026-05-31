# AGENTS.md

Figseed is a Figma plugin that turns a [shadcn/ui](https://ui.shadcn.com)
preset code into native Figma variables, styles, components, and app blocks.
It generates Tailwind colors, primitive tokens, a single-mode light/dark
shadcn theme, Tailwind typography text styles, shadow/blur effect styles, a
Design System page, a Components page, and a Blocks region on the Components
page.

## Agent startup

Start with these files before changing behavior:

1. `src/code.ts` - top-level generate flow and UI progress messages.
2. `src/generator/index.ts` - variable collections, text styles, effect
   styles, and font loading.
3. `src/designSystem/index.ts` - Design System page sections and layout.
4. `src/componentsPage/index.ts` - component section registry, deferred
   sections, and column layout.
5. `src/blocksPage/index.ts` - login, signup, and dashboard Blocks region
   appended to the Components page.

Recent product surface to preserve:

- The Components page has 58 shadcn-style sections, including charts, form,
  typography, data table, sidebar, icon-backed controls, and overlays.
- Blocks are not a separate page. They live as a region on the Components page
  to stay within Figma Starter/free page limits and reuse live component
  instances.
- The dashboard block should stay structurally close to shadcn's dashboard
  block patterns; avoid simplifying it into a static showcase.
- `manifest.json` already has the published numeric plugin id. Do not restore
  pre-submission publishing docs or placeholder-id instructions.

## Commands

```bash
npm install
npm run build      # one-shot esbuild -> dist/code.js + dist/ui.html
npm run watch      # rebuild on changes
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run test:coverage  # vitest run --coverage (enforces thresholds)
node scripts/extract-themes.mjs  # regenerate src/data/themes.json from shadcn-ui/
node scripts/gen-avatar-images.mjs  # regenerate src/data/avatars.ts (avatar photos)
node scripts/gen-icons.mjs  # regenerate src/data/icons.ts (shadcn icon-library subsets)
node scripts/gen-plugin-icon.mjs  # regenerate assets/icon.png + @512/@1024 from assets/icon.svg
```

After changes, run `npm run typecheck`, `npm test`, and `npm run build`. Tests
live in `test/` (Vitest), mirroring `src/`; the Figma plugin API is faked by
`test/figma-mock.ts` so the generator and page builders run under Node. There
is no linter. Load the plugin in Figma desktop via **Plugins → Development →
Import plugin from manifest…** and pick `manifest.json`.

### Test layers

- **Logic (most tests).** Import `src/*.ts` directly and assert against the
  in-memory `test/figma-mock.ts`. `test/generator/idempotency.test.ts` adds
  re-run / golden-tree coverage via `test/helpers/snapshot.ts`, which strips
  non-deterministic IDs so snapshots stay stable.
- **QuickJS sandbox (`test/quickjs/`).** Compiles `src/code.ts` with the
  production esbuild downlevel flags and runs the bundle inside a real QuickJS
  engine (`quickjs-emscripten`), driving a `generate` message end to end. This
  guards the ES2017 / QuickJS hard constraint — modern syntax or builtins that
  slip past the downlevel step fail here, not in Figma. The sandbox esbuild
  settings are shared via `scripts/esbuild-config.mjs` so the harness and the
  production build can't drift. `test/figma-mock.ts` must stay free of any
  `vitest` import (it is bundled into the VM); use its local `createSpy`.

## Layout

```
src/
  code.ts            # plugin sandbox entry (figma.* APIs, QuickJS)
  ui.ts / ui.html    # iframe UI
  messages.ts        # sandbox ↔ UI message contract
  preset.ts          # shadcn preset codec mirror (validate + decode)
  registry.ts        # local resolver, mirrors shadcn buildRegistryTheme
  fonts.ts           # loads preset body/heading fonts, applies + binds them
  colors/            # Tailwind table, OKLCH→sRGB, alias matcher
  primitives.ts      # radius/spacing/typography token tables
  effects.ts         # Tailwind shadow + blur effect token tables
  effectStyles.ts    # idempotent Figma effect styles (shadows, blur, backdrop)
  textStyles.ts      # idempotent Tailwind typography text styles
  tokenBindings.ts   # binds literal dimensions/effects/etc. back to variables
  generator/         # builds Figma collections, modes, variables
  designSystem/      # rebuilds the "Design System" page
  componentsPage/    # rebuilds the "Components" page (component registry)
  blocksPage/        # app blocks appended to Components (reuses components)
  data/themes.json   # snapshot of shadcn's apps/v4/registry/themes.ts
  data/avatars.ts    # base64 avatar photos (build-time fetch) for Avatar styles
  data/icons.ts      # shadcn icon-library subsets (build-time) for the Icons section
scripts/
  build.mjs          # esbuild runner
  extract-themes.mjs # regenerates src/data/themes.json from shadcn-ui/
  gen-avatar-images.mjs # regenerates src/data/avatars.ts from pravatar.cc
  gen-icons.mjs      # regenerates src/data/icons.ts from the icon-library packages
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
- **Generated pages are rebuilt, not patched.** `buildDesignSystem` and
  `buildComponentsPage` clear their owned page contents on each run. Keep page
  generation idempotent and deterministic so snapshots stay stable.
- **Blocks depend on Components.** Build or update reusable component sections
  before blocks that instance them. Blocks should bind text styles and token
  variables just like Design System and Components nodes.

## Conventions

- TypeScript strict mode with `noUncheckedIndexedAccess`. Handle `undefined`
  from index access explicitly.
- Keep sandbox (`code.ts` and its imports) free of DOM APIs; keep UI (`ui.ts`)
  free of `figma.*` APIs. They communicate only through `messages.ts`.
- Prefer editing the canonical builder for a surface instead of adding parallel
  paths. Component work usually belongs in `src/componentsPage/sections/*`;
  block work belongs in `src/blocksPage/blocks/*` plus shared helpers only
  when there is real reuse.
- When adding a component section, register it in `src/componentsPage/index.ts`
  and extend focused tests under `test/componentsPage/`.
- When adding a block, keep it in `src/blocksPage/blocks/`, reuse generated
  component instances where possible, and extend `test/blocksPage/`.
- If a change touches sandbox compatibility, run or update
  `test/quickjs/sandbox.test.ts`.
- `dist/` is build output, do not hand-edit.
- Conventional Commits for messages.
