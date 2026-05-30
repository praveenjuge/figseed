// Public types and shared layout constants for the Components page.

import type {
  PrimitiveVariableMap,
  TailwindColorVarMap,
  ThemeFontVars,
  ThemeVariableMaps,
} from "../generator";
import type { EffectStyleMap } from "../effectStyles";
import type { TextStyleMap } from "../textStyles";
import type { ResolvedFonts } from "../primitives";

export const PAGE_NAME = "Components";
export const SECTION_GAP = 32;
// Max width used for the page header and any wrapping component sets so
// they align visually on the canvas.
export const SECTION_WIDTH = 1120;

export type ComponentsInputs = {
  presetCode: string;
  presetSummary?: Record<string, string | undefined>;
  primitives: PrimitiveVariableMap;
  tailwindColors: TailwindColorVarMap;
  theme: ThemeVariableMaps;
  // Preset font families + the variables backing them. Optional so existing
  // callers/tests keep working; the builder falls back to Inter when absent.
  fonts?: ResolvedFonts;
  fontVars?: ThemeFontVars;
  // Shadow + blur effect styles. Populated by the builder when absent so
  // sections can reference published styles instead of literal effects.
  effectStyles?: EffectStyleMap;
  // Tailwind typography text styles. Populated by the builder when absent so
  // matching text nodes get mapped onto a published style.
  textStyles?: TextStyleMap;
  onProgress?: (current: number, total: number, label: string) => void;
};

export type ComponentsResult = { nodeCount: number };

export type SectionBuilder = {
  label: string;
  build: (page: PageNode, inputs: ComponentsInputs) => Promise<number>;
};
