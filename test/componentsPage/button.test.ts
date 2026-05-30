import { describe, expect, it } from "vitest";
import { addButtonSection } from "../../src/componentsPage/sections/button";
import type { ComponentsInputs } from "../../src/componentsPage";

// Minimal inputs: the binding helpers no-op on missing variables, so empty
// maps still exercise the full variant matrix and component-set assembly.
function emptyInputs(): ComponentsInputs {
  return {
    presetCode: "test",
    primitives: new Map(),
    tailwindColors: new Map(),
    theme: { light: new Map(), dark: new Map() },
  };
}

type FakeNode = { type: string; name: string; children: FakeNode[] };

describe("addButtonSection", () => {
  it("builds a 6x8 variant matrix combined into one component set", async () => {
    const figma = (globalThis as { figma: { createPage: () => FakeNode } })
      .figma;
    const page = figma.createPage();

    const count = await addButtonSection(page as never, emptyInputs());

    // 48 components in one set. The 24 text buttons (6 variants × 4 non-icon
    // sizes) each wrap a single label node; the 24 icon buttons (6 × 4 icon
    // sizes) each wrap a rendered icon (mock createNodeFromSvg → frame + vector).
    //   1 (set) + 24*(1 comp + 1 label) + 24*(1 comp + 1 frame + 1 vector)
    //   = 1 + 48 + 72 = 121.
    expect(count).toBe(121);

    expect(page.children).toHaveLength(1);
    const set = page.children[0]!;
    expect(set.type).toBe("COMPONENT_SET");
    expect(set.name).toBe("Button");
    expect(set.children).toHaveLength(48);
  });

  it("names variants with the Figma Variant=…, Size=… convention", async () => {
    const figma = (globalThis as { figma: { createPage: () => FakeNode } })
      .figma;
    const page = figma.createPage();
    await addButtonSection(page as never, emptyInputs());

    const set = page.children[0]!;
    const names = set.children.map((c) => c.name);
    expect(names).toContain("Variant=default, Size=icon");
    expect(names).toContain("Variant=link, Size=lg");
    expect(names).toContain("Variant=outline, Size=icon-xs");
    expect(names).toContain("Variant=secondary, Size=icon-lg");
  });
});
