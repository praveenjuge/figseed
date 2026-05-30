import { describe, expect, it } from "vitest";
import { applyTokenBindings } from "../src/tokenBindings";
import type { FigmaMock } from "./figma-mock";

function liveFigma(): FigmaMock {
  return (globalThis as unknown as { figma: FigmaMock }).figma;
}

// Build a primitives map with the variables the pass looks up. Names mirror
// the generator's `group/name` convention.
function makePrimitives(): Map<string, Variable> {
  const figma = liveFigma();
  const coll = figma.variables.createVariableCollection(
    "Tailwind / Primitives",
  );
  const map = new Map<string, Variable>();
  const add = (name: string) => {
    map.set(
      name,
      figma.variables.createVariable(
        name,
        coll,
        "FLOAT",
      ) as unknown as Variable,
    );
  };
  add("spacing/4"); // 16
  add("spacing/2"); // 8
  add("spacing/0"); // 0
  add("border-width/1"); // 1
  add("radius/lg"); // 8
  add("font/size/sm"); // 14
  return map;
}

function boundId(node: unknown, field: string): string | undefined {
  const bound = (node as { boundVariables?: Record<string, { id: string }> })
    .boundVariables;
  return bound && bound[field] ? bound[field]!.id : undefined;
}

describe("applyTokenBindings", () => {
  it("binds padding + gap on auto-layout frames when the literal matches a token", () => {
    const figma = liveFigma();
    const primitives = makePrimitives();

    const frame = figma.createFrame();
    (frame as unknown as Record<string, unknown>).layoutMode = "VERTICAL";
    (frame as unknown as Record<string, unknown>).itemSpacing = 16;
    (frame as unknown as Record<string, unknown>).paddingTop = 8;

    applyTokenBindings(frame as never, primitives);

    expect(boundId(frame, "itemSpacing")).toBe(primitives.get("spacing/4")!.id);
    expect(boundId(frame, "paddingTop")).toBe(primitives.get("spacing/2")!.id);
  });

  it("does not bind spacing on non-auto-layout frames", () => {
    const figma = liveFigma();
    const primitives = makePrimitives();

    const frame = figma.createFrame();
    (frame as unknown as Record<string, unknown>).itemSpacing = 16;

    applyTokenBindings(frame as never, primitives);

    expect(boundId(frame, "itemSpacing")).toBeUndefined();
  });

  it("skips zero values so spacing/0 is never bound", () => {
    const figma = liveFigma();
    const primitives = makePrimitives();

    const frame = figma.createFrame();
    (frame as unknown as Record<string, unknown>).layoutMode = "HORIZONTAL";
    (frame as unknown as Record<string, unknown>).itemSpacing = 0;

    applyTokenBindings(frame as never, primitives);

    expect(boundId(frame, "itemSpacing")).toBeUndefined();
  });

  it("never overrides a field a builder already bound", () => {
    const figma = liveFigma();
    const primitives = makePrimitives();

    const frame = figma.createFrame();
    (frame as unknown as Record<string, unknown>).layoutMode = "VERTICAL";
    (frame as unknown as Record<string, unknown>).itemSpacing = 16;
    // Pretend a builder bound itemSpacing to spacing/2 already.
    (
      frame as unknown as { boundVariables: Record<string, unknown> }
    ).boundVariables = {
      itemSpacing: {
        type: "VARIABLE_ALIAS",
        id: primitives.get("spacing/2")!.id,
      },
    };

    applyTokenBindings(frame as never, primitives);

    expect(boundId(frame, "itemSpacing")).toBe(primitives.get("spacing/2")!.id);
  });

  it("fans a uniform cornerRadius out to all four corners", () => {
    const figma = liveFigma();
    const primitives = makePrimitives();

    const frame = figma.createFrame();
    (frame as unknown as Record<string, unknown>).cornerRadius = 8;

    applyTokenBindings(frame as never, primitives);

    const lg = primitives.get("radius/lg")!.id;
    expect(boundId(frame, "topLeftRadius")).toBe(lg);
    expect(boundId(frame, "topRightRadius")).toBe(lg);
    expect(boundId(frame, "bottomLeftRadius")).toBe(lg);
    expect(boundId(frame, "bottomRightRadius")).toBe(lg);
  });

  it("binds strokeWeight to a border-width token", () => {
    const figma = liveFigma();
    const primitives = makePrimitives();

    const frame = figma.createFrame();
    (frame as unknown as Record<string, unknown>).strokeWeight = 1;

    applyTokenBindings(frame as never, primitives);

    expect(boundId(frame, "strokeWeight")).toBe(
      primitives.get("border-width/1")!.id,
    );
  });

  it("binds fontSize on text nodes and recurses into children", () => {
    const figma = liveFigma();
    const primitives = makePrimitives();

    const parent = figma.createFrame();
    (parent as unknown as Record<string, unknown>).layoutMode = "VERTICAL";
    const text = figma.createText();
    (text as unknown as Record<string, unknown>).fontSize = 14;
    parent.appendChild(text as never);

    applyTokenBindings(parent as never, primitives);

    expect(boundId(text, "fontSize")).toBe(primitives.get("font/size/sm")!.id);
  });

  it("leaves a field alone when no token matches the literal", () => {
    const figma = liveFigma();
    const primitives = makePrimitives();

    const frame = figma.createFrame();
    (frame as unknown as Record<string, unknown>).layoutMode = "VERTICAL";
    (frame as unknown as Record<string, unknown>).itemSpacing = 13; // no token

    applyTokenBindings(frame as never, primitives);

    expect(boundId(frame, "itemSpacing")).toBeUndefined();
  });
});
