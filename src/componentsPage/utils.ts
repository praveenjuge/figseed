// Misc helpers shared by the Components page.

import { loadPresetFonts } from "../fonts";
import type { ComponentsInputs } from "./types";

// Load the preset fonts for the Components page and activate them. Falls back
// to Inter when the inputs don't carry preset fonts (older callers/tests).
export async function loadComponentsFonts(
  inputs: ComponentsInputs,
): Promise<void> {
  const body = inputs.fonts ? inputs.fonts.body : "Inter";
  const heading = inputs.fonts ? inputs.fonts.heading : "Inter";
  await loadPresetFonts({ body, heading, fontVars: inputs.fontVars });
}

export function countDescendants(node: SceneNode): number {
  let count = 1;
  if ("children" in node) {
    for (const child of node.children) count += countDescendants(child);
  }
  return count;
}
