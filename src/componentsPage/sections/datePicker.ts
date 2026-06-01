// Date Picker: the trigger button for a calendar popover. shadcn builds the
// Date Picker by composing a Popover trigger (an outline button with a leading
// calendar icon showing the selected date) over the Calendar. The Calendar
// itself already has its own section, so here we render the trigger in its two
// meaningful states: empty (placeholder, muted) and a picked date.
//
// Mirrors the date-picker demo trigger: `w-[240px] justify-start text-left
// font-normal` outline button, `text-muted-foreground` when no date is set.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { createIcon, resolveIconLibrary } from "../../icons";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const DATE_PICKER_STATES = ["empty", "selected"] as const;
type DatePickerState = (typeof DATE_PICKER_STATES)[number];

const TRIGGER_WIDTH = 240;
const TRIGGER_HEIGHT = 32;

export async function addDatePickerSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const state of DATE_PICKER_STATES) {
    const comp = buildDatePickerComponent(inputs, state);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Date Picker";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildDatePickerComponent(
  inputs: ComponentsInputs,
  state: DatePickerState,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;
  const isEmpty = state === "empty";

  const comp = figma.createComponent();
  comp.name = `State=${state}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  comp.resize(TRIGGER_WIDTH, TRIGGER_HEIGHT);
  // Outline button: `h-8 px-2.5 rounded-lg gap-2 justify-start`.
  comp.itemSpacing = 8;
  comp.paddingLeft = 10;
  comp.paddingRight = 10;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  bindFill(comp, t.get("background"));
  bindStrokeColor(comp, t.get("input"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";

  // Leading calendar icon (`size-4`), tinted muted-foreground. Falls back to a
  // small framed square when the library lacks a candidate.
  const iconColor = t.get("muted-foreground");
  const icon = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: "folder",
    size: 16,
    color: iconColor,
  });
  if (icon) {
    icon.name = "Icon";
    comp.appendChild(icon);
  }

  const text = figma.createText();
  applyFont(text, "body", "Regular");
  text.characters = isEmpty ? "Pick a date" : "June 17, 2025";
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, isEmpty ? t.get("muted-foreground") : t.get("foreground"));
  comp.appendChild(text);

  return comp;
}
