// Theme swatches grouped by purpose (Surfaces, Brand, States, …) for either
// the light or dark scheme. Each card binds its fill and label to the
// corresponding theme variable so the whole grid updates with the preset.

import { bindFill } from "../bindings";
import { createSectionFrame, sectionContentWidth } from "../layout";
import { solidPaint } from "../paints";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

// Theme key groupings, ordered the way designers usually scan them.
const THEME_GROUPS: { title: string; pairs: [string, string | null][] }[] = [
  {
    title: "Surfaces",
    pairs: [
      ["background", "foreground"],
      ["card", "card-foreground"],
      ["popover", "popover-foreground"],
    ],
  },
  {
    title: "Brand",
    pairs: [
      ["primary", "primary-foreground"],
      ["secondary", "secondary-foreground"],
      ["accent", "accent-foreground"],
    ],
  },
  {
    title: "States",
    pairs: [
      ["muted", "muted-foreground"],
      ["destructive", "destructive-foreground"],
    ],
  },
  {
    title: "Lines",
    pairs: [
      ["border", null],
      ["input", null],
      ["ring", null],
    ],
  },
  {
    title: "Sidebar",
    pairs: [
      ["sidebar", "sidebar-foreground"],
      ["sidebar-primary", "sidebar-primary-foreground"],
      ["sidebar-accent", "sidebar-accent-foreground"],
      ["sidebar-border", null],
      ["sidebar-ring", null],
    ],
  },
  {
    title: "Charts",
    pairs: [
      ["chart-1", null],
      ["chart-2", null],
      ["chart-3", null],
      ["chart-4", null],
      ["chart-5", null],
    ],
  },
];

export async function addThemeSection(
  page: PageNode,
  inputs: DesignSystemInputs,
  scheme: "light" | "dark",
): Promise<number> {
  const map = scheme === "light" ? inputs.theme.light : inputs.theme.dark;
  const title = scheme === "light" ? "Theme · Light" : "Theme · Dark";

  const section = createSectionFrame(title, { title });

  // Two-column grid of group cards. The section content width is fixed, so
  // each column gets exactly half (minus the gap).
  const contentWidth = sectionContentWidth();
  const columnGap = 16;
  const columnWidth = Math.floor((contentWidth - columnGap) / 2);

  const grid = figma.createFrame();
  grid.layoutMode = "HORIZONTAL";
  grid.layoutWrap = "WRAP";
  grid.itemSpacing = columnGap;
  grid.counterAxisSpacing = columnGap;
  grid.fills = [];
  grid.resize(contentWidth, 1);
  grid.primaryAxisSizingMode = "FIXED";
  grid.counterAxisSizingMode = "AUTO";
  section.appendChild(grid);

  const swatchSize = 116; // compact theme swatch
  const swatchHeight = 64;

  for (const group of THEME_GROUPS) {
    const groupCard = figma.createFrame();
    groupCard.layoutMode = "VERTICAL";
    groupCard.itemSpacing = 8;
    groupCard.fills = [];
    groupCard.resize(columnWidth, 1);
    groupCard.primaryAxisSizingMode = "AUTO";
    groupCard.counterAxisSizingMode = "FIXED";

    const heading = figma.createText();
    heading.fontName = { family: "Inter", style: "Medium" };
    heading.characters = group.title;
    heading.fontSize = 11;
    heading.fills = [solidPaint(0.4)];
    groupCard.appendChild(heading);

    const itemRow = figma.createFrame();
    itemRow.layoutMode = "HORIZONTAL";
    itemRow.layoutWrap = "WRAP";
    itemRow.itemSpacing = 8;
    itemRow.counterAxisSpacing = 8;
    itemRow.fills = [];
    itemRow.resize(columnWidth, 1);
    itemRow.primaryAxisSizingMode = "FIXED";
    itemRow.counterAxisSizingMode = "AUTO";
    groupCard.appendChild(itemRow);

    for (const [bg, fg] of group.pairs) {
      const card = figma.createFrame();
      card.layoutMode = "VERTICAL";
      card.itemSpacing = 2;
      card.cornerRadius = 6;
      card.paddingTop = 10;
      card.paddingBottom = 10;
      card.paddingLeft = 12;
      card.paddingRight = 12;
      card.strokeWeight = 1;
      // Subtle outline so the card stays visible even when its fill matches
      // the page background (e.g. the literal "background" swatch).
      card.strokes = [solidPaint(scheme === "light" ? 0.9 : 0.25)];
      bindFill(card, map.get(bg));

      const swatchLabel = figma.createText();
      swatchLabel.characters = bg;
      swatchLabel.fontSize = 11;
      swatchLabel.fontName = { family: "Inter", style: "Semi Bold" };
      bindFill(
        swatchLabel,
        fg ? map.get(fg) : map.get("foreground"),
        scheme === "light" ? 0.1 : 0.9,
      );
      card.appendChild(swatchLabel);

      const swatchSub = figma.createText();
      swatchSub.characters = `--${bg}`;
      swatchSub.fontSize = 9;
      swatchSub.fontName = { family: "Inter", style: "Regular" };
      bindFill(
        swatchSub,
        fg ? map.get(fg) : map.get("foreground"),
        scheme === "light" ? 0.4 : 0.6,
      );
      card.appendChild(swatchSub);

      card.resize(swatchSize, swatchHeight);
      card.primaryAxisSizingMode = "FIXED";
      card.counterAxisSizingMode = "FIXED";
      itemRow.appendChild(card);
    }

    grid.appendChild(groupCard);
  }

  page.appendChild(section);
  return countDescendants(section);
}
