import { describe, expect, it, vi } from "vitest";
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
    ).figma.root.children.find((c) => c.name === "Design System");
    expect(page).toBeDefined();
    expect(
      (page as unknown as { children: unknown[] }).children.length,
    ).toBeGreaterThan(0);
  });

  it("reports progress once per section plus a final Done", async () => {
    const inputs = await makeInputs();
    const onProgress = vi.fn();
    await buildDesignSystem({ ...inputs, onProgress });
    // 12 sections + the final "Done" call.
    expect(onProgress).toHaveBeenCalledTimes(13);
    expect(onProgress).toHaveBeenLastCalledWith(12, 12, "Done");
  });

  it("rebuilds in place rather than duplicating the page", async () => {
    const inputs = await makeInputs();
    await buildDesignSystem(inputs);
    await buildDesignSystem(inputs);
    const figma = (
      globalThis as { figma: { root: { children: { name: string }[] } } }
    ).figma;
    const pages = figma.root.children.filter((c) => c.name === "Design System");
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
      (c) => (c as unknown as { name: string }).name === "Design System",
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
