import { describe, expect, it } from "vitest";
import { withShadcnRadius } from "../../src/generator/radius";

type AnyVar = { id: string };

function fakeVar(id: string): Variable {
  return { id } as unknown as Variable;
}

describe("withShadcnRadius", () => {
  it("returns the primitives map unchanged when the radius scale is empty", () => {
    const primitives = new Map<string, Variable>([
      ["radius/lg", fakeVar("prim-lg")],
    ]);
    const result = withShadcnRadius(primitives, new Map());
    // Same reference back — nothing to overlay.
    expect(result).toBe(primitives);
  });

  it("overlays the preset-scaled steps onto a copy, leaving the original intact", () => {
    const primitives = new Map<string, Variable>([
      ["radius/lg", fakeVar("prim-lg")],
      ["radius/none", fakeVar("prim-none")],
    ]);
    const scale = new Map<string, Variable>([
      ["lg", fakeVar("theme-lg")],
      ["sm", fakeVar("theme-sm")],
    ]);
    const result = withShadcnRadius(primitives, scale);

    expect(result).not.toBe(primitives);
    expect((result.get("radius/lg") as unknown as AnyVar).id).toBe("theme-lg");
    expect((result.get("radius/sm") as unknown as AnyVar).id).toBe("theme-sm");
    // Structural steps still point at the fixed primitive.
    expect((result.get("radius/none") as unknown as AnyVar).id).toBe(
      "prim-none",
    );
    // Original map is untouched.
    expect((primitives.get("radius/lg") as unknown as AnyVar).id).toBe(
      "prim-lg",
    );
  });
});
