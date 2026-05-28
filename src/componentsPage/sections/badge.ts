// Badge: pill-shaped labels for status, counts, and tags. Four variants.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import {
  createSectionFrame,
  createWrappingRow,
  styleComponentSet,
} from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const BADGE_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
] as const;
type BadgeVariant = (typeof BADGE_VARIANTS)[number];

export async function addBadgeSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Badge", {
    title: "Badge",
    subtitle:
      "Four variants — pill-shaped labels for status, counts, and tags.",
  });

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

  const showcase = createWrappingRow(section, 12);
  for (const comp of components) {
    showcase.appendChild(comp.createInstance());
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
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
  comp.itemSpacing = 4;
  comp.paddingLeft = 10;
  comp.paddingRight = 10;
  comp.paddingTop = 4;
  comp.paddingBottom = 4;
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
      bindFill(label, t.get("destructive-foreground"));
      break;
    case "outline":
      bindFill(label, t.get("foreground"));
      break;
  }

  comp.appendChild(label);
  return comp;
}
