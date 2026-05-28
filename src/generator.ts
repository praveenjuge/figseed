// Materializes a shadcn preset into Figma variables, collections, and modes.

import {
  findTailwindAlias,
  parseColor,
  parseOklch,
  TAILWIND_COLOR_FAMILIES,
  TAILWIND_COLOR_SCALES,
  TAILWIND_COLORS,
  type Rgba,
} from "./colors";
import {
  BLUR_TOKENS,
  BORDER_WIDTH_TOKENS,
  BREAKPOINT_TOKENS,
  CONTAINER_TOKENS,
  DEFAULT_FONT_FAMILY,
  FONT_LEADING_TOKENS,
  FONT_SIZE_TOKENS,
  FONT_STYLE_TOKENS,
  FONT_TRACKING_TOKENS,
  FONT_WEIGHT_TOKENS,
  fontSlugBucket,
  OPACITY_TOKENS,
  PRESET_FONT_FAMILY_MAP,
  RADIUS_TOKENS,
  SKEW_TOKENS,
  SPACING_TOKENS,
  type NumberToken,
} from "./primitives";
import type { ResolvedRegistry } from "./registry";

const COLLECTION_TAILWIND_COLORS = "Tailwind / Colors";
const COLLECTION_PRIMITIVES = "Tailwind / Primitives";
const COLLECTION_THEME = "shadcn / Theme";

// Theme variables that should be created as colors (vs numbers).
const THEME_NUMBER_KEYS = new Set(["radius"]);

// Maps a shadcn theme key to a friendly Figma variable name.
// We keep the dash-separated key as-is, since it matches the JSON token style
// shown in Default.tokens.json and reads well in the Figma UI.
function themeVariableName(key: string): string {
  return key;
}

export type GenerateOptions = {
  presetCode: string;
  presetSummary?: Record<string, string | undefined>;
};

export type ThemeVariableMaps = {
  // Variables in `shadcn / Theme` keyed by their bare name (e.g. "background")
  // for the light pass, and "dark-<name>" for the dark pass.
  light: Map<string, Variable>;
  dark: Map<string, Variable>;
};

export type PrimitiveVariableMap = Map<string, Variable>;

export type GenerateResult = {
  presetCode: string;
  collections: { name: string; variableCount: number }[];
  fallbackThemeColors: number;
  variables: {
    tailwindColors: TailwindColorVarMap;
    primitives: PrimitiveVariableMap;
    theme: ThemeVariableMaps;
  };
};

// Top-level entry. Idempotent: existing collections by name are reused.
export async function generateFromRegistry(
  data: ResolvedRegistry,
  options: GenerateOptions,
): Promise<GenerateResult> {
  const colorVars = await ensureTailwindColorCollection();
  const primitives = await ensurePrimitivesCollection({
    fontFamily: resolveFontFamily(options.presetSummary?.["font"]),
  });
  const themeResult = await ensureThemeCollection(data, colorVars);

  return {
    presetCode: options.presetCode,
    collections: [
      { name: COLLECTION_TAILWIND_COLORS, variableCount: colorVars.size },
      { name: COLLECTION_PRIMITIVES, variableCount: primitives.size },
      {
        name: COLLECTION_THEME,
        variableCount: themeResult.variableCount,
      },
    ],
    fallbackThemeColors: themeResult.unaliasedCount,
    variables: {
      tailwindColors: colorVars,
      primitives,
      theme: themeResult.maps,
    },
  };
}

// ----------------- Collection helpers -----------------

async function findCollectionByName(name: string) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  return collections.find((collection) => collection.name === name) ?? null;
}

async function getOrCreateCollection(name: string) {
  const existing = await findCollectionByName(name);
  if (existing) return existing;
  return figma.variables.createVariableCollection(name);
}

async function findVariableInCollection(
  collection: VariableCollection,
  name: string,
): Promise<Variable | null> {
  for (const id of collection.variableIds) {
    const variable = await figma.variables.getVariableByIdAsync(id);
    if (variable && variable.name === name) return variable;
  }
  return null;
}

async function getOrCreateVariable(
  collection: VariableCollection,
  name: string,
  type: VariableResolvedDataType,
): Promise<Variable> {
  const existing = await findVariableInCollection(collection, name);
  if (existing) {
    if (existing.resolvedType === type) return existing;
    // Type can't change after creation. Recreate fresh to avoid surprises.
    existing.remove();
  }
  return figma.variables.createVariable(name, collection, type);
}

// ----------------- Tailwind colors -----------------

export type TailwindColorVarMap = Map<string, Variable>;

