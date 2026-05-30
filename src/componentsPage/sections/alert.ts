// Alert: default and destructive variants with icon, title, and description.

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

const ALERT_VARIANTS = ["default", "destructive"] as const;
type AlertVariant = (typeof ALERT_VARIANTS)[number];

export async function addAlertSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
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

  return countDescendants(componentSet);
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
  // radix-nova Alert: `rounded-lg px-2.5 py-2 has-[>svg]:gap-x-2`.
  comp.paddingLeft = 10;
  comp.paddingRight = 10;
  comp.paddingTop = 8;
  comp.paddingBottom = 8;
  comp.itemSpacing = 0;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  bindFill(comp, t.get("card"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;

  // Row: icon + text column. radix-nova has `gap-x-2` (8) between the SVG
  // column and the text column.
  const row = figma.createFrame();
  row.name = "Content";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "AUTO";
  row.counterAxisSizingMode = "AUTO";
  row.itemSpacing = 8;
  row.fills = [];
  comp.appendChild(row);
  row.layoutSizingHorizontal = "FILL";

  // Icon — a real icon from the preset's icon library, inheriting the alert's
  // `text-current` colour (card-foreground for default, destructive for the
  // destructive variant). Falls back to a small filled square when the active
  // library has no candidate for the semantic icon.
  const iconColor =
    variant === "destructive" ? t.get("destructive") : t.get("card-foreground");
  const icon = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: variant === "destructive" ? "warning" : "info",
    size: 16,
    color: iconColor,
  });
  if (icon) {
    icon.name = "Icon";
    row.appendChild(icon);
  } else {
    const fallback = figma.createFrame();
    fallback.name = "Icon";
    fallback.resize(16, 16);
    fallback.cornerRadius = 4;
    bindCornerRadii(fallback, p.get("radius/sm"));
    bindFill(fallback, iconColor);
    row.appendChild(fallback);
  }

  // Text column. radix-nova `gap-0.5` between title and description.
  const textCol = figma.createFrame();
  textCol.name = "Text";
  textCol.layoutMode = "VERTICAL";
  textCol.primaryAxisSizingMode = "AUTO";
  textCol.counterAxisSizingMode = "AUTO";
  textCol.itemSpacing = 2;
  textCol.fills = [];
  row.appendChild(textCol);
  textCol.layoutSizingHorizontal = "FILL";

  const title = figma.createText();
  applyFont(title, "heading", "Medium");
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
  applyFont(desc, "body", "Regular");
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
