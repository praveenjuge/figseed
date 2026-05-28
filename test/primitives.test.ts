import { describe, expect, it } from "vitest";
import {
  DEFAULT_FONT_FAMILY,
  FONT_SIZE_TOKENS,
  fontSlugBucket,
  PRESET_FONT_FAMILY_MAP,
  RADIUS_TOKENS,
  SPACING_TOKENS,
} from "../src/primitives";

describe("fontSlugBucket", () => {
  it("classifies mono fonts", () => {
    expect(fontSlugBucket("jetbrains-mono")).toBe("mono");
    expect(fontSlugBucket("geist-mono")).toBe("mono");
  });

  it("classifies serif fonts", () => {
    expect(fontSlugBucket("lora")).toBe("serif");
    expect(fontSlugBucket("playfair-display")).toBe("serif");
    expect(fontSlugBucket("instrument-serif")).toBe("serif");
  });

  it("defaults everything else to sans", () => {
    expect(fontSlugBucket("inter")).toBe("sans");
    expect(fontSlugBucket("geist")).toBe("sans");
    expect(fontSlugBucket("unknown-font")).toBe("sans");
  });
});

describe("token tables", () => {
  it("anchors the radius and spacing scales", () => {
    expect(RADIUS_TOKENS.find((t) => t.name === "none")?.value).toBe(0);
    expect(RADIUS_TOKENS.find((t) => t.name === "full")?.value).toBe(9999);
    expect(SPACING_TOKENS.find((t) => t.name === "px")?.value).toBe(1);
    expect(SPACING_TOKENS.find((t) => t.name === "4")?.value).toBe(16);
    expect(FONT_SIZE_TOKENS.find((t) => t.name === "base")?.value).toBe(16);
  });

  it("emits the three default font buckets", () => {
    const names = DEFAULT_FONT_FAMILY.map((t) => t.name);
    expect(names).toEqual(["sans", "serif", "mono"]);
  });
});

describe("PRESET_FONT_FAMILY_MAP", () => {
  it("maps slugs to Figma-friendly family names", () => {
    expect(PRESET_FONT_FAMILY_MAP["dm-sans"]).toBe("DM Sans");
    expect(PRESET_FONT_FAMILY_MAP["jetbrains-mono"]).toBe("JetBrains Mono");
    expect(PRESET_FONT_FAMILY_MAP["unknown"]).toBeUndefined();
  });
});
