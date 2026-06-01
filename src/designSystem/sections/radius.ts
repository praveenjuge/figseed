// Border radius scale: tile per token, corners bound to radius variables.

import {
  RADIUS_TOKENS,
  radiusScaleForSlug,
  scaleRadiusTokens,
} from "../../primitives";
import { applyFont } from "../../fonts";
import { bindCornerRadii, bindFill } from "../bindings";
import {
  createSectionFrame,
  createVertical,
  createWrappingRow,
} from "../layout";
import type { DesignSystemInputs } from "../types";
import { countDescendants } from "../utils";

export async function addRadiusScale(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Border radius");

  const row = createWrappingRow(section, 16);

  // Scale the displayed tokens by the preset's `--radius` ratio so the preview
  // matches the values components actually bind to (the `radius/*` primitives
  // are scaled the same way in the generator).
  const scale = radiusScaleForSlug(inputs.presetSummary?.["radius"]);

  // `radius=none` (and radius-locked styles) resolve to a 0 scale, which zeroes
  // every derived token (sm…4xl) and would collapse this reference legend into
  // a row of identical squares. Fall back to the canonical scale so the section
  // still documents the rounding ramp; binding to the zeroed variables is also
  // skipped below so the literal radii actually render.
  const collapsed = scale === 0;
  const tokens = scaleRadiusTokens(RADIUS_TOKENS, collapsed ? 1 : scale);

  for (const token of tokens) {
    const cell = createVertical(row, 6);
    const tile = figma.createFrame();
    tile.resize(72, 72);
    bindFill(tile, inputs.theme.light.get("primary"));
    const radius = Math.min(token.value, 36);
    tile.topLeftRadius = radius;
    tile.topRightRadius = radius;
    tile.bottomLeftRadius = radius;
    tile.bottomRightRadius = radius;
    if (!collapsed) {
      bindCornerRadii(tile, inputs.primitives.get(`radius/${token.name}`));
    }

    const label = figma.createText();
    label.characters = token.name;
    label.fontSize = 11;
    applyFont(label, "body", "Medium");
    bindFill(label, inputs.theme.light.get("foreground"));

    const sub = figma.createText();
    sub.characters = `${token.value}px`;
    sub.fontSize = 10;
    applyFont(sub, "body", "Regular");
    bindFill(sub, inputs.theme.light.get("muted-foreground"));

    cell.appendChild(tile);
    cell.appendChild(label);
    cell.appendChild(sub);
  }

  page.appendChild(section);
  return countDescendants(section);
}
