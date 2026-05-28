// Opacity scale: each token rendered as a faded tile bound to its
// opacity/<name> primitive variable.

import { OPACITY_TOKENS } from "../../primitives";
import { bindFill, bindOpacity } from "../bindings";
import { createSectionFrame, createWrappingRow } from "../layout";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

export async function addOpacityScale(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Opacity scale");

  const row = createWrappingRow(section, 8);

  for (const token of OPACITY_TOKENS) {
    const cell = figma.createFrame();
    cell.layoutMode = "VERTICAL";
    cell.itemSpacing = 6;
    cell.counterAxisAlignItems = "CENTER";
    cell.fills = [];
    cell.resize(56, 80);
    cell.primaryAxisSizingMode = "FIXED";
    cell.counterAxisSizingMode = "FIXED";

    const tile = figma.createFrame();
    tile.resize(48, 48);
    tile.cornerRadius = 4;
    bindFill(tile, inputs.theme.light.get("primary"));
    tile.opacity = Math.max(0.0001, token.value / 100);
    bindOpacity(tile, inputs.primitives.get(`opacity/${token.name}`));

    const label = figma.createText();
    label.characters = token.name;
    label.fontSize = 10;
    label.fontName = { family: "Inter", style: "Medium" };
    bindFill(label, inputs.theme.light.get("foreground"));

    const sub = figma.createText();
    sub.characters = `${token.value}%`;
    sub.fontSize = 9;
    sub.fontName = { family: "Inter", style: "Regular" };
    bindFill(sub, inputs.theme.light.get("muted-foreground"));

    cell.appendChild(tile);
    cell.appendChild(label);
    cell.appendChild(sub);
    row.appendChild(cell);
  }

  page.appendChild(section);
  return countDescendants(section);
}
