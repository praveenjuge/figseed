import { describe, expect, it } from "vitest";
import {
  fillHeight,
  fillW,
  iconCandidates,
  truncateLine,
} from "../../src/blocksPage/blocks/sidebar/primitives";

type FakeNode = { type: string; name: string; [key: string]: unknown };

const fig = () => (globalThis as { figma: typeof figma }).figma;

function frame(): FakeNode {
  return fig().createFrame() as unknown as FakeNode;
}

function text(): FakeNode {
  return fig().createText() as unknown as FakeNode;
}

describe("sidebar primitives sizing helpers", () => {
  it("fillW sets layoutSizingHorizontal to FILL", () => {
    const node = frame();
    fillW(node as unknown as SceneNode);
    expect(node.layoutSizingHorizontal).toBe("FILL");
  });

  it("fillW swallows a host that rejects FILL", () => {
    const node = frame();
    Object.defineProperty(node, "layoutSizingHorizontal", {
      set() {
        throw new Error("cannot FILL");
      },
    });
    expect(() => fillW(node as unknown as SceneNode)).not.toThrow();
  });

  it("fillHeight sets layoutSizingVertical to FILL", () => {
    const node = frame();
    fillHeight(node as unknown as SceneNode);
    expect(node.layoutSizingVertical).toBe("FILL");
  });

  it("fillHeight swallows a host that rejects FILL", () => {
    const node = frame();
    Object.defineProperty(node, "layoutSizingVertical", {
      set() {
        throw new Error("cannot FILL");
      },
    });
    expect(() => fillHeight(node as unknown as SceneNode)).not.toThrow();
  });

  it("truncateLine sets the single-line truncation fields", () => {
    const node = text();
    truncateLine(node as unknown as TextNode);
    expect(node.textAutoResize).toBe("HEIGHT");
    expect(node.maxLines).toBe(1);
    expect(node.textTruncation).toBe("ENDING");
  });

  it("truncateLine swallows hosts that reject each truncation field", () => {
    const node = text();
    for (const field of ["textAutoResize", "maxLines", "textTruncation"]) {
      Object.defineProperty(node, field, {
        set() {
          throw new Error(`cannot set ${field}`);
        },
      });
    }
    expect(() => truncateLine(node as unknown as TextNode)).not.toThrow();
  });
});

describe("iconCandidates", () => {
  it("returns the curated cross-library candidate list for a known glyph", () => {
    const list = iconCandidates("chevron-right");
    expect(list.length).toBeGreaterThan(1);
    expect(list[0]).toBe("chevron-right");
  });

  it("falls back to the bare name for an unmapped glyph", () => {
    expect(iconCandidates("totally-unknown-glyph")).toEqual([
      "totally-unknown-glyph",
    ]);
  });
});
