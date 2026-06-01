// Builds a "Components" page with real Figma components (ComponentNode /
// ComponentSetNode) so designers can drag instances and swap variants.
//
// Each component is created via figma.createComponent(), grouped into a
// ComponentSet when there are multiple variants. The page only holds the
// components themselves — no example frames or showcases.

import { addAccordionSection } from "./sections/accordion";
import { addAlertSection } from "./sections/alert";
import { addAlertDialogSection } from "./sections/alertDialog";
import { addAspectRatioSection } from "./sections/aspectRatio";
import { addAvatarSection } from "./sections/avatar";
import { addBadgeSection } from "./sections/badge";
import { addBreadcrumbSection } from "./sections/breadcrumb";
import { addButtonSection } from "./sections/button";
import { addButtonGroupSection } from "./sections/buttonGroup";
import { addCalendarSection } from "./sections/calendar";
import { addCardSection } from "./sections/card";
import { addCarouselSection } from "./sections/carousel";
import { addChartSection } from "./sections/chart";
import { addCheckboxSection } from "./sections/checkbox";
import { addCollapsibleSection } from "./sections/collapsible";
import { addComboboxSection } from "./sections/combobox";
import { addCommandSection } from "./sections/command";
import { addContextMenuSection } from "./sections/contextMenu";
import { addDataTableSection } from "./sections/dataTable";
import { addDatePickerSection } from "./sections/datePicker";
import { addDialogSection } from "./sections/dialog";
import { addDrawerSection } from "./sections/drawer";
import { addDropdownMenuSection } from "./sections/dropdownMenu";
import { addEmptySection } from "./sections/empty";
import { addFieldSection } from "./sections/field";
import { addFormSection } from "./sections/form";
import { addHeader } from "./sections/header";
import { addHoverCardSection } from "./sections/hoverCard";
import { addInputSection } from "./sections/input";
import { addInputGroupSection } from "./sections/inputGroup";
import { addInputOtpSection } from "./sections/inputOtp";
import { addItemSection } from "./sections/item";
import { addKbdSection } from "./sections/kbd";
import { addLabelSection } from "./sections/label";
import { addMenubarSection } from "./sections/menubar";
import { addNativeSelectSection } from "./sections/nativeSelect";
import { addNavigationMenuSection } from "./sections/navigationMenu";
import { addPaginationSection } from "./sections/pagination";
import { addPopoverSection } from "./sections/popover";
import { addProgressSection } from "./sections/progress";
import { addRadioGroupSection } from "./sections/radioGroup";
import { addResizableSection } from "./sections/resizable";
import { addScrollAreaSection } from "./sections/scrollArea";
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
import { addTypographySection } from "./sections/typography";
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
  { label: "Alert Dialog", build: addAlertDialogSection },
  { label: "Aspect Ratio", build: addAspectRatioSection },
  { label: "Avatar", build: addAvatarSection },
  { label: "Badge", build: addBadgeSection },
  { label: "Breadcrumb", build: addBreadcrumbSection },
  { label: "Button", build: addButtonSection },
  { label: "Button Group", build: addButtonGroupSection },
  { label: "Calendar", build: addCalendarSection },
  { label: "Card", build: addCardSection },
  { label: "Carousel", build: addCarouselSection },
  { label: "Chart", build: addChartSection },
  { label: "Checkbox", build: addCheckboxSection },
  { label: "Collapsible", build: addCollapsibleSection },
  { label: "Combobox", build: addComboboxSection },
  { label: "Command", build: addCommandSection },
  { label: "Context Menu", build: addContextMenuSection },
  { label: "Data Table", build: addDataTableSection },
  { label: "Date Picker", build: addDatePickerSection },
  { label: "Dialog", build: addDialogSection },
  { label: "Drawer", build: addDrawerSection },
  { label: "Dropdown Menu", build: addDropdownMenuSection },
  { label: "Empty", build: addEmptySection },
  { label: "Field", build: addFieldSection },
  { label: "Hover Card", build: addHoverCardSection },
  { label: "Input", build: addInputSection },
  { label: "Input Group", build: addInputGroupSection },
  { label: "Input OTP", build: addInputOtpSection },
  { label: "Item", build: addItemSection },
  { label: "Kbd", build: addKbdSection },
  { label: "Label", build: addLabelSection },
  { label: "Menubar", build: addMenubarSection },
  { label: "Native Select", build: addNativeSelectSection },
  { label: "Navigation Menu", build: addNavigationMenuSection },
  { label: "Pagination", build: addPaginationSection },
  { label: "Popover", build: addPopoverSection },
  { label: "Progress", build: addProgressSection },
  { label: "Radio Group", build: addRadioGroupSection },
  { label: "Resizable", build: addResizableSection },
  { label: "Scroll Area", build: addScrollAreaSection },
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
  { label: "Typography", build: addTypographySection },
];

// Sections that embed live instances of other page-built components (the same
// reuse model the Toggle uses for the published icon set). They must run after
// every component set above exists on the page, so they're appended after the
// alphabetical pass rather than sorted into it. Form reuses Button, Input, and
// Label.
const DEFERRED_SECTIONS: SectionBuilder[] = [
  { label: "Form", build: addFormSection },
];

// Header first, then every other section alphabetically by label, then the
// deferred sections that depend on the others already being built.
const ORDERED_SECTIONS: SectionBuilder[] = [
  HEADER_SECTION,
  ...[...SECTIONS].sort((a, b) => a.label.localeCompare(b.label)),
  ...DEFERRED_SECTIONS,
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

// Lay the section frames out across three equal-width columns (mirroring the
// Design System page) so the page stays compact instead of running down a
// single tall column. The header pins to the top-left; every other section is
// placed into whichever column is currently shortest, preserving the
// alphabetical build order while keeping the columns balanced in height.
function layoutSectionsInColumns(page: PageNode) {
  const COLUMN_COUNT = 4;
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
      // Pick the shortest column so the stacks stay balanced.
      for (let col = 1; col < COLUMN_COUNT; col++) {
        if (columnHeights[col]! < columnHeights[target]!) target = col;
      }
    }

    node.x = target * (SECTION_WIDTH + SECTION_GAP);
    node.y = columnHeights[target]!;

    const height = node.height ?? 0;
    columnHeights[target] = columnHeights[target]! + height + SECTION_GAP;
  });
}
