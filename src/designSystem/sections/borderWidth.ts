// Border width scale: outlined tile per token bound to border-width
// primitive variables.

import { BORDER_WIDTH_TOKENS } from "../../primitives";
import { applyFont } from "../../fonts";
import { bindFill, bindStrokeColor, bindStrokeWeight } from "../bindings";
import {
  createSectionFrame,
  createVertical,
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
    const cell = createVertical(row, 6);
    const tile = figma.createFrame();
    tile.resize(72, 72);
    tile.cornerRadius = 6;
    tile.fills = [];
    tile.strokes = [solidPaint(0.4)];
    tile.strokeWeight = Math.max(token.value, 1);
    // Use the theme primary color so the borders pick up the active palette.
    bindStrokeColor(tile, inputs.theme.light.get("primary"));
    bindStrokeWeight(tile, inputs.primitives.get(`border-width/${token.name}`));

    const label = figma.createText();
    label.characters = `${token.name} · ${token.value}px`;
    label.fontSize = 11;
    applyFont(label, "body", "Regular");
    bindFill(label, inputs.theme.light.get("foreground"));

    cell.appendChild(tile);
    cell.appendChild(label);
  }

  page.appendChild(section);
  return countDescendants(section);
}
