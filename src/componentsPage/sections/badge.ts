// Badge: pill-shaped labels for status, counts, and tags. Four variants.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const BADGE_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const;
type BadgeVariant = (typeof BADGE_VARIANTS)[number];

export async function addBadgeSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const variant of BADGE_VARIANTS) {
    const comp = buildBadgeComponent(inputs, variant);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Badge";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildBadgeComponent(
  inputs: ComponentsInputs,
  variant: BadgeVariant,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  // Mirrors shadcn's Badge: `px-2 py-0.5 text-xs font-medium rounded-full`.
  comp.itemSpacing = 4;
  comp.paddingLeft = 8;
  comp.paddingRight = 8;
  comp.paddingTop = 2;
  comp.paddingBottom = 2;
  comp.cornerRadius = 9999;
  bindCornerRadii(comp, p.get("radius/full"));
  comp.fills = [];
  comp.strokes = [];

  switch (variant) {
    case "default":
      bindFill(comp, t.get("primary"));
      break;
    case "secondary":
      bindFill(comp, t.get("secondary"));
      break;
    case "destructive":
      bindFill(comp, t.get("destructive"));
      break;
    case "outline":
      bindStrokeColor(comp, t.get("border"));
      comp.strokeWeight = 1;
      break;
    case "ghost":
    case "link":
      // `ghost` and `link` have no resting background; they only differ in
      // hover/underline behaviour, which doesn't translate to Figma.
      break;
  }

  const label = figma.createText();
  label.fontName = { family: "Inter", style: "Medium" };
  label.characters = "Badge";
  label.fontSize = 12;
  bindFontSize(label, p.get("font/size/xs"));

  switch (variant) {
    case "default":
      bindFill(label, t.get("primary-foreground"));
      break;
    case "secondary":
      bindFill(label, t.get("secondary-foreground"));
      break;
    case "destructive":
      // shadcn v4 uses `text-white` on destructive (not destructive-foreground).
      bindFill(label, inputs.tailwindColors.get("white"));
      break;
    case "outline":
    case "ghost":
      bindFill(label, t.get("foreground"));
      break;
    case "link":
      bindFill(label, t.get("primary"));
      label.textDecoration = "UNDERLINE";
      break;
  }

  comp.appendChild(label);
  return comp;
}
