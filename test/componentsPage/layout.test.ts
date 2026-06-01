import { describe, expect, it } from "vitest";
import { styleComponentSet } from "../../src/componentsPage/layout";
import { SECTION_WIDTH } from "../../src/componentsPage/types";

type FakeSet = {
  layoutMode: string;
  width: number;
  height: number;
  counterAxisSizingMode?: string;
  primaryAxisSizingMode?: string;
  [key: string]: unknown;
};

function makeSet(layoutMode: string): FakeSet {
  const set = (
    globalThis as { figma: { createFrame: () => FakeSet } }
  ).figma.createFrame();
  set.layoutMode = layoutMode;
  return set;
}

describe("styleComponentSet", () => {
  it("pins a vertical set to the section width and hugs its height", () => {
    const set = makeSet("VERTICAL");
    styleComponentSet(set as unknown as ComponentSetNode);
    expect(set.width).toBe(SECTION_WIDTH);
    expect(set.counterAxisSizingMode).toBe("FIXED");
    expect(set.primaryAxisSizingMode).toBe("AUTO");
  });

  it("pins a horizontal set to the section width and wraps its variants", () => {
    const set = makeSet("HORIZONTAL");
    set.itemSpacing = 16;
    styleComponentSet(set as unknown as ComponentSetNode);
    expect(set.width).toBe(SECTION_WIDTH);
    expect(set.layoutWrap).toBe("WRAP");
  });
});
