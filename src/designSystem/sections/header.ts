// Design System page header — preset code and a compact summary line.

import { createSectionFrame } from "../layout";
import type { DesignSystemInputs } from "../types";
import { countDescendants, summarizePreset } from "../utils";

export async function addHeader(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const frame = createSectionFrame("Figseed", {
    title: inputs.presetCode,
    titleSize: 28,
    subtitle: summarizePreset(inputs.presetSummary),
  });
  page.appendChild(frame);
  return countDescendants(frame);
}
