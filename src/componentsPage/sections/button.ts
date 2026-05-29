// Button: 6 variants × 5 sizes, grouped into a Figma component set.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { styleComponentSet } from "../layout";
import { SECTION_WIDTH, type ComponentsInputs } from "../types";
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

const BUTTON_SIZES = [
  "xs",
  "sm",
  "default",
  "lg",
  "icon-xs",
  "icon-sm",
  "icon",
  "icon-lg",
] as const;
type ButtonSize = (typeof BUTTON_SIZES)[number];

function isIconSize(size: ButtonSize): boolean {
  return (
    size === "icon" ||
    size === "icon-xs" ||
    size === "icon-sm" ||
    size === "icon-lg"
  );
}

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
  // Fixed primary-axis width forces the wrap to kick in instead of growing
  // into a single very wide row.
  componentSet.primaryAxisSizingMode = "FIXED";
  componentSet.resize(SECTION_WIDTH, componentSet.height);

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
  comp.fills = [];
  comp.strokes = [];
  // Mirrors radix-nova's per-size gap:
  //   xs/sm: gap-1 (4), default/lg: gap-1.5 (6)
  comp.itemSpacing = size === "xs" || size === "sm" ? 4 : 6;

  if (isIconSize(size)) {
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

  // radix-nova's button uses `rounded-lg` by default (8px at the default
  // 10px radius), and `rounded-[min(var(--radius-md),10/12px)]` for the
  // xs/sm and icon-xs/icon-sm sizes. Mapping:
  //   xs / icon-xs / sm / icon-sm → radius/md (6px)
  //   default / lg / icon / icon-lg → radius/lg (8px)
  const useMdRadius =
    size === "xs" || size === "sm" || size === "icon-xs" || size === "icon-sm";
  comp.cornerRadius = useMdRadius ? 6 : 8;
  bindCornerRadii(comp, p.get(useMdRadius ? "radius/md" : "radius/lg"));

  // Apply variant fill/stroke.
  applyButtonVariant(comp, variant, t);

  // Label text.
  const label = figma.createText();
  label.fontName = { family: "Inter", style: "Medium" };
  label.characters = isIconSize(size) ? "★" : "Button";
  label.fontSize = size === "xs" || size === "icon-xs" ? 12 : 14;
  bindFontSize(
    label,
    size === "xs" || size === "icon-xs"
      ? p.get("font/size/xs")
      : p.get("font/size/sm"),
  );
  applyButtonLabelColor(label, variant, t, inputs.tailwindColors);
  if (variant === "link") {
    label.textDecoration = "UNDERLINE";
  }
  comp.appendChild(label);

  return comp;
}

type ButtonDims = { height: number; paddingX: number; paddingY: number };

function buttonDimensions(size: ButtonSize): ButtonDims {
  // Mirrors radix-nova's button size CVA:
  //   default: h-8 px-2.5 py-2 (32 / 10 / 8)
  //   xs:      h-6 px-2 (24 / 8 / 4)
  //   sm:      h-7 px-2.5 (28 / 10 / 6)
  //   lg:      h-9 px-2.5 py-2 (36 / 10 / 8)
  // Icon sizes are square (size-N).
  switch (size) {
    case "xs":
      return { height: 24, paddingX: 8, paddingY: 4 };
    case "sm":
      return { height: 28, paddingX: 10, paddingY: 6 };
    case "default":
      return { height: 32, paddingX: 10, paddingY: 8 };
    case "lg":
      return { height: 36, paddingX: 10, paddingY: 8 };
    case "icon-xs":
      return { height: 24, paddingX: 0, paddingY: 0 };
    case "icon-sm":
      return { height: 28, paddingX: 0, paddingY: 0 };
    case "icon":
      return { height: 32, paddingX: 0, paddingY: 0 };
    case "icon-lg":
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
      // Solid destructive fill so the Tailwind white label reads against it.
      // (radix-nova's source uses `bg-destructive/10 text-destructive`, but
      // we deliberately keep the readable solid + white pairing here.)
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
  tw: Map<string, Variable>,
) {
  switch (variant) {
    case "default":
      bindFill(node, t.get("primary-foreground"));
      break;
    case "secondary":
      bindFill(node, t.get("secondary-foreground"));
      break;
    case "destructive":
      // Tailwind `white` so the label stays legible on the solid destructive
      // surface regardless of the active preset.
      bindFill(node, tw.get("white"));
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
