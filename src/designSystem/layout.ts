// Layout helpers shared by the Design System page sections.

import { bindFill } from "./bindings";
import { solidPaint } from "./paints";
import { SECTION_WIDTH } from "./types";

export function sectionContentWidth(): number {
  // Section frame total width minus its 24px horizontal padding on each side.
  return SECTION_WIDTH - 48;
}

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
  frame.paddingTop = 24;
  frame.paddingBottom = 24;
  frame.paddingLeft = 24;
  frame.paddingRight = 24;
  frame.cornerRadius = 12;
  frame.fills = [solidPaint(1)];
  frame.strokes = [solidPaint(0.92)];
  frame.strokeWeight = 1;
  frame.resize(SECTION_WIDTH, 100);
  // Clip so oversized children (large font sizes, shadow bleed at edges)
  // stay inside the rounded card. Sections that need bleed compensate by
  // adding internal padding on their inner rows instead.
  frame.clipsContent = true;

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

export function createSubSection(parent: FrameNode, title: string): FrameNode {
  const frame = figma.createFrame();
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = 8;
  frame.fills = [];

  const heading = figma.createText();
  heading.fontName = { family: "Inter", style: "Medium" };
  heading.characters = title;
  heading.fontSize = 12;
  heading.fills = [solidPaint(0.3)];

  frame.appendChild(heading);
  parent.appendChild(frame);
  return frame;
}

// Create a horizontal row whose width matches the parent's content area, so
// children can wrap predictably. Used for radius / shadow / blur grids.
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
  frame.resize(Math.max(width, 100), 1);
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

// One row in a label / value table. Fixed counter-axis alignment keeps the
// label baseline aligned with the sample even when the sample is taller.
export function createTableRow(
  parent: FrameNode,
  _labelWidth: number,
): FrameNode {
  const frame = figma.createFrame();
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.counterAxisAlignItems = "CENTER";
  frame.itemSpacing = 16;
  frame.fills = [];
  parent.appendChild(frame);
  return frame;
}

export function addLabel(
  parent: FrameNode,
  text: string,
  variable: Variable | undefined,
  width: number,
): TextNode {
  const label = figma.createText();
  label.characters = text;
  label.fontSize = 10;
  label.fontName = { family: "Inter", style: "Regular" };
  bindFill(label, variable);
  label.resize(width, 16);
  parent.appendChild(label);
  return label;
}
