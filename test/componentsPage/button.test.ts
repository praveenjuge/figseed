import { describe, expect, it } from "vitest";
import { addButtonSection } from "../../src/componentsPage/sections/button";
import type { ComponentsInputs } from "../../src/componentsPage";

// Minimal inputs: the binding helpers no-op on missing variables, so empty
// maps still exercise the full variant matrix and component-set assembly.
function emptyInputs(): ComponentsInputs {
  return {
    presetCode: "test",
    primitives: new Map(),
    theme: { light: new Map(), dark: new Map() },
  };
}

type FakeNode = { type: string; name: string; children: FakeNode[] };

describe("addButtonSection", () => {
  it("builds a 6x5 variant matrix combined into one component set", async () => {
    const figma = (globalThis as { figma: { createPage: () => FakeNode } }).figma;
    const page = figma.createPage();

    const count = await addButtonSection(page as never, emptyInputs());

    // 30 components, each wrapping a label => 1 set + 30*(1 + 1) descendants.
    expect(count).toBe(61);

    expect(page.children).toHaveLength(1);
    const set = page.children[0]!;
    expect(set.type).toBe("COMPONENT_SET");
    expect(set.name).toBe("Button");
    expect(set.children).toHaveLength(30);
  });

  it("names variants with the Figma Variant=…, Size=… convention", async () => {
    const figma = (globalThis as { figma: { createPage: () => FakeNode } }).figma;
    const page = figma.createPage();
    await addButtonSection(page as never, emptyInputs());

    const set = page.children[0]!;
    const names = set.children.map((c) => c.name);
    expect(names).toContain("Variant=default, Size=icon");
    expect(names).toContain("Variant=link, Size=lg");
  });
});
