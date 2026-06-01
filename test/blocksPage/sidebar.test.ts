import { describe, expect, it } from "vitest";
import { addSidebarBlock } from "../../src/blocksPage/blocks/sidebar";
import { SIDEBAR_VARIANTS } from "../../src/blocksPage/blocks/sidebar/variants";
import { SIDEBAR_HEIGHT } from "../../src/blocksPage/blocks/sidebar/primitives";
import type { BlocksInputs } from "../../src/blocksPage";
import { generateFromRegistry } from "../../src/generator";
import { resolvePreset } from "../../src/registry";

// Build real theme/primitive variables so the rails bind their sidebar tokens
// (`--sidebar-*`) exactly like a live run, then render the block onto a bare
// page (no Components grid — the sidebar variants are self-contained).
async function makeInputs(code = "b2fA"): Promise<BlocksInputs> {
  const resolved = resolvePreset(code);
  if (!resolved.ok) throw new Error("fixture failed to resolve");
  const generated = await generateFromRegistry(resolved.data, {
    presetCode: code,
  });
  const figma = (
    globalThis as unknown as { figma: { createPage: () => PageNode } }
  ).figma;
  const page = figma.createPage();
  (page as unknown as { name: string }).name = "Scratch";
  return {
    presetCode: code,
    primitives: generated.variables.primitives,
    tailwindColors: generated.variables.tailwindColors,
    theme: generated.variables.theme,
    targetPage: page,
  };
}

type FakeNode = {
  type: string;
  name: string;
  width: number;
  height: number;
  children: FakeNode[];
};

describe("addSidebarBlock", () => {
  it("renders with empty token maps, resolving sidebar vars through their neutral fallbacks", async () => {
    // No `--sidebar-*` (or any) variables, so every `t.get(key) ?? t.get(
    // fallback)` resolver falls through to its neutral fallback key.
    const figma = (
      globalThis as unknown as { figma: { createPage: () => PageNode } }
    ).figma;
    const page = figma.createPage();
    const inputs = {
      presetCode: "x",
      primitives: { get: () => undefined },
      tailwindColors: { get: () => undefined },
      theme: { light: { get: () => undefined }, dark: { get: () => undefined } },
      targetPage: page,
    } as unknown as BlocksInputs;

    const count = await addSidebarBlock(page as never, inputs);
    expect(count).toBeGreaterThan(0);
  });

  it("combines the 16 shadcn sidebar layouts into one component set", async () => {
    const inputs = await makeInputs();
    const page = inputs.targetPage as unknown as { children: FakeNode[] };

    const count = await addSidebarBlock(page as never, inputs);
    expect(count).toBeGreaterThan(0);

    // One top-level node: the bordered card wrapping the set.
    expect(page.children).toHaveLength(1);
    const set = findComponentSet(page.children[0]!);
    expect(set).toBeDefined();
    expect(set!.name).toBe("Sidebar");
    expect(set!.children).toHaveLength(16);
  });

  it("names every variant Variant=sidebar-NN", async () => {
    const inputs = await makeInputs();
    const page = inputs.targetPage as unknown as { children: FakeNode[] };
    await addSidebarBlock(page as never, inputs);

    const set = findComponentSet(page.children[0]!)!;
    const names = set.children.map((c) => c.name).sort();
    expect(names).toEqual(
      SIDEBAR_VARIANTS.map((v) => `Variant=${v.key}`).sort(),
    );
  });

  it("gives each sidebar variant the requested 982px height", async () => {
    const inputs = await makeInputs();
    const page = inputs.targetPage as unknown as { children: FakeNode[] };
    await addSidebarBlock(page as never, inputs);

    const set = findComponentSet(page.children[0]!)!;
    for (const variant of set.children) {
      expect(variant.height).toBe(SIDEBAR_HEIGHT);
    }
  });

  it("pins the set to the full 1512 block-canvas width", async () => {
    const inputs = await makeInputs();
    const page = inputs.targetPage as unknown as { children: FakeNode[] };
    await addSidebarBlock(page as never, inputs);

    const set = findComponentSet(page.children[0]!)!;
    expect(set.width).toBe(1512);
  });
});

function findComponentSet(node: FakeNode): FakeNode | undefined {
  if (node.type === "COMPONENT_SET") return node;
  for (const child of node.children ?? []) {
    const found = findComponentSet(child);
    if (found) return found;
  }
  return undefined;
}
