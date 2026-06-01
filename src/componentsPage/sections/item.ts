// Item: a flexible list row with a media slot, content (title + description),
// and a trailing actions slot. Mirrors radix-nova's Item primitives:
//
//   Item             `flex w-full items-center rounded-lg border gap-2.5
//                     px-3 py-2.5 text-sm`
//   ItemMedia(icon)  `size-4` icon, self-start when a description is present
//   ItemContent      `flex flex-1 flex-col gap-1`
//   ItemTitle        `text-sm font-medium leading-snug` (foreground)
//   ItemDescription  `text-sm text-muted-foreground leading-normal`
//   ItemActions      `flex items-center gap-2`
//
// The `variant` prop drives the border/background:
//   default — `border-transparent`
//   outline — `border-border`
//   muted   — `border-transparent bg-muted/50`

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

const ITEM_VARIANTS = ["default", "outline", "muted"] as const;
type ItemVariant = (typeof ITEM_VARIANTS)[number];

const ITEM_WIDTH = 360;

export async function addItemSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const variant of ITEM_VARIANTS) {
    const comp = buildItemComponent(inputs, variant);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Item";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildItemComponent(
  inputs: ComponentsInputs,
  variant: ItemVariant,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}`;
  comp.layoutMode = "HORIZONTAL";
  comp.resize(ITEM_WIDTH, 10);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "MIN";
  // `gap-2.5 px-3 py-2.5 rounded-lg border`.
  comp.itemSpacing = 10;
  comp.paddingLeft = 12;
  comp.paddingRight = 12;
  comp.paddingTop = 10;
  comp.paddingBottom = 10;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";

  if (variant === "outline") {
    comp.fills = [];
    bindStrokeColor(comp, t.get("border"));
  } else if (variant === "muted") {
    bindFill(comp, t.get("muted"));
    comp.strokes = [];
  } else {
    comp.fills = [];
    comp.strokes = [];
  }

  // Media (`icon` variant): a `size-4` icon nudged to the top so it aligns
  // with the title when a description wraps (`self-start`).
  const media = figma.createFrame();
  media.name = "Item Media";
  media.layoutMode = "HORIZONTAL";
  media.primaryAxisSizingMode = "FIXED";
  media.counterAxisSizingMode = "FIXED";
  media.primaryAxisAlignItems = "CENTER";
  media.counterAxisAlignItems = "CENTER";
  media.resize(20, 20);
  media.fills = [];
  media.strokes = [];
  const icon = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: "folder",
    size: 16,
    color: t.get("foreground"),
  });
  if (icon) {
    icon.name = "Icon";
    media.appendChild(icon);
  }
  comp.appendChild(media);

  // Content: title + description (`flex-1 flex-col gap-1`).
  const content = figma.createFrame();
  content.name = "Item Content";
  content.layoutMode = "VERTICAL";
  content.primaryAxisSizingMode = "AUTO";
  content.counterAxisSizingMode = "AUTO";
  content.itemSpacing = 4;
  content.fills = [];
  content.strokes = [];

  const title = figma.createText();
  applyFont(title, "body", "Medium");
  title.characters = "Project files";
  title.fontSize = 14;
  bindFontSize(title, p.get("font/size/sm"));
  bindFill(title, t.get("foreground"));
  content.appendChild(title);

  const desc = figma.createText();
  applyFont(desc, "body", "Regular");
  desc.characters = "12 files · updated 2 hours ago";
  desc.fontSize = 14;
  bindFontSize(desc, p.get("font/size/sm"));
  bindFill(desc, t.get("muted-foreground"));
  content.appendChild(desc);

  comp.appendChild(content);
  content.layoutGrow = 1;
  content.layoutSizingHorizontal = "FILL";
  title.layoutSizingHorizontal = "FILL";
  desc.layoutSizingHorizontal = "FILL";

  // Actions: a trailing chevron, mirroring a navigable list row.
  const actions = figma.createFrame();
  actions.name = "Item Actions";
  actions.layoutMode = "HORIZONTAL";
  actions.primaryAxisSizingMode = "AUTO";
  actions.counterAxisSizingMode = "FIXED";
  actions.primaryAxisAlignItems = "CENTER";
  actions.counterAxisAlignItems = "CENTER";
  actions.resize(20, 20);
  actions.fills = [];
  actions.strokes = [];
  actions.appendChild(buildChevronRight(t));
  comp.appendChild(actions);

  return comp;
}

function buildChevronRight(t: Map<string, Variable>): VectorNode {
  const chevron = figma.createVector();
  chevron.name = "Chevron";
  chevron.resize(16, 16);
  chevron.vectorPaths = [
    {
      windingRule: "NONZERO",
      data: "M 6 4 L 10 8 L 6 12",
    },
  ];
  chevron.strokeWeight = 1.5;
  chevron.strokeCap = "ROUND";
  chevron.strokeJoin = "ROUND";
  chevron.fills = [];
  bindStrokeColor(chevron, t.get("muted-foreground"));
  return chevron;
}
