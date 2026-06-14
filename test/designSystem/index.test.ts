import { describe, expect, it } from "vitest";
import { buildDesignSystem } from "../../src/designSystem";
import type { DesignSystemInputs } from "../../src/designSystem";
import { generateFromRegistry } from "../../src/generator";
import { resolvePreset } from "../../src/registry";
import type { FigmaMock } from "../figma-mock";

async function makeInputs(code = "b2fA"): Promise<DesignSystemInputs> {
  const resolved = resolvePreset(code);
  if (!resolved.ok) throw new Error("fixture failed to resolve");
  const generated = await generateFromRegistry(resolved.data, {
    presetCode: code,
  });
  return {
    presetCode: code,
    tailwindColors: generated.variables.tailwindColors,
    primitives: generated.variables.primitives,
    theme: generated.variables.theme,
  };
}

describe("buildDesignSystem", () => {
  it("builds the page and reports a node count", async () => {
    const inputs = await makeInputs();
    const result = await buildDesignSystem(inputs);
    expect(result.nodeCount).toBeGreaterThan(0);

    const page = (
      globalThis as { figma: { root: { children: { name: string }[] } } }
    ).figma.root.children.find((c) => c.name === "Niram");
    expect(page).toBeDefined();
    expect(
      (page as unknown as { children: unknown[] }).children.length,
    ).toBeGreaterThan(0);
  });

  it("reports build and post-processing phase progress", async () => {
    const inputs = await makeInputs();
    const events: { phase: string; current: number; total: number }[] = [];
    await buildDesignSystem({
      ...inputs,
      onProgress: (event) => events.push(event),
    });

    const phases = new Set(events.map((e) => e.phase));
    // Build phase plus every post-processing sweep reports progress.
    expect(phases).toContain("building");
    expect(phases).toContain("text-styles");
    expect(phases).toContain("binding");
    expect(phases).toContain("layout");

    // The build phase steps once per section (11) and emits a final "Done".
    const building = events.filter((e) => e.phase === "building");
    expect(building.length).toBe(12);
    expect(building.at(-1)).toMatchObject({ current: 11, total: 11 });
    // The post-build sweeps end at 100% of the section nodes they processed.
    const lastBinding = events.filter((e) => e.phase === "binding").at(-1)!;
    expect(lastBinding.current).toBe(lastBinding.total);
  });

  it("rebuilds in place rather than duplicating the page", async () => {
    const inputs = await makeInputs();
    await buildDesignSystem(inputs);
    await buildDesignSystem(inputs);
    const figma = (
      globalThis as { figma: { root: { children: { name: string }[] } } }
    ).figma;
    const pages = figma.root.children.filter((c) => c.name === "Niram");
    expect(pages).toHaveLength(1);
  });

  it("publishes the Tailwind text styles and maps matching text nodes onto them", async () => {
    const inputs = await makeInputs();
    await buildDesignSystem(inputs);

    const figma = (globalThis as unknown as { figma: FigmaMock }).figma;
    const styles = await figma.getLocalTextStylesAsync();
    // 13 sizes × 9 weights.
    expect(styles).toHaveLength(117);

    const page = figma.root.children.find(
      (c) => (c as unknown as { name: string }).name === "Niram",
    );
    const styled = countStyledText(page as unknown as TreeNode);
    expect(styled).toBeGreaterThan(0);
  });
});

type TreeNode = {
  type: string;
  textStyleId?: string;
  children?: TreeNode[];
};

function countStyledText(node: TreeNode | undefined): number {
  if (!node) return 0;
  let count =
    node.type === "TEXT" && typeof node.textStyleId === "string" ? 1 : 0;
  for (const child of node.children ?? []) count += countStyledText(child);
  return count;
}
