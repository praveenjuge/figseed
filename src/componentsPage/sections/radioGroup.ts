// Radio Group: 16x16 circular input with optional dot indicator.
//
// Mirrors radix-nova's RadioGroup (radix-ui primitive): rounded-full size-4
// with an `input` border in the unchecked state; checked state swaps the
// background to `bg-primary` and shows a small inner circle in
// `bg-primary-foreground`.

import { bindCornerRadii, bindFill, bindStrokeColor } from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

// Boolean variant: shadcn / Radix RadioGroupItem exposes a `checked` state, so
// we expose `Checked=True/False`. Figma promotes a property to a boolean toggle
// in the inspector when its values are exactly `True`/`False`.
const RADIO_STATES = ["False", "True"] as const;
type RadioState = (typeof RADIO_STATES)[number];

const SIZE = 16;
const DOT_SIZE = 8;

export async function addRadioGroupSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const state of RADIO_STATES) {
    const comp = buildRadioComponent(inputs, state);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Radio Group";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildRadioComponent(
  inputs: ComponentsInputs,
  state: RadioState,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Checked=${state}`;
  // Absolute layout so the dot sits centred without auto-layout repositioning.
  comp.layoutMode = "NONE";
  comp.resize(SIZE, SIZE);
  comp.cornerRadius = 9999;
  bindCornerRadii(comp, p.get("radius/full"));

  if (state === "True") {
    // radix-nova: `data-checked:border-primary data-checked:bg-primary`.
    bindFill(comp, t.get("primary"));
    bindStrokeColor(comp, t.get("primary"));
    comp.strokeWeight = 1;

    const dot = figma.createEllipse();
    dot.name = "Indicator";
    dot.resize(DOT_SIZE, DOT_SIZE);
    dot.x = (SIZE - DOT_SIZE) / 2;
    dot.y = (SIZE - DOT_SIZE) / 2;
    bindFill(dot, t.get("primary-foreground"));
    comp.appendChild(dot);
  } else {
    bindFill(comp, t.get("background"));
    bindStrokeColor(comp, t.get("input"));
    comp.strokeWeight = 1;
  }

  return comp;
}
