import { describe, expect, it } from "vitest";
import { createSurface } from "../../src/blocksPage/layout";
import type { BlocksInputs } from "../../src/blocksPage";

const baseInputs = {
  presetCode: "x",
  primitives: { get: () => undefined },
  tailwindColors: { get: () => undefined },
  theme: { light: { get: () => undefined }, dark: { get: () => undefined } },
} as unknown as BlocksInputs;

describe("createSurface", () => {
  it("applies a published effect style when a shadow + effectStyles are given", async () => {
    const inputs = {
      ...baseInputs,
      effectStyles: { idFor: () => "shadow-style-1" },
    } as unknown as BlocksInputs;

    const surface = await createSurface(inputs, 360, { shadow: "Shadow/sm" });
    expect(
      (surface as unknown as { effectStyleId?: string }).effectStyleId,
    ).toBe("shadow-style-1");
  });

  it("falls through cleanly when a shadow is requested but no effectStyles exist", async () => {
    // effectStyles is absent, so the optional chain yields undefined and
    // applyEffectStyle no-ops — the surface keeps its literal (empty) effects.
    const surface = await createSurface(baseInputs, 360, { shadow: "Shadow/sm" });
    expect(
      (surface as unknown as { effectStyleId?: string }).effectStyleId,
    ).toBeUndefined();
  });
});
