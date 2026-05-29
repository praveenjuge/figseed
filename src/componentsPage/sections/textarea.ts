// Textarea: multi-line text input. Three representative states.
//
// Mirrors shadcn's Textarea: rounded-md, input border, transparent
// background, muted-foreground placeholder. Focus uses ring colour with a
// subtle ring shadow; invalid uses destructive border.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const TEXTAREA_STATES = ["default", "focused", "invalid"] as const;
type TextareaState = (typeof TEXTAREA_STATES)[number];

const TEXTAREA_WIDTH = 320;
const TEXTAREA_HEIGHT = 96;

export async function addTextareaSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const state of TEXTAREA_STATES) {
    const comp = buildTextareaComponent(inputs, state);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Textarea";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildTextareaComponent(
  inputs: ComponentsInputs,
  state: TextareaState,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `State=${state}`;
  comp.layoutMode = "VERTICAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "MIN";
  comp.resize(TEXTAREA_WIDTH, TEXTAREA_HEIGHT);
  // Mirrors radix-nova's Textarea: `min-h-16 px-2.5 py-2 rounded-lg`.
  comp.paddingLeft = 10;
  comp.paddingRight = 10;
  comp.paddingTop = 8;
  comp.paddingBottom = 8;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  bindFill(comp, t.get("background"));

  switch (state) {
    case "focused":
      bindStrokeColor(comp, t.get("ring"));
      comp.strokeWeight = 1;
      comp.effects = [
        {
          type: "DROP_SHADOW",
          color: { r: 0, g: 0, b: 0, a: 0.08 },
          offset: { x: 0, y: 0 },
          radius: 0,
          spread: 3,
          visible: true,
          blendMode: "NORMAL",
          showShadowBehindNode: true,
        },
      ];
      break;
    case "invalid":
      bindStrokeColor(comp, t.get("destructive"));
      comp.strokeWeight = 1;
      break;
    default:
      bindStrokeColor(comp, t.get("input"));
      comp.strokeWeight = 1;
      break;
  }

  const text = figma.createText();
  text.fontName = { family: "Inter", style: "Regular" };
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  text.textAutoResize = "HEIGHT";
  // Make the text frame fill the textarea horizontally so wrapped content
  // sits within the padded area.
  text.resize(TEXTAREA_WIDTH - 24, text.height);

  switch (state) {
    case "default":
      text.characters = "Type your message here.";
      bindFill(text, t.get("muted-foreground"));
      break;
    case "focused":
      text.characters =
        "Loving the new components page so far. A few thoughts on the layout…";
      bindFill(text, t.get("foreground"));
      break;
    case "invalid":
      text.characters = "Message must be at least 20 characters.";
      bindFill(text, t.get("foreground"));
      break;
  }

  comp.appendChild(text);
  // After appending, let auto-layout manage the text width (FILL).
  if ("layoutSizingHorizontal" in text) {
    (text as TextNode).layoutSizingHorizontal = "FILL";
  }
  return comp;
}
