import { describe, expect, it } from "vitest";
import { TAILWIND_COLORS } from "../../src/colors";
import { ensureTailwindColorCollection } from "../../src/generator/tailwindColors";
import { ensureThemeCollection } from "../../src/generator/theme";
import type { ResolvedRegistry } from "../../src/generator/types";

type AnyVar = { id: string; valuesByMode: Record<string, unknown> };
type Alias = { type: "VARIABLE_ALIAS"; id: string };

function soleValue(variable: unknown): unknown {
  return Object.values((variable as AnyVar).valuesByMode)[0];
}

function makeRegistry(): ResolvedRegistry {
  return {
    name: "test",
    // The generator only reads cssVars; config is along for the ride.
    config: {} as ResolvedRegistry["config"],
    cssVars: {
      light: {
        background: "oklch(1 0 0)", // -> white alias
        primary: TAILWIND_COLORS.slate["500"], // -> slate/500 alias
        custom: "oklch(0.123 0.456 78)", // -> literal RGBA (no alias)
        radius: "0.625rem", // -> FLOAT 10
      },
      dark: {
        background: "oklch(0 0 0)", // -> dark-background, black alias
      },
    },
  };
}

describe("ensureThemeCollection", () => {
  it("aliases matching colors to the Tailwind collection", async () => {
    const tw = await ensureTailwindColorCollection();
    const result = await ensureThemeCollection(makeRegistry(), tw);

    const whiteId = (tw.get("white") as unknown as AnyVar).id;
    const slateId = (tw.get("slate/500") as unknown as AnyVar).id;

    const background = soleValue(result.maps.light.get("background")) as Alias;
    expect(background).toEqual({ type: "VARIABLE_ALIAS", id: whiteId });

    const primary = soleValue(result.maps.light.get("primary")) as Alias;
    expect(primary).toEqual({ type: "VARIABLE_ALIAS", id: slateId });
  });

  it("falls back to a literal RGBA for non-Tailwind colors", async () => {
    const tw = await ensureTailwindColorCollection();
    const result = await ensureThemeCollection(makeRegistry(), tw);

    const custom = soleValue(result.maps.light.get("custom")) as Record<
      string,
      unknown
    >;
    expect(custom).not.toBeNull();
    expect(custom.type).toBeUndefined(); // not an alias
    expect(custom).toHaveProperty("r");
    expect(result.unaliasedCount).toBe(1);
  });

  it("parses radius rem into a FLOAT of pixels", async () => {
    const tw = await ensureTailwindColorCollection();
    const result = await ensureThemeCollection(makeRegistry(), tw);
    expect(soleValue(result.maps.light.get("radius"))).toBe(10); // 0.625 * 16
  });

  it("emits dark values as a separate dark-prefixed variable", async () => {
    const tw = await ensureTailwindColorCollection();
    const result = await ensureThemeCollection(makeRegistry(), tw);
    const darkBg = result.maps.dark.get("background") as unknown as {
      name: string;
    };
    expect(darkBg).toBeDefined();
    expect(darkBg.name).toBe("dark-background");
  });

  it("accounts for every variable processed", async () => {
    const tw = await ensureTailwindColorCollection();
    const result = await ensureThemeCollection(makeRegistry(), tw);
    // 4 light keys + 1 dark key.
    expect(result.variableCount).toBe(5);
  });
});
