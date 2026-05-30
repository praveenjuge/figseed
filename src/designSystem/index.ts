// Builds a "Design System" page in Figma that visualizes every variable
// produced by the generator: theme colors (light + dark), Tailwind palette,
// typography, radius, spacing, opacity, blur, border widths, and shadows.
//
// All visual nodes bind to the corresponding Figma variables, so any later
// edit to the variables flows through the page.

import { addBlurAndBackdrop } from "./sections/blur";
import { addBorderWidthScale } from "./sections/borderWidth";
import { addBoxShadows } from "./sections/boxShadow";
import { addHeader } from "./sections/header";
import { addIconLibrary } from "./sections/icons";
import { addOpacityScale } from "./sections/opacity";
import { addRadiusScale } from "./sections/radius";
import { addSpacingScale } from "./sections/spacing";
import { addTailwindPalette } from "./sections/tailwindPalette";
import { addThemeSection } from "./sections/theme";
import { addTypography } from "./sections/typography";
import {
  PAGE_NAME,
  SECTION_GAP,
  SECTION_WIDTH,
  type DesignSystemInputs,
  type DesignSystemResult,
  type SectionBuilder,
} from "./types";
import { loadDesignSystemFonts } from "./utils";
import { applyTokenBindings } from "../tokenBindings";

export type { DesignSystemInputs, DesignSystemResult } from "./types";

const SECTIONS: SectionBuilder[] = [
  // Left column: the color-related sections, grouped together.
  { label: "Header", column: 0, build: addHeader },
  {
    label: "Theme · Light",
    column: 0,
    build: (p, i) => addThemeSection(p, i, "light"),
  },
  {
    label: "Theme · Dark",
    column: 0,
    build: (p, i) => addThemeSection(p, i, "dark"),
  },
  { label: "Tailwind palette", column: 0, build: addTailwindPalette },
  { label: "Spacing scale", column: 0, build: addSpacingScale },
  { label: "Icons", column: 0, build: addIconLibrary },
  // Right column: the non-color scales and tokens.
  { label: "Border radius", column: 1, build: addRadiusScale },
  { label: "Border widths", column: 1, build: addBorderWidthScale },
  { label: "Box shadows", column: 1, build: addBoxShadows },
  { label: "Blur & backdrop", column: 1, build: addBlurAndBackdrop },
  { label: "Opacity scale", column: 1, build: addOpacityScale },
  // Typography last — its many subsections make it the tallest panel and
  // having it at the bottom keeps the rest of the page scannable.
  { label: "Typography", column: 1, build: addTypography },
];

export async function buildDesignSystem(
  inputs: DesignSystemInputs,
): Promise<DesignSystemResult> {
  // The "dynamic-page" manifest setting requires us to load all pages before
  // we can search for an existing page by name.
  await figma.loadAllPagesAsync();

  // Reset (or create) the page so the layout stays clean across re-runs.
  let page = figma.root.children.find(
    (child) => child.type === "PAGE" && child.name === PAGE_NAME,
  ) as PageNode | undefined;

  if (page) {
    for (const node of [...page.children]) node.remove();
  } else {
    page = figma.createPage();
    page.name = PAGE_NAME;
  }

  // Load the preset's body + heading fonts (plus the Inter fallback) and make
  // them the active context so every section can apply them. Figma falls back
  // gracefully on machines that don't have a given family.
  await loadDesignSystemFonts(inputs);

  const total = SECTIONS.length;
  let count = 0;

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i]!;
    inputs.onProgress?.(i, total, section.label);
    count += await section.build(page, inputs);
    // Yield to the event loop so the UI can paint between sections.
    await Promise.resolve();
  }
  inputs.onProgress?.(total, total, "Done");

  // Bind the remaining non-color primitives (spacing, padding, gaps, border
  // widths, radii, font sizes) wherever a literal matches a token, so later
  // variable edits reflow the page instead of leaving frozen literals.
  for (const child of page.children) {
    applyTokenBindings(child as SceneNode, inputs.primitives);
  }

  // Lay out the section frames across two columns, keeping each section in
  // its assigned column (all color sections stay together).
  layoutSectionsInColumns(page);

  // Move the user to the page and frame the result.
  await figma.setCurrentPageAsync(page);
  if (page.children.length > 0) {
    page.selection = [page.children[0] as SceneNode];
    figma.viewport.scrollAndZoomIntoView(page.children as SceneNode[]);
  }

  return { nodeCount: count };
}

function layoutSectionsInColumns(page: PageNode) {
  const COLUMN_COUNT = 2;
  // Track the running height (next free y) of each column so sections stack
  // top-to-bottom within their assigned column.
  const columnHeights = new Array<number>(COLUMN_COUNT).fill(0);

  // page.children mirrors the SECTIONS order, since each builder appends
  // exactly one top-level frame in sequence. Use that to read each section's
  // pinned column.
  page.children.forEach((child, index) => {
    if (!("x" in child)) return;
    const node = child as SceneNode & {
      x: number;
      y: number;
      height: number;
    };

    const target = SECTIONS[index]?.column ?? 0;

    node.x = target * (SECTION_WIDTH + SECTION_GAP);
    node.y = columnHeights[target]!;

    const height = node.height ?? 0;
    columnHeights[target] = columnHeights[target]! + height + SECTION_GAP;
  });
}
