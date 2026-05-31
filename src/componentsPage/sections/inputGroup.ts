// Input Group: an input shell that hosts inline addons (icons, text, buttons)
// before/after the control. Mirrors radix-nova's InputGroup: `flex h-8 w-full
// items-center rounded-lg border border-input`, with InputGroupAddon
// (`text-sm text-muted-foreground`, `inline-start` adds `pl-2`, `inline-end`
// adds `pr-2`) and a flexible InputGroupInput in the middle.
//
// We surface the common compositions as a `Variant` axis:
//   icon     — a leading search icon + placeholder text
//   text     — a leading `text-muted-foreground` prefix (e.g. "https://")
//   button   — a trailing ghost button addon
//
// Focus-within swaps the border to `ring` with a 3px ring; the resting state
// keeps the `input` border.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { createIcon, resolveIconLibrary } from "../../icons";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const INPUT_GROUP_VARIANTS = ["icon", "text", "button"] as const;
type InputGroupVariant = (typeof INPUT_GROUP_VARIANTS)[number];

const INPUT_GROUP_WIDTH = 320;
const INPUT_GROUP_HEIGHT = 32;

export async function addInputGroupSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const variant of INPUT_GROUP_VARIANTS) {
    const comp = buildInputGroupComponent(inputs, variant);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Input Group";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildInputGroupComponent(
  inputs: ComponentsInputs,
  variant: InputGroupVariant,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  comp.resize(INPUT_GROUP_WIDTH, INPUT_GROUP_HEIGHT);
  // InputGroup: `h-8 rounded-lg border-input`. Addons own their own padding,
  // so the shell carries a small horizontal gap and inset only.
  comp.itemSpacing = 6;
  comp.paddingLeft = variant === "button" ? 10 : 8;
  comp.paddingRight = variant === "button" ? 4 : 8;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  bindFill(comp, t.get("background"));
  bindStrokeColor(comp, t.get("input"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";

  // Leading addon (icon or text prefix).
  if (variant === "icon") {
    const icon = createIcon({
      library: resolveIconLibrary(inputs.presetSummary),
      name: "search",
      size: 16,
      color: t.get("muted-foreground"),
    });
    if (icon) {
      icon.name = "Icon";
      comp.appendChild(icon);
    }
  } else if (variant === "text") {
    const prefix = figma.createText();
    applyFont(prefix, "body", "Regular");
    prefix.characters = "https://";
    prefix.fontSize = 14;
    bindFontSize(prefix, p.get("font/size/sm"));
    bindFill(prefix, t.get("muted-foreground"));
    comp.appendChild(prefix);
  }

  // The control: a flexible muted placeholder that grows to fill the shell.
  const control = figma.createText();
  applyFont(control, "body", "Regular");
  control.characters = variant === "text" ? "figseed.dev" : "Search components";
  control.fontSize = 14;
  bindFontSize(control, p.get("font/size/sm"));
  bindFill(
    control,
    variant === "text" ? t.get("foreground") : t.get("muted-foreground"),
  );
  comp.appendChild(control);
  control.layoutGrow = 1;

  // Trailing addon button (`InputGroupButton`, ghost, `h-6 rounded-md px-1.5`).
  if (variant === "button") {
    comp.appendChild(buildAddonButton(inputs, "Submit"));
  }

  return comp;
}

function buildAddonButton(inputs: ComponentsInputs, label: string): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const btn = figma.createFrame();
  btn.name = "Addon Button";
  btn.layoutMode = "HORIZONTAL";
  btn.primaryAxisSizingMode = "AUTO";
  btn.counterAxisSizingMode = "FIXED";
  btn.primaryAxisAlignItems = "CENTER";
  btn.counterAxisAlignItems = "CENTER";
  btn.resize(btn.width, 24);
  btn.primaryAxisSizingMode = "AUTO";
  btn.paddingLeft = 6;
  btn.paddingRight = 6;
  btn.cornerRadius = 6;
  bindCornerRadii(btn, p.get("radius/md"));
  // Ghost button addon: a muted surface so it reads as an interactive chip.
  bindFill(btn, t.get("muted"));
  btn.strokes = [];

  const text = figma.createText();
  applyFont(text, "body", "Medium");
  text.characters = label;
  text.fontSize = 12;
  bindFontSize(text, p.get("font/size/xs"));
  bindFill(text, t.get("foreground"));
  btn.appendChild(text);

  return btn;
}
