import { describe, expect, it } from "vitest";
import {
  createIcon,
  instantiateIcon,
  type IconComponentMap,
} from "../src/icons";

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
});
