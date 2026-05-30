// Context Menu: the open right-click menu panel. Mirrors shadcn's
// ContextMenuContent: `min-w-32 rounded-md border bg-popover p-1
// text-popover-foreground shadow-md`.
//
// It showcases the richer item types shadcn ships that a plain Dropdown Menu
// demo doesn't: a regular item with a trailing shortcut, a checkbox item
// (with a leading check), a submenu trigger (with a trailing chevron), a
// labelled radio group, and a destructive item — separated by rules.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { applyEffectStyle } from "../../effectStyles";
import { wrapInSectionCard } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const MENU_WIDTH = 256;

export async function addContextMenuSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildContextMenuComponent(inputs);
  await applyEffectStyle(comp, inputs.effectStyles?.idFor("Shadow/md"));
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
}

function buildContextMenuComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Context Menu";
  comp.layoutMode = "VERTICAL";
  comp.resize(MENU_WIDTH, 10);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  comp.itemSpacing = 0;
  comp.paddingTop = 4;
  comp.paddingBottom = 4;
  comp.paddingLeft = 4;
  comp.paddingRight = 4;
  comp.cornerRadius = 6;
  bindCornerRadii(comp, p.get("radius/md"));
  bindFill(comp, t.get("popover"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";

  // Plain items with shortcuts.
  appendChildFill(comp, buildItem(inputs, { label: "Back", shortcut: "⌘[" }));
  appendChildFill(
    comp,
    buildItem(inputs, { label: "Forward", shortcut: "⌘]", disabled: true }),
  );
  appendChildFill(comp, buildItem(inputs, { label: "Reload", shortcut: "⌘R" }));
  // Submenu trigger.
  appendChildFill(
    comp,
    buildItem(inputs, { label: "More Tools", submenu: true }),
  );

  appendChildFill(comp, buildSeparator(inputs));

  // Checkbox item (checked).
  appendChildFill(
    comp,
    buildItem(inputs, { label: "Show Bookmarks", checkbox: "checked" }),
  );
  appendChildFill(
    comp,
    buildItem(inputs, { label: "Show Full URLs", checkbox: "unchecked" }),
  );

  appendChildFill(comp, buildSeparator(inputs));

  // Radio label + radio item (selected).
  appendChildFill(comp, buildLabel(inputs, "People"));
  appendChildFill(
    comp,
    buildItem(inputs, { label: "Pedro Duarte", radio: "selected" }),
  );
  appendChildFill(
    comp,
    buildItem(inputs, { label: "Colm Tuite", radio: "unselected" }),
  );

  appendChildFill(comp, buildSeparator(inputs));

  // Destructive item.
  appendChildFill(
    comp,
    buildItem(inputs, { label: "Delete", shortcut: "⌫", destructive: true }),
  );

  return comp;
}

function appendChildFill(parent: ComponentNode, child: FrameNode) {
  parent.appendChild(child);
  child.layoutSizingHorizontal = "FILL";
}

type ItemSpec = {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  submenu?: boolean;
  checkbox?: "checked" | "unchecked";
  radio?: "selected" | "unselected";
};

function buildItem(inputs: ComponentsInputs, spec: ItemSpec): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const colorVar = spec.destructive
    ? t.get("destructive")
    : t.get("popover-foreground");

  const row = figma.createFrame();
  row.name = spec.destructive ? "Item (destructive)" : "Item";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.primaryAxisAlignItems = "MIN";
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 8;
  // checkbox/radio items get extra left padding for the leading indicator slot
  // (`pl-8` in shadcn); plain items use `px-2`.
  const hasIndicator = Boolean(spec.checkbox || spec.radio);
  row.paddingLeft = hasIndicator ? 8 : 8;
  row.paddingRight = 8;
  row.paddingTop = 6;
  row.paddingBottom = 6;
  row.cornerRadius = 4;
  bindCornerRadii(row, p.get("radius/sm"));
  row.fills = [];
  row.strokes = [];

  // Leading checkbox/radio indicator slot (16px wide so labels align).
  if (spec.checkbox) {
    row.appendChild(buildCheckIndicator(inputs, spec.checkbox === "checked"));
  } else if (spec.radio) {
    row.appendChild(buildRadioIndicator(inputs, spec.radio === "selected"));
  }

  const label = figma.createText();
  applyFont(label, "body", "Regular");
  label.characters = spec.label;
  label.fontSize = 14;
  bindFontSize(label, p.get("font/size/sm"));
  bindFill(label, colorVar);
  row.appendChild(label);
  label.layoutGrow = 1;

  if (spec.shortcut) {
    const shortcut = figma.createText();
    applyFont(shortcut, "body", "Regular");
    shortcut.characters = spec.shortcut;
    shortcut.fontSize = 12;
    bindFontSize(shortcut, p.get("font/size/xs"));
    bindFill(shortcut, t.get("muted-foreground"));
    shortcut.letterSpacing = { unit: "PIXELS", value: 1 };
    row.appendChild(shortcut);
  }

  // Submenu trigger gets a trailing right-chevron.
  if (spec.submenu) {
    const chevron = figma.createVector();
    chevron.name = "Chevron";
    chevron.resize(16, 16);
    chevron.vectorPaths = [
      { windingRule: "NONZERO", data: "M 6 4 L 10 8 L 6 12" },
    ];
    chevron.strokeWeight = 1.5;
    chevron.strokeCap = "ROUND";
    chevron.strokeJoin = "ROUND";
    chevron.fills = [];
    bindStrokeColor(chevron, t.get("muted-foreground"));
    row.appendChild(chevron);
  }

  if (spec.disabled) row.opacity = 0.5;

  return row;
}

