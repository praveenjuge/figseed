import { describe, expect, it } from "vitest";
import {
  createIcon,
  createNamedIcon,
  instantiateIcon,
  resolveIconName,
  type IconComponentMap,
} from "../src/icons";
import { ICON_LIBRARIES } from "../src/data/icons";

type FakeNode = {
  type: string;
  name: string;
  rescale?: (factor: number) => void;
  [key: string]: unknown;
};

const fig = () => (globalThis as { figma: typeof figma }).figma;

describe("createIcon", () => {
  it("renders a recolored icon node from the active library", () => {
    const icon = createIcon({
      library: "lucide",
      name: "info",
      size: 24,
    }) as unknown as FakeNode;
    expect(icon).toBeDefined();
    expect(icon.name).toBe("icon");
  });

  it("rescales the geometry when the target size differs from 24px", () => {
    const calls: number[] = [];
    const figmaAny = fig() as unknown as {
      createNodeFromSvg: (svg: string) => FakeNode;
    };
    const orig = figmaAny.createNodeFromSvg.bind(figmaAny);
    figmaAny.createNodeFromSvg = (svg: string) => {
      const node = orig(svg);
      node.rescale = (factor: number) => calls.push(factor);
      return node;
    };

    createIcon({ library: "lucide", name: "info", size: 12 });
    expect(calls).toEqual([12 / 24]);
  });

  it("returns undefined when the library has no candidate for the icon", () => {
    // findIconInner falls through every candidate when none resolves in the
    // active library. The curated subsets always carry a candidate, so we
    // temporarily strip the "info" candidates from lucide to drive the
    // fall-through, then restore.
    const original = { ...ICON_LIBRARIES.lucide.icons };
    for (const candidate of [
      "info",
      "information-circle",
      "info-circle",
      "information-line",
    ]) {
      delete ICON_LIBRARIES.lucide.icons[candidate];
    }
    try {
      const icon = createIcon({ library: "lucide", name: "info", size: 24 });
      expect(icon).toBeUndefined();
    } finally {
      ICON_LIBRARIES.lucide.icons = original;
    }
  });

  it("does not rescale when the target size is the native 24px", () => {
    const calls: number[] = [];
    const figmaAny = fig() as unknown as {
      createNodeFromSvg: (svg: string) => FakeNode;
    };
    const orig = figmaAny.createNodeFromSvg.bind(figmaAny);
    figmaAny.createNodeFromSvg = (svg: string) => {
      const node = orig(svg);
      node.rescale = (factor: number) => calls.push(factor);
      return node;
    };

    createIcon({ library: "lucide", name: "info", size: 24 });
    expect(calls).toEqual([]);
  });
});

describe("resolveIconName", () => {
  it("returns the first candidate present in the library", () => {
    expect(resolveIconName("lucide", "info")).toBe("info");
  });

  it("returns undefined when no candidate exists in the library", () => {
    const original = { ...ICON_LIBRARIES.lucide.icons };
    for (const candidate of [
      "info",
      "information-circle",
      "info-circle",
      "information-line",
    ]) {
      delete ICON_LIBRARIES.lucide.icons[candidate];
    }
    try {
      expect(resolveIconName("lucide", "info")).toBeUndefined();
    } finally {
      ICON_LIBRARIES.lucide.icons = original;
    }
  });
});

describe("createNamedIcon", () => {
  type Node = { type: string; name: string; [key: string]: unknown };

  it("renders a named icon by exact name", () => {
    const icon = createNamedIcon({
      library: "lucide",
      name: "chevron-right",
      size: 16,
    }) as unknown as Node;
    expect(icon).toBeDefined();
    expect(icon.name).toBe("icon");
  });

  it("returns undefined when no candidate name exists in the library", () => {
    // phosphor has no `chevron-right` (it uses `caret-right`); a bare lookup
    // misses, which is the bug behind the previously-dropped chevron glyphs.
    const icon = createNamedIcon({
      library: "phosphor",
      name: "chevron-right",
      size: 16,
    });
    expect(icon).toBeUndefined();
  });

  it("falls back to the first candidate present in the active library", () => {
    // The Sidebar blocks pass cross-library candidate lists so a chevron still
    // renders as phosphor's caret instead of dropping out.
    const icon = createNamedIcon({
      library: "phosphor",
      name: ["chevron-right", "caret-right", "arrow-right"],
      size: 16,
    }) as unknown as Node;
    expect(icon).toBeDefined();
    expect(icon.name).toBe("icon");
  });
});

describe("instantiateIcon rescale", () => {
  it("rescales the instance when the target size differs from 24px", () => {
    const calls: number[] = [];
    const comp = fig().createComponent() as unknown as FakeNode;
    comp.name = "Icon=bold";
    comp.createInstance = () => {
      const instance = fig().createFrame() as unknown as FakeNode;
      instance.type = "INSTANCE";
      instance.rescale = (factor: number) => calls.push(factor);
      return instance;
    };
    const icons: IconComponentMap = new Map([
      ["bold", comp as unknown as ComponentNode],
    ]);

    const instance = instantiateIcon({
      icons,
      library: "lucide",
      name: "bold",
      size: 48,
    });
    expect(instance).toBeDefined();
    expect(calls).toEqual([48 / 24]);
  });

  it("returns undefined when the library has no candidate for the icon", () => {
    // resolveIconName falls through every candidate, so instantiateIcon bails
    // out before touching the component map.
    const original = { ...ICON_LIBRARIES.lucide.icons };
    for (const candidate of [
      "info",
      "information-circle",
      "info-circle",
      "information-line",
    ]) {
      delete ICON_LIBRARIES.lucide.icons[candidate];
    }
    try {
      const icons: IconComponentMap = new Map();
      const instance = instantiateIcon({
        icons,
        library: "lucide",
        name: "info",
        size: 24,
      });
      expect(instance).toBeUndefined();
    } finally {
      ICON_LIBRARIES.lucide.icons = original;
    }
  });

  it("returns undefined when the resolved name has no component in the map", () => {
    // resolveIconName finds "bold" in lucide, but the icon component map is
    // empty, so the lookup misses and instantiateIcon bails out.
    const icons: IconComponentMap = new Map();
    const instance = instantiateIcon({
      icons,
      library: "lucide",
      name: "bold",
      size: 24,
    });
    expect(instance).toBeUndefined();
  });
});
