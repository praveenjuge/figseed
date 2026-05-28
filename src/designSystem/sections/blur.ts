// Blur scale: each token rendered as a frosted overlay on a colorful stage,
// with the overlay's backdrop blur radius bound to the matching primitive.

import { BLUR_TOKENS } from "../../primitives";
import { bindEffectRadius, bindFill } from "../bindings";
import {
  createSectionFrame,
  createVertical,
  createWrappingRow,
} from "../layout";
import { solidPaint, solidPaintRgba } from "../paints";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

export async function addBlurAndBackdrop(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Blur & backdrop");

  const row = createWrappingRow(section, 16);

  for (const token of BLUR_TOKENS) {
    const cell = createVertical(row, 8);

    // The stage holds a colorful pattern (so the blur has something to
    // dissolve) plus a frosted overlay sitting on top. Overlapping circles
    // produce a much smoother gradient than the previous stripe pattern,
    // which made bigger radii look identical to small ones.
    const stage = figma.createFrame();
    stage.resize(112, 112);
    stage.cornerRadius = 12;
    stage.clipsContent = true; // blur should stay within the tile
    bindFill(stage, inputs.theme.light.get("primary"));

    // Three soft circles in different shades of the primary palette. They
    // overlap so any blur radius produces a noticeably different feathering.
    const blobConfigs: Array<{
      x: number;
      y: number;
      size: number;
      tone: number;
    }> = [
      { x: -16, y: -16, size: 80, tone: 0.95 },
      { x: 48, y: 8, size: 90, tone: 0.15 },
      { x: 8, y: 56, size: 80, tone: 0.6 },
    ];
    for (const blob of blobConfigs) {
      const circle = figma.createEllipse();
      circle.resize(blob.size, blob.size);
      circle.x = blob.x;
      circle.y = blob.y;
      circle.fills = [solidPaint(blob.tone)];
      stage.appendChild(circle);
    }

    // Frosted overlay with a backdrop blur. We give it a non-zero radius
    // even at "blur/none" so Figma keeps the effect on the node and the
    // bound variable continues to drive it.
    const overlay = figma.createFrame();
    overlay.resize(88, 56);
    overlay.x = 12;
    overlay.y = 28;
    overlay.cornerRadius = 8;
    overlay.fills = [solidPaintRgba({ r: 1, g: 1, b: 1, a: 0.4 })];
    overlay.strokes = [solidPaintRgba({ r: 1, g: 1, b: 1, a: 0.5 })];
    overlay.strokeWeight = 1;
    overlay.effects = [
      {
        type: "BACKGROUND_BLUR",
        blurType: "NORMAL",
        radius: Math.max(token.value, 0.01),
        visible: true,
      },
    ];
    bindEffectRadius(overlay, 0, inputs.primitives.get(`blur/${token.name}`));
    stage.appendChild(overlay);

    const label = figma.createText();
    label.characters = `blur/${token.name}`;
    label.fontSize = 11;
    label.fontName = { family: "Inter", style: "Medium" };
    bindFill(label, inputs.theme.light.get("foreground"));

    const sub = figma.createText();
    sub.characters = `${token.value}px`;
    sub.fontSize = 10;
    sub.fontName = { family: "Inter", style: "Regular" };
    bindFill(sub, inputs.theme.light.get("muted-foreground"));

    cell.appendChild(stage);
    cell.appendChild(label);
    cell.appendChild(sub);
  }

  page.appendChild(section);
  return countDescendants(section);
}
