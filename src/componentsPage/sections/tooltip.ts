// Tooltip: small floating bubble with an arrow. Four placement sides, mirroring
// shadcn's Tooltip `side` prop (top / bottom / left / right).
//
// Mirrors shadcn's Tooltip (radix-ui primitive): `bg-foreground` rounded
// rectangle with `text-background` content and a small triangular arrow
// pointing toward the trigger. The arrow sits on the edge opposite the
// placement: a `top` tooltip points down, `bottom` points up, etc.

import { bindCornerRadii, bindFill, bindFontSize } from "../bindings";
import { applyFont } from "../../fonts";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const ARROW_LONG = 10; // base length of the arrow triangle
const ARROW_SHORT = 5; // height of the arrow triangle

// shadcn Tooltip `side` prop. The arrow points back toward the trigger, so a
// `top`-placed tooltip (above the trigger) has its arrow on the bottom edge.
const TOOLTIP_SIDES = ["top", "bottom", "left", "right"] as const;
type TooltipSide = (typeof TOOLTIP_SIDES)[number];

export async function addTooltipSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const side of TOOLTIP_SIDES) {
    const comp = buildTooltipComponent(inputs, side);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Tooltip";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.primaryAxisAlignItems = "MIN";
  componentSet.counterAxisAlignItems = "MIN";
  componentSet.itemSpacing = 24;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildTooltipComponent(
  inputs: ComponentsInputs,
  side: TooltipSide,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  // Use absolute positioning so the arrow can sit on the correct edge.
  const comp = figma.createComponent();
  comp.name = `Side=${side}`;
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
  // shadcn TooltipContent uses `text-xs` with no explicit weight (Regular).
  applyFont(text, "body", "Regular");
  text.characters = "Add to library";
  text.fontSize = 12;
  bindFontSize(text, p.get("font/size/xs"));
  bindFill(text, t.get("background"));
  bubble.appendChild(text);

  comp.appendChild(bubble);

  // The arrow points back toward the trigger, so it sits on the edge opposite
  // the placement. Lay the bubble + arrow out and size the component to fit.
  const horizontalArrow = side === "left" || side === "right";
  // The bubble has hugged its content by now, so width/height are known.
  const bw = bubble.width;
  const bh = bubble.height;

  if (horizontalArrow) {
    comp.resize(bw + ARROW_SHORT, bh);
  } else {
    comp.resize(bw, bh + ARROW_SHORT);
  }

  // Position the bubble within the component, leaving room for the arrow.
  switch (side) {
    case "top": // tooltip above trigger → arrow on bottom edge
      bubble.x = 0;
      bubble.y = 0;
      break;
    case "bottom": // tooltip below trigger → arrow on top edge
      bubble.x = 0;
      bubble.y = ARROW_SHORT;
      break;
    case "left": // tooltip left of trigger → arrow on right edge
      bubble.x = 0;
      bubble.y = 0;
      break;
    case "right": // tooltip right of trigger → arrow on left edge
      bubble.x = ARROW_SHORT;
      bubble.y = 0;
      break;
  }

  comp.appendChild(buildArrow(inputs, side, bw, bh));

  return comp;
}

// A small triangle pointing away from the bubble toward the trigger.
function buildArrow(
  inputs: ComponentsInputs,
  side: TooltipSide,
  bubbleW: number,
  bubbleH: number,
): VectorNode {
  const t = inputs.theme.light;
  const arrow = figma.createVector();
  arrow.name = "Arrow";

  let data: string;
  switch (side) {
    case "top": {
      // Down-pointing triangle centred on the bubble's bottom edge.
      const x0 = bubbleW / 2 - ARROW_LONG / 2;
      const y0 = bubbleH;
      data = `M ${x0} ${y0} L ${x0 + ARROW_LONG} ${y0} L ${x0 + ARROW_LONG / 2} ${y0 + ARROW_SHORT} Z`;
      break;
    }
    case "bottom": {
      // Up-pointing triangle centred on the bubble's top edge.
      const x0 = bubbleW / 2 - ARROW_LONG / 2;
      const y0 = ARROW_SHORT;
      data = `M ${x0} ${y0} L ${x0 + ARROW_LONG} ${y0} L ${x0 + ARROW_LONG / 2} 0 Z`;
      break;
    }
    case "left": {
      // Right-pointing triangle centred on the bubble's right edge.
      const x0 = bubbleW;
      const y0 = bubbleH / 2 - ARROW_LONG / 2;
      data = `M ${x0} ${y0} L ${x0} ${y0 + ARROW_LONG} L ${x0 + ARROW_SHORT} ${y0 + ARROW_LONG / 2} Z`;
      break;
    }
    case "right": {
      // Left-pointing triangle centred on the bubble's left edge.
      const x0 = ARROW_SHORT;
      const y0 = bubbleH / 2 - ARROW_LONG / 2;
      data = `M ${x0} ${y0} L ${x0} ${y0 + ARROW_LONG} L 0 ${y0 + ARROW_LONG / 2} Z`;
      break;
    }
  }

  arrow.vectorPaths = [{ windingRule: "NONZERO", data }];
  arrow.strokes = [];
  bindFill(arrow, t.get("foreground"));
  return arrow;
}
