import { afterEach, describe, expect, it } from "vitest";
import { addButtonGroupSection } from "../../src/componentsPage/sections/buttonGroup";
import { addInputOtpSection } from "../../src/componentsPage/sections/inputOtp";
import type { ComponentsInputs } from "../../src/componentsPage";
import { generateFromRegistry } from "../../src/generator";
import { resolvePreset } from "../../src/registry";

// Real generated variables so radius/lg resolves and the radius-binding
// branches actually run (an empty primitives map would skip them).
async function makeInputs(code = "b2fA"): Promise<ComponentsInputs> {
  const resolved = resolvePreset(code);
  if (!resolved.ok) throw new Error("fixture failed to resolve");
  const generated = await generateFromRegistry(resolved.data, {
    presetCode: code,
  });
  return {
    presetCode: code,
    primitives: generated.variables.primitives,
    tailwindColors: generated.variables.tailwindColors,
    theme: generated.variables.theme,
  };
}

type Figma = {
  createFrame: () => { setBoundVariable: (field: string, v: unknown) => void };
  createPage: () => unknown;
};

function getFigma(): Figma {
  return (globalThis as unknown as { figma: Figma }).figma;
}

describe("section radius-binding rejections", () => {
  let restore: (() => void) | undefined;

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  // Make every frame reject setBoundVariable so the per-corner radius bindings
  // throw. The shared bind helpers and the inline corner bindings both guard
  // these calls, so the section still builds — exercising their catch blocks.
  function rejectFrameBindings() {
    const figma = getFigma();
    const orig = figma.createFrame.bind(figma);
    figma.createFrame = () => {
      const node = orig();
      node.setBoundVariable = () => {
        throw new Error("host rejected the binding");
      };
      return node;
    };
    restore = () => {
      figma.createFrame = orig;
    };
  }

  it("button group swallows rejected corner-radius bindings", async () => {
    rejectFrameBindings();
    const page = getFigma().createPage();
    await expect(
      addButtonGroupSection(page as never, await makeInputs()),
    ).resolves.toBeGreaterThan(0);
  });

  it("input OTP swallows rejected slot-radius bindings", async () => {
    rejectFrameBindings();
    const page = getFigma().createPage();
    await expect(
      addInputOtpSection(page as never, await makeInputs()),
    ).resolves.toBeGreaterThan(0);
  });
});
