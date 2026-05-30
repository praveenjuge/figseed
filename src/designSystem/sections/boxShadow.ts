// Box + inner shadow tokens. Shadows are published as Figma *effect styles*
// (see src/effects.ts / src/effectStyles.ts) so a designer edits a shadow once
// and every node referencing it updates. Each tile here references the matching
// style by name; the literal effects from the spec are applied first as a
// fallback for hosts that reject the style binding.

import {
  INNER_SHADOW_STYLES,
  SHADOW_STYLES,
  type EffectStyleSpec,
} from "../../effects";
import { applyEffectStyle } from "../../effectStyles";
import { applyFont } from "../../fonts";
import { bindFill } from "../bindings";
import {
  createSectionFrame,
  createSubSection,
  createWrappingRow,
  sectionContentWidth,
} from "../layout";
import { solidPaint } from "../paints";
import type { DesignSystemInputs } from "../types";
import { countDescendants, shortTokenName } from "../utils";

const TILE = 56; // compact swatch size

export async function addBoxShadows(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Shadows");
  // Shadows bleed past their tile, so the section must NOT clip its content —
  // otherwise the spread/blur gets cut off at the card edge. (Regression
  // guard: see test/designSystem/boxShadow.test.ts.)
  section.clipsContent = false;

  await addShadowGroup(section, inputs, "Drop shadow", SHADOW_STYLES);
  await addShadowGroup(section, inputs, "Inner shadow", INNER_SHADOW_STYLES);

  page.appendChild(section);
  return countDescendants(section);
}

async function addShadowGroup(
  section: FrameNode,
  inputs: DesignSystemInputs,
  title: string,
  specs: EffectStyleSpec[],
): Promise<void> {
  const group = createSubSection(section, title);
  // The subsection frame sits between the (non-clipping) section and the row;
  // it must not clip either, or it cuts off the shadow bleed.
  group.clipsContent = false;

  // Parent the row to the section's content width so tiles flow left-to-right
  // and wrap, instead of collapsing into a vertical stack inside the hugging
  // subsection frame.
  const row = createWrappingRow(group, 24);
  // The subsection hugs its content (≈0 width), so size the row to the
  // section's content width — otherwise tiles collapse into a vertical stack.
  row.resize(sectionContentWidth(), 1);
  // Let shadows spread freely — none of the wrappers around a shadow tile may
  // clip, or the bleed gets cut off. Vertical padding keeps neighbouring rows
  // from visually overlapping once the shadows extend past the tiles.
  row.clipsContent = false;
  row.paddingTop = 16;
  row.paddingBottom = 24;
  row.paddingLeft = 8;
  row.paddingRight = 8;

  for (const spec of specs) {
    const cell = figma.createFrame();
    cell.layoutMode = "VERTICAL";
    cell.itemSpacing = 6;
    cell.counterAxisAlignItems = "CENTER";
    cell.fills = [];
    cell.clipsContent = false;
    cell.primaryAxisSizingMode = "AUTO";
    cell.counterAxisSizingMode = "AUTO";

    const tile = figma.createFrame();
    tile.resize(TILE, TILE);
    tile.cornerRadius = 8;
    tile.fills = [solidPaint(1)];
    // Literal effects first (fallback), then reference the published style so
    // the tile tracks later edits to the shared shadow.
    tile.effects = spec.effects;
    await applyEffectStyle(tile, inputs.effectStyles?.idFor(spec.name));

    const label = figma.createText();
    label.characters = shortTokenName(spec.name);
    label.fontSize = 10;
    applyFont(label, "body", "Medium");
    bindFill(label, inputs.theme.light.get("muted-foreground"));

    cell.appendChild(tile);
    cell.appendChild(label);
    row.appendChild(cell);
  }
}
