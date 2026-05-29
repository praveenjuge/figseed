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

  it("reports progress for all 23 sections plus Done", async () => {
    const onProgress = vi.fn();
    await buildComponentsPage({ ...(await makeInputs()), onProgress });
    expect(onProgress).toHaveBeenCalledTimes(24);
    expect(onProgress).toHaveBeenLastCalledWith(23, 23, "Done");
  });
});
