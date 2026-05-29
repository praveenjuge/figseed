// Public types and shared layout constants for the Design System page.

import type {
  PrimitiveVariableMap,
  TailwindColorVarMap,
  ThemeVariableMaps,
} from "../generator";

export const PAGE_NAME = "Design System";

// Each section is now its own top-level frame so designers can move them
// independently. The page just lays them out in a vertical stack.
export const SECTION_WIDTH = 1120;
export const SECTION_GAP = 32;

export type DesignSystemInputs = {
  presetCode: string;
  presetSummary?: Record<string, string | undefined>;
  tailwindColors: TailwindColorVarMap;
  primitives: PrimitiveVariableMap;
  theme: ThemeVariableMaps;
  // Called once per section so the UI can show a determinate progress bar.
  onProgress?: (current: number, total: number, label: string) => void;
};

export type DesignSystemResult = { nodeCount: number };

// Each entry corresponds to one top-level section frame on the page. Adding
// a section here also extends the progress total reported to the UI.
// `column` pins the section to a specific column in the two-column layout so
// related sections (e.g. all the color sections) stay grouped together.
export type SectionBuilder = {
  label: string;
  column: 0 | 1;
  build: (page: PageNode, inputs: DesignSystemInputs) => Promise<number>;
};
