// Materializes the "shadcn / Theme" variable collection. Light values use
// the bare key; dark values are emitted as "dark-<key>" since the free tier
// only supports a single mode per collection.

import { findTailwindAlias, parseColor, type Rgba } from "../colors";
import {
  ensureSingleMode,
  getOrCreateCollection,
  getOrCreateVariable,
} from "./collections";
import { COLLECTION_THEME, THEME_NUMBER_KEYS } from "./constants";
import type {
  ResolvedRegistry,
  TailwindColorVarMap,
  ThemeVariableMaps,
} from "./types";

export type ThemeResult = {
  variableCount: number;
  unaliasedCount: number;
  maps: ThemeVariableMaps;
};

// Maps a shadcn theme key to a friendly Figma variable name.
// We keep the dash-separated key as-is, since it matches the JSON token style
// shown in Default.tokens.json and reads well in the Figma UI.
function themeVariableName(key: string): string {
  return key;
}

export async function ensureThemeCollection(
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
