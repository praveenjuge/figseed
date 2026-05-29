// Toggle Group: a row of connected toggle items where one (or more) is
// pressed. Two variants (default / outline) mirroring radix-nova.
//
// Mirrors radix-nova's ToggleGroup (radix-ui primitive) built on the shared
// `toggleVariants`: default size is `h-8 min-w-8 px-2.5 rounded-lg`, pressed
// items get `bg-muted`, and the outline variant adds an `input` border. The
// default `spacing` is 2 → an 8px gap between items.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const TOGGLE_GROUP_VARIANTS = ["default", "outline"] as const;
type ToggleGroupVariant = (typeof TOGGLE_GROUP_VARIANTS)[number];

// A classic text-formatting group. The first item starts pressed so the
// "on" surface is visible at a glance.
type ItemData = { glyph: string; pressed: boolean };
const ITEMS: ItemData[] = [
  { glyph: "B", pressed: true },
  { glyph: "I", pressed: false },
  { glyph: "U", pressed: false },
];

const ITEM_SIZE = 32;

export async function addToggleGroupSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const variant of TOGGLE_GROUP_VARIANTS) {
    const comp = buildToggleGroupComponent(inputs, variant);
    page.appendChild(comp);
    components.push(comp);
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
): ComponentNode {
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  // radix-nova ToggleGroup default `spacing` is 2 → 8px gap, `rounded-lg`.
  comp.itemSpacing = 8;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  comp.fills = [];
  comp.strokes = [];

  for (let i = 0; i < ITEMS.length; i++) {
    comp.appendChild(buildToggleGroupItem(inputs, ITEMS[i]!, variant));
  }

  return comp;
}

function buildToggleGroupItem(
  inputs: ComponentsInputs,
  data: ItemData,
  variant: ToggleGroupVariant,
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
  item.resize(ITEM_SIZE, ITEM_SIZE);
  item.cornerRadius = 8;
  bindCornerRadii(item, p.get("radius/lg"));
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
  glyph.fontName = { family: "Inter", style: "Bold" };
  glyph.characters = data.glyph;
  glyph.fontSize = 14;
  bindFontSize(glyph, p.get("font/size/sm"));
  // radix-nova items inherit `text-foreground` (no colour swap on press).
  bindFill(glyph, t.get("foreground"));
  if (data.glyph === "U") glyph.textDecoration = "UNDERLINE";
  if (data.glyph === "I") glyph.fontName = { family: "Inter", style: "Medium" };
  item.appendChild(glyph);

  return item;
}
