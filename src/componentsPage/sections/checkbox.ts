// Checkbox: 4×4 box with optional check-mark indicator. Three states.
//
// Mirrors shadcn's Checkbox (radix-ui primitive): a square with input
// border by default; primary fill + check icon when checked.

import { bindCornerRadii, bindFill, bindStrokeColor } from "../bindings";
import {
  createSectionFrame,
  createWrappingRow,
  styleComponentSet,
} from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const CHECKBOX_STATES = ["unchecked", "checked", "indeterminate"] as const;
type CheckboxState = (typeof CHECKBOX_STATES)[number];

export async function addCheckboxSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Checkbox", {
    title: "Checkbox",
    subtitle: "Three states: unchecked, checked, and indeterminate.",
  });

  const components: ComponentNode[] = [];
  for (const state of CHECKBOX_STATES) {
    const comp = buildCheckboxComponent(inputs, state);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Checkbox";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  const showcase = createWrappingRow(section, 16);
  for (const comp of components) {
    showcase.appendChild(comp.createInstance());
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildCheckboxComponent(
  inputs: ComponentsInputs,
  state: CheckboxState,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `State=${state}`;
  // Absolute positioning so the inner check / bar sit centred without
  // auto-layout repositioning them.
  comp.layoutMode = "NONE";
  comp.resize(16, 16);
  comp.cornerRadius = 4;
  bindCornerRadii(comp, p.get("radius/sm"));

  if (state === "unchecked") {
    bindFill(comp, t.get("background"));
    bindStrokeColor(comp, t.get("input"));
    comp.strokeWeight = 1;
  } else {
    // checked + indeterminate share the primary fill in shadcn.
    bindFill(comp, t.get("primary"));
    comp.strokes = [];
  }

  if (state === "checked") {
    // Check-mark drawn as a vector polyline.
    const check = figma.createVector();
    check.name = "Check";
    check.vectorPaths = [
      {
        windingRule: "NONZERO",
        // Two strokes forming a check: short up-left segment, long down-right.
        data: "M 3 8 L 6.5 11.5 L 13 5",
      },
    ];
    check.strokeWeight = 1.75;
    check.strokeCap = "ROUND";
    check.strokeJoin = "ROUND";
    check.fills = [];
    bindStrokeColor(check, t.get("primary-foreground"));
    check.constraints = { horizontal: "SCALE", vertical: "SCALE" };
    check.x = 0;
    check.y = 0;
    comp.appendChild(check);
  } else if (state === "indeterminate") {
    // A short horizontal bar.
    const bar = figma.createRectangle();
    bar.name = "Bar";
    bar.resize(8, 1.75);
    bar.cornerRadius = 1;
    bindFill(bar, t.get("primary-foreground"));
    bar.x = (16 - 8) / 2;
    bar.y = (16 - 1.75) / 2;
    comp.appendChild(bar);
  }

  return comp;
}
