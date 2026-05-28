// Spacing scale: each token rendered as a horizontal bar bound to its
// spacing/<name> primitive variable.

import { SPACING_TOKENS } from "../../primitives";
import { bindFill, bindWidth } from "../bindings";
import { createSectionFrame, createVertical } from "../layout";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

export async function addSpacingScale(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Spacing scale");

  const stack = createVertical(section, 4);

  for (const token of SPACING_TOKENS) {
    const row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisSizingMode = "AUTO";
    row.counterAxisSizingMode = "AUTO";
    row.itemSpacing = 12;
    row.fills = [];

    const label = figma.createText();
    label.characters = `spacing/${token.name}`;
    label.fontSize = 10;
    label.fontName = { family: "Inter", style: "Regular" };
    bindFill(label, inputs.theme.light.get("muted-foreground"));
    label.resize(96, 16);

    const value = figma.createText();
    value.characters = `${token.value}px`;
    value.fontSize = 10;
    value.fontName = { family: "Inter", style: "Regular" };
    bindFill(value, inputs.theme.light.get("foreground"));
    value.resize(40, 16);

    const bar = figma.createFrame();
    // Add a 1px floor so 0px tokens still produce a visible node — Figma
    // refuses to keep a zero-width frame on canvas otherwise.
    bar.resize(Math.max(token.value, 1), 12);
    bar.cornerRadius = 2;
    bindFill(bar, inputs.theme.light.get("primary"));
    bindWidth(bar, inputs.primitives.get(`spacing/${token.name}`));

    row.appendChild(label);
    row.appendChild(value);
    row.appendChild(bar);
    stack.appendChild(row);
  }

  page.appendChild(section);
  return countDescendants(section);
}
