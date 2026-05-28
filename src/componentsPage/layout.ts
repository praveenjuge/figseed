// Layout helpers shared by the Components page sections.

import { SECTION_WIDTH } from "./types";
import { solidPaint } from "./paints";

export function createSectionFrame(
  name: string,
  meta?: { title?: string; titleSize?: number; subtitle?: string },
): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "FIXED";
  frame.itemSpacing = 16;
  frame.paddingTop = 16;
  frame.paddingBottom = 16;
  frame.paddingLeft = 16;
  frame.paddingRight = 16;
  frame.fills = [solidPaint(1)];
  frame.resize(SECTION_WIDTH, 100);

  const heading = figma.createText();
  heading.fontName = { family: "Inter", style: "Semi Bold" };
  heading.characters = meta?.title ?? name;
  heading.fontSize = meta?.titleSize ?? 16;
  heading.fills = [solidPaint(0.1)];
  frame.appendChild(heading);

  if (meta?.subtitle) {
    const sub = figma.createText();
    sub.fontName = { family: "Inter", style: "Regular" };
    sub.characters = meta.subtitle;
    sub.fontSize = 12;
    sub.fills = [solidPaint(0.4)];
    frame.appendChild(sub);
  }

  return frame;
}

export function createWrappingRow(
  parent: FrameNode,
  spacing: number,
): FrameNode {
  const frame = figma.createFrame();
  frame.layoutMode = "HORIZONTAL";
  frame.itemSpacing = spacing;
  frame.fills = [];
  const width =
    (parent.width || SECTION_WIDTH) -
    ((parent.paddingLeft ?? 0) + (parent.paddingRight ?? 0));
  frame.resize(Math.max(width, 100), 10);
  frame.primaryAxisSizingMode = "FIXED";
  frame.counterAxisSizingMode = "AUTO";
  frame.layoutWrap = "WRAP";
  frame.counterAxisSpacing = spacing;
  parent.appendChild(frame);
  return frame;
}

export function createVertical(parent: FrameNode, spacing: number): FrameNode {
  const frame = figma.createFrame();
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = spacing;
  frame.fills = [];
  parent.appendChild(frame);
  return frame;
}

// Standardised wrapper styling used by every component-set frame on the
// canvas (Button, Badge, Avatar, etc).
export function styleComponentSet(componentSet: ComponentSetNode) {
  componentSet.strokes = [solidPaint(0.9)];
  componentSet.fills = [solidPaint(1)];
  componentSet.strokeWeight = 1;
  componentSet.paddingTop = 16;
  componentSet.paddingBottom = 16;
  componentSet.paddingLeft = 16;
  componentSet.paddingRight = 16;
  componentSet.primaryAxisSizingMode = "AUTO";
  componentSet.counterAxisSizingMode = "AUTO";
}
