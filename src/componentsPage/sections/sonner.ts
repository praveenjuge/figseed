// Sonner (Toast): a transient notification. Mirrors radix-nova's Toaster,
// which themes sonner with `--normal-bg: var(--popover)`, `--normal-text:
// var(--popover-foreground)`, `--normal-border: var(--border)` and the
// `.cn-toast` rule `rounded-2xl`. The default toast carries `shadow-lg`.
//
// Demo content (sonner-demo): a title "Event has been created", a
// `text-muted-foreground` description "Sunday, December 03, 2023 at 9:00 AM",
// and a trailing "Undo" action button. A leading status icon mirrors the
// `toast.success` icon set radix-nova wires up (CircleCheckIcon at size-4).

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { applyEffectStyle } from "../../effectStyles";
import { createIcon, resolveIconLibrary } from "../../icons";
import { wrapInSectionCard } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const TOAST_WIDTH = 356; // sonner's default toast width.

export async function addSonnerSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildToastComponent(inputs);
  // sonner's default toast uses `shadow-lg`; reference the published style.
  await applyEffectStyle(comp, inputs.effectStyles?.idFor("Shadow/lg"));
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
}

function buildToastComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Toast";
  comp.layoutMode = "HORIZONTAL";
  // resize() pins both axes to FIXED; re-set the counter axis to AUTO so the
  // toast hugs its content height at the fixed width.
  comp.resize(TOAST_WIDTH, 10);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  // sonner default toast: `gap-1.5 p-4`, `.cn-toast` rounds it `rounded-2xl`.
  comp.itemSpacing = 12;
  comp.paddingTop = 16;
  comp.paddingBottom = 16;
  comp.paddingLeft = 16;
  comp.paddingRight = 16;
  comp.cornerRadius = 16;
  bindCornerRadii(comp, p.get("radius/2xl"));
  bindFill(comp, t.get("popover"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";

  // Leading status icon (`size-4`) — sonner's success icon, tinted to the
  // toast text colour.
  const icon = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: "success",
    size: 16,
    color: t.get("popover-foreground"),
  });
  if (icon) {
    icon.name = "Icon";
    comp.appendChild(icon);
  }

  // Text column: title + description (`flex flex-col gap-0.5`).
  const textCol = figma.createFrame();
  textCol.name = "Text";
  textCol.layoutMode = "VERTICAL";
  textCol.primaryAxisSizingMode = "AUTO";
  textCol.counterAxisSizingMode = "AUTO";
  textCol.itemSpacing = 2;
  textCol.fills = [];
  textCol.strokes = [];
  comp.appendChild(textCol);
  textCol.layoutGrow = 1;
  textCol.layoutSizingHorizontal = "FILL";

  const title = figma.createText();
  applyFont(title, "body", "Medium");
  title.characters = "Event has been created";
  title.fontSize = 14;
  bindFontSize(title, p.get("font/size/sm"));
  bindFill(title, t.get("popover-foreground"));
  textCol.appendChild(title);
  title.layoutSizingHorizontal = "FILL";

  const desc = figma.createText();
  applyFont(desc, "body", "Regular");
  desc.characters = "Sunday, December 03, 2023 at 9:00 AM";
  desc.fontSize = 12;
  bindFontSize(desc, p.get("font/size/xs"));
  bindFill(desc, t.get("muted-foreground"));
  textCol.appendChild(desc);
  desc.layoutSizingHorizontal = "FILL";

  // Action button: sonner's action button uses the `--normal` button styling;
  // we render the default solid button at the compact h-6 sonner size.
  comp.appendChild(buildActionButton(inputs, "Undo"));

  return comp;
}

function buildActionButton(inputs: ComponentsInputs, label: string): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const btn = figma.createFrame();
  btn.name = "Action";
  btn.layoutMode = "HORIZONTAL";
  btn.primaryAxisSizingMode = "AUTO";
  btn.counterAxisSizingMode = "FIXED";
  btn.primaryAxisAlignItems = "CENTER";
  btn.counterAxisAlignItems = "CENTER";
  btn.paddingLeft = 8;
  btn.paddingRight = 8;
  btn.resize(60, 24);
  btn.primaryAxisSizingMode = "AUTO";
  btn.cornerRadius = 6;
  bindCornerRadii(btn, p.get("radius/md"));
  bindFill(btn, t.get("primary"));
  btn.strokes = [];

  const text = figma.createText();
  applyFont(text, "body", "Medium");
  text.characters = label;
  text.fontSize = 12;
  bindFontSize(text, p.get("font/size/xs"));
  bindFill(text, t.get("primary-foreground"));
  btn.appendChild(text);

  return btn;
}
