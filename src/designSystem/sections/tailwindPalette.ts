// Full Tailwind color palette grid — every family/scale plus the unscaled
// neutrals (white, black, transparent).

import { TAILWIND_COLOR_FAMILIES, TAILWIND_COLOR_SCALES } from "../../colors";
import { applyFont } from "../../fonts";
import { bindFill } from "../bindings";
import {
  createSectionFrame,
  createVertical,
  sectionContentWidth,
} from "../layout";
import { solidPaint } from "../paints";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

export async function addTailwindPalette(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Tailwind palette");

  const stack = createVertical(section, 2);
  const rowWidth = sectionContentWidth();
  const labelWidth = 56;
  const rowHeight = 24; // each scale row is exactly this tall

  for (const family of TAILWIND_COLOR_FAMILIES) {
    const row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.itemSpacing = 0;
    row.fills = [];
    // Pin both axes so the row keeps a consistent height regardless of how
    // tall its children would otherwise size themselves to.
    row.resize(rowWidth, rowHeight);
    row.primaryAxisSizingMode = "FIXED";
    row.counterAxisSizingMode = "FIXED";
    row.counterAxisAlignItems = "CENTER";

    const label = figma.createText();
    label.characters = family;
    label.fontSize = 10;
    applyFont(label, "body", "Medium");
    label.fills = [solidPaint(0.4)];
    label.resize(labelWidth, 16);
    row.appendChild(label);

    for (const scale of TAILWIND_COLOR_SCALES) {
      const swatch = figma.createFrame();
      swatch.layoutMode = "VERTICAL";
      swatch.primaryAxisAlignItems = "MAX";
      swatch.counterAxisAlignItems = "MIN";
      swatch.paddingLeft = 3;
      swatch.paddingRight = 3;
      swatch.paddingTop = 2;
      swatch.paddingBottom = 2;
      // Grow horizontally to share the remaining row width and stretch
      // vertically to match the row height. Together these keep the swatch
      // a real rectangle instead of collapsing onto its label.
      swatch.layoutGrow = 1;
      swatch.layoutAlign = "STRETCH";
      bindFill(swatch, inputs.tailwindColors.get(`${family}/${scale}`));

      const tag = figma.createText();
      tag.characters = scale;
      tag.fontSize = 9;
      applyFont(tag, "body", "Medium");
      const isDark = parseInt(scale, 10) >= 500;
      tag.fills = [solidPaint(isDark ? 0.95 : 0.1)];
      swatch.appendChild(tag);

      row.appendChild(swatch);
    }

    stack.appendChild(row);
  }

  // Neutrals that live outside the family table.
  const neutralRow = figma.createFrame();
  neutralRow.layoutMode = "HORIZONTAL";
  neutralRow.primaryAxisSizingMode = "AUTO";
  neutralRow.counterAxisSizingMode = "AUTO";
  neutralRow.itemSpacing = 12;
  neutralRow.fills = [];
  for (const name of ["white", "black", "transparent"]) {
    const cell = createVertical(neutralRow, 4);
    const swatch = figma.createFrame();
    swatch.resize(56, 24);
    swatch.cornerRadius = 4;
    swatch.strokeWeight = 1;
    swatch.strokes = [solidPaint(0.85)];
    bindFill(swatch, inputs.tailwindColors.get(name));

    const cap = figma.createText();
    cap.characters = name;
    cap.fontSize = 9;
    applyFont(cap, "body", "Medium");
    cap.fills = [solidPaint(0.4)];

    cell.appendChild(swatch);
    cell.appendChild(cap);
  }
  stack.appendChild(neutralRow);

  page.appendChild(section);
  return countDescendants(section);
}
