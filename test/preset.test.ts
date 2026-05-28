import { describe, expect, it } from "vitest";
import {
  decodePreset,
  extractPresetCode,
  isPresetCode,
  PRESET_FONTS,
} from "../src/preset";
import {
  MENU_BOLD_CODE,
  OUT_OF_RANGE_CODE,
  REAL_PRESETS,
  V1_MINIMAL_CODE,
} from "./fixtures/presets";

describe("isPresetCode", () => {
  it("accepts a real code", () => {
    expect(isPresetCode("b2fA")).toBe(true);
  });

  it("rejects codes that are too short or too long", () => {
    expect(isPresetCode("")).toBe(false);
    expect(isPresetCode("b")).toBe(false);
    expect(isPresetCode("b234567890")).toBe(true); // exactly 10
    expect(isPresetCode("b2345678901")).toBe(false); // 11
  });

  it("rejects an unknown version prefix", () => {
    expect(isPresetCode("c2fA")).toBe(false);
    expect(isPresetCode("z123")).toBe(false);
  });

  it("rejects non-base62 characters in the body", () => {
    expect(isPresetCode("b2f-")).toBe(false);
    expect(isPresetCode("b2f.")).toBe(false);
    expect(isPresetCode("b2f ")).toBe(false);
  });

  it("accepts both v1 and v2 prefixes", () => {
    expect(isPresetCode("a0")).toBe(true);
    expect(isPresetCode("b0")).toBe(true);
  });
});

describe("extractPresetCode", () => {
  it("returns a bare code untouched", () => {
    expect(extractPresetCode("b2fA")).toBe("b2fA");
    expect(extractPresetCode("  b2fA  ")).toBe("b2fA");
  });

  it("pulls the code off a --preset flag", () => {
    expect(extractPresetCode("--preset b2fA")).toBe("b2fA");
    expect(extractPresetCode("--preset=b2fA")).toBe("b2fA");
  });

  it("handles full CLI commands", () => {
    expect(extractPresetCode("npx shadcn@latest init --preset b2fA")).toBe(
      "b2fA",
    );
    expect(
      extractPresetCode("pnpm dlx shadcn@latest init --preset=b2fA"),
    ).toBe("b2fA");
  });

  it("pulls the code off a query param", () => {
    expect(extractPresetCode("https://ui.shadcn.com/init?preset=b2fA")).toBe(
      "b2fA",
    );
    expect(extractPresetCode("https://x.com/?foo=1&preset=b2fA&bar=2")).toBe(
      "b2fA",
    );
  });

  it("does not bare-scan prose for false positives", () => {
    expect(extractPresetCode("install it at the root")).toBeNull();
    expect(extractPresetCode("")).toBeNull();
    expect(extractPresetCode("   ")).toBeNull();
  });

  it("returns null when the flag value isn't a valid code", () => {
    expect(extractPresetCode("--preset not-a-code!!")).toBeNull();
  });
});

describe("decodePreset", () => {
  it("decodes every real preset into a complete config", () => {
    for (const preset of REAL_PRESETS) {
      const config = decodePreset(preset.code);
      expect(config, preset.name).not.toBeNull();
      expect(config!.font, preset.name).toBe(preset.font);
      expect(config!.style, preset.name).toBe(preset.style);
      // chartColor and fontHeading are always present on a decoded config.
      expect(config!).toHaveProperty("chartColor");
      expect(config!).toHaveProperty("fontHeading");
    }
  });

  it("decodes Nova (b2fA) exactly", () => {
    const config = decodePreset("b2fA");
    expect(config).toMatchObject({
      style: "nova",
      baseColor: "neutral",
      theme: "neutral",
      chartColor: "neutral",
      font: "geist",
      radius: "default",
      menuAccent: "subtle",
      menuColor: "default",
    });
  });

  it("applies the v1 upgrade defaults", () => {
    const config = decodePreset(V1_MINIMAL_CODE);
    expect(config).not.toBeNull();
    expect(config!.fontHeading).toBe("inherit");
    // v1 has no chartColor field, so it mirrors the theme.
    expect(config!.chartColor).toBe(config!.theme);
  });

  it("decodes the bold-accent edge fixture", () => {
    const config = decodePreset(MENU_BOLD_CODE);
    expect(config).toMatchObject({
      menuAccent: "bold",
      theme: "blue",
      chartColor: "blue",
    });
  });

  it("rejects bits that overflow the encoded field range", () => {
    expect(decodePreset(OUT_OF_RANGE_CODE)).toBeNull();
  });

  it("rejects malformed codes", () => {
    expect(decodePreset("")).toBeNull();
    expect(decodePreset("nope!")).toBeNull();
    expect(decodePreset("c2fA")).toBeNull();
  });

  it("exposes the font catalogue used for decoding", () => {
    // Guards against a silent reordering of PRESET_FONTS, which would shift
    // every decoded font index.
    expect(PRESET_FONTS[0]).toBe("inter");
    expect(PRESET_FONTS).toContain("geist");
  });
});
