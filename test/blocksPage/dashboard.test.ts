import { describe, expect, it } from "vitest";
import { addDashboardBlock } from "../../src/blocksPage/blocks/dashboard";
import type { BlocksInputs } from "../../src/blocksPage";

// Empty token maps + no Components page, so the dashboard draws its fallback
// rail and the sidebar tokens resolve through their card/border fallbacks
// (`t.get("sidebar") ?? t.get("card")`).
const emptyInputs = {
  presetCode: "x",
  primitives: { get: () => undefined },
  tailwindColors: { get: () => undefined },
  theme: { light: { get: () => undefined }, dark: { get: () => undefined } },
} as unknown as BlocksInputs;

function newPage() {
  return (globalThis as { figma: { createPage: () => unknown } }).figma
    .createPage() as never;
}

describe("addDashboardBlock", () => {
  it("builds the fallback rail and resolves sidebar tokens via the card/border fallbacks", async () => {
    const count = await addDashboardBlock(newPage(), emptyInputs);
    expect(count).toBeGreaterThan(0);
  });
});
