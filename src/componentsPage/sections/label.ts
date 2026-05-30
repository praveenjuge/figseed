// Label: form field label rendered in the foreground colour.
//
// Mirrors shadcn's Label (radix-ui primitive): `text-sm leading-none
// font-medium` text used to caption inputs and other controls.

import { bindFill, bindFontSize } from "../bindings";
import { applyFont } from "../../fonts";
import { wrapInSectionCard } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

export async function addLabelSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildLabelComponent(inputs);
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
}

function buildLabelComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Label";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.counterAxisAlignItems = "CENTER";
  comp.itemSpacing = 8;
  comp.fills = [];
  comp.strokes = [];

  const text = figma.createText();
  applyFont(text, "body", "Medium");
  text.characters = "Email address";
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, t.get("foreground"));
  comp.appendChild(text);

  return comp;
}
