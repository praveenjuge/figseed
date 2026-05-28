// Switch: toggle with thumb, two sizes × two states.

import { bindCornerRadii, bindFill } from "../bindings";
import { styleComponentSet } from "../layout";
import { SECTION_WIDTH, type ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const SWITCH_STATES = ["unchecked", "checked"] as const;
type SwitchState = (typeof SWITCH_STATES)[number];

const SWITCH_SIZES = ["sm", "default"] as const;
type SwitchSize = (typeof SWITCH_SIZES)[number];

const SWITCH_DIMS: Record<SwitchSize, { w: number; h: number; thumb: number }> =
  {
    sm: { w: 28, h: 16, thumb: 12 },
    default: { w: 36, h: 20, thumb: 16 },
  };

export async function addSwitchSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const size of SWITCH_SIZES) {
    for (const state of SWITCH_STATES) {
      const comp = buildSwitchComponent(inputs, size, state);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Switch";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.layoutWrap = "WRAP";
  componentSet.itemSpacing = 16;
  componentSet.counterAxisSpacing = 16;
  styleComponentSet(componentSet);
  componentSet.primaryAxisSizingMode = "FIXED";
  componentSet.resize(SECTION_WIDTH, componentSet.height);

  return countDescendants(componentSet);
}

function buildSwitchComponent(
  inputs: ComponentsInputs,
  size: SwitchSize,
  state: SwitchState,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;
  const dims = SWITCH_DIMS[size];

  const comp = figma.createComponent();
  comp.name = `Size=${size}, State=${state}`;
  // Use absolute positioning for the thumb inside the track.
  comp.layoutMode = "NONE";
  comp.resize(dims.w, dims.h);
  comp.cornerRadius = 9999;
  bindCornerRadii(comp, p.get("radius/full"));

  if (state === "checked") {
    bindFill(comp, t.get("primary"));
  } else {
    bindFill(comp, t.get("input"));
  }

  // Thumb.
  const thumb = figma.createEllipse();
  thumb.name = "Thumb";
  thumb.resize(dims.thumb, dims.thumb);
  bindFill(thumb, t.get("background"));
  const yOffset = (dims.h - dims.thumb) / 2;
  thumb.y = yOffset;
  if (state === "checked") {
    thumb.x = dims.w - dims.thumb - 2;
  } else {
    thumb.x = 2;
  }
  thumb.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.12 },
      offset: { x: 0, y: 1 },
      radius: 2,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
      showShadowBehindNode: true,
    },
  ];
  comp.appendChild(thumb);

  return comp;
}
