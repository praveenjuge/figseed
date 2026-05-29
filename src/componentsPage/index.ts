// Builds a "Components" page with real Figma components (ComponentNode /
// ComponentSetNode) so designers can drag instances and swap variants.
//
// Each component is created via figma.createComponent(), grouped into a
// ComponentSet when there are multiple variants. The page only holds the
// components themselves — no example frames or showcases.

import { addAlertSection } from "./sections/alert";
import { addAvatarSection } from "./sections/avatar";
import { addBadgeSection } from "./sections/badge";
import { addBreadcrumbSection } from "./sections/breadcrumb";
import { addButtonSection } from "./sections/button";
import { addCardSection } from "./sections/card";
import { addCheckboxSection } from "./sections/checkbox";
import { addHeader } from "./sections/header";
import { addInputSection } from "./sections/input";
import { addProgressSection } from "./sections/progress";
import { addRadioGroupSection } from "./sections/radioGroup";
import { addSkeletonSection } from "./sections/skeleton";
import { addSliderSection } from "./sections/slider";
import { addSwitchSection } from "./sections/switch";
import { addTabsSection } from "./sections/tabs";
import { addTextareaSection } from "./sections/textarea";
import { addToggleSection } from "./sections/toggle";
import { addTooltipSection } from "./sections/tooltip";
import {
  PAGE_NAME,
  SECTION_GAP,
  type ComponentsInputs,
  type ComponentsResult,
  type SectionBuilder,
} from "./types";
import { loadCommonFonts } from "./utils";

export type { ComponentsInputs, ComponentsResult } from "./types";

const SECTIONS: SectionBuilder[] = [
  { label: "Header", build: addHeader },
  { label: "Button", build: addButtonSection },
  { label: "Toggle", build: addToggleSection },
  { label: "Badge", build: addBadgeSection },
  { label: "Avatar", build: addAvatarSection },
  { label: "Input", build: addInputSection },
  { label: "Textarea", build: addTextareaSection },
  { label: "Checkbox", build: addCheckboxSection },
  { label: "Radio Group", build: addRadioGroupSection },
  { label: "Switch", build: addSwitchSection },
  { label: "Slider", build: addSliderSection },
  { label: "Progress", build: addProgressSection },
  { label: "Skeleton", build: addSkeletonSection },
  { label: "Tabs", build: addTabsSection },
  { label: "Breadcrumb", build: addBreadcrumbSection },
  { label: "Tooltip", build: addTooltipSection },
  { label: "Card", build: addCardSection },
  { label: "Alert", build: addAlertSection },
];

export async function buildComponentsPage(
  inputs: ComponentsInputs,
): Promise<ComponentsResult> {
  await figma.loadAllPagesAsync();

  let page = figma.root.children.find(
    (child) => child.type === "PAGE" && child.name === PAGE_NAME,
  ) as PageNode | undefined;

  if (page) {
    for (const node of [...page.children]) node.remove();
  } else {
    page = figma.createPage();
    page.name = PAGE_NAME;
  }

  await loadCommonFonts();

  const total = SECTIONS.length;
  let count = 0;

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i]!;
    inputs.onProgress?.(i, total, section.label);
    count += await section.build(page, inputs);
    await Promise.resolve();
  }
  inputs.onProgress?.(total, total, "Done");

  layoutSectionsVertically(page);
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
