// Top-level entry for the generator. Materializes a shadcn preset into Figma
// variables, collections, and modes. Idempotent: existing collections by
// name are reused.

import {
  COLLECTION_PRIMITIVES,
  COLLECTION_TAILWIND_COLORS,
  COLLECTION_THEME,
} from "./constants";
import { ensurePrimitivesCollection, resolveFontFamily } from "./primitives";
import { ensureTailwindColorCollection } from "./tailwindColors";
import { ensureThemeCollection } from "./theme";
import { ensureEffectStyles } from "../effectStyles";
import type {
  GenerateOptions,
  GenerateResult,
  ResolvedRegistry,
} from "./types";

export type {
  GenerateOptions,
  GenerateResult,
  PrimitiveVariableMap,
  TailwindColorVarMap,
  ThemeFontVars,
  ThemeVariableMaps,
} from "./types";
export type { EffectStyleMap } from "../effectStyles";

export async function generateFromRegistry(
  data: ResolvedRegistry,
  options: GenerateOptions,
): Promise<GenerateResult> {
  const colorVars = await ensureTailwindColorCollection();
  const primitives = await ensurePrimitivesCollection({
    fontFamily: resolveFontFamily(options.presetSummary?.["font"]),
  });
  const themeResult = await ensureThemeCollection(data, colorVars);

  // Publish the shadow + blur effect styles. Their blur radii bind to the
  // `blur/*` primitives created just above, so the styles stay in sync.
  const effectStyles = await ensureEffectStyles(primitives);

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
    fonts: themeResult.fonts,
    effectStyles,
    variables: {
      tailwindColors: colorVars,
      primitives,
      theme: themeResult.maps,
      fonts: themeResult.fontVars,
    },
  };
}
