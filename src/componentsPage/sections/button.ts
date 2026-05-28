// Button: 6 variants × 5 sizes, grouped into a Figma component set.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const;
type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const BUTTON_SIZES = ["xs", "sm", "default", "lg", "icon"] as const;
type ButtonSize = (typeof BUTTON_SIZES)[number];

export async function addButtonSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  // Build one ComponentNode per (variant, size) combination, then group
  // them into a ComponentSet so Figma shows a variant picker.
  const components: ComponentNode[] = [];

  for (const variant of BUTTON_VARIANTS) {
    for (const size of BUTTON_SIZES) {
      const comp = buildButtonComponent(inputs, variant, size);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  // Create the component set from all variants.
  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Button";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.layoutWrap = "WRAP";
  componentSet.itemSpacing = 16;
  componentSet.counterAxisSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildButtonComponent(
  inputs: ComponentsInputs,
  variant: ButtonVariant,
  size: ButtonSize,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;
  const dims = buttonDimensions(size);

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}, Size=${size}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  comp.itemSpacing = 8;
  comp.fills = [];
  comp.strokes = [];

  if (size === "icon") {
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";
    comp.resize(dims.height, dims.height);
  } else {
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "AUTO";
    comp.paddingLeft = dims.paddingX;
    comp.paddingRight = dims.paddingX;
    comp.paddingTop = dims.paddingY;
    comp.paddingBottom = dims.paddingY;
  }

  comp.cornerRadius = 6;
  bindCornerRadii(comp, p.get("radius/md"));

  // Apply variant fill/stroke.
  applyButtonVariant(comp, variant, t);

  // Label text.
  const label = figma.createText();
  label.fontName = { family: "Inter", style: "Medium" };
  label.characters = size === "icon" ? "★" : "Button";
  label.fontSize = size === "xs" ? 12 : 14;
  bindFontSize(
    label,
    size === "xs" ? p.get("font/size/xs") : p.get("font/size/sm"),
  );
  applyButtonLabelColor(label, variant, t);
  if (variant === "link") {
    label.textDecoration = "UNDERLINE";
  }
  comp.appendChild(label);

  return comp;
}

type ButtonDims = { height: number; paddingX: number; paddingY: number };

function buttonDimensions(size: ButtonSize): ButtonDims {
  switch (size) {
    case "xs":
      return { height: 24, paddingX: 8, paddingY: 4 };
    case "sm":
      return { height: 32, paddingX: 12, paddingY: 6 };
    case "default":
      return { height: 36, paddingX: 16, paddingY: 8 };
    case "lg":
      return { height: 40, paddingX: 24, paddingY: 8 };
    case "icon":
      return { height: 36, paddingX: 0, paddingY: 0 };
  }
}

function applyButtonVariant(
  node: FrameNode | ComponentNode,
  variant: ButtonVariant,
  t: Map<string, Variable>,
) {
  switch (variant) {
    case "default":
      bindFill(node, t.get("primary"));
      break;
    case "secondary":
      bindFill(node, t.get("secondary"));
      break;
    case "destructive":
      bindFill(node, t.get("destructive"));
      break;
    case "outline":
      bindFill(node, t.get("background"));
      bindStrokeColor(node, t.get("border"));
      node.strokeWeight = 1;
      break;
    case "ghost":
      node.fills = [];
      break;
    case "link":
      node.fills = [];
      break;
  }
}

function applyButtonLabelColor(
  node: TextNode,
  variant: ButtonVariant,
  t: Map<string, Variable>,
) {
  switch (variant) {
    case "default":
      bindFill(node, t.get("primary-foreground"));
      break;
    case "secondary":
      bindFill(node, t.get("secondary-foreground"));
      break;
    case "destructive":
      bindFill(node, t.get("destructive-foreground"));
      break;
    case "outline":
    case "ghost":
      bindFill(node, t.get("foreground"));
      break;
    case "link":
      bindFill(node, t.get("primary"));
      break;
  }
}
