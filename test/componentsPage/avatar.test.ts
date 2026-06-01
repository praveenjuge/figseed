import { describe, expect, it, vi } from "vitest";
import { addAvatarSection } from "../../src/componentsPage/sections/avatar";
import type { ComponentsInputs } from "../../src/componentsPage";
import { AVATAR_IMAGES } from "../../src/data/avatars";
import { generateFromRegistry } from "../../src/generator";
import { resolvePreset } from "../../src/registry";

type StyleStore = {
  getLocalPaintStylesAsync(): Promise<{ name: string; paints: unknown[] }[]>;
};

type NodeLike = {
  name: string;
  children: NodeLike[];
  fillStyleId?: string;
};

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

function getFigma() {
  return (
    globalThis as unknown as { figma: StyleStore & { createPage(): NodeLike } }
  ).figma;
}

describe("addAvatarSection", () => {
  it("creates one image paint style per bundled avatar", async () => {
    const figma = getFigma();
    const page = figma.createPage();
    await addAvatarSection(page as unknown as PageNode, await makeInputs());

    const styles = await figma.getLocalPaintStylesAsync();
    const avatarStyles = styles.filter((s) => s.name.indexOf("Avatar/") === 0);
    expect(avatarStyles).toHaveLength(AVATAR_IMAGES.length);
    // Each style holds a single image paint.
    for (const style of avatarStyles) {
      expect(style.paints).toHaveLength(1);
      expect((style.paints[0] as { type: string }).type).toBe("IMAGE");
    }
  });

  it("links image variants to a paint style instead of a color fill", async () => {
    const figma = getFigma();
    const page = figma.createPage();
    await addAvatarSection(page as unknown as PageNode, await makeInputs());

    const componentSet = (page as unknown as NodeLike).children.find(
      (c) => c.name === "Avatar",
    );
    expect(componentSet).toBeDefined();
    const imageVariants = componentSet!.children.filter((c) =>
      c.name.includes("Kind=image"),
    );
    expect(imageVariants.length).toBeGreaterThan(0);
    for (const variant of imageVariants) {
      expect(typeof variant.fillStyleId).toBe("string");
      expect(variant.fillStyleId!.length).toBeGreaterThan(0);
    }
  });

  it("reuses existing avatar styles on a second build (idempotent)", async () => {
    const figma = getFigma();
    const inputs = await makeInputs();

    const page1 = figma.createPage();
    await addAvatarSection(page1 as unknown as PageNode, inputs);
    const page2 = figma.createPage();
    await addAvatarSection(page2 as unknown as PageNode, inputs);

    const styles = await figma.getLocalPaintStylesAsync();
    const avatarStyles = styles.filter((s) => s.name.indexOf("Avatar/") === 0);
    // No duplicates: still one style per bundled avatar after re-running.
    expect(avatarStyles).toHaveLength(AVATAR_IMAGES.length);
  });

  it("skips a blank avatar image entry without minting a style", async () => {
    const figma = getFigma();
    // A falsy entry exercises the `if (!base64) continue` guard in
    // ensureAvatarStyles without producing a paint style for it.
    (AVATAR_IMAGES as string[]).push("");
    try {
      const page = figma.createPage();
      await addAvatarSection(page as unknown as PageNode, await makeInputs());
      const styles = await figma.getLocalPaintStylesAsync();
      const avatarStyles = styles.filter(
        (s) => s.name.indexOf("Avatar/") === 0,
      );
      // The blank entry is skipped, so the style count matches the real images.
      expect(avatarStyles).toHaveLength(AVATAR_IMAGES.length - 1);
    } finally {
      (AVATAR_IMAGES as string[]).pop();
    }
  });

  it("swallows a setFillStyleIdAsync rejection from the host", async () => {
    const figma = getFigma() as unknown as {
      createComponent: () => { setFillStyleIdAsync: (id: string) => Promise<void> };
      createPage(): NodeLike;
    };
    const origCreate = figma.createComponent.bind(figma);
    figma.createComponent = () => {
      const comp = origCreate();
      comp.setFillStyleIdAsync = () =>
        Promise.reject(new Error("host rejected fill style"));
      return comp;
    };
    try {
      const page = figma.createPage();
      await expect(
        addAvatarSection(page as unknown as PageNode, await makeInputs()),
      ).resolves.toBeGreaterThan(0);
    } finally {
      figma.createComponent = origCreate;
    }
  });

  it("falls back to a tinted fill + initials when no image style is available", async () => {
    // Simulate the data module being absent: ensureAvatarStyles yields a map
    // whose idAt always returns undefined, so the image variants take the
    // tinted-fill + "PJ" initials fallback branch instead of a paint style.
    vi.resetModules();
    vi.doMock("../../src/componentsPage/avatarStyles", () => ({
      ensureAvatarStyles: () =>
        Promise.resolve({ idAt: () => undefined, count: 0 }),
    }));
    const { addAvatarSection: addWithoutStyles } =
      await import("../../src/componentsPage/sections/avatar");

    const figma = getFigma();
    const page = figma.createPage();
    await addWithoutStyles(page as unknown as PageNode, await makeInputs());

    const componentSet = (page as unknown as NodeLike).children.find(
      (c) => c.name === "Avatar",
    );
    expect(componentSet).toBeDefined();
    const imageVariants = componentSet!.children.filter((c) =>
      c.name.includes("Kind=image"),
    );
    expect(imageVariants.length).toBeGreaterThan(0);
    for (const variant of imageVariants) {
      // No paint style attached — the fallback uses a bound color fill, and
      // appends an initials text node ("PJ").
      expect(variant.fillStyleId).toBeUndefined();
      const initials = variant.children.find(
        (child) => (child as { characters?: string }).characters === "PJ",
      );
      expect(initials).toBeDefined();
    }
    vi.doUnmock("../../src/componentsPage/avatarStyles");
    vi.resetModules();
  });
});
