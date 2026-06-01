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
  it("builds the Components grid on the Figseed page with nodes", async () => {
    const result = await buildComponentsPage(await makeInputs());
    expect(result.nodeCount).toBeGreaterThan(0);
    const page = (
      globalThis as { figma: { root: { children: { name: string }[] } } }
    ).figma.root.children.find((c) => c.name === "Figseed");
    expect(page).toBeDefined();
  });

  it("reports progress for all 58 sections plus Done", async () => {
    const onProgress = vi.fn();
    await buildComponentsPage({ ...(await makeInputs()), onProgress });
    expect(onProgress).toHaveBeenCalledTimes(59);
    expect(onProgress).toHaveBeenLastCalledWith(58, 58, "Done");
  });

  it("reuses and clears its region on the Figseed page on rebuild", async () => {
    const inputs = await makeInputs();
    await buildComponentsPage(inputs);
    await buildComponentsPage(inputs);

    const pages = (
      globalThis as { figma: { root: { children: { name: string }[] } } }
    ).figma.root.children.filter((c) => c.name === "Figseed");
    // The second build clears its own region's frames rather than minting a
    // duplicate page (idempotent rebuild on the shared page).
    expect(pages).toHaveLength(1);
  });
});
