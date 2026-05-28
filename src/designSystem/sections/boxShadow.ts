// Box shadow tokens. Shadows aren't first-class Figma variables, so we apply
// them as literal effects on each tile. Values mirror Tailwind v4's preset.

import { bindFill } from "../bindings";
import {
  createSectionFrame,
  createVertical,
  createWrappingRow,
} from "../layout";
import { dropShadow, innerShadow, solidPaint } from "../paints";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

export async function addBoxShadows(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Box shadows");

  // Generous gap and inner padding so the larger shadows have room to
  // bleed without overlapping their neighbours.
  const row = createWrappingRow(section, 32);
  row.paddingTop = 24;
  row.paddingBottom = 32;
  row.paddingLeft = 8;
  row.paddingRight = 8;

  const shadows: Array<{ name: string; effects: Effect[] }> = [
    {
      name: "shadow/2xs",
      effects: [dropShadow(0, 1, 0, { r: 0, g: 0, b: 0, a: 0.05 })],
    },
    {
      name: "shadow/xs",
      effects: [dropShadow(0, 1, 2, { r: 0, g: 0, b: 0, a: 0.05 })],
    },
    {
      name: "shadow/sm",
      effects: [
        dropShadow(0, 1, 3, { r: 0, g: 0, b: 0, a: 0.1 }),
        dropShadow(0, 1, 2, { r: 0, g: 0, b: 0, a: 0.06 }),
      ],
    },
    {
      name: "shadow/md",
      effects: [
        dropShadow(0, 4, 6, { r: 0, g: 0, b: 0, a: 0.07 }),
        dropShadow(0, 2, 4, { r: 0, g: 0, b: 0, a: 0.06 }),
      ],
    },
    {
      name: "shadow/lg",
      effects: [
        dropShadow(0, 10, 15, { r: 0, g: 0, b: 0, a: 0.1 }),
        dropShadow(0, 4, 6, { r: 0, g: 0, b: 0, a: 0.05 }),
      ],
    },
    {
      name: "shadow/xl",
      effects: [
        dropShadow(0, 20, 25, { r: 0, g: 0, b: 0, a: 0.1 }),
        dropShadow(0, 8, 10, { r: 0, g: 0, b: 0, a: 0.04 }),
      ],
    },
    {
      name: "shadow/2xl",
      effects: [dropShadow(0, 25, 50, { r: 0, g: 0, b: 0, a: 0.25 })],
    },
    {
      name: "shadow/inner",
      effects: [innerShadow(0, 2, 4, { r: 0, g: 0, b: 0, a: 0.05 })],
    },
  ];

  for (const shadow of shadows) {
    const cell = createVertical(row, 8);
    const tile = figma.createFrame();
    tile.resize(80, 80);
    tile.cornerRadius = 10;
    tile.fills = [solidPaint(1)];
    tile.effects = shadow.effects;

    const label = figma.createText();
    label.characters = shadow.name;
    label.fontSize = 11;
    label.fontName = { family: "Inter", style: "Medium" };
    bindFill(label, inputs.theme.light.get("foreground"));

    cell.appendChild(tile);
    cell.appendChild(label);
  }

  page.appendChild(section);
  return countDescendants(section);
}
