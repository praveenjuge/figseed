// Select: trigger button with value and chevron, in two sizes.
//
// Mirrors shadcn's Select trigger (radix-ui primitive): `rounded-md border
// border-input bg-transparent px-3 py-2 text-sm` with a trailing chevron-down
// icon. The `data-size` prop drives the height (default h-9, sm h-8).

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const SELECT_SIZES = ["sm", "default"] as const;
type SelectSize = (typeof SELECT_SIZES)[number];

const SELECT_DIMS: Record<SelectSize, { height: number; width: number }> = {
  sm: { height: 32, width: 180 },
  default: { height: 36, width: 200 },
};

export async function addSelectSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const size of SELECT_SIZES) {
    const comp = buildSelectComponent(inputs, size);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Select";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildSelectComponent(
  inputs: ComponentsInputs,
  size: SelectSize,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;
  const dims = SELECT_DIMS[size];

  const comp = figma.createComponent();
  comp.name = `Size=${size}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "SPACE_BETWEEN";
  comp.counterAxisAlignItems = "CENTER";
  comp.resize(dims.width, dims.height);
  comp.itemSpacing = 8;
  comp.paddingLeft = 12;
  comp.paddingRight = 12;
  comp.paddingTop = 8;
  comp.paddingBottom = 8;
  comp.cornerRadius = 6;
  bindCornerRadii(comp, p.get("radius/md"));
  bindFill(comp, t.get("background"));
  bindStrokeColor(comp, t.get("input"));
  comp.strokeWeight = 1;

  const value = figma.createText();
  value.fontName = { family: "Inter", style: "Regular" };
  value.characters = "Select a fruit";
  value.fontSize = 14;
  bindFontSize(value, p.get("font/size/sm"));
  bindFill(value, t.get("foreground"));
  comp.appendChild(value);

  comp.appendChild(buildChevronDown(t));

  return comp;
}

function buildChevronDown(t: Map<string, Variable>): VectorNode {
  // Down-pointing chevron at 16px to match the trigger text.
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
