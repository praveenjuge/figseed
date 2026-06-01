// Regression guard for the "Border radius" reference legend. A `radius=none`
// preset zeroes every derived `radius/*` variable (sm…4xl), which used to make
// this whole section render as a row of identical squares. The section must
// fall back to the canonical radius ramp (and skip binding to the zeroed
// variables) so it keeps documenting the rounding scale.

import { describe, expect, it } from "vitest";
import { addRadiusScale } from "../../src/designSystem/sections/radius";
import type { DesignSystemInputs } from "../../src/designSystem";
import { generateFromRegistry } from "../../src/generator";
import { resolvePreset } from "../../src/registry";

type NodeLike = {
  type: string;
  name: string;
  characters?: string;
  children: NodeLike[];
  topLeftRadius?: number;
  boundVariables: Record<string, unknown>;
};

async function makeInputs(
  radius: string | undefined,
  code = "b2fA",
): Promise<DesignSystemInputs> {
  const resolved = resolvePreset(code);
  if (!resolved.ok) throw new Error("fixture failed to resolve");
  const generated = await generateFromRegistry(resolved.data, {
    presetCode: code,
    presetSummary: { radius },
  });
  return {
    presetCode: code,
    presetSummary: { radius },
    tailwindColors: generated.variables.tailwindColors,
    primitives: generated.variables.primitives,
    theme: generated.variables.theme,
  };
}

function page(): NodeLike {
  return (
    globalThis as { figma: { createPage(): NodeLike } }
  ).figma.createPage();
}

// Collect the radius tiles paired with the px value printed beneath them. The
// section lays out vertical cells of [tile, label, sub] where `sub` reads
// "<n>px".
function collectTiles(
  section: NodeLike,
): Array<{ radius: number; bound: boolean; px: number }> {
  const out: Array<{ radius: number; bound: boolean; px: number }> = [];
  const walk = (node: NodeLike) => {
    for (const cell of node.children ?? []) {
      const tile = cell.children?.[0];
      const sub = cell.children?.[2];
      if (
        tile &&
        tile.type === "FRAME" &&
        typeof tile.topLeftRadius === "number" &&
        sub &&
        sub.type === "TEXT"
      ) {
        out.push({
          radius: tile.topLeftRadius,
          bound: "topLeftRadius" in (tile.boundVariables ?? {}),
          px: parseInt(String(sub.characters ?? "0"), 10),
        });
      } else {
        walk(cell);
      }
    }
  };
  walk(section);
  return out;
}

describe("addRadiusScale", () => {
  it("binds tiles to the scaled radius variables for a normal preset", async () => {
    const inputs = await makeInputs("default");
    const p = page();
    await addRadiusScale(p as unknown as PageNode, inputs);

    const section = p.children.find((c) => c.name === "Border radius")!;
    const tiles = collectTiles(section);
    expect(tiles.length).toBe(10);
    // Default preset keeps the canonical ramp and binds every tile.
    expect(tiles.every((t) => t.bound)).toBe(true);
    // A spread of distinct radii, not all-zero.
    expect(new Set(tiles.map((t) => t.px)).size).toBeGreaterThan(3);
  });

  it("falls back to the canonical ramp when radius=none collapses the scale", async () => {
    const inputs = await makeInputs("none");
    const p = page();
    await addRadiusScale(p as unknown as PageNode, inputs);

    const section = p.children.find((c) => c.name === "Border radius")!;
    const tiles = collectTiles(section);
    expect(tiles.length).toBe(10);

    // The derived tokens must NOT all collapse to a square.
    const derived = tiles.filter((t) => t.px > 0 && t.px < 9999);
    expect(derived.length).toBeGreaterThan(3);

    // Literal radii render (capped at 36) and are not bound to the zeroed
    // variables, so the legend stays meaningful instead of square.
    expect(tiles.every((t) => !t.bound)).toBe(true);
    const rounded = tiles.filter((t) => t.radius > 0);
    expect(rounded.length).toBeGreaterThan(3);
  });
});
