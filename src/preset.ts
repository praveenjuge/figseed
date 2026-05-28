// Mirror of shadcn's preset codec (packages/shadcn/src/preset/preset.ts).
// Kept in sync with v2 ("b") — backward compatible with v1 ("a").
// We use it on the UI side to validate input before hitting the network.

export const PRESET_BASES = ["radix", "base"] as const;

export const PRESET_STYLES = [
  "nova",
  "vega",
  "maia",
  "lyra",
  "mira",
  "luma",
  "sera",
  "rhea",
] as const;

export const PRESET_BASE_COLORS = [
  "neutral",
  "stone",
  "zinc",
  "gray",
  "mauve",
  "olive",
  "mist",
  "taupe",
] as const;

export const PRESET_THEMES = [
  "neutral",
  "stone",
  "zinc",
  "gray",
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "teal",
  "violet",
  "yellow",
  "mauve",
  "olive",
  "mist",
  "taupe",
] as const;

export const PRESET_ICON_LIBRARIES = [
  "lucide",
  "hugeicons",
  "tabler",
  "phosphor",
  "remixicon",
] as const;

export const PRESET_FONTS = [
  "inter",
  "noto-sans",
  "nunito-sans",
  "figtree",
  "roboto",
  "raleway",
  "dm-sans",
  "public-sans",
  "outfit",
  "jetbrains-mono",
  "geist",
  "geist-mono",
  "lora",
  "merriweather",
  "playfair-display",
  "noto-serif",
  "roboto-slab",
  "oxanium",
  "manrope",
  "space-grotesk",
  "montserrat",
  "ibm-plex-sans",
  "source-sans-3",
  "instrument-sans",
  "eb-garamond",
  "instrument-serif",
] as const;

export const PRESET_FONT_HEADINGS = ["inherit", ...PRESET_FONTS] as const;

export const PRESET_RADII = [
  "default",
  "none",
  "small",
  "medium",
  "large",
] as const;

export const PRESET_MENU_ACCENTS = ["subtle", "bold"] as const;
export const PRESET_MENU_COLORS = [
  "default",
  "inverted",
  "default-translucent",
  "inverted-translucent",
] as const;

const PRESET_FIELDS_V1 = [
  { key: "menuColor", values: PRESET_MENU_COLORS, bits: 3 },
  { key: "menuAccent", values: PRESET_MENU_ACCENTS, bits: 3 },
  { key: "radius", values: PRESET_RADII, bits: 4 },
  { key: "font", values: PRESET_FONTS, bits: 6 },
  { key: "iconLibrary", values: PRESET_ICON_LIBRARIES, bits: 6 },
  { key: "theme", values: PRESET_THEMES, bits: 6 },
  { key: "baseColor", values: PRESET_BASE_COLORS, bits: 6 },
  { key: "style", values: PRESET_STYLES, bits: 6 },
] as const;

const PRESET_FIELDS_V2 = [
  ...PRESET_FIELDS_V1,
  { key: "chartColor", values: PRESET_THEMES, bits: 6 },
  { key: "fontHeading", values: PRESET_FONT_HEADINGS, bits: 5 },
] as const;

export type PresetConfig = {
  style: (typeof PRESET_STYLES)[number];
  baseColor: (typeof PRESET_BASE_COLORS)[number];
  theme: (typeof PRESET_THEMES)[number];
  chartColor: (typeof PRESET_THEMES)[number];
  iconLibrary: (typeof PRESET_ICON_LIBRARIES)[number];
  font: (typeof PRESET_FONTS)[number];
  fontHeading: (typeof PRESET_FONT_HEADINGS)[number];
  radius: (typeof PRESET_RADII)[number];
  menuAccent: (typeof PRESET_MENU_ACCENTS)[number];
  menuColor: (typeof PRESET_MENU_COLORS)[number];
};

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const VALID_VERSIONS = ["a", "b"] as const;

function fromBase62(str: string): number {
  let result = 0;
  for (const ch of str) {
    const idx = BASE62.indexOf(ch);
    if (idx === -1) return -1;
    result = result * 62 + idx;
  }
  return result;
}

export function isPresetCode(value: string): boolean {
  if (!value || value.length < 2 || value.length > 10) return false;
  if (!VALID_VERSIONS.includes(value[0] as (typeof VALID_VERSIONS)[number])) {
    return false;
  }
  for (let i = 1; i < value.length; i++) {
    if (BASE62.indexOf(value[i]!) === -1) return false;
  }
  return true;
}

// Extract a preset code from common copy-paste sources:
//   "b3HGM2E529"
//   "--preset b3HGM2E529"
//   "--preset=b3HGM2E529"
//   "npx shadcn@latest init --preset b3HGM2E529"
//   "pnpm dlx shadcn@latest init --preset=b3HGM2E529"
//   "https://ui.shadcn.com/init?preset=b3HGM2E529"
// Returns the bare code, or null if nothing valid is found.
export function extractPresetCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Fast path — the user pasted just the code.
  if (isPresetCode(trimmed)) return trimmed;

  // Pull the value off a flag (`--preset <code>` or `--preset=<code>`) or a
  // query param (`?preset=<code>` / `&preset=<code>`). We deliberately don't
  // do a bare-token scan to avoid false positives on regular English words
  // (e.g. "at" passes the version-prefix + base62 shape).
  const candidates: string[] = [];

  for (const match of trimmed.matchAll(/--preset[=\s]+([^\s&"'`]+)/g)) {
    candidates.push(match[1]!);
  }
  for (const match of trimmed.matchAll(/[?&]preset=([^\s&"'`]+)/g)) {
    candidates.push(match[1]!);
  }

  for (const candidate of candidates) {
    if (isPresetCode(candidate)) return candidate;
  }

  return null;
}

export function decodePreset(code: string): PresetConfig | null {
  if (!isPresetCode(code)) return null;
  const version = code[0]!;
  const fields = version === "a" ? PRESET_FIELDS_V1 : PRESET_FIELDS_V2;
  const bits = fromBase62(code.slice(1));
  if (bits < 0) return null;

  const out: Record<string, string> = {};
  let offset = 0;
  for (const field of fields) {
    const idx = Math.floor(bits / 2 ** offset) % 2 ** field.bits;
    out[field.key] =
      idx < field.values.length ? field.values[idx]! : field.values[0]!;
    offset += field.bits;
  }
  if (version === "a") {
    out.fontHeading = "inherit";
    out.chartColor = out.theme!;
  }
  return out as unknown as PresetConfig;
}
