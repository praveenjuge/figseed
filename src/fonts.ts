// Shared font handling for the page builders.
//
// shadcn presets carry two fonts — a body font (`--font-sans`) and a heading
// font (`--font-heading`, which falls back to the body font when left as
// "inherit"). The generator writes both as STRING variables in the
// `shadcn / Theme` collection (see generator/theme.ts). This module loads those
// families in Figma and applies them to text nodes, binding each node's
// `fontFamily` to the matching variable so the page stays linked to the preset.
//
// Sandbox-safe: only touches `figma.*` (no DOM, no network) and stays within
// the ES2017 target. State is a single module-level "active" context set at the
// start of each page build, so section builders don't have to thread it around.

import type { ThemeFontVars } from "./generator";

export type FontRole = "body" | "heading";

// Weights we try to load for every family so weight-aware text (the typography
// showcase) renders real glyphs instead of synthetic faux-bolding. Loads are
// best-effort: a family that lacks a weight just isn't recorded, and pickFont
// falls back.
const FONT_STYLES = [
  "Thin",
  "Extra Light",
  "Light",
  "Regular",
  "Medium",
  "Semi Bold",
  "Bold",
  "Extra Bold",
  "Black",
] as const;

// Inter ships with Figma, so it is always a safe fallback.
const FALLBACK_FAMILY = "Inter";

function styleKey(family: string, style: string): string {
  return family + "\u0000" + style;
}

export type FontContext = {
  body: string;
  heading: string;
  bodyVar: Variable | undefined;
  headingVar: Variable | undefined;
  // Set of "family\u0000style" pairs that actually loaded on this host.
  loaded: Set<string>;
};

let active: FontContext | null = null;

export function setActiveFonts(context: FontContext): void {
  active = context;
}

// Test/Figma-host hook: clear the active context (used so unit tests don't leak
// a context between page builds).
export function resetActiveFonts(): void {
  active = null;
}

export type LoadFontsOptions = {
  body: string;
  heading: string;
  fontVars?: ThemeFontVars;
};

// Load every weight of the given families, returning the set of
// "family\u0000style" pairs that actually loaded on this host. Loads are
// best-effort: a missing family/weight is simply absent from the result.
export async function loadFontFamilies(
  families: string[],
): Promise<Set<string>> {
  const loaded = new Set<string>();

  const unique: string[] = [];
  for (const family of families) {
    if (family && unique.indexOf(family) === -1) unique.push(family);
  }

  const attempts: Promise<void>[] = [];
  for (const family of unique) {
    for (const style of FONT_STYLES) {
      attempts.push(
        figma.loadFontAsync({ family, style }).then(
          function () {
            loaded.add(styleKey(family, style));
          },
          function () {
            // Family/weight unavailable on this host — skip; pickFont falls back.
          },
        ),
      );
    }
  }
  await Promise.all(attempts);
  return loaded;
}

// Load the preset fonts (plus the Inter fallback) across all weights and make
// the resulting context active. Returns the context so callers can hold onto it
// if they want to pass it explicitly.
export async function loadPresetFonts(
  options: LoadFontsOptions,
): Promise<FontContext> {
  const loaded = await loadFontFamilies([
    options.body,
    options.heading,
    FALLBACK_FAMILY,
  ]);

  const context: FontContext = {
    body: options.body,
    heading: options.heading,
    bodyVar: options.fontVars ? options.fontVars.body : undefined,
    headingVar: options.fontVars ? options.fontVars.heading : undefined,
    loaded,
  };
  active = context;
  return context;
}

type PickedFont = { fontName: FontName; bindable: boolean };

// Choose the closest loaded font for a requested family/style. `bindable` is
// true only when the chosen family is the requested preset family, so callers
// know it is safe to bind the node's fontFamily to the preset variable (binding
// to an unloaded family would break setting characters).
function pickFont(
  context: FontContext,
  family: string,
  style: string,
): PickedFont {
  if (context.loaded.has(styleKey(family, style))) {
    return { fontName: { family, style }, bindable: true };
  }
  // Family is present but not in this weight — keep the family, drop to Regular.
  if (context.loaded.has(styleKey(family, "Regular"))) {
    return { fontName: { family, style: "Regular" }, bindable: true };
  }
  // Family unavailable — fall back to Inter, preserving the weight if we can.
  const fallbackStyle = context.loaded.has(styleKey(FALLBACK_FAMILY, style))
    ? style
    : "Regular";
  return {
    fontName: { family: FALLBACK_FAMILY, style: fallbackStyle },
    bindable: family === FALLBACK_FAMILY,
  };
}

// Apply the preset's body or heading font to a text node and bind its
// fontFamily to the matching theme variable. Must run before the node's
// `characters` are set (Figma requires the active font to be loaded).
export function applyFont(
  node: TextNode,
  role: FontRole,
  style: string = "Regular",
  context: FontContext | null = active,
): void {
  if (!context) {
    // No active context (e.g. a unit test exercising a builder in isolation).
    // Best-effort: use Inter and skip binding.
    node.fontName = { family: FALLBACK_FAMILY, style };
    return;
  }

  const family = role === "heading" ? context.heading : context.body;
  const picked = pickFont(context, family, style);
  node.fontName = picked.fontName;

  const variable = role === "heading" ? context.headingVar : context.bodyVar;
  if (picked.bindable && variable) {
    try {
      node.setBoundVariable("fontFamily", variable);
    } catch {
      // Some hosts/types reject the binding — leave the literal font in place.
    }
  }
}
