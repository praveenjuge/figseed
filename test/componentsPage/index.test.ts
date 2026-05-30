import { describe, expect, it, vi } from "vitest";
import { buildComponentsPage } from "../../src/componentsPage";
import type { ComponentsInputs } from "../../src/componentsPage";
import { generateFromRegistry } from "../../src/generator";
import { resolvePreset } from "../../src/registry";

async function makeInputs(code = "b2fA"): Promise<ComponentsInputs> {
  const resolved = resolvePreset(code);
  if (!resolved.ok) throw new Error("fixture failed to resolve");
  const generated = await generateFromRegistry(resolved.data, {
    presetCode: code,
  });
  return {
    presetCode: code,
    primitives: generated.variables.primitives,
    tailwindColors: generated.variables.tailwindColors,
    theme: generated.variables.theme,
  };
}

describe("buildComponentsPage", () => {
  it("builds the Components page with nodes", async () => {
    const result = await buildComponentsPage(await makeInputs());
    expect(result.nodeCount).toBeGreaterThan(0);
    const page = (
      globalThis as { figma: { root: { children: { name: string }[] } } }
    ).figma.root.children.find((c) => c.name === "Components");
    expect(page).toBeDefined();
  });

  it("reports progress for all 38 sections plus Done", async () => {
    const onProgress = vi.fn();
    await buildComponentsPage({ ...(await makeInputs()), onProgress });
    expect(onProgress).toHaveBeenCalledTimes(39);
    expect(onProgress).toHaveBeenLastCalledWith(38, 38, "Done");
  });

  it("reuses and clears an existing Components page on rebuild", async () => {
    const inputs = await makeInputs();
    await buildComponentsPage(inputs);
    await buildComponentsPage(inputs);

    const pages = (
      globalThis as { figma: { root: { children: { name: string }[] } } }
    ).figma.root.children.filter((c) => c.name === "Components");
    // The second build clears the existing page's children rather than minting
    // a duplicate page (idempotent rebuild).
    expect(pages).toHaveLength(1);
  });
});
