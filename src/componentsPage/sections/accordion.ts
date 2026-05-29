// Accordion: stacked items separated by bottom borders, one item expanded.
//
// Mirrors shadcn's Accordion (radix-ui primitive): each item is a trigger row
// (`py-4 text-sm font-medium` with a trailing chevron) over a `border-b`
// divider; the open item reveals a `pb-4` content block and rotates its
// chevron 180°.

import { bindFill, bindFontSize, bindStrokeColor } from "../bindings";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

type AccordionItemData = { title: string; open: boolean; body?: string };

const ITEMS: AccordionItemData[] = [
  {
    title: "Is it accessible?",
    open: true,
    body: "Yes. It adheres to the WAI-ARIA design pattern.",
  },
  { title: "Is it styled?", open: false },
  { title: "Is it animated?", open: false },
];

const ACCORDION_WIDTH = 400;

export async function addAccordionSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildAccordionComponent(inputs);
  page.appendChild(comp);
  return countDescendants(comp);
}

function buildAccordionComponent(inputs: ComponentsInputs): ComponentNode {
  const comp = figma.createComponent();
  comp.name = "Accordion";
  comp.layoutMode = "VERTICAL";
  // Resize before declaring sizing modes — calling resize() on an
  // auto-layout frame pins both axes to FIXED, which would lock the height
  // at the placeholder. Re-setting primaryAxisSizingMode to AUTO lets Figma
  // hug the items vertically.
  comp.resize(ACCORDION_WIDTH, 10);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  comp.itemSpacing = 0;
  comp.fills = [];
  comp.strokes = [];

  for (let i = 0; i < ITEMS.length; i++) {
    const item = buildAccordionItem(inputs, ITEMS[i]!, i < ITEMS.length - 1);
    comp.appendChild(item);
    item.layoutSizingHorizontal = "FILL";
  }

  return comp;
}

function buildAccordionItem(
  inputs: ComponentsInputs,
  data: AccordionItemData,
  withBorder: boolean,
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const item = figma.createFrame();
  item.name = data.open ? "Item (open)" : "Item";
  item.layoutMode = "VERTICAL";
  item.primaryAxisSizingMode = "AUTO";
  item.counterAxisSizingMode = "FIXED";
  item.itemSpacing = 0;
  item.fills = [];
  item.strokes = [];
  if (withBorder) {
    bindStrokeColor(item, t.get("border"));
    item.strokeWeight = 1;
    item.strokeAlign = "INSIDE";
    item.strokeBottomWeight = 1;
    item.strokeTopWeight = 0;
    item.strokeLeftWeight = 0;
    item.strokeRightWeight = 0;
  }

  // Trigger row: title + chevron.
  const trigger = figma.createFrame();
  trigger.name = "Trigger";
  trigger.layoutMode = "HORIZONTAL";
  trigger.primaryAxisSizingMode = "FIXED";
  trigger.counterAxisSizingMode = "AUTO";
  trigger.primaryAxisAlignItems = "SPACE_BETWEEN";
  trigger.counterAxisAlignItems = "CENTER";
  trigger.itemSpacing = 16;
  trigger.paddingTop = 16;
  trigger.paddingBottom = 16;
  trigger.fills = [];
  trigger.strokes = [];
  item.appendChild(trigger);
  trigger.layoutSizingHorizontal = "FILL";

  const title = figma.createText();
  title.fontName = { family: "Inter", style: "Medium" };
  title.characters = data.title;
  title.fontSize = 14;
  bindFontSize(title, p.get("font/size/sm"));
  bindFill(title, t.get("foreground"));
  trigger.appendChild(title);

  trigger.appendChild(buildChevron(t, data.open));

  // Content block for the open item.
  if (data.open && data.body) {
    const content = figma.createText();
    content.name = "Content";
    content.fontName = { family: "Inter", style: "Regular" };
    content.characters = data.body;
    content.fontSize = 14;
    bindFontSize(content, p.get("font/size/sm"));
    bindFill(content, t.get("muted-foreground"));
    content.paragraphSpacing = 0;
    // shadcn renders the open content with bottom padding (`pb-4`).
    const wrapper = figma.createFrame();
    wrapper.name = "Content Wrapper";
    wrapper.layoutMode = "VERTICAL";
    wrapper.primaryAxisSizingMode = "AUTO";
    wrapper.counterAxisSizingMode = "FIXED";
    wrapper.paddingBottom = 16;
    wrapper.fills = [];
    wrapper.strokes = [];
    item.appendChild(wrapper);
    wrapper.layoutSizingHorizontal = "FILL";
    wrapper.appendChild(content);
    content.layoutSizingHorizontal = "FILL";
  }

  return item;
}

function buildChevron(t: Map<string, Variable>, open: boolean): VectorNode {
  // Down-pointing chevron; the open item flips it to point up (180°).
  const chevron = figma.createVector();
  chevron.name = "Chevron";
  chevron.resize(16, 16);
  chevron.vectorPaths = [
    {
      windingRule: "NONZERO",
      data: open ? "M 4 10 L 8 6 L 12 10" : "M 4 6 L 8 10 L 12 6",
    },
  ];
  chevron.strokeWeight = 1.5;
  chevron.strokeCap = "ROUND";
  chevron.strokeJoin = "ROUND";
  chevron.fills = [];
  bindStrokeColor(chevron, t.get("muted-foreground"));
  return chevron;
}
