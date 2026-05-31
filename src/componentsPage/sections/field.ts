// Field: the form-field wrapper that groups a label, control, and description
// (plus an optional error). Mirrors radix-nova's Field primitives:
//
//   Field        `flex w-full gap-2`, vertical or horizontal orientation
//   FieldLabel   `text-sm font-medium leading-snug` (foreground)
//   FieldDescription `text-sm text-muted-foreground`
//   FieldError   `text-sm font-normal text-destructive`
//
// We surface the meaningful compositions as an `Orientation` axis:
//   vertical    — label over an input over a description (the default)
//   horizontal  — a switch-style control with the label/description beside it
//   invalid     — the vertical layout with a destructive error message
//
// The control is a faithful copy of radix-nova's Input (`h-8 px-2.5 rounded-lg
// border-input`) / Switch so the field reads as a real form row.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const FIELD_VARIANTS = ["vertical", "horizontal", "invalid"] as const;
type FieldVariant = (typeof FIELD_VARIANTS)[number];

const FIELD_WIDTH = 320;

export async function addFieldSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const variant of FIELD_VARIANTS) {
    const comp = buildFieldComponent(inputs, variant);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Field";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildFieldComponent(
  inputs: ComponentsInputs,
  variant: FieldVariant,
): ComponentNode {
  const comp = figma.createComponent();
  comp.name = `Orientation=${variant}`;
  comp.resize(FIELD_WIDTH, 10);

  if (variant === "horizontal") {
    return buildHorizontalField(comp, inputs);
  }
  return buildVerticalField(comp, inputs, variant === "invalid");
}

// Vertical field: `flex-col gap-2` — label, control, description (and an error
// message replacing the description when invalid).
function buildVerticalField(
  comp: ComponentNode,
  inputs: ComponentsInputs,
  invalid: boolean,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  comp.layoutMode = "VERTICAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  // `gap-2`.
  comp.itemSpacing = 8;
  comp.fills = [];
  comp.strokes = [];

  const label = buildLabel(inputs, "Email", invalid);
  comp.appendChild(label);

  const input = buildInput(inputs, "you@example.com", invalid);
  comp.appendChild(input);
  input.layoutSizingHorizontal = "FILL";

  if (invalid) {
    const error = figma.createText();
    applyFont(error, "body", "Regular");
    error.characters = "Enter a valid email address.";
    error.fontSize = 14;
    bindFontSize(error, p.get("font/size/sm"));
    bindFill(error, t.get("destructive"));
    comp.appendChild(error);
    error.layoutSizingHorizontal = "FILL";
  } else {
    const desc = buildDescription(
      inputs,
      "We'll use this to send you receipts.",
    );
    comp.appendChild(desc);
    desc.layoutSizingHorizontal = "FILL";
  }

  return comp;
}

// Horizontal field: `flex-row items-start gap-2` — a switch control with the
// label + description stacked to its right (FieldContent).
function buildHorizontalField(
  comp: ComponentNode,
  inputs: ComponentsInputs,
): ComponentNode {
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "MIN";
  // `gap-2`.
  comp.itemSpacing = 8;
  comp.fills = [];
  comp.strokes = [];

  const content = figma.createFrame();
  content.name = "Field Content";
  content.layoutMode = "VERTICAL";
  content.primaryAxisSizingMode = "AUTO";
  content.counterAxisSizingMode = "AUTO";
  // FieldContent: `gap-0.5 leading-snug`.
  content.itemSpacing = 2;
  content.fills = [];
  content.strokes = [];

  content.appendChild(buildLabel(inputs, "Marketing emails", false));
  content.appendChild(
    buildDescription(inputs, "Receive product updates and announcements."),
  );

  comp.appendChild(content);
  content.layoutGrow = 1;
  content.layoutSizingHorizontal = "FILL";

  comp.appendChild(buildSwitch(inputs));

  return comp;
}

function buildLabel(
  inputs: ComponentsInputs,
  text: string,
  invalid: boolean,
): TextNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const label = figma.createText();
  applyFont(label, "body", "Medium");
  label.characters = text;
  label.fontSize = 14;
  bindFontSize(label, p.get("font/size/sm"));
  // `data-[invalid=true]:text-destructive` propagates to the label.
  bindFill(label, invalid ? t.get("destructive") : t.get("foreground"));
  return label;
}

function buildDescription(inputs: ComponentsInputs, text: string): TextNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const desc = figma.createText();
  applyFont(desc, "body", "Regular");
  desc.characters = text;
  desc.fontSize = 14;
  bindFontSize(desc, p.get("font/size/sm"));
  bindFill(desc, t.get("muted-foreground"));
  return desc;
}

// Mirrors radix-nova's Input (`h-8 px-2.5 py-1 rounded-lg border-input`).
function buildInput(
  inputs: ComponentsInputs,
  value: string,
  invalid: boolean,
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const input = figma.createFrame();
  input.name = "Input";
  input.layoutMode = "HORIZONTAL";
  input.primaryAxisSizingMode = "FIXED";
  input.counterAxisSizingMode = "FIXED";
  input.counterAxisAlignItems = "CENTER";
  input.resize(FIELD_WIDTH, 32);
  input.paddingLeft = 10;
  input.paddingRight = 10;
  input.paddingTop = 4;
  input.paddingBottom = 4;
  input.cornerRadius = 8;
  bindCornerRadii(input, p.get("radius/lg"));
  bindFill(input, t.get("background"));
  bindStrokeColor(input, invalid ? t.get("destructive") : t.get("input"));
  input.strokeWeight = 1;

  const text = figma.createText();
  applyFont(text, "body", "Regular");
  text.characters = value;
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, t.get("muted-foreground"));
  input.appendChild(text);

  return input;
}

// A small "on" switch (mirrors radix-nova's Switch: `h-[1.15rem] w-8 rounded-
// full bg-primary` with a `size-4` thumb pushed to the right).
function buildSwitch(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;

  const track = figma.createFrame();
  track.name = "Switch";
  track.layoutMode = "HORIZONTAL";
  track.primaryAxisSizingMode = "FIXED";
  track.counterAxisSizingMode = "FIXED";
  track.primaryAxisAlignItems = "MAX";
  track.counterAxisAlignItems = "CENTER";
  track.resize(32, 18);
  track.paddingLeft = 2;
  track.paddingRight = 2;
  track.cornerRadius = 999;
  bindFill(track, t.get("primary"));
  track.strokes = [];

  const thumb = figma.createEllipse();
  thumb.name = "Thumb";
  thumb.resize(14, 14);
  bindFill(thumb, t.get("background"));
  track.appendChild(thumb);

  return track;
}