// Returns a flat lookup keyed by "family/scale" plus "black", "white",
// "transparent". Allows the theme step to alias matching values.
async function ensureTailwindColorCollection(): Promise<TailwindColorVarMap> {
  const collection = await getOrCreateCollection(COLLECTION_TAILWIND_COLORS);
  ensureSingleMode(collection, "Default");

  const map: TailwindColorVarMap = new Map();
  const modeId = collection.modes[0]!.modeId;

  for (const family of TAILWIND_COLOR_FAMILIES) {
    for (const scale of TAILWIND_COLOR_SCALES) {
      const name = `${family}/${scale}`;
      const variable = await getOrCreateVariable(collection, name, "COLOR");
      const rgba = parseOklch(TAILWIND_COLORS[family][scale]);
      if (rgba) variable.setValueForMode(modeId, rgba);
      map.set(name, variable);
    }
  }

  // Ungrouped neutrals.
  const black = await getOrCreateVariable(collection, "black", "COLOR");
  black.setValueForMode(modeId, { r: 0, g: 0, b: 0, a: 1 });
  map.set("black", black);

  const white = await getOrCreateVariable(collection, "white", "COLOR");
  white.setValueForMode(modeId, { r: 1, g: 1, b: 1, a: 1 });
  map.set("white", white);

  const transparent = await getOrCreateVariable(
    collection,
    "transparent",
    "COLOR",
  );
  transparent.setValueForMode(modeId, { r: 0, g: 0, b: 0, a: 0 });
  map.set("transparent", transparent);

  return map;
}

// ----------------- Primitives -----------------

type ResolvedFontFamily = {
  family: string;
  bucket: "sans" | "serif" | "mono";
};

type PrimitivesOpts = { fontFamily: ResolvedFontFamily };

async function ensurePrimitivesCollection(
  opts: PrimitivesOpts,
): Promise<PrimitiveVariableMap> {
  const collection = await getOrCreateCollection(COLLECTION_PRIMITIVES);
  ensureSingleMode(collection, "Default");
  const modeId = collection.modes[0]!.modeId;

  const map: PrimitiveVariableMap = new Map();

  await writeNumberGroup(collection, modeId, "radius", RADIUS_TOKENS, map);
  await writeNumberGroup(
    collection,
    modeId,
    "border-width",
    BORDER_WIDTH_TOKENS,
    map,
  );
  await writeNumberGroup(collection, modeId, "opacity", OPACITY_TOKENS, map);
  await writeNumberGroup(collection, modeId, "blur", BLUR_TOKENS, map);
  await writeNumberGroup(collection, modeId, "skew", SKEW_TOKENS, map);
  await writeNumberGroup(
    collection,
    modeId,
    "breakpoint",
    BREAKPOINT_TOKENS,
    map,
  );
  await writeNumberGroup(
    collection,
    modeId,
    "container",
    CONTAINER_TOKENS,
    map,
  );
  await writeNumberGroup(collection, modeId, "spacing", SPACING_TOKENS, map);

  // Font / typography.
  await writeNumberGroup(
    collection,
    modeId,
    "font/size",
    FONT_SIZE_TOKENS,
    map,
  );
  await writeNumberGroup(
    collection,
    modeId,
    "font/weight",
    FONT_WEIGHT_TOKENS,
    map,
  );
  await writeNumberGroup(
    collection,
    modeId,
    "font/tracking",
    FONT_TRACKING_TOKENS,
    map,
  );
  await writeNumberGroup(
    collection,
    modeId,
    "font/leading",
    FONT_LEADING_TOKENS,
    map,
  );

  // Font families: bucket the preset font into sans/serif/mono.
  const families = computeFontFamilies(opts.fontFamily);
  for (const family of families) {
    const name = `font/family/${family.name}`;
    const variable = await getOrCreateVariable(collection, name, "STRING");
    variable.setValueForMode(modeId, family.value);
    map.set(name, variable);
  }

  for (const styleToken of FONT_STYLE_TOKENS) {
    const name = `font/style/${styleToken.name}`;
    const variable = await getOrCreateVariable(collection, name, "STRING");
    variable.setValueForMode(modeId, styleToken.value);
    map.set(name, variable);
  }

  return map;
}

async function writeNumberGroup(
  collection: VariableCollection,
  modeId: string,
  group: string,
  tokens: NumberToken[],
  map: PrimitiveVariableMap,
): Promise<void> {
  for (const token of tokens) {
    const name = `${group}/${token.name}`;
    const variable = await getOrCreateVariable(collection, name, "FLOAT");
    variable.setValueForMode(modeId, token.value);
    map.set(name, variable);
  }
}

function computeFontFamilies(presetFontFamily: ResolvedFontFamily) {
  // Always emit all three buckets; only the selected slug's bucket changes.
  return DEFAULT_FONT_FAMILY.map((token) => {
    if (
      (presetFontFamily.bucket === "sans" && token.name === "sans") ||
      (presetFontFamily.bucket === "serif" && token.name === "serif") ||
      (presetFontFamily.bucket === "mono" && token.name === "mono")
    ) {
      return { name: token.name, value: presetFontFamily.family };
    }
    return token;
  });
}

