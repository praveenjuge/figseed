import { describe, expect, it } from "vitest";
import {
  ensurePrimitivesCollection,
  resolveFontFamily,
} from "../../src/generator/primitives";

type AnyVar = { resolvedType: string; valuesByMode: Record<string, unknown> };

function soleValue(variable: unknown): unknown {
  return Object.values((variable as AnyVar).valuesByMode)[0];
}

describe("resolveFontFamily", () => {
  it("defaults to Inter / sans", () => {
    expect(resolveFontFamily(undefined)).toEqual({
      family: "Inter",
      bucket: "sans",
    });
  });

  it("resolves a known mono font", () => {
    expect(resolveFontFamily("jetbrains-mono")).toEqual({
      family: "JetBrains Mono",
      bucket: "mono",
    });
  });

  it("falls back to Inter for an unknown slug but keeps the bucket", () => {
    expect(resolveFontFamily("some-unknown-serif")).toEqual({
      family: "Inter",
      bucket: "sans",
    });
  });
});

describe("ensurePrimitivesCollection", () => {
  it("writes numeric and string primitive tokens", async () => {
    const map = await ensurePrimitivesCollection({
      fontFamily: { family: "Inter", bucket: "sans" },
    });
    expect(soleValue(map.get("radius/full"))).toBe(9999);
    expect(soleValue(map.get("spacing/px"))).toBe(1);
    expect(soleValue(map.get("font/size/base"))).toBe(16);
    expect(soleValue(map.get("opacity/100"))).toBe(100);
    expect(soleValue(map.get("font/style/italic"))).toBe("italic");
    expect((map.get("radius/full") as unknown as AnyVar).resolvedType).toBe(
      "FLOAT",
    );
  });

  it("only overrides the bucket matching the selected font", async () => {
    const map = await ensurePrimitivesCollection({
      fontFamily: { family: "JetBrains Mono", bucket: "mono" },
    });
    expect(soleValue(map.get("font/family/mono"))).toBe("JetBrains Mono");
    // Other buckets keep their defaults.
    expect(soleValue(map.get("font/family/sans"))).toBe("Inter");
    expect(soleValue(map.get("font/family/serif"))).toBe("Georgia");
  });

  it("overrides the serif bucket when a serif font is selected", async () => {
    const map = await ensurePrimitivesCollection({
      fontFamily: { family: "Lora", bucket: "serif" },
    });
    expect(soleValue(map.get("font/family/serif"))).toBe("Lora");
    // The other buckets keep their defaults.
    expect(soleValue(map.get("font/family/sans"))).toBe("Inter");
  });
});
