// Input: text field in four states (default, focused, disabled, invalid).

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

const INPUT_STATES = ["default", "focused", "disabled", "invalid"] as const;
type InputState = (typeof INPUT_STATES)[number];

export async function addInputSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const state of INPUT_STATES) {
    const comp = buildInputComponent(inputs, state);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Input";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildInputComponent(
  inputs: ComponentsInputs,
  state: InputState,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `State=${state}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  comp.resize(280, 32);
  // Mirrors radix-nova's Input: `h-8 px-2.5 py-1 rounded-lg`.
  comp.paddingLeft = 10;
  comp.paddingRight = 10;
  comp.paddingTop = 4;
  comp.paddingBottom = 4;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  bindFill(comp, t.get("background"));

  // Border per state. Focus uses a 1px ring border + the focus ring shadow;
  // invalid keeps the 1px border and only swaps the colour to destructive.
  switch (state) {
    case "focused":
      bindStrokeColor(comp, t.get("ring"));
      comp.strokeWeight = 1;
      comp.effects = [
        {
          type: "DROP_SHADOW",
          color: { r: 0, g: 0, b: 0, a: 0.08 },
          offset: { x: 0, y: 0 },
          radius: 0,
          spread: 3,
          visible: true,
          blendMode: "NORMAL",
          showShadowBehindNode: true,
        },
      ];
      break;
    case "invalid":
      bindStrokeColor(comp, t.get("destructive"));
      comp.strokeWeight = 1;
      break;
    default:
      bindStrokeColor(comp, t.get("input"));
      comp.strokeWeight = 1;
      break;
  }

  const text = figma.createText();
  applyFont(text, "body", "Regular");
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));

  switch (state) {
    case "default":
      text.characters = "you@example.com";
      bindFill(text, t.get("muted-foreground"));
      break;
    case "focused":
      text.characters = "designer@figma.com";
      bindFill(text, t.get("foreground"));
      break;
    case "disabled":
      text.characters = "you@example.com";
      bindFill(text, t.get("muted-foreground"));
      break;
    case "invalid":
      text.characters = "not-an-email";
      bindFill(text, t.get("foreground"));
      break;
  }

  comp.appendChild(text);

  if (state === "disabled") {
    comp.opacity = 0.5;
  }

  return comp;
}
