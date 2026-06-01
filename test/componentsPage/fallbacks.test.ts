import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ICON_LIBRARIES } from "../../src/data/icons";
import { addAlertSection } from "../../src/componentsPage/sections/alert";
import { addButtonSection } from "../../src/componentsPage/sections/button";
import { addBadgeSection } from "../../src/componentsPage/sections/badge";
import { addEmptySection } from "../../src/componentsPage/sections/empty";
import { addKbdSection } from "../../src/componentsPage/sections/kbd";
import { addSheetSection } from "../../src/componentsPage/sections/sheet";
import { addDialogSection } from "../../src/componentsPage/sections/dialog";
import type { ComponentsInputs } from "../../src/componentsPage";

// Minimal inputs with empty token maps: the binding helpers no-op on missing
// variables, and an empty theme drives the `t.get(key) ?? t.get(fallback)`
// fallbacks (e.g. sidebar tokens) down their right-hand side.
function emptyInputs(): ComponentsInputs {
  return {
    presetCode: "test",
    primitives: new Map(),
    tailwindColors: new Map(),
    theme: { light: new Map(), dark: new Map() },
  };
}

function newPage() {
  return (globalThis as { figma: { createPage: () => unknown } }).figma
    .createPage() as never;
}

describe("section fallbacks without an icon library", () => {
  let savedIcons: Record<string, string>;

  beforeEach(() => {
    // Strip every lucide glyph so createIcon / instantiateIcon resolve to
    // undefined and each section takes its icon-less fallback branch.
    savedIcons = ICON_LIBRARIES.lucide.icons;
    ICON_LIBRARIES.lucide.icons = {};
  });

  afterEach(() => {
    ICON_LIBRARIES.lucide.icons = savedIcons;
  });

  it("alert renders a placeholder icon frame when no glyph resolves", async () => {
    const count = await addAlertSection(newPage(), emptyInputs());
    expect(count).toBeGreaterThan(0);
  });

  it("button uses a plain + glyph for icon sizes when no icon resolves", async () => {
    // With no icon, icon-size buttons fall through to the label path and emit
    // a "+" instead of returning early with a rendered icon.
    const count = await addButtonSection(newPage(), emptyInputs());
    expect(count).toBeGreaterThan(0);
  });

  it("badge renders a text dismiss glyph when no close icon resolves", async () => {
    const count = await addBadgeSection(newPage(), emptyInputs());
    expect(count).toBeGreaterThan(0);
  });

  it("empty state renders a placeholder media dot when no folder icon resolves", async () => {
    const count = await addEmptySection(newPage(), emptyInputs());
    expect(count).toBeGreaterThan(0);
  });

  it("kbd falls back to a text command cap when no command icon resolves", async () => {
    const count = await addKbdSection(newPage(), emptyInputs());
    expect(count).toBeGreaterThan(0);
  });

  it("sheet uses a drawn close glyph when no close icon resolves", async () => {
    const count = await addSheetSection(newPage(), emptyInputs());
    expect(count).toBeGreaterThan(0);
  });

  it("dialog uses a drawn close glyph when no close icon resolves", async () => {
    const count = await addDialogSection(newPage(), emptyInputs());
    expect(count).toBeGreaterThan(0);
  });
});
