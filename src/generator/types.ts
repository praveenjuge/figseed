// Public types for the generator module.

import type { ResolvedRegistry } from "../registry";

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

export type TailwindColorVarMap = Map<string, Variable>;

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

export type ResolvedFontFamily = {
  family: string;
  bucket: "sans" | "serif" | "mono";
};

// Re-export ResolvedRegistry so internals can grab it from one path.
export type { ResolvedRegistry };
