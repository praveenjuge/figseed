// Theme swatches grouped by purpose (Surfaces, Brand, States, …) for either
// the light or dark scheme. Each swatch binds its fill to the matching theme
// variable so the whole grid updates with the preset.

import { bindFill } from "../bindings";
import { applyFont } from "../../fonts";
import { createSectionFrame, sectionContentWidth } from "../layout";
import { solidPaint } from "../paints";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

// Theme keys grouped the way designers usually scan them. Foreground tokens
// are intentionally omitted — the swatch is just a paint chip, the name lives
// underneath in plain text.
const THEME_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Surfaces",
    keys: ["background", "card", "popover"],
  },
  {
    title: "Brand",
    keys: ["primary", "secondary", "accent"],
  },
  {
    title: "States",
    keys: ["muted", "destructive"],
  },
  {
    title: "Lines",
    keys: ["border", "input", "ring"],
  },
  {
    title: "Sidebar",
    keys: [
      "sidebar",
      "sidebar-primary",
      "sidebar-accent",
      "sidebar-border",
      "sidebar-ring",
    ],
  },
  {
    title: "Charts",
    keys: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  },
];

// Tunables for the compact swatch grid.
const SWATCH_WIDTH = 72;
const SWATCH_HEIGHT = 40;
const SWATCH_GAP = 8;
const GROUP_GAP = 16;

export async function addThemeSection(
  page: PageNode,
  inputs: DesignSystemInputs,
  scheme: "light" | "dark",
): Promise<number> {
  const map = scheme === "light" ? inputs.theme.light : inputs.theme.dark;
  const title = scheme === "light" ? "Theme · Light" : "Theme · Dark";

  const section = createSectionFrame(title, { title });

  // Two-column grid of group blocks. The section content width is fixed, so
  // each column gets exactly half (minus the column gap).
  const contentWidth = sectionContentWidth();
  const columnGap = 24;
  const columnWidth = Math.floor((contentWidth - columnGap) / 2);

  const grid = figma.createFrame();
  grid.layoutMode = "HORIZONTAL";
  grid.layoutWrap = "WRAP";
  grid.itemSpacing = columnGap;
  grid.counterAxisSpacing = GROUP_GAP;
  grid.fills = [];
  grid.resize(contentWidth, 1);
  grid.primaryAxisSizingMode = "FIXED";
  grid.counterAxisSizingMode = "AUTO";
  section.appendChild(grid);

  for (const group of THEME_GROUPS) {
    const groupBlock = figma.createFrame();
    groupBlock.layoutMode = "VERTICAL";
    groupBlock.itemSpacing = 8;
    groupBlock.fills = [];
    groupBlock.resize(columnWidth, 1);
    groupBlock.primaryAxisSizingMode = "AUTO";
    groupBlock.counterAxisSizingMode = "FIXED";

    const heading = figma.createText();
    applyFont(heading, "heading", "Medium");
    heading.characters = group.title.toUpperCase();
    heading.fontSize = 10;
    heading.lineHeight = { unit: "PIXELS", value: 14 };
    heading.letterSpacing = { unit: "PERCENT", value: 4 };
    heading.fills = [solidPaint(0.45)];
    groupBlock.appendChild(heading);

    const swatchRow = figma.createFrame();
    swatchRow.layoutMode = "HORIZONTAL";
    swatchRow.layoutWrap = "WRAP";
    swatchRow.itemSpacing = SWATCH_GAP;
    swatchRow.counterAxisSpacing = SWATCH_GAP;
    swatchRow.fills = [];
    swatchRow.resize(columnWidth, 1);
    swatchRow.primaryAxisSizingMode = "FIXED";
    swatchRow.counterAxisSizingMode = "AUTO";
    groupBlock.appendChild(swatchRow);

    for (const key of group.keys) {
      const cell = figma.createFrame();
      cell.layoutMode = "VERTICAL";
      cell.itemSpacing = 6;
      cell.fills = [];
      cell.resize(SWATCH_WIDTH, 1);
      cell.primaryAxisSizingMode = "AUTO";
      cell.counterAxisSizingMode = "FIXED";

      // Chip is itself an auto-layout frame with both axes fixed — a plain
      // frame collapses to 0 height when nested in a vertical auto-layout
      // parent, even after resize().
      const chip = figma.createFrame();
      chip.layoutMode = "VERTICAL";
      chip.strokeWeight = 1;
      // Hairline outline so chips matching the page surface (e.g. the literal
      // "background" or near-white "card" in light mode) stay visible.
      chip.strokes = [solidPaint(scheme === "light" ? 0.9 : 0.8)];
      chip.resize(SWATCH_WIDTH, SWATCH_HEIGHT);
      chip.primaryAxisSizingMode = "FIXED";
      chip.counterAxisSizingMode = "FIXED";
      bindFill(chip, map.get(key));
      cell.appendChild(chip);

      const caption = figma.createText();
      applyFont(caption, "body", "Regular");
      caption.characters = key;
      caption.fontSize = 9;
      caption.fills = [solidPaint(0.35)];
      cell.appendChild(caption);

      swatchRow.appendChild(cell);
    }

    grid.appendChild(groupBlock);
  }

  page.appendChild(section);
  return countDescendants(section);
}
