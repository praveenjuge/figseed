// Input OTP: one-time-password field rendered as two groups of three
// connected slots, joined by a minus separator.
//
// Mirrors radix-nova's InputOTP: each slot is `size-8 border-y border-r
// border-input text-sm`, the first slot adds a left border and rounds its
// left corners (`first:rounded-l-lg first:border-l`), the last rounds its
// right corners (`last:rounded-r-lg`). The active slot gets a `border-ring`
// + ring. The separator renders a `MinusIcon`.

import { bindFill, bindFontSize, bindStrokeColor } from "../bindings";
import { applyFont } from "../../fonts";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const SLOT_SIZE = 32;
const RADIUS_LG = 8;

// First group is filled (with the last filled slot "active"); second group
// is empty — a realistic mid-entry state.
const GROUP_A = ["1", "2", "3"];
const GROUP_B = ["", "", ""];
const ACTIVE_INDEX = 2; // last filled slot in group A.

export async function addInputOtpSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildInputOtpComponent(inputs);
  page.appendChild(comp);
  // Wrap so it sits in the same bordered card frame as the other sets.
  const componentSet = figma.combineAsVariants([comp], page);
  componentSet.name = "Input OTP";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);
  return countDescendants(componentSet);
}

function buildInputOtpComponent(inputs: ComponentsInputs): ComponentNode {
  const comp = figma.createComponent();
  comp.name = "Default";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  // radix-nova InputOTP container: `flex items-center` with `gap-2` between
  // the two groups (via the separator margins). We use an 8px item spacing.
  comp.itemSpacing = 8;
  comp.fills = [];
  comp.strokes = [];

  comp.appendChild(buildGroup(inputs, GROUP_A, ACTIVE_INDEX));
  comp.appendChild(buildSeparator(inputs));
  comp.appendChild(buildGroup(inputs, GROUP_B, -1));

  return comp;
}

function buildGroup(
  inputs: ComponentsInputs,
  chars: string[],
  activeIndex: number,
): FrameNode {
  const group = figma.createFrame();
  group.name = "Group";
  group.layoutMode = "HORIZONTAL";
  group.primaryAxisSizingMode = "AUTO";
  group.counterAxisSizingMode = "AUTO";
  group.counterAxisAlignItems = "CENTER";
  // Slots are connected (no gap) — borders overlap like shadcn's group.
  group.itemSpacing = 0;
  group.fills = [];
  group.strokes = [];

  for (let i = 0; i < chars.length; i++) {
    group.appendChild(
      buildSlot(inputs, chars[i]!, {
        first: i === 0,
        last: i === chars.length - 1,
        active: i === activeIndex,
      }),
    );
  }

  return group;
}

type SlotFlags = { first: boolean; last: boolean; active: boolean };

function buildSlot(
  inputs: ComponentsInputs,
  char: string,
  flags: SlotFlags,
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const slot = figma.createFrame();
  slot.name = flags.active ? "Slot (active)" : "Slot";
  slot.layoutMode = "HORIZONTAL";
  slot.primaryAxisAlignItems = "CENTER";
  slot.counterAxisAlignItems = "CENTER";
  slot.resize(SLOT_SIZE, SLOT_SIZE);
  slot.primaryAxisSizingMode = "FIXED";
  slot.counterAxisSizingMode = "FIXED";
  slot.fills = [];

  // Border: every slot has top/right/bottom; the first adds a left edge so
  // the group reads as one box. The active slot swaps to the ring colour.
  bindStrokeColor(slot, t.get(flags.active ? "ring" : "input"));
  slot.strokeWeight = 1;
  slot.strokeAlign = "INSIDE";
  slot.strokeTopWeight = 1;
  slot.strokeBottomWeight = 1;
  slot.strokeRightWeight = 1;
  slot.strokeLeftWeight = flags.first ? 1 : 0;

  // Corner rounding: first slot rounds its left, last slot rounds its right.
  const radiusVar = p.get("radius/lg");
  if (flags.first) {
    slot.topLeftRadius = RADIUS_LG;
    slot.bottomLeftRadius = RADIUS_LG;
    if (radiusVar) {
      try {
        slot.setBoundVariable("topLeftRadius", radiusVar);
        slot.setBoundVariable("bottomLeftRadius", radiusVar);
      } catch {
        // ignore
      }
    }
  }
  if (flags.last) {
    slot.topRightRadius = RADIUS_LG;
    slot.bottomRightRadius = RADIUS_LG;
    if (radiusVar) {
      try {
        slot.setBoundVariable("topRightRadius", radiusVar);
        slot.setBoundVariable("bottomRightRadius", radiusVar);
      } catch {
        // ignore
      }
    }
  }

  if (char) {
    const text = figma.createText();
    applyFont(text, "body", "Regular");
    text.characters = char;
    text.fontSize = 14;
    bindFontSize(text, p.get("font/size/sm"));
    bindFill(text, t.get("foreground"));
    slot.appendChild(text);
  } else if (flags.active) {
    // Fake caret: a 1px tall bar like shadcn's `animate-caret-blink`.
    const caret = figma.createRectangle();
    caret.name = "Caret";
    caret.resize(1, 16);
    bindFill(caret, t.get("foreground"));
    slot.appendChild(caret);
  }

  return slot;
}

function buildSeparator(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;

  const sep = figma.createFrame();
  sep.name = "Separator";
  sep.layoutMode = "HORIZONTAL";
  sep.primaryAxisAlignItems = "CENTER";
  sep.counterAxisAlignItems = "CENTER";
  sep.resize(16, SLOT_SIZE);
  sep.primaryAxisSizingMode = "FIXED";
  sep.counterAxisSizingMode = "FIXED";
  sep.fills = [];
  sep.strokes = [];

  // MinusIcon → a short horizontal line.
  const dash = figma.createRectangle();
  dash.name = "Minus";
  dash.resize(8, 1.5);
  dash.cornerRadius = 1;
  bindFill(dash, t.get("muted-foreground"));
  sep.appendChild(dash);

  return sep;
}
