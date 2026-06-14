import { describe, expect, it } from "vitest";
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
  it("builds the Components grid on the Niram page with nodes", async () => {
    const result = await buildComponentsPage(await makeInputs());
    expect(result.nodeCount).toBeGreaterThan(0);
    const page = (
      globalThis as { figma: { root: { children: { name: string }[] } } }
    ).figma.root.children.find((c) => c.name === "Niram");
    expect(page).toBeDefined();
  });

  it("reports build and post-processing phase progress for all sections", async () => {
    const events: { phase: string; current: number; total: number }[] = [];
    await buildComponentsPage({
      ...(await makeInputs()),
      onProgress: (event) => events.push(event),
    });

    const phases = new Set(events.map((e) => e.phase));
    expect(phases).toContain("building");
    expect(phases).toContain("text-styles");
    expect(phases).toContain("binding");
    expect(phases).toContain("layout");

    // 58 sections each step the build phase, plus a final "Done" step.
    const building = events.filter((e) => e.phase === "building");
    expect(building.length).toBe(59);
    expect(building.at(-1)).toMatchObject({ current: 58, total: 58 });
    // The sweeps complete (current === total of the nodes they walked).
    const lastText = events.filter((e) => e.phase === "text-styles").at(-1)!;
    expect(lastText.current).toBe(lastText.total);
  });

  it("reuses and clears its region on the Niram page on rebuild", async () => {
    const inputs = await makeInputs();
    await buildComponentsPage(inputs);
    await buildComponentsPage(inputs);

    const pages = (
      globalThis as { figma: { root: { children: { name: string }[] } } }
    ).figma.root.children.filter((c) => c.name === "Niram");
    // The second build clears its own region's frames rather than minting a
    // duplicate page (idempotent rebuild on the shared page).
    expect(pages).toHaveLength(1);
  });
});
