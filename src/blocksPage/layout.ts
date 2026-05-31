// Layout helpers shared by the Blocks page.
//
// Blocks reuse the Components page's variable-binding helpers (bindFill,
// bindStrokeColor, …) so every drawn surface stays wired to the active preset's
// theme variables, exactly like the component sections.

import {
  bindCornerRadii,
  bindFill,
  bindStrokeColor,
} from "../componentsPage/bindings";
import { applyFont } from "../fonts";
import { solidPaint } from "../componentsPage/paints";
import type { BlocksInputs } from "./types";

// The outer frame for a single block: a named, fixed-width canvas painted with
// the theme background so the block reads as a real screen. Children are laid
// out by the caller (centered for auth, a row for the dashboard).
export function createBlockCanvas(
  inputs: BlocksInputs,
  name: string,
  width: number,
  height: number,
): FrameNode {
  const t = inputs.theme.light;

  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "FIXED";
  frame.counterAxisSizingMode = "FIXED";
  frame.resize(width, height);
  frame.clipsContent = true;
  bindFill(frame, t.get("background"));
  frame.strokes = [];
  return frame;
}

// A card surface (`bg-card text-card-foreground rounded-xl border`) used as the
// container for auth forms and dashboard panels. Vertical auto-layout, hugging
// its content height.
export function createSurface(
  inputs: BlocksInputs,
  width: number,
  opts: { padding?: number; gap?: number } = {},
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const surface = figma.createFrame();
  surface.name = "Surface";
  surface.layoutMode = "VERTICAL";
  surface.resize(width, 10);
  surface.primaryAxisSizingMode = "AUTO";
  surface.counterAxisSizingMode = "FIXED";
  surface.itemSpacing = opts.gap ?? 24;
  const pad = opts.padding ?? 24;
  surface.paddingTop = pad;
  surface.paddingBottom = pad;
  surface.paddingLeft = pad;
  surface.paddingRight = pad;
  surface.cornerRadius = 12;
  bindCornerRadii(surface, p.get("radius/xl"));
  bindFill(surface, t.get("card"));
  bindStrokeColor(surface, t.get("border"));
  surface.strokeWeight = 1;
  surface.strokeAlign = "INSIDE";
  return surface;
}

// A plain vertical auto-layout group with no fill/stroke, for stacking rows.
export function createColumn(name: string, gap: number): FrameNode {
  const col = figma.createFrame();
  col.name = name;
  col.layoutMode = "VERTICAL";
  col.primaryAxisSizingMode = "AUTO";
  col.counterAxisSizingMode = "AUTO";
  col.itemSpacing = gap;
  col.fills = [];
  col.strokes = [];
  return col;
}

// A plain horizontal auto-layout group with no fill/stroke.
export function createRow(name: string, gap: number): FrameNode {
  const row = figma.createFrame();
  row.name = name;
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "AUTO";
  row.counterAxisSizingMode = "AUTO";
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = gap;
  row.fills = [];
  row.strokes = [];
  return row;
}

// A heading text node bound to a theme foreground colour.
export function createHeading(
  inputs: BlocksInputs,
  text: string,
  size: number,
  colorKey = "card-foreground",
): TextNode {
  const t = inputs.theme.light;
  const node = figma.createText();
  applyFont(node, "heading", "Semi Bold");
  node.characters = text;
  node.fontSize = size;
  bindFill(node, t.get(colorKey));
  return node;
}

// A body text node bound to a theme colour (defaults to muted-foreground for
// the supporting copy auth/dashboard screens lean on).
export function createBody(
  inputs: BlocksInputs,
  text: string,
  size: number,
  colorKey = "muted-foreground",
  weight: "Regular" | "Medium" = "Regular",
): TextNode {
  const t = inputs.theme.light;
  const node = figma.createText();
  applyFont(node, "body", weight);
  node.characters = text;
  node.fontSize = size;
  bindFill(node, t.get(colorKey));
  return node;
}

// A neutral region-header card matching the Design System / Components headers,
// so the blocks region opens with the same intro treatment.
export function createPageHeader(
  inputs: BlocksInputs,
  width: number,
): FrameNode {
  const frame = figma.createFrame();
  frame.name = "Blocks";
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "FIXED";
  frame.itemSpacing = 16;
  frame.paddingTop = 16;
  frame.paddingBottom = 16;
  frame.paddingLeft = 16;
  frame.paddingRight = 16;
  frame.fills = [solidPaint(1)];
  frame.resize(width, 100);

  const title = figma.createText();
  applyFont(title, "heading", "Semi Bold");
  title.characters = "Blocks";
  title.fontSize = 28;
  title.fills = [solidPaint(0.1)];
  frame.appendChild(title);

  const subtitle = figma.createText();
  applyFont(subtitle, "body", "Regular");
  subtitle.characters = `Ready-made shadcn screens for ${inputs.presetCode}, assembled from live instances of the components on this page. Edit a Button or Input once and every block updates.`;
  subtitle.fontSize = 12;
  subtitle.fills = [solidPaint(0.4)];
  frame.appendChild(subtitle);

  return frame;
}
