// Border width scale: outlined tile per token bound to border-width
// primitive variables.

import { BORDER_WIDTH_TOKENS } from "../../primitives";
import { bindStrokeColor, bindStrokeWeight } from "../bindings";
import {
  createSectionFrame,
  createSwatchCell,
  createWrappingRow,
} from "../layout";
import { solidPaint } from "../paints";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

export async function addBorderWidthScale(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Border widths");

  const row = createWrappingRow(section, 16);

  for (const token of BORDER_WIDTH_TOKENS) {
    const tile = createSwatchCell(row, {
      size: 72,
      caption: `${token.name} · ${token.value}px`,
      captionVar: inputs.theme.light.get("foreground"),
    });
    tile.cornerRadius = 6;
    tile.fills = [];
    tile.strokes = [solidPaint(0.4)];
    tile.strokeWeight = Math.max(token.value, 1);
    // Use the theme primary color so the borders pick up the active palette.
    bindStrokeColor(tile, inputs.theme.light.get("primary"));
    bindStrokeWeight(tile, inputs.primitives.get(`border-width/${token.name}`));
  }

  page.appendChild(section);
  return countDescendants(section);
}
