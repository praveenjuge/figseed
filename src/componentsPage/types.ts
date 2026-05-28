// Public types and shared layout constants for the Components page.

import type { PrimitiveVariableMap, ThemeVariableMaps } from "../generator";

export const PAGE_NAME = "Components";
export const SECTION_GAP = 32;

export type ComponentsInputs = {
  presetCode: string;
  presetSummary?: Record<string, string | undefined>;
  primitives: PrimitiveVariableMap;
  theme: ThemeVariableMaps;
  onProgress?: (current: number, total: number, label: string) => void;
};

export type ComponentsResult = { nodeCount: number };

export type SectionBuilder = {
  label: string;
  build: (page: PageNode, inputs: ComponentsInputs) => Promise<number>;
};
