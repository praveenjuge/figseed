// Combobox: an autocomplete input paired with a popover list. shadcn composes
// it from an InputGroup trigger (`h-8 rounded-lg border-input` with a trailing
// chevron) over a ComboboxContent popover (`rounded-lg bg-popover p-1 shadow-md
// ring-1 ring-foreground/10`). Items mirror ComboboxItem (`gap-2 rounded-md
// py-1 pr-8 pl-1.5 text-sm`) with a trailing check on the selected option
// (`data-highlighted:bg-accent`).
//
// We render the open state — trigger + popup list — as one demo so designers
// see the whole pattern at a glance.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { applyEffectStyle } from "../../effectStyles";
import { createIcon, resolveIconLibrary } from "../../icons";
import { wrapInSectionCard } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const COMBOBOX_WIDTH = 280;

type Option = { label: string; selected?: boolean };
const OPTIONS: Option[] = [
  { label: "Next.js" },
  { label: "SvelteKit" },
  { label: "Nuxt.js", selected: true },
  { label: "Remix" },
  { label: "Astro" },
];

export async function addComboboxSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = await buildComboboxComponent(inputs);
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
}

async function buildComboboxComponent(
  inputs: ComponentsInputs,
): Promise<ComponentNode> {
  const comp = figma.createComponent();
  comp.name = "Combobox";
  comp.layoutMode = "VERTICAL";
  comp.resize(COMBOBOX_WIDTH, 10);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  // sideOffset between the trigger and the popup (`sideOffset={6}`).
  comp.itemSpacing = 6;
  comp.fills = [];
  comp.strokes = [];

  // Trigger (InputGroup with a trailing chevron).
  const trigger = buildTrigger(inputs);
  comp.appendChild(trigger);
  trigger.layoutSizingHorizontal = "FILL";

  // Popup content with the option list.
  const popup = buildPopup(inputs);
  comp.appendChild(popup);
  popup.layoutSizingHorizontal = "FILL";
  // ComboboxContent uses `shadow-md`.
  await applyEffectStyle(popup, inputs.effectStyles?.idFor("Shadow/md"));

  return comp;
}

function buildTrigger(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const trigger = figma.createFrame();
  trigger.name = "Trigger";
  trigger.layoutMode = "HORIZONTAL";
  trigger.primaryAxisSizingMode = "FIXED";
  trigger.counterAxisSizingMode = "FIXED";
  trigger.primaryAxisAlignItems = "MIN";
  trigger.counterAxisAlignItems = "CENTER";
  trigger.resize(COMBOBOX_WIDTH, 32);
  // InputGroup: `h-8 rounded-lg border-input`, addon `pr-2`.
  trigger.itemSpacing = 6;
  trigger.paddingLeft = 10;
  trigger.paddingRight = 8;
  trigger.cornerRadius = 8;
  bindCornerRadii(trigger, p.get("radius/lg"));
  bindFill(trigger, t.get("background"));
  bindStrokeColor(trigger, t.get("input"));
  trigger.strokeWeight = 1;
  trigger.strokeAlign = "INSIDE";

  const value = figma.createText();
  applyFont(value, "body", "Regular");
  value.characters = "Nuxt.js";
  value.fontSize = 14;
  bindFontSize(value, p.get("font/size/sm"));
  bindFill(value, t.get("foreground"));
  trigger.appendChild(value);
  value.layoutGrow = 1;

  trigger.appendChild(buildChevronDown(t));

  return trigger;
}

function buildPopup(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const popup = figma.createFrame();
  popup.name = "Content";
  popup.layoutMode = "VERTICAL";
  popup.resize(COMBOBOX_WIDTH, 10);
  popup.primaryAxisSizingMode = "AUTO";
  popup.counterAxisSizingMode = "FIXED";
  // `p-1 rounded-lg`.
  popup.itemSpacing = 0;
  popup.paddingTop = 4;
  popup.paddingBottom = 4;
  popup.paddingLeft = 4;
  popup.paddingRight = 4;
  popup.cornerRadius = 8;
  bindCornerRadii(popup, p.get("radius/lg"));
  bindFill(popup, t.get("popover"));
  bindStrokeColor(popup, t.get("border"));
  popup.strokeWeight = 1;
  popup.strokeAlign = "INSIDE";

  for (const option of OPTIONS) {
    const row = buildOption(inputs, option);
    popup.appendChild(row);
    row.layoutSizingHorizontal = "FILL";
  }

  return popup;
}

function buildOption(inputs: ComponentsInputs, option: Option): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const row = figma.createFrame();
  row.name = option.selected ? "Item (selected)" : "Item";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.primaryAxisAlignItems = "MIN";
  row.counterAxisAlignItems = "CENTER";
  // `gap-2 rounded-md py-1 pr-8 pl-1.5`.
  row.itemSpacing = 8;
  row.paddingLeft = 6;
  row.paddingRight = 8;
  row.paddingTop = 4;
  row.paddingBottom = 4;
  row.cornerRadius = 6;
  bindCornerRadii(row, p.get("radius/md"));
  // The selected (highlighted) row gets the accent surface.
  if (option.selected) {
    bindFill(row, t.get("accent"));
  } else {
    row.fills = [];
  }
  row.strokes = [];

  const label = figma.createText();
  applyFont(label, "body", "Regular");
  label.characters = option.label;
  label.fontSize = 14;
  bindFontSize(label, p.get("font/size/sm"));
  bindFill(
    label,
    option.selected ? t.get("accent-foreground") : t.get("popover-foreground"),
  );
  row.appendChild(label);
  label.layoutGrow = 1;

  // Trailing check indicator on the selected option (`ComboboxItemIndicator`).
  if (option.selected) {
    const check = createIcon({
      library: resolveIconLibrary(inputs.presetSummary),
      name: "check",
      size: 16,
      color: t.get("accent-foreground"),
    });
    if (check) {
      check.name = "Check";
      row.appendChild(check);
    }
  }

  return row;
}

function buildChevronDown(t: Map<string, Variable>): VectorNode {
  const chevron = figma.createVector();
  chevron.name = "Chevron";
  chevron.resize(16, 16);
  chevron.vectorPaths = [
    {
      windingRule: "NONZERO",
      data: "M 4 6 L 8 10 L 12 6",
    },
  ];
  chevron.strokeWeight = 1.5;
  chevron.strokeCap = "ROUND";
  chevron.strokeJoin = "ROUND";
  chevron.fills = [];
  bindStrokeColor(chevron, t.get("muted-foreground"));
  return chevron;
}
