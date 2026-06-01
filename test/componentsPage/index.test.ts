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

  it("offsets the grid to the right of an existing Design System region", async () => {
    type FakeNode = {
      x: number;
      name: string;
      resize: (w: number, h: number) => void;
      setPluginData: (k: string, v: string) => void;
      getPluginData: (k: string) => string;
      appendChild: (c: unknown) => void;
      children: FakeNode[];
    };
    const figmaApi = (
      globalThis as unknown as {
        figma: { createPage: () => FakeNode; createFrame: () => FakeNode };
      }
    ).figma;

    // Pre-build the shared page with a tagged Design System region: a wide
    // frame (sets the right edge), a narrower one (exercises the
    // `right > maxRight` false branch), and an untagged frame (the
    // not-our-region skip branch).
    const page = figmaApi.createPage();
    page.name = "Figseed";
    const tag = (n: FakeNode, w: number, region?: string) => {
      n.x = 0;
      n.resize(w, 100);
      if (region) n.setPluginData("figseedRegion", region);
      page.appendChild(n);
    };
    tag(figmaApi.createFrame(), 1000, "design-system");
    tag(figmaApi.createFrame(), 500, "design-system");
    tag(figmaApi.createFrame(), 200); // untagged, neither own nor DS

    await buildComponentsPage(await makeInputs());

    const sectionNodes = page.children.filter(
      (n) => n.getPluginData("figseedRegion") === "components",
    );
    expect(sectionNodes.length).toBeGreaterThan(0);
    // Every section starts past the Design System region's right edge (1000).
    const minX = Math.min(...sectionNodes.map((n) => n.x));
    expect(minX).toBeGreaterThanOrEqual(1000);
  });
});
