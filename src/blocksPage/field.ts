// Shared form-field builder for the auth blocks (login, signup).
//
// A field is a Label over an Input — the same FormItem composition shadcn ships
// and the Components page's Form section models. We embed live instances of the
// page-built Label and Input components so editing either updates every field
// in every block. When the Components page isn't available (isolated callers /
// tests) we fall back to a plain drawn label + input so the block still renders.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../componentsPage/bindings";
import { applyFont } from "../fonts";
import { createColumn } from "./layout";
import type { BlocksInputs } from "./types";
import { fillWidth, instanceFromComponents, overrideFirstText } from "./utils";

// Build one label-over-input field. Reuses the Label + Input instances when the
// Components page is present; otherwise draws plain stand-ins.
export function buildField(
  inputs: BlocksInputs,
  width: number,
  label: string,
  placeholder: string,
): FrameNode {
  const col = createColumn("Field", 8);
  col.resize(width, 10);
  col.primaryAxisSizingMode = "AUTO";
  col.counterAxisSizingMode = "FIXED";

  // Label — reuse the published Label component.
  const labelInstance = instanceFromComponents(
    inputs,
    "Label",
    undefined,
    label,
  );
  if (labelInstance) {
    col.appendChild(labelInstance);
  } else {
    col.appendChild(buildFallbackLabel(inputs, label));
  }

  // Input — reuse the resting default variant so the field reads as a clean
  // empty state, then relabel its placeholder text.
  const inputInstance = instanceFromComponents(
    inputs,
    "Input",
    "State=default, Leading=none",
  );
  if (inputInstance) {
    overrideFirstText(inputInstance, placeholder);
    col.appendChild(inputInstance);
    fillWidth(inputInstance);
  } else {
    const input = buildFallbackInput(inputs, placeholder, width);
    col.appendChild(input);
    fillWidth(input);
  }

  return col;
}

// ----- Fallbacks (used only when the Components page isn't available) -----

function buildFallbackLabel(inputs: BlocksInputs, text: string): TextNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;
  const node = figma.createText();
  applyFont(node, "body", "Medium");
  node.characters = text;
  node.fontSize = 14;
  bindFontSize(node, p.get("font/size/sm"));
  bindFill(node, t.get("foreground"));
  return node;
}

function buildFallbackInput(
  inputs: BlocksInputs,
  value: string,
  width: number,
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const input = figma.createFrame();
  input.name = "Input";
  input.layoutMode = "HORIZONTAL";
  input.primaryAxisSizingMode = "FIXED";
  input.counterAxisSizingMode = "FIXED";
  input.counterAxisAlignItems = "CENTER";
  input.resize(width, 32);
  input.paddingLeft = 10;
  input.paddingRight = 10;
  input.cornerRadius = 8;
  bindCornerRadii(input, p.get("radius/lg"));
  bindFill(input, t.get("background"));
  bindStrokeColor(input, t.get("input"));
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

// Build a primary, full-width action button for an auth form. Reuses the
// published Button (default variant) and relabels it; falls back to a drawn
// button when the Components page isn't available.
export function buildPrimaryButton(
  inputs: BlocksInputs,
  width: number,
  label: string,
): SceneNode {
  const instance = instanceFromComponents(
    inputs,
    "Button",
    "Variant=default, Size=default, State=default",
    label,
  );
  if (instance) {
    instance.resize(width, instance.height || 32);
    fillWidth(instance);
    return instance;
  }
  return buildFallbackButton(inputs, width, label, "primary");
}

// Build a full-width outline button (e.g. "Continue with Google"). Reuses the
// published outline Button variant; falls back to a drawn outline button.
export function buildOutlineButton(
  inputs: BlocksInputs,
  width: number,
  label: string,
): SceneNode {
  const instance = instanceFromComponents(
    inputs,
    "Button",
    "Variant=outline, Size=default, State=default",
    label,
  );
  if (instance) {
    instance.resize(width, instance.height || 32);
    fillWidth(instance);
    return instance;
  }
  return buildFallbackButton(inputs, width, label, "outline");
}

function buildFallbackButton(
  inputs: BlocksInputs,
  width: number,
  label: string,
  variant: "primary" | "outline",
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const button = figma.createFrame();
  button.name = "Button";
  button.layoutMode = "HORIZONTAL";
  button.primaryAxisSizingMode = "FIXED";
  button.counterAxisSizingMode = "FIXED";
  button.primaryAxisAlignItems = "CENTER";
  button.counterAxisAlignItems = "CENTER";
  button.resize(width, 32);
  button.cornerRadius = 8;
  bindCornerRadii(button, p.get("radius/lg"));
  if (variant === "primary") {
    bindFill(button, t.get("primary"));
  } else {
    bindFill(button, t.get("background"));
    bindStrokeColor(button, t.get("border"));
    button.strokeWeight = 1;
  }

  const text = figma.createText();
  applyFont(text, "body", "Medium");
  text.characters = label;
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(
    text,
    variant === "primary" ? t.get("primary-foreground") : t.get("foreground"),
  );
  button.appendChild(text);

  return button;
}