// A 16px slot holding a check vector when checked.
function buildCheckIndicator(
  inputs: ComponentsInputs,
  checked: boolean,
): FrameNode {
  const t = inputs.theme.light;

  const slot = figma.createFrame();
  slot.name = "Indicator";
  slot.layoutMode = "HORIZONTAL";
  slot.primaryAxisSizingMode = "FIXED";
  slot.counterAxisSizingMode = "FIXED";
  slot.primaryAxisAlignItems = "CENTER";
  slot.counterAxisAlignItems = "CENTER";
  slot.resize(16, 16);
  slot.fills = [];
  slot.strokes = [];

  if (checked) {
    const check = figma.createVector();
    check.name = "Check";
    check.vectorPaths = [
      { windingRule: "NONZERO", data: "M 3 8 L 6.5 11.5 L 13 4" },
    ];
    check.strokeWeight = 1.75;
    check.strokeCap = "ROUND";
    check.strokeJoin = "ROUND";
    check.fills = [];
    bindStrokeColor(check, t.get("popover-foreground"));
    slot.appendChild(check);
  }

  return slot;
}

// A 16px slot holding a filled dot when selected.
function buildRadioIndicator(
  inputs: ComponentsInputs,
  selected: boolean,
): FrameNode {
  const t = inputs.theme.light;

  const slot = figma.createFrame();
  slot.name = "Indicator";
  slot.layoutMode = "HORIZONTAL";
  slot.primaryAxisSizingMode = "FIXED";
  slot.counterAxisSizingMode = "FIXED";
  slot.primaryAxisAlignItems = "CENTER";
  slot.counterAxisAlignItems = "CENTER";
  slot.resize(16, 16);
  slot.fills = [];
  slot.strokes = [];

  if (selected) {
    const dot = figma.createEllipse();
    dot.name = "Dot";
    dot.resize(6, 6);
    bindFill(dot, t.get("popover-foreground"));
    slot.appendChild(dot);
  }

  return slot;
}

function buildLabel(inputs: ComponentsInputs, text: string): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const row = figma.createFrame();
  row.name = "Label";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.counterAxisAlignItems = "CENTER";
  row.paddingLeft = 8;
  row.paddingRight = 8;
  row.paddingTop = 6;
  row.paddingBottom = 6;
  row.fills = [];
  row.strokes = [];

  const label = figma.createText();
  applyFont(label, "body", "Medium");
  label.characters = text;
  label.fontSize = 12;
  bindFontSize(label, p.get("font/size/xs"));
  bindFill(label, t.get("muted-foreground"));
  row.appendChild(label);

  return row;
}

function buildSeparator(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;

  const wrap = figma.createFrame();
  wrap.name = "Separator";
  wrap.layoutMode = "VERTICAL";
  wrap.primaryAxisSizingMode = "AUTO";
  wrap.counterAxisSizingMode = "AUTO";
  wrap.counterAxisAlignItems = "CENTER";
  wrap.paddingTop = 4;
  wrap.paddingBottom = 4;
  wrap.fills = [];
  wrap.strokes = [];

  const line = figma.createRectangle();
  line.name = "Line";
  line.resize(MENU_WIDTH - 8, 1);
  bindFill(line, t.get("border"));
  wrap.appendChild(line);

  return wrap;
}
