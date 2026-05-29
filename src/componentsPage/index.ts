// Builds a "Components" page with real Figma components (ComponentNode /
// ComponentSetNode) so designers can drag instances and swap variants.
//
// Each component is created via figma.createComponent(), grouped into a
// ComponentSet when there are multiple variants. The page only holds the
// components themselves — no example frames or showcases.

import { addAccordionSection } from "./sections/accordion";
import { addAlertSection } from "./sections/alert";
import { addAvatarSection } from "./sections/avatar";
import { addBadgeSection } from "./sections/badge";
import { addBreadcrumbSection } from "./sections/breadcrumb";
import { addButtonSection } from "./sections/button";
import { addCardSection } from "./sections/card";
import { addCheckboxSection } from "./sections/checkbox";
import { addDialogSection } from "./sections/dialog";
import { addHeader } from "./sections/header";
import { addInputSection } from "./sections/input";
import { addInputOtpSection } from "./sections/inputOtp";
import { addKbdSection } from "./sections/kbd";
import { addLabelSection } from "./sections/label";
import { addPaginationSection } from "./sections/pagination";
import { addProgressSection } from "./sections/progress";
import { addRadioGroupSection } from "./sections/radioGroup";
import { addSelectSection } from "./sections/select";
import { addSeparatorSection } from "./sections/separator";
import { addSkeletonSection } from "./sections/skeleton";
import { addSliderSection } from "./sections/slider";
import { addSwitchSection } from "./sections/switch";
import { addTableSection } from "./sections/table";
import { addTabsSection } from "./sections/tabs";
import { addTextareaSection } from "./sections/textarea";
import { addToggleSection } from "./sections/toggle";
import { addToggleGroupSection } from "./sections/toggleGroup";
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
  { label: "Toggle Group", build: addToggleGroupSection },
  { label: "Badge", build: addBadgeSection },
  { label: "Avatar", build: addAvatarSection },
  { label: "Label", build: addLabelSection },
  { label: "Input", build: addInputSection },
  { label: "Input OTP", build: addInputOtpSection },
  { label: "Textarea", build: addTextareaSection },
  { label: "Select", build: addSelectSection },
  { label: "Checkbox", build: addCheckboxSection },
  { label: "Radio Group", build: addRadioGroupSection },
  { label: "Switch", build: addSwitchSection },
  { label: "Slider", build: addSliderSection },
  { label: "Progress", build: addProgressSection },
  { label: "Skeleton", build: addSkeletonSection },
  { label: "Separator", build: addSeparatorSection },
  { label: "Tabs", build: addTabsSection },
  { label: "Accordion", build: addAccordionSection },
  { label: "Breadcrumb", build: addBreadcrumbSection },
  { label: "Pagination", build: addPaginationSection },
  { label: "Table", build: addTableSection },
  { label: "Tooltip", build: addTooltipSection },
  { label: "Kbd", build: addKbdSection },
  { label: "Card", build: addCardSection },
  { label: "Dialog", build: addDialogSection },
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
