// Toggle Group: a row of connected toggle items where one (or more) is
// pressed. Two variants (default / outline) × three sizes mirroring
// radix-nova.
//
// Mirrors radix-nova's ToggleGroup (radix-ui primitive) built on the shared
// `toggleVariants`: default size is `h-8 min-w-8 px-2.5 rounded-lg`, sm is
// `h-7 min-w-7`, lg is `h-9 min-w-9`; pressed items get `bg-muted`, and the
// outline variant adds an `input` border. The default `spacing` is 2 → an 8px
// gap between items.

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

const TOGGLE_GROUP_VARIANTS = ["default", "outline"] as const;
type ToggleGroupVariant = (typeof TOGGLE_GROUP_VARIANTS)[number];

// Mirrors radix-nova's toggleVariants `size` axis (shared with Toggle).
const TOGGLE_GROUP_SIZES = ["sm", "default", "lg"] as const;
type ToggleGroupSize = (typeof TOGGLE_GROUP_SIZES)[number];

// radix-nova sizes: sm `h-7` (28), default `h-8` (32), lg `h-9` (36). The sm
// size rounds with `radius-md` (6); default/lg use `radius-lg` (8).
const TOGGLE_GROUP_DIMS: Record<
  ToggleGroupSize,
  { size: number; radius: number; radiusToken: string; fontSize: number }
> = {
  sm: { size: 28, radius: 6, radiusToken: "radius/md", fontSize: 13 },
  default: { size: 32, radius: 8, radiusToken: "radius/lg", fontSize: 14 },
  lg: { size: 36, radius: 8, radiusToken: "radius/lg", fontSize: 14 },
};

// A classic text-formatting group. The first item starts pressed so the
// "on" surface is visible at a glance.
type ItemData = { glyph: string; pressed: boolean };
const ITEMS: ItemData[] = [
  { glyph: "B", pressed: true },
  { glyph: "I", pressed: false },
  { glyph: "U", pressed: false },
];

export async function addToggleGroupSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const variant of TOGGLE_GROUP_VARIANTS) {
    for (const size of TOGGLE_GROUP_SIZES) {
      const comp = buildToggleGroupComponent(inputs, variant, size);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Toggle Group";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildToggleGroupComponent(
  inputs: ComponentsInputs,
  variant: ToggleGroupVariant,
  size: ToggleGroupSize,
): ComponentNode {
  const p = inputs.primitives;
  const dims = TOGGLE_GROUP_DIMS[size];

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}, Size=${size}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  // radix-nova ToggleGroup default `spacing` is 2 → 8px gap.
  comp.itemSpacing = 8;
  comp.cornerRadius = dims.radius;
  bindCornerRadii(comp, p.get(dims.radiusToken));
  comp.fills = [];
  comp.strokes = [];

  for (let i = 0; i < ITEMS.length; i++) {
    comp.appendChild(buildToggleGroupItem(inputs, ITEMS[i]!, variant, dims));
  }

  return comp;
}

function buildToggleGroupItem(
  inputs: ComponentsInputs,
  data: ItemData,
  variant: ToggleGroupVariant,
  dims: { size: number; radius: number; radiusToken: string; fontSize: number },
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const item = figma.createFrame();
  item.name = data.pressed ? "Item (on)" : "Item";
  item.layoutMode = "HORIZONTAL";
  item.primaryAxisSizingMode = "FIXED";
  item.counterAxisSizingMode = "FIXED";
  item.primaryAxisAlignItems = "CENTER";
  item.counterAxisAlignItems = "CENTER";
  item.resize(dims.size, dims.size);
  item.cornerRadius = dims.radius;
  bindCornerRadii(item, p.get(dims.radiusToken));
  item.strokes = [];

  if (data.pressed) {
    // radix-nova: `aria-pressed:bg-muted` / `data-[state=on]:bg-muted`.
    bindFill(item, t.get("muted"));
  } else if (variant === "outline") {
    // radix-nova outline: `border border-input bg-transparent`.
    bindFill(item, t.get("background"));
    bindStrokeColor(item, t.get("input"));
    item.strokeWeight = 1;
  } else {
    item.fills = [];
  }

  const glyph = figma.createText();
  applyFont(glyph, "body", data.glyph === "I" ? "Medium" : "Bold");
  glyph.characters = data.glyph;
  glyph.fontSize = dims.fontSize;
  bindFontSize(glyph, p.get("font/size/sm"));
  // radix-nova items inherit `text-foreground` (no colour swap on press).
  bindFill(glyph, t.get("foreground"));
  if (data.glyph === "U") glyph.textDecoration = "UNDERLINE";
  item.appendChild(glyph);

  return item;
}
