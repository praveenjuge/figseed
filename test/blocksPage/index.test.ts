import { describe, expect, it, vi } from "vitest";
import { buildBlocksRegion } from "../../src/blocksPage";
import type { BlocksInputs } from "../../src/blocksPage";
import { buildComponentsPage } from "../../src/componentsPage";
import { generateFromRegistry } from "../../src/generator";
import { resolvePreset } from "../../src/registry";

type Root = { figma: { root: { children: { type: string; name: string }[] } } };

type GeneratedVars = Awaited<
  ReturnType<typeof generateFromRegistry>
>["variables"];

async function makeVars(code = "b2fA"): Promise<GeneratedVars> {
  const resolved = resolvePreset(code);
  if (!resolved.ok) throw new Error("fixture failed to resolve");
  const generated = await generateFromRegistry(resolved.data, {
    presetCode: code,
  });
  return generated.variables;
}

// Build the Components page (the blocks render onto it) and return inputs that
// target it, so blocks reuse the page's component instances.
async function makeInputsOnComponentsPage(
  code = "b2fA",
): Promise<BlocksInputs> {
  const vars = await makeVars(code);
  const componentsInputs = {
    presetCode: code,
    primitives: vars.primitives,
    tailwindColors: vars.tailwindColors,
    theme: vars.theme,
  };
  await buildComponentsPage(componentsInputs);
  const targetPage = (globalThis as unknown as Root).figma.root.children.find(
    (c) => c.type === "PAGE" && c.name === "Components",
  ) as unknown as PageNode;
  return { ...componentsInputs, targetPage };
}

function countInstances(page: {
  children: { type: string; children?: unknown[] }[];
}): number {
  let instanceCount = 0;
  const visit = (node: { type: string; children?: unknown[] }) => {
    if (node.type === "INSTANCE") instanceCount++;
    const children = node.children as
      | { type: string; children?: unknown[] }[]
      | undefined;
    if (children) for (const child of children) visit(child);
  };
  for (const child of page.children) visit(child);
  return instanceCount;
}

describe("buildBlocksRegion", () => {
  it("appends a blocks region onto the Components page", async () => {
    const inputs = await makeInputsOnComponentsPage();
    const before = (inputs.targetPage as unknown as { children: unknown[] })
      .children.length;

    const result = await buildBlocksRegion(inputs);
    expect(result.nodeCount).toBeGreaterThan(0);

    const after = (inputs.targetPage as unknown as { children: unknown[] })
      .children.length;
    // Header + Login + Signup + Dashboard add 4 top-level frames.
    expect(after - before).toBe(4);
  });

  it("does not create a new page (Starter tier 3-page cap)", async () => {
    const inputs = await makeInputsOnComponentsPage();
    const pagesBefore = (
      globalThis as unknown as Root
    ).figma.root.children.filter((c) => c.type === "PAGE").length;

    await buildBlocksRegion(inputs);

    const pagesAfter = (
      globalThis as unknown as Root
    ).figma.root.children.filter((c) => c.type === "PAGE").length;
    expect(pagesAfter).toBe(pagesBefore);
    expect(
      (globalThis as unknown as Root).figma.root.children.find(
        (c) => c.type === "PAGE" && c.name === "Blocks",
      ),
    ).toBeUndefined();
  });

  it("reports progress for the header plus all blocks and Done", async () => {
    const onProgress = vi.fn();
    await buildBlocksRegion({
      ...(await makeInputsOnComponentsPage()),
      onProgress,
    });
    // Header + Login + Signup + Dashboard = 4 builders, plus the final Done.
    expect(onProgress).toHaveBeenCalledTimes(5);
    expect(onProgress).toHaveBeenLastCalledWith(4, 4, "Done");
  });

  it("embeds live instances of the page's components", async () => {
    const inputs = await makeInputsOnComponentsPage();
    const before = countInstances(
      inputs.targetPage as unknown as {
        children: { type: string; children?: unknown[] }[];
      },
    );

    await buildBlocksRegion(inputs);

    const after = countInstances(
      inputs.targetPage as unknown as {
        children: { type: string; children?: unknown[] }[];
      },
    );
    // The blocks region adds INSTANCE nodes (reused Button/Input/Label/Card/
    // Chart/Table/Sidebar) on top of whatever the component grid already had.
    expect(after).toBeGreaterThan(before);
  });

  it("places the region to the right of the existing component grid", async () => {
    const inputs = await makeInputsOnComponentsPage();
    const page = inputs.targetPage as unknown as {
      children: (SceneNode & { x: number; width: number })[];
    };
    const existing = [...page.children];
    let gridRight = 0;
    for (const node of existing) {
      gridRight = Math.max(gridRight, (node.x ?? 0) + (node.width ?? 0));
    }

    await buildBlocksRegion(inputs);

    const added = page.children.filter((c) => !existing.includes(c));
    expect(added.length).toBeGreaterThan(0);
    // Every newly added block starts at or past the grid's right edge.
    for (const node of added) {
      expect(node.x).toBeGreaterThanOrEqual(gridRight);
    }
  });

  it("falls back to drawn stand-ins on a bare page (no components)", async () => {
    // Render onto an empty page that holds no component sets. Every reuse
    // misses, so each block draws its fallback Button/Input/Label/Sidebar/etc.
    const vars = await makeVars();
    const figma = (
      globalThis as unknown as { figma: { createPage: () => PageNode } }
    ).figma;
    const barePage = figma.createPage();
    (barePage as unknown as { name: string }).name = "Scratch";

    const result = await buildBlocksRegion({
      presetCode: "b2fA",
      primitives: vars.primitives,
      tailwindColors: vars.tailwindColors,
      theme: vars.theme,
      targetPage: barePage,
    });

    // The blocks still render (via fallbacks) and the region anchors at x=0
    // since there's no grid to sit beside.
    expect(result.nodeCount).toBeGreaterThan(0);
    const children = (
      barePage as unknown as { children: (SceneNode & { x: number })[] }
    ).children;
    expect(children.length).toBe(4);
    for (const node of children) expect(node.x).toBe(0);
    // No component instances exist on a bare page — everything is drawn.
    expect(
      countInstances(
        barePage as unknown as {
          children: { type: string; children?: unknown[] }[];
        },
      ),
    ).toBe(0);
  });
});
