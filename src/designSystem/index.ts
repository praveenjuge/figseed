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
import { addOpacityScale } from "./sections/opacity";
import { addRadiusScale } from "./sections/radius";
import { addSpacingScale } from "./sections/spacing";
import { addTailwindPalette } from "./sections/tailwindPalette";
import { addThemeSection } from "./sections/theme";
import { addTypography } from "./sections/typography";
import {
  PAGE_NAME,
  SECTION_GAP,
  type DesignSystemInputs,
  type DesignSystemResult,
  type SectionBuilder,
} from "./types";
import { loadCommonFonts } from "./utils";

export type { DesignSystemInputs, DesignSystemResult } from "./types";

const SECTIONS: SectionBuilder[] = [
  { label: "Header", build: addHeader },
  { label: "Theme · Light", build: (p, i) => addThemeSection(p, i, "light") },
  { label: "Theme · Dark", build: (p, i) => addThemeSection(p, i, "dark") },
  { label: "Tailwind palette", build: addTailwindPalette },
  { label: "Border radius", build: addRadiusScale },
  { label: "Spacing scale", build: addSpacingScale },
  { label: "Border widths", build: addBorderWidthScale },
  { label: "Box shadows", build: addBoxShadows },
  { label: "Blur & backdrop", build: addBlurAndBackdrop },
  { label: "Opacity scale", build: addOpacityScale },
  // Typography last — its many subsections make it the tallest panel and
  // having it at the bottom keeps the rest of the page scannable.
  { label: "Typography", build: addTypography },
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

  // Loading the regular sans family is enough for every text node we create.
  // Figma will fall back gracefully on machines that don't have Inter.
  await loadCommonFonts();

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

  // Lay out the section frames in a single vertical stack down the page.
  layoutSectionsVertically(page);

  // Move the user to the page and frame the result.
  await figma.setCurrentPageAsync(page);
  if (page.children.length > 0) {
    page.selection = [page.children[0] as SceneNode];
    figma.viewport.scrollAndZoomIntoView(page.children as SceneNode[]);
  }

  return { nodeCount: count };
}

function layoutSectionsVertically(page: PageNode) {
  let y = 0;
  for (const child of page.children) {
    if (!("x" in child)) continue;
    (child as SceneNode & { x: number; y: number }).x = 0;
    (child as SceneNode & { x: number; y: number }).y = y;
    const height = (child as SceneNode & { height: number }).height ?? 0;
    y += height + SECTION_GAP;
  }
}
