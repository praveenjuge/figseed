// Tabs: pill list with one trigger active. Three variants per active index.
//
// Mirrors shadcn's Tabs (radix-ui primitive): `bg-muted` list with rounded
// corners, individual triggers padded inside; the active trigger gets the
// `bg-background` surface plus a subtle drop shadow.

import { bindCornerRadii, bindFill, bindFontSize } from "../bindings";
import { applyFont } from "../../fonts";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const TAB_LABELS = ["Account", "Password", "Team"] as const;

const ACTIVE_INDICES = [0, 1, 2] as const;
type ActiveIndex = (typeof ACTIVE_INDICES)[number];

const LIST_HEIGHT = 32;
const LIST_PADDING = 3;

export async function addTabsSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const active of ACTIVE_INDICES) {
    const comp = buildTabsComponent(inputs, active);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Tabs";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildTabsComponent(
  inputs: ComponentsInputs,
  active: ActiveIndex,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Active=${TAB_LABELS[active]}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  // Mirrors radix-nova's TabsList: `h-8 gap-2 p-[3px] rounded-lg bg-muted`.
  comp.itemSpacing = 8;
  comp.paddingLeft = LIST_PADDING;
  comp.paddingRight = LIST_PADDING;
  comp.paddingTop = LIST_PADDING;
  comp.paddingBottom = LIST_PADDING;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  bindFill(comp, t.get("muted"));
  comp.strokes = [];

  for (let i = 0; i < TAB_LABELS.length; i++) {
    const trigger = buildTabTrigger(inputs, TAB_LABELS[i]!, i === active);
    comp.appendChild(trigger);
  }

  return comp;
}

function buildTabTrigger(
  inputs: ComponentsInputs,
  label: string,
  isActive: boolean,
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const trigger = figma.createFrame();
  trigger.name = isActive ? "Trigger (active)" : "Trigger";
  trigger.layoutMode = "HORIZONTAL";
  trigger.primaryAxisSizingMode = "AUTO";
  trigger.counterAxisSizingMode = "FIXED";
  trigger.primaryAxisAlignItems = "CENTER";
  trigger.counterAxisAlignItems = "CENTER";
  trigger.resize(96, LIST_HEIGHT - LIST_PADDING * 2);
  // radix-nova TabsTrigger: `gap-1.5 rounded-md px-1.5 py-0.5 text-sm
  // font-medium`.
  trigger.itemSpacing = 6;
  trigger.paddingLeft = 6;
  trigger.paddingRight = 6;
  trigger.paddingTop = 2;
  trigger.paddingBottom = 2;
  trigger.cornerRadius = 6;
  bindCornerRadii(trigger, p.get("radius/md"));
  trigger.strokes = [];

  if (isActive) {
    bindFill(trigger, t.get("background"));
    trigger.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.05 },
        offset: { x: 0, y: 1 },
        radius: 2,
        spread: 0,
        visible: true,
        blendMode: "NORMAL",
        showShadowBehindNode: true,
      },
    ];
  } else {
    trigger.fills = [];
  }

  const text = figma.createText();
  applyFont(text, "body", "Medium");
  text.characters = label;
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  if (isActive) {
    bindFill(text, t.get("foreground"));
  } else {
    // radix-nova inactive trigger: `text-foreground/60` (then
    // `dark:text-muted-foreground`). Use foreground @ 60% for the light
    // mode look — close enough to muted-foreground at most presets.
    bindFill(text, t.get("muted-foreground"));
  }
  trigger.appendChild(text);

  return trigger;
}
