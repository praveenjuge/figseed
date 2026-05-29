// Tooltip: small floating bubble with arrow. One representative bubble.
//
// Mirrors shadcn's Tooltip (radix-ui primitive): `bg-foreground` rounded
// rectangle with `text-background` content and a small triangular arrow
// pointing down toward the trigger.

import { bindCornerRadii, bindFill, bindFontSize } from "../bindings";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const ARROW_WIDTH = 10;
const ARROW_HEIGHT = 5;

export async function addTooltipSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildTooltipComponent(inputs);
  page.appendChild(comp);
  return countDescendants(comp);
}

function buildTooltipComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  // Use absolute positioning so the arrow can sit just under the bubble.
  const comp = figma.createComponent();
  comp.name = "Tooltip";
  comp.layoutMode = "NONE";
  comp.fills = [];
  comp.clipsContent = false;

  // Bubble — rounded rectangle with foreground fill and inner padding.
  const bubble = figma.createFrame();
  bubble.name = "Bubble";
  bubble.layoutMode = "HORIZONTAL";
  bubble.primaryAxisSizingMode = "AUTO";
  bubble.counterAxisSizingMode = "AUTO";
  bubble.primaryAxisAlignItems = "CENTER";
  bubble.counterAxisAlignItems = "CENTER";
  bubble.paddingLeft = 12;
  bubble.paddingRight = 12;
  bubble.paddingTop = 6;
  bubble.paddingBottom = 6;
  bubble.cornerRadius = 6;
  bindCornerRadii(bubble, p.get("radius/md"));
  bindFill(bubble, t.get("foreground"));
  bubble.strokes = [];

  const text = figma.createText();
  text.fontName = { family: "Inter", style: "Medium" };
  text.characters = "Add to library";
  text.fontSize = 12;
  bindFontSize(text, p.get("font/size/xs"));
  bindFill(text, t.get("background"));
  bubble.appendChild(text);

  comp.appendChild(bubble);
  bubble.x = 0;
  bubble.y = 0;

  // Resize the component to fit the bubble plus the arrow tip below it.
  const totalHeight = bubble.height + ARROW_HEIGHT;
  comp.resize(bubble.width, totalHeight);

  // Arrow — a downward-pointing triangle drawn as a vector path so it
  // tracks the foreground fill cleanly.
  const arrow = figma.createVector();
  arrow.name = "Arrow";
  const x0 = bubble.width / 2 - ARROW_WIDTH / 2;
  const y0 = bubble.height;
  arrow.vectorPaths = [
    {
      windingRule: "NONZERO",
      data: `M ${x0} ${y0} L ${x0 + ARROW_WIDTH} ${y0} L ${x0 + ARROW_WIDTH / 2} ${y0 + ARROW_HEIGHT} Z`,
    },
  ];
  arrow.strokes = [];
  bindFill(arrow, t.get("foreground"));
  comp.appendChild(arrow);

  return comp;
}
