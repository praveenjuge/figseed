// Card: composable container with header, content, and footer slots.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { wrapInSectionCard } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

export async function addCardSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildCardComponent(inputs);
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
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
  // radix-nova Card: `gap-4 py-4 rounded-xl bg-card ring-1 ring-foreground/10`.
  // Padding is on the inner sections (`px-4`), not the card itself, so the
  // card frame has only vertical padding here.
  comp.itemSpacing = 16;
  comp.paddingTop = 16;
  comp.paddingBottom = 16;
  comp.paddingLeft = 0;
  comp.paddingRight = 0;
  comp.cornerRadius = 12;
  bindCornerRadii(comp, p.get("radius/xl"));
  bindFill(comp, t.get("card"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";
  // radix-nova uses `ring-1 ring-foreground/10` instead of a drop shadow.
  comp.effects = [];

  // Card Header.
  const header = figma.createFrame();
  header.name = "Card Header";
  header.layoutMode = "VERTICAL";
  header.primaryAxisSizingMode = "AUTO";
  header.counterAxisSizingMode = "AUTO";
  // radix-nova CardHeader: `grid items-start gap-1 rounded-t-xl px-4`.
  header.itemSpacing = 4;
  header.paddingLeft = 16;
  header.paddingRight = 16;
  header.fills = [];

  const title = figma.createText();
  applyFont(title, "heading", "Medium");
  title.characters = "Card Title";
  title.fontSize = 16;
  bindFontSize(title, p.get("font/size/base"));
  bindFill(title, t.get("card-foreground"));
  header.appendChild(title);

  const desc = figma.createText();
  applyFont(desc, "body", "Regular");
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
  // radix-nova CardContent: `px-4`.
  content.itemSpacing = 8;
  content.paddingLeft = 16;
  content.paddingRight = 16;
  content.fills = [];

  const body = figma.createText();
  applyFont(body, "body", "Regular");
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
  // radix-nova CardFooter: `flex items-center rounded-b-xl border-t
  // bg-muted/50 p-4`. We approximate with foreground padding only.
  footer.itemSpacing = 8;
  footer.paddingLeft = 16;
  footer.paddingRight = 16;
  footer.fills = [];

  const footerText = figma.createText();
  applyFont(footerText, "body", "Regular");
  footerText.characters = "Card footer";
  footerText.fontSize = 12;
  bindFontSize(footerText, p.get("font/size/xs"));
  bindFill(footerText, t.get("muted-foreground"));
  footer.appendChild(footerText);

  comp.appendChild(footer);

  return comp;
}
