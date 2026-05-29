// Card: composable container with header, content, and footer slots.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

export async function addCardSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildCardComponent(inputs);
  page.appendChild(comp);
  return countDescendants(comp);
}

function buildCardComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Card";
  comp.layoutMode = "VERTICAL";
  // Resize before declaring sizing modes — calling resize() on an
  // auto-layout frame pins both axes to FIXED, which would lock the height
  // at the placeholder. Re-setting primaryAxisSizingMode to AUTO lets
  // Figma hug the children vertically.
  comp.resize(360, 100);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  comp.itemSpacing = 24;
  comp.paddingTop = 24;
  comp.paddingBottom = 24;
  comp.paddingLeft = 24;
  comp.paddingRight = 24;
  comp.cornerRadius = 12;
  bindCornerRadii(comp, p.get("radius/xl"));
  bindFill(comp, t.get("card"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;
  comp.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.05 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
      showShadowBehindNode: true,
    },
  ];

  // Card Header.
  const header = figma.createFrame();
  header.name = "Card Header";
  header.layoutMode = "VERTICAL";
  header.primaryAxisSizingMode = "AUTO";
  header.counterAxisSizingMode = "AUTO";
  // Mirrors shadcn's CardHeader: `grid gap-2`.
  header.itemSpacing = 8;
  header.fills = [];

  const title = figma.createText();
  title.fontName = { family: "Inter", style: "Semi Bold" };
  title.characters = "Card Title";
  title.fontSize = 16;
  bindFontSize(title, p.get("font/size/base"));
  bindFill(title, t.get("card-foreground"));
  header.appendChild(title);

  const desc = figma.createText();
  desc.fontName = { family: "Inter", style: "Regular" };
  desc.characters = "Card description goes here with supporting text.";
  desc.fontSize = 14;
  bindFontSize(desc, p.get("font/size/sm"));
  bindFill(desc, t.get("muted-foreground"));
  header.appendChild(desc);

  comp.appendChild(header);

  // Card Content.
  const content = figma.createFrame();
  content.name = "Card Content";
  content.layoutMode = "VERTICAL";
  content.primaryAxisSizingMode = "AUTO";
  content.counterAxisSizingMode = "AUTO";
  content.itemSpacing = 8;
  content.fills = [];

  const body = figma.createText();
  body.fontName = { family: "Inter", style: "Regular" };
  body.characters =
    "This is the card body content area. It can contain any layout.";
  body.fontSize = 14;
  bindFontSize(body, p.get("font/size/sm"));
  bindFill(body, t.get("foreground"));
  content.appendChild(body);

  comp.appendChild(content);

  // Card Footer.
  const footer = figma.createFrame();
  footer.name = "Card Footer";
  footer.layoutMode = "HORIZONTAL";
  footer.primaryAxisSizingMode = "AUTO";
  footer.counterAxisSizingMode = "AUTO";
  footer.primaryAxisAlignItems = "MIN";
  footer.counterAxisAlignItems = "CENTER";
  footer.itemSpacing = 8;
  footer.fills = [];

  const footerText = figma.createText();
  footerText.fontName = { family: "Inter", style: "Regular" };
  footerText.characters = "Card footer";
  footerText.fontSize = 12;
  bindFontSize(footerText, p.get("font/size/xs"));
  bindFill(footerText, t.get("muted-foreground"));
  footer.appendChild(footerText);

  comp.appendChild(footer);

  return comp;
}
