// Components page header — preset summary and a friendly intro line.

import { createSectionFrame } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

export async function addHeader(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const frame = createSectionFrame("Components", {
    title: "Components",
    titleSize: 28,
    subtitle: `Starter sheet for ${inputs.presetCode} — every variant and state, bound to the active preset. Each element is a real Figma component you can instance and swap.`,
  });
  page.appendChild(frame);
  return countDescendants(frame);
}
