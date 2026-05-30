// Toggle: pressable square / pill that holds an "on" or "off" state.
// Two variants × two states for a quick component-set picker.
//
// Mirrors radix-nova's Toggle (radix-ui primitive): `bg-transparent` by
// default, `aria-pressed:bg-muted` (or `data-[state=on]:bg-muted`) when on;
// outline variant adds an `input` border. Default size is `h-8 min-w-8`
// (32×32) with `rounded-lg`.

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

const TOGGLE_VARIANTS = ["default", "outline"] as const;
type ToggleVariant = (typeof TOGGLE_VARIANTS)[number];

// Boolean variant: shadcn / Radix Toggle exposes a `pressed` prop, so we
// expose `Pressed=True/False`. Figma promotes a property to a boolean toggle
// in the inspector when its values are exactly `True`/`False`.
const TOGGLE_STATES = ["False", "True"] as const;
type ToggleState = (typeof TOGGLE_STATES)[number];

const SIZE = 32;

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
  // Mirrors radix-nova's Toggle default size (`h-8 min-w-8 rounded-lg`).
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  comp.strokes = [];

  if (state === "True") {
    // radix-nova: `aria-pressed:bg-muted` / `data-[state=on]:bg-muted`.
    bindFill(comp, t.get("muted"));
  } else if (variant === "outline") {
    // radix-nova outline: `border border-input bg-transparent`.
    bindFill(comp, t.get("background"));
    bindStrokeColor(comp, t.get("input"));
    comp.strokeWeight = 1;
  } else {
    comp.fills = [];
  }

  const glyph = figma.createText();
  applyFont(glyph, "body", "Bold");
  // A bold "B" is a good stand-in for the typical toggle use case (text
  // formatting). Designers can swap to any icon they prefer.
  glyph.characters = "B";
  glyph.fontSize = 14;
  bindFontSize(glyph, p.get("font/size/sm"));

  // radix-nova doesn't change the text colour on press — both states use the
  // hover colour `text-foreground` (default state has no explicit colour, so
  // it inherits the surrounding `foreground`).
  bindFill(glyph, t.get("foreground"));
  comp.appendChild(glyph);

  return comp;
}
