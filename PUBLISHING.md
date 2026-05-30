# Publishing Figseed to the Figma Community

This is the checklist and reference copy for submitting Figseed to the
Figma Community. Follow it top-to-bottom the first time, then use the
"Publish updates" section for subsequent releases.

> Sources: Figma's [Plugin Manifest](https://developers.figma.com/docs/plugins/manifest/),
> [Publishing](https://developers.figma.com/docs/plugins/publishing/), and
> [Plugin and widget review guidelines](https://help.figma.com/hc/en-us/articles/360039958914-Plugin-and-widget-review-guidelines).

## Pre-flight checklist

Run these before clicking Publish in Figma:

```bash
npm install
npm run typecheck
npm test
npm run build
```

Then in Figma desktop, import `manifest.json` and smoke-test:

- [ ] Empty file: paste `b0`, hit Generate. Three collections + two pages
      should appear.
- [ ] Re-run with a different code (e.g. `b3HGM2E529`). Same collections
      get updated in place — no duplicates, no renames.
- [ ] Run with garbage input (`zzz`, empty string). Friendly error in the
      status bar, no crash, no developer stack trace.
- [ ] Run **Plugins → Figseed → Shuffle a random preset** from the menu.
      It should auto-generate immediately.
- [ ] Confirm the plugin works in a file with multiple pages (dynamic-page
      compatibility).
- [ ] Confirm the plugin works while offline (it should — `networkAccess`
      is `["none"]`).

## Manifest

The current `manifest.json` is publish-ready except for the `id` field.
Figma assigns a real plugin ID the first time you publish. The flow is:

1. In Figma desktop, open Figseed (Plugins → Development → Figseed).
2. From the plugin menu in the bottom-left, choose **Publish new release**.
3. Figma generates a new `id` and writes it back into `manifest.json`.
4. Commit the updated `manifest.json` (the new ID is stable across
   updates).

Until then, the `id` value `figseed-shadcn-preset` is just a local
placeholder.

The manifest already declares the things review cares about:

- `documentAccess: "dynamic-page"` — required for new plugins.
- `networkAccess.allowedDomains: ["none"]` — explicitly offline; this is
  surfaced on the Community listing.
- `editorType: ["figma"]` — design files only (no FigJam/Slides/Buzz/Dev).
- `menu` — two clear commands: "Generate from preset…" and "Shuffle a
  random preset".

## Listing copy

Use this verbatim when filling out the Community listing modal.

### Plugin name

```
Figseed
```

### Tagline (under 80 chars)

```
Turn a shadcn/ui preset code into native Figma variables, components, and a design system.
```

### Description

```
Figseed turns a shadcn/ui preset code into a complete Figma design system in
seconds.

Build a preset at ui.shadcn.com/create, copy the short code (like b0 or
bAhk2P), paste it into Figseed, and hit Generate. Figseed creates:

• A Tailwind / Colors collection — the full Tailwind v4 OKLCH palette as
  native Figma variables.
• A Tailwind / Primitives collection — radius, spacing, and typography
  tokens.
• A shadcn / Theme collection — your preset's light theme plus matching
  dark-* twin variables, with theme colors aliased back to the Tailwind
  palette wherever they match.
• A Design System page — type, color, radius, and spacing tokens visualized
  and bound to the variables above.
• A Components page — shadcn primitives (buttons, inputs, cards, avatars,
  icons, and more) wired to the same variables.

Re-run with a different preset and Figseed updates everything in place — no
duplicate collections, no renamed variables, no broken bindings.

Privacy
Figseed is fully offline. The plugin's network access is set to "none" in
the manifest, so nothing about your file or the preset code you paste ever
leaves your machine. No analytics, no telemetry, no third-party services.

Pair it with shadcn/ui in code for a single source of truth between your
designs and your components.
```

### Tags

Pick up to 12 from Figma's tag list. Suggested:

```
design systems, tokens, variables, themes, color, typography, components, ui kit, tailwind, shadcn, automation, productivity
```

### Support contact

```
https://github.com/praveenjuge/figseed/issues
```

(Required by the review guidelines: "Established a way for users to contact
you for support.")

### Privacy policy

Because Figseed makes zero network calls and stores no user data, link to
the Privacy section in the README:

```
https://github.com/praveenjuge/figseed#privacy
```

If your account-level settings require a hosted privacy policy URL, host
the same content on a static page or GitHub Pages.

## Cover image and assets

Figma's listing accepts:

- **Cover image**: 1920×960 PNG/JPG/GIF — shown at the top of the listing.
- **Icon**: 128×128 PNG — shown in search and the plugin runner.
- **Carousel images** (optional but recommended): up to 12 PNG/JPG at
  1920×960.

The plugin icon is checked into the repo:

- `assets/icon.svg` — master vector source, edit this if you want to
  redesign the mark.
- `assets/icon.png` — 128×128, this is the file you upload to Figma.
- `assets/icon@512.png`, `assets/icon@1024.png` — high-res renders for
  README headers, press, or scaling into the cover image.

To regenerate the PNGs after editing the SVG:

```bash
node scripts/gen-plugin-icon.mjs
```

Suggested screenshots to capture:

1. The plugin UI with a preset typed in, just before Generate.
2. The generated Design System page (typography + color tokens visible).
3. The generated Components page (buttons, inputs, cards visible).
4. The Variables panel showing the three collections.
5. A side-by-side: paste a different preset → re-generate → everything
   updates in place.

Render screenshots at 2× and downscale to keep text crisp.

The icon assets live in `assets/`. For the cover image, drop other final
artwork (1920×960 carousel images, etc.) alongside them. Anything large or
not source-of-truth can be gitignored on a per-project basis later.

## Pre-submission review-guideline self-check

Mapped to Figma's [review guidelines](https://help.figma.com/hc/en-us/articles/360039958914-Plugin-and-widget-review-guidelines):

- **Completeness** — no temp content, no placeholder strings, no developer
  error messages surfaced to users (errors render in the status row in
  plain language).
- **Accurate description** — the listing above describes exactly what the
  plugin does. No hidden functionality.
- **Design** — the UI uses Figma's `--figma-color-*` tokens and Inter; it
  matches the host UI in light and dark.
- **Performance** — generation is bounded (single user-initiated run), no
  background work, no polling.
- **Offline behavior** — works fully offline; this is enforced by
  `networkAccess: ["none"]`.
- **Security & API usage** — only official `figma.*` APIs, no external
  packages required, no document mutation outside what the user asked for.
- **Trust** — variables are written under clearly-named collections
  (`Tailwind / *`, `shadcn / Theme`); pages are named `Design System` and
  `Components`. Re-running is idempotent.
- **Business sense** — public utility, not an internal-only tool, no
  ads, no monetization.

## Publish flow (first release)

1. Sign in to Figma desktop with the account that should own the listing.
2. Confirm two-factor authentication is enabled on the account (Figma
   requires it for publishing).
3. Run a final `npm run build` so `dist/code.js` and `dist/ui.html` are
   fresh.
4. **Plugins → Development → Import plugin from manifest…** → pick
   `manifest.json` from this repo.
5. Run the plugin once; verify it works against the smoke-test list above.
6. Open the plugin's three-dot menu in the dev runner →
   **Publish new release**.
7. Fill in name, tagline, description, tags, cover image, icon, and
   support contact using the copy in this file.
8. Submit. Figma will email a decision; allow several business days.
9. After approval, commit the auto-updated `manifest.json` (with the
   real `id`) and tag the release in git.

## Publishing updates

For every subsequent release:

1. Bump `package.json` version (semver).
2. Run `npm run typecheck && npm test && npm run build`.
3. Smoke-test in the dev runner.
4. **Plugins → Development → Figseed → Publish new release**.
5. Fill in a release-notes blurb describing what changed.
6. Commit and tag the release in git.

Material changes (new commands, new permissions, new network access)
trigger re-review per the guidelines. Cosmetic changes typically don't.
