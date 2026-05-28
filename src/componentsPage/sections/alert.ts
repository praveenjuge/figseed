// Alert: default and destructive variants with icon, title, and description.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import {
  createSectionFrame,
  createVertical,
  styleComponentSet,
} from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const ALERT_VARIANTS = ["default", "destructive"] as const;
type AlertVariant = (typeof ALERT_VARIANTS)[number];

export async function addAlertSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Alert", {
    title: "Alert",
    subtitle: "Default and destructive variants with title and description.",
  });

  const components: ComponentNode[] = [];
  for (const variant of ALERT_VARIANTS) {
    const comp = buildAlertComponent(inputs, variant);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Alert";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  // Make variants fill the component set width.
  for (const child of componentSet.children) {
    if ("layoutSizingHorizontal" in child) {
      (child as FrameNode).layoutSizingHorizontal = "FILL";
    }
  }

  const showcase = createVertical(section, 12);
  showcase.layoutSizingHorizontal = "FILL";
  for (const comp of components) {
    const instance = comp.createInstance();
    showcase.appendChild(instance);
    instance.layoutSizingHorizontal = "FILL";
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildAlertComponent(
  inputs: ComponentsInputs,
  variant: AlertVariant,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  // Use a vertical layout for the component with a nested horizontal row
  // for icon + text. This avoids Figma's auto-height issues with horizontal
  // layouts containing fill-width text children.
  const comp = figma.createComponent();
  comp.name = `Variant=${variant}`;
  comp.layoutMode = "VERTICAL";
  // Resize before declaring the sizing modes — calling resize() on an
  // auto-layout frame pins both axes to FIXED, which would lock the height
  // at the placeholder value below. Re-setting primaryAxisSizingMode to
  // AUTO afterwards lets Figma hug the children vertically.
  comp.resize(480, 10);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  comp.paddingLeft = 16;
  comp.paddingRight = 16;
  comp.paddingTop = 12;
  comp.paddingBottom = 12;
  comp.itemSpacing = 0;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  bindFill(comp, t.get("card"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;

  // Row: icon + text column.
  const row = figma.createFrame();
  row.name = "Content";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "AUTO";
  row.counterAxisSizingMode = "AUTO";
  row.itemSpacing = 12;
  row.fills = [];
  comp.appendChild(row);
  row.layoutSizingHorizontal = "FILL";

  // Icon placeholder — a small filled square.
  const icon = figma.createFrame();
  icon.name = "Icon";
  icon.resize(16, 16);
  icon.cornerRadius = 4;
  bindCornerRadii(icon, p.get("radius/sm"));
  if (variant === "destructive") {
    bindFill(icon, t.get("destructive"));
  } else {
    bindFill(icon, t.get("foreground"));
  }
  row.appendChild(icon);

  // Text column.
  const textCol = figma.createFrame();
  textCol.name = "Text";
  textCol.layoutMode = "VERTICAL";
  textCol.primaryAxisSizingMode = "AUTO";
  textCol.counterAxisSizingMode = "AUTO";
  textCol.itemSpacing = 4;
  textCol.fills = [];
  row.appendChild(textCol);
  textCol.layoutSizingHorizontal = "FILL";

  const title = figma.createText();
  title.fontName = { family: "Inter", style: "Medium" };
  title.fontSize = 14;
  bindFontSize(title, p.get("font/size/sm"));
  if (variant === "destructive") {
    title.characters = "Error";
    bindFill(title, t.get("destructive"));
  } else {
    title.characters = "Heads up!";
    bindFill(title, t.get("card-foreground"));
  }
  textCol.appendChild(title);
  title.layoutSizingHorizontal = "FILL";

  const desc = figma.createText();
  desc.fontName = { family: "Inter", style: "Regular" };
  desc.fontSize = 14;
  bindFontSize(desc, p.get("font/size/sm"));
  desc.characters =
    variant === "destructive"
      ? "Your session has expired. Please sign in again."
      : "You can add components to your app using the CLI.";
  if (variant === "destructive") {
    bindFill(desc, t.get("destructive"));
    desc.opacity = 0.9;
  } else {
    bindFill(desc, t.get("muted-foreground"));
  }
  textCol.appendChild(desc);
  desc.layoutSizingHorizontal = "FILL";

  return comp;
}
