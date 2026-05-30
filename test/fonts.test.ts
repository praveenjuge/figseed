import { afterEach, describe, expect, it } from "vitest";
import { applyFont, loadPresetFonts, resetActiveFonts } from "../src/fonts";

type Spy = { mock: { calls: Array<[{ family: string; style: string }]> } };

function loadCalls(): Array<{ family: string; style: string }> {
  return (figma.loadFontAsync as unknown as Spy).mock.calls.map((c) => c[0]);
}

// A STRING variable minted through the mock, standing in for a theme font var.
function makeVar(): Variable {
  const collection = figma.variables.createVariableCollection("T");
  return figma.variables.createVariable(
    "font-sans",
    collection,
    "STRING",
  ) as unknown as Variable;
}

afterEach(() => {
  resetActiveFonts();
});

describe("loadPresetFonts", () => {
  it("loads the body, heading, and Inter fallback families", async () => {
    await loadPresetFonts({ body: "Geist", heading: "Lora" });
    const families = new Set(loadCalls().map((f) => f.family));
    expect(families.has("Geist")).toBe(true);
    expect(families.has("Lora")).toBe(true);
    expect(families.has("Inter")).toBe(true);
  });

  it("does not double-load when body and heading match", async () => {
    await loadPresetFonts({ body: "Inter", heading: "Inter" });
    const families = new Set(loadCalls().map((f) => f.family));
    // Only Inter should be requested (body == heading == fallback).
    expect([...families]).toEqual(["Inter"]);
  });
});

describe("applyFont", () => {
  it("applies the preset body font to a text node", async () => {
    await loadPresetFonts({ body: "Geist", heading: "Lora" });
    const node = figma.createText();
    applyFont(node, "body", "Medium");
    expect(node.fontName).toEqual({ family: "Geist", style: "Medium" });
  });

  it("applies the heading font for the heading role", async () => {
    await loadPresetFonts({ body: "Geist", heading: "Lora" });
    const node = figma.createText();
    applyFont(node, "heading", "Semi Bold");
    expect(node.fontName).toEqual({ family: "Lora", style: "Semi Bold" });
  });

  it("binds fontFamily to the matching theme variable", async () => {
    const bodyVar = makeVar();
    await loadPresetFonts({
      body: "Geist",
      heading: "Geist",
      fontVars: { body: bodyVar },
    });
    const node = figma.createText();
    applyFont(node, "body", "Regular");
    const bound = (
      node as unknown as {
        boundVariables: Record<string, { id: string }>;
      }
    ).boundVariables;
    expect(bound.fontFamily).toBeDefined();
    expect(bound.fontFamily.id).toBe((bodyVar as unknown as { id: string }).id);
  });

  it("falls back to Inter when no context is active", () => {
    resetActiveFonts();
    const node = figma.createText();
    applyFont(node, "body", "Bold");
    expect(node.fontName).toEqual({ family: "Inter", style: "Bold" });
  });

  it("drops to Regular in the same family when the weight is missing", () => {
    const node = figma.createText();
    applyFont(node, "body", "Black", {
      body: "Geist",
      heading: "Geist",
      bodyVar: undefined,
      headingVar: undefined,
      // Geist loaded only at Regular; "Black" is unavailable.
      loaded: new Set(["Geist\u0000Regular"]),
    });
    expect(node.fontName).toEqual({ family: "Geist", style: "Regular" });
  });

  it("falls back to Inter at the requested weight when the family is unavailable", () => {
    const node = figma.createText();
    applyFont(node, "heading", "Bold", {
      body: "Geist",
      heading: "Lora",
      bodyVar: undefined,
      headingVar: undefined,
      // Lora didn't load at all; Inter has Bold.
      loaded: new Set(["Inter\u0000Bold", "Inter\u0000Regular"]),
    });
    expect(node.fontName).toEqual({ family: "Inter", style: "Bold" });
  });

  it("falls back to Inter Regular when neither family nor weight is available", () => {
    const node = figma.createText();
    applyFont(node, "body", "Black", {
      body: "Geist",
      heading: "Geist",
      bodyVar: undefined,
      headingVar: undefined,
      loaded: new Set(["Inter\u0000Regular"]),
    });
    expect(node.fontName).toEqual({ family: "Inter", style: "Regular" });
  });

  it("does not bind when the chosen font fell back off the preset family", () => {
    const bodyVar = makeVar();
    const node = figma.createText();
    applyFont(node, "body", "Regular", {
      body: "Geist",
      heading: "Geist",
      bodyVar,
      headingVar: undefined,
      // Geist unavailable → Inter is used → binding is skipped.
      loaded: new Set(["Inter\u0000Regular"]),
    });
    const bound = (
      node as unknown as {
        boundVariables: Record<string, unknown>;
      }
    ).boundVariables;
    expect(bound.fontFamily).toBeUndefined();
  });
});
