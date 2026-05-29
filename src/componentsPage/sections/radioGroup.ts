// Radio Group: 16x16 circular input with optional dot indicator.
//
// Mirrors shadcn's RadioGroup (radix-ui primitive): rounded-full size-4
// with an `input` border in the unchecked state; checked state shows a
// small filled inner circle in the primary colour.

import { bindCornerRadii, bindFill, bindStrokeColor } from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const RADIO_STATES = ["unchecked", "checked"] as const;
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
  comp.name = `State=${state}`;
  // Absolute layout so the dot sits centred without auto-layout repositioning.
  comp.layoutMode = "NONE";
  comp.resize(SIZE, SIZE);
  comp.cornerRadius = 9999;
  bindCornerRadii(comp, p.get("radius/full"));
  bindFill(comp, t.get("background"));
  bindStrokeColor(comp, t.get("input"));
  comp.strokeWeight = 1;

  if (state === "checked") {
    const dot = figma.createEllipse();
    dot.name = "Indicator";
    dot.resize(DOT_SIZE, DOT_SIZE);
    dot.x = (SIZE - DOT_SIZE) / 2;
    dot.y = (SIZE - DOT_SIZE) / 2;
    bindFill(dot, t.get("primary"));
    comp.appendChild(dot);
  }

  return comp;
}
