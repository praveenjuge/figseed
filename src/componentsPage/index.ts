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
import { addButtonGroupSection } from "./sections/buttonGroup";
import { addCalendarSection } from "./sections/calendar";
import { addCardSection } from "./sections/card";
import { addCheckboxSection } from "./sections/checkbox";
import { addCommandSection } from "./sections/command";
import { addDialogSection } from "./sections/dialog";
import { addDropdownMenuSection } from "./sections/dropdownMenu";
import { addEmptySection } from "./sections/empty";
import { addHeader } from "./sections/header";
import { addHoverCardSection } from "./sections/hoverCard";
import { addInputSection } from "./sections/input";
import { addInputOtpSection } from "./sections/inputOtp";
import { addKbdSection } from "./sections/kbd";
import { addLabelSection } from "./sections/label";
import { addPaginationSection } from "./sections/pagination";
import { addPopoverSection } from "./sections/popover";
import { addProgressSection } from "./sections/progress";
import { addRadioGroupSection } from "./sections/radioGroup";
import { addSelectSection } from "./sections/select";
import { addSeparatorSection } from "./sections/separator";
import { addSheetSection } from "./sections/sheet";
import { addSkeletonSection } from "./sections/skeleton";
import { addSliderSection } from "./sections/slider";
import { addSonnerSection } from "./sections/sonner";
import { addSpinnerSection } from "./sections/spinner";
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
  SECTION_WIDTH,
  type ComponentsInputs,
  type ComponentsResult,
  type SectionBuilder,
} from "./types";
import { loadComponentsFonts } from "./utils";
import { ensureEffectStyles } from "../effectStyles";
import { ensureTextStyles, applyTextStyles } from "../textStyles";
import { applyTokenBindings } from "../tokenBindings";

export type { ComponentsInputs, ComponentsResult } from "./types";

// The header is always rendered first; every other section is laid out in
// alphabetical order so newly added components slot into the right place
// automatically. Keep this list sorted by `label` (the runtime sort below is
// a safety net, but a sorted source keeps diffs readable).
const HEADER_SECTION: SectionBuilder = { label: "Header", build: addHeader };

const SECTIONS: SectionBuilder[] = [
  { label: "Accordion", build: addAccordionSection },
  { label: "Alert", build: addAlertSection },
  { label: "Avatar", build: addAvatarSection },
  { label: "Badge", build: addBadgeSection },
  { label: "Breadcrumb", build: addBreadcrumbSection },
  { label: "Button", build: addButtonSection },
  { label: "Button Group", build: addButtonGroupSection },
  { label: "Calendar", build: addCalendarSection },
  { label: "Card", build: addCardSection },
  { label: "Checkbox", build: addCheckboxSection },
  { label: "Command", build: addCommandSection },
  { label: "Dialog", build: addDialogSection },
  { label: "Dropdown Menu", build: addDropdownMenuSection },
  { label: "Empty", build: addEmptySection },
  { label: "Hover Card", build: addHoverCardSection },
  { label: "Input", build: addInputSection },
  { label: "Input OTP", build: addInputOtpSection },
  { label: "Kbd", build: addKbdSection },
  { label: "Label", build: addLabelSection },
  { label: "Pagination", build: addPaginationSection },
  { label: "Popover", build: addPopoverSection },
  { label: "Progress", build: addProgressSection },
  { label: "Radio Group", build: addRadioGroupSection },
  { label: "Select", build: addSelectSection },
  { label: "Separator", build: addSeparatorSection },
  { label: "Sheet", build: addSheetSection },
  { label: "Skeleton", build: addSkeletonSection },
  { label: "Slider", build: addSliderSection },
  { label: "Sonner", build: addSonnerSection },
  { label: "Spinner", build: addSpinnerSection },
  { label: "Switch", build: addSwitchSection },
  { label: "Table", build: addTableSection },
  { label: "Tabs", build: addTabsSection },
  { label: "Textarea", build: addTextareaSection },
  { label: "Toggle", build: addToggleSection },
  { label: "Toggle Group", build: addToggleGroupSection },
  { label: "Tooltip", build: addTooltipSection },
];

// Header first, then every other section alphabetically by label.
const ORDERED_SECTIONS: SectionBuilder[] = [
  HEADER_SECTION,
  ...[...SECTIONS].sort((a, b) => a.label.localeCompare(b.label)),
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

  await loadComponentsFonts(inputs);

  // Publish/refresh the shadow + blur effect styles (idempotent) so component
  // sections can reference real styles instead of literal effects.
  const effectStyles =
    inputs.effectStyles ?? (await ensureEffectStyles(inputs.primitives));
  const inputsWithStyles: ComponentsInputs = { ...inputs, effectStyles };

  // Publish/refresh the Tailwind typography text styles so matching component
  // text nodes can be mapped onto a published style after the build.
  const textStyles =
    inputs.textStyles ??
    (await ensureTextStyles(inputs.primitives, inputs.fontVars));

  const total = ORDERED_SECTIONS.length;
  let count = 0;

  for (let i = 0; i < ORDERED_SECTIONS.length; i++) {
    const section = ORDERED_SECTIONS[i]!;
    inputs.onProgress?.(i, total, section.label);
    count += await section.build(page, inputsWithStyles);
    await Promise.resolve();
  }
  inputs.onProgress?.(total, total, "Done");

  // Map eligible text nodes onto their Tailwind text style before the token
  // sweep, so the style owns each node's font size + line height.
  for (const child of page.children) {
    await applyTextStyles(child as SceneNode, textStyles);
  }

  // Bind the remaining non-color primitives (spacing, padding, gaps, border
  // widths, radii, font sizes) wherever a literal matches a token, so later
  // variable edits reflow the components instead of leaving frozen literals.
  for (const child of page.children) {
    applyTokenBindings(child as SceneNode, inputs.primitives);
  }

  layoutSectionsInColumns(page);
  return { nodeCount: count };
}

// Lay the section frames out across two equal-width columns (mirroring the
// Design System page) so the page stays compact instead of running down a
// single tall column. The header pins to the top-left; every other section is
// placed into whichever column is currently shorter, preserving the
// alphabetical build order while keeping the two columns balanced in height.
function layoutSectionsInColumns(page: PageNode) {
  const COLUMN_COUNT = 2;
  const columnHeights = new Array<number>(COLUMN_COUNT).fill(0);

  page.children.forEach((child, index) => {
    if (!("x" in child)) return;
    const node = child as SceneNode & {
      x: number;
      y: number;
      height: number;
    };

    // The header (first child) always anchors the top of the left column.
    let target = 0;
    if (index > 0) {
      // Pick the shorter column so the two stacks stay balanced.
      target = columnHeights[1]! < columnHeights[0]! ? 1 : 0;
    }

    node.x = target * (SECTION_WIDTH + SECTION_GAP);
    node.y = columnHeights[target]!;

    const height = node.height ?? 0;
    columnHeights[target] = columnHeights[target]! + height + SECTION_GAP;
  });
}
