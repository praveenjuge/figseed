// Toggle: pressable square / pill that holds an "on" or "off" state.
// Two variants × two states for a quick component-set picker.
//
// Mirrors shadcn's Toggle (radix-ui primitive): `bg-transparent` by default,
// `bg-accent text-accent-foreground` when on; outline variant adds an
// `input` border. Sized close to a default button (h-9 w-9).

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const TOGGLE_VARIANTS = ["default", "outline"] as const;
type ToggleVariant = (typeof TOGGLE_VARIANTS)[number];

// Boolean variant: shadcn / Radix Toggle exposes a `pressed` prop, so we
// expose `Pressed=True/False`. Figma promotes a property to a boolean toggle
// in the inspector when its values are exactly `True`/`False`.
const TOGGLE_STATES = ["False", "True"] as const;
type ToggleState = (typeof TOGGLE_STATES)[number];

const SIZE = 36;

export async function addToggleSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const variant of TOGGLE_VARIANTS) {
    for (const state of TOGGLE_STATES) {
      const comp = buildToggleComponent(inputs, variant, state);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Toggle";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildToggleComponent(
  inputs: ComponentsInputs,
  variant: ToggleVariant,
  state: ToggleState,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}, Pressed=${state}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  comp.resize(SIZE, SIZE);
  comp.cornerRadius = 6;
  bindCornerRadii(comp, p.get("radius/md"));
  comp.strokes = [];

  if (state === "True") {
    bindFill(comp, t.get("accent"));
  } else if (variant === "outline") {
    bindFill(comp, t.get("background"));
    bindStrokeColor(comp, t.get("input"));
    comp.strokeWeight = 1;
  } else {
    comp.fills = [];
  }

  const glyph = figma.createText();
  glyph.fontName = { family: "Inter", style: "Bold" };
  // A bold "B" is a good stand-in for the typical toggle use case (text
  // formatting). Designers can swap to any icon they prefer.
  glyph.characters = "B";
  glyph.fontSize = 14;
  bindFontSize(glyph, p.get("font/size/sm"));

  if (state === "True") {
    bindFill(glyph, t.get("accent-foreground"));
  } else {
    bindFill(glyph, t.get("foreground"));
  }
  comp.appendChild(glyph);

  return comp;
}
