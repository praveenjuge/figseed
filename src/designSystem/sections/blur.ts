// Blur scale: each token rendered as a frosted overlay on a colorful stage,
// with the overlay's backdrop blur radius bound to the matching primitive.

import { BLUR_BG_BASE64 } from "../../data/blurBackground";
import { BLUR_TOKENS } from "../../primitives";
import { bindEffectRadius, bindFill } from "../bindings";
import {
  createSectionFrame,
  createVertical,
  createWrappingRow,
} from "../layout";
import { solidPaintRgba } from "../paints";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

export async function addBlurAndBackdrop(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Blur & backdrop");

  const row = createWrappingRow(section, 16);

  // Decode the bundled background once and reuse the same image hash for
  // every tile. Figma deduplicates by hash, so this is safe across runs.
  const bgImage = figma.createImage(figma.base64Decode(BLUR_BG_BASE64));
  const bgPaint: ImagePaint = {
    type: "IMAGE",
    scaleMode: "FILL",
    imageHash: bgImage.hash,
  };

  for (const token of BLUR_TOKENS) {
    const cell = createVertical(row, 8);

    // Stage holds the bundled image as backdrop plus a frosted overlay on
    // top. A photo-style image gives the backdrop blur richer color
    // information to dissolve than the previous flat circles.
    const stage = figma.createFrame();
    stage.resize(112, 112);
    stage.cornerRadius = 12;
    stage.clipsContent = true; // blur should stay within the tile
    stage.fills = [bgPaint];

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