function resolveFontFamily(slug: string | undefined): ResolvedFontFamily {
  if (!slug) return { family: "Inter", bucket: "sans" };
  return {
    family: PRESET_FONT_FAMILY_MAP[slug] ?? "Inter",
    bucket: fontSlugBucket(slug),
  };
}

// ----------------- Theme (light + dark) -----------------

type ThemeResult = {
  variableCount: number;
  unaliasedCount: number;
  maps: ThemeVariableMaps;
};

async function ensureThemeCollection(
  data: ResolvedRegistry,
  tailwindColors: TailwindColorVarMap,
): Promise<ThemeResult> {
  const light = data.cssVars.light;
  const dark = data.cssVars.dark;

  const collection = await getOrCreateCollection(COLLECTION_THEME);
  ensureSingleMode(collection, "Default");
  const modeId = collection.modes[0]!.modeId;

  const allKeys = new Set<string>([
    ...Object.keys(light),
    ...Object.keys(dark),
  ]);

  let variableCount = 0;
  let unaliasedCount = 0;

  const maps: ThemeVariableMaps = {
    light: new Map(),
    dark: new Map(),
  };

  // Free-tier Figma collections only support one mode. Instead of two modes,
  // we emit one variable per (key, scheme): "background" carries the light
  // value, "dark-background" carries the dark value. Designers swap by
  // re-binding to the dark-* variants when they want a dark surface.
  const passes: Array<{
    prefix: string;
    values: Record<string, string>;
    target: Map<string, Variable>;
  }> = [
    { prefix: "", values: light, target: maps.light },
    { prefix: "dark-", values: dark, target: maps.dark },
  ];

  for (const key of allKeys) {
    const isNumber = THEME_NUMBER_KEYS.has(key);

    for (const pass of passes) {
      const rawValue = pass.values[key];
      if (rawValue === undefined) continue;

      const variableName = `${pass.prefix}${themeVariableName(key)}`;

      if (isNumber) {
        const variable = await getOrCreateVariable(
          collection,
          variableName,
          "FLOAT",
        );
        const number = parseLengthRem(rawValue);
        if (number !== null) variable.setValueForMode(modeId, number);
        variableCount += 1;
        pass.target.set(key, variable);
        continue;
      }

      const variable = await getOrCreateVariable(
        collection,
        variableName,
        "COLOR",
      );

      const applied = applyThemeColor(
        variable,
        modeId,
        rawValue,
        tailwindColors,
      );
      if (!applied.aliased) unaliasedCount += 1;
      variableCount += 1;
      pass.target.set(key, variable);
    }
  }

  return { variableCount, unaliasedCount, maps };
}

function applyThemeColor(
  variable: Variable,
  modeId: string,
  rawValue: string | undefined,
  tailwindColors: TailwindColorVarMap,
): { aliased: boolean } {
  if (!rawValue) return { aliased: false };

  const aliasKey = findTailwindAlias(rawValue);
  if (aliasKey) {
    const target = tailwindColors.get(aliasKey);
    if (target) {
      variable.setValueForMode(
        modeId,
        figma.variables.createVariableAlias(target),
      );
      return { aliased: true };
    }
  }

  const rgba = colorFromString(rawValue, tailwindColors);
  if (rgba) variable.setValueForMode(modeId, rgba);
  return { aliased: false };
}

// Parse "0.625rem", "16px", or a plain number into a Figma float (px).
function parseLengthRem(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.endsWith("rem")) {
    const n = parseFloat(trimmed);
    return Number.isNaN(n) ? null : n * 16;
  }
  if (trimmed.endsWith("px")) {
    const n = parseFloat(trimmed);
    return Number.isNaN(n) ? null : n;
  }
  const n = parseFloat(trimmed);
  return Number.isNaN(n) ? null : n;
}

function colorFromString(
  value: string,
  _tailwindColors: TailwindColorVarMap,
): Rgba | null {
  // shadcn theme values are always oklch() in v4. Hex falls back to direct
  // RGB. Anything else (named colors etc.) we skip.
  return parseColor(value);
}

// ----------------- Mode helpers -----------------

function ensureSingleMode(collection: VariableCollection, modeName: string) {
  const [first, ...rest] = collection.modes;
  // Newly-created collections always come with exactly one mode, so this
  // branch is defensive — `addMode` would throw on the free tier.
  if (!first) return;
  if (first.name !== modeName) collection.renameMode(first.modeId, modeName);
  // Drop extras to keep the collection clean (e.g. if a previous run created
  // Light + Dark modes on a paid plan).
  for (const mode of rest) {
    try {
      collection.removeMode(mode.modeId);
    } catch {
      // Ignore — Figma forbids removing the last mode.
    }
  }
}
