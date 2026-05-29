// Kbd: keyboard key hint. A single key cap plus a grouped shortcut.
//
// Mirrors radix-nova's Kbd: `h-5 min-w-5 gap-1 rounded-sm bg-muted px-1
// text-xs font-medium text-muted-foreground`. KbdGroup is just an
// `inline-flex items-center gap-1` wrapper, so the "group" variant lays a
// few caps in a row with a small "+" style joiner.

import { bindCornerRadii, bindFill, bindFontSize } from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const KBD_KINDS = ["single", "group"] as const;
type KbdKind = (typeof KBD_KINDS)[number];

const CAP_HEIGHT = 20;

export async function addKbdSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const kind of KBD_KINDS) {
    const comp = buildKbdComponent(inputs, kind);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Kbd";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.primaryAxisAlignItems = "MIN";
  componentSet.counterAxisAlignItems = "CENTER";
  componentSet.itemSpacing = 24;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildKbdComponent(
  inputs: ComponentsInputs,
  kind: KbdKind,
): ComponentNode {
  const comp = figma.createComponent();
  comp.name = `Kind=${kind}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  // KbdGroup: `inline-flex items-center gap-1`.
  comp.itemSpacing = 4;
  comp.fills = [];
  comp.strokes = [];

  if (kind === "single") {
    comp.appendChild(buildCap(inputs, "⌘"));
  } else {
    comp.appendChild(buildCap(inputs, "⌘"));
    comp.appendChild(buildCap(inputs, "K"));
  }

  return comp;
}

function buildCap(inputs: ComponentsInputs, glyph: string): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const cap = figma.createFrame();
  cap.name = "Key";
  cap.layoutMode = "HORIZONTAL";
  cap.primaryAxisAlignItems = "CENTER";
  cap.counterAxisAlignItems = "CENTER";
  // radix-nova Kbd: `h-5 min-w-5 px-1 rounded-sm bg-muted`.
  cap.paddingLeft = 4;
  cap.paddingRight = 4;
  // resize() pins both axes to FIXED; re-set the primary axis to AUTO so the
  // cap hugs its glyph while the height stays locked at h-5 (20px). The
  // minWidth honours radix-nova's `min-w-5`.
  cap.resize(CAP_HEIGHT, CAP_HEIGHT);
  cap.primaryAxisSizingMode = "AUTO";
  cap.counterAxisSizingMode = "FIXED";
  cap.minWidth = CAP_HEIGHT;
  cap.cornerRadius = 4;
  bindCornerRadii(cap, p.get("radius/sm"));
  bindFill(cap, t.get("muted"));
  cap.strokes = [];

  const text = figma.createText();
  text.fontName = { family: "Inter", style: "Medium" };
  text.characters = glyph;
  text.fontSize = 12;
  bindFontSize(text, p.get("font/size/xs"));
  bindFill(text, t.get("muted-foreground"));
  cap.appendChild(text);

  return cap;
}
