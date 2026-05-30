// Sidebar: an app navigation rail. Mirrors shadcn's Sidebar composition: a
// `bg-sidebar text-sidebar-foreground` panel with a SidebarHeader (a brand
// row), a SidebarGroup of SidebarMenuButtons (`h-8 rounded-md px-2 gap-2
// text-sm`, the active one `bg-sidebar-accent`), and a SidebarFooter (a user
// row). shadcn ships dedicated `--sidebar-*` theme tokens; we bind to them and
// fall back to the popover/foreground pair when a preset lacks them.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import {
  createIcon,
  resolveIconLibrary,
  type SemanticIconName,
} from "../../icons";
import { wrapInSectionCard } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const SIDEBAR_WIDTH = 256; // shadcn `--sidebar-width: 16rem`

type NavItem = { label: string; icon: SemanticIconName; active?: boolean };
const ITEMS: NavItem[] = [
  { label: "Search", icon: "search", active: true },
  { label: "Inbox", icon: "bell" },
  { label: "Calendar", icon: "folder" },
  { label: "Settings", icon: "command" },
];

// Resolve a sidebar-specific token, falling back to a neutral equivalent so
// presets without `--sidebar-*` variables still render sensibly.
function sidebarVar(
  t: Map<string, Variable>,
  key: string,
  fallback: string,
): Variable | undefined {
  return t.get(key) ?? t.get(fallback);
}

export async function addSidebarSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildSidebarComponent(inputs);
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
}

function buildSidebarComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Sidebar";
  comp.layoutMode = "VERTICAL";
  comp.resize(SIDEBAR_WIDTH, 10);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  comp.itemSpacing = 8;
  comp.paddingTop = 8;
  comp.paddingBottom = 8;
  comp.paddingLeft = 8;
  comp.paddingRight = 8;
  bindFill(comp, sidebarVar(t, "sidebar", "popover"));
  bindStrokeColor(comp, sidebarVar(t, "sidebar-border", "border"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";

  // Header: brand row.
  comp.appendChild(buildHeaderRow(inputs));

  // Group label.
  const groupLabel = buildGroupLabel(inputs, "Platform");
  comp.appendChild(groupLabel);
  groupLabel.layoutSizingHorizontal = "FILL";

  // Menu items.
  for (const item of ITEMS) {
    const row = buildMenuItem(inputs, item);
    comp.appendChild(row);
    row.layoutSizingHorizontal = "FILL";
  }

  // Footer: user row.
  const footer = buildFooterRow(inputs);
  comp.appendChild(footer);
  footer.layoutSizingHorizontal = "FILL";

  return comp;
}

function buildHeaderRow(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const row = figma.createFrame();
  row.name = "Header";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 8;
  row.paddingLeft = 8;
  row.paddingRight = 8;
  row.paddingTop = 8;
  row.paddingBottom = 8;
  row.fills = [];
  row.strokes = [];

  // Brand mark: a small rounded primary square.
  const mark = figma.createFrame();
  mark.name = "Mark";
  mark.layoutMode = "HORIZONTAL";
  mark.primaryAxisAlignItems = "CENTER";
  mark.counterAxisAlignItems = "CENTER";
  mark.resize(32, 32);
  mark.primaryAxisSizingMode = "FIXED";
  mark.counterAxisSizingMode = "FIXED";
  mark.cornerRadius = 8;
  bindCornerRadii(mark, p.get("radius/lg"));
  bindFill(mark, t.get("primary"));
  mark.strokes = [];
  row.appendChild(mark);

  const icon = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: "command",
    size: 16,
    color: t.get("primary-foreground"),
  });
  if (icon) {
    icon.name = "Icon";
    mark.appendChild(icon);
  }

  const text = figma.createText();
  applyFont(text, "body", "Medium");
  text.characters = "Acme Inc";
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, sidebarVar(t, "sidebar-foreground", "foreground"));
  row.appendChild(text);

  return row;
}

function buildGroupLabel(inputs: ComponentsInputs, text: string): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const row = figma.createFrame();
  row.name = "Group Label";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.counterAxisAlignItems = "CENTER";
  row.paddingLeft = 8;
  row.paddingRight = 8;
  row.paddingTop = 4;
  row.paddingBottom = 4;
  row.fills = [];
  row.strokes = [];

  const label = figma.createText();
  applyFont(label, "body", "Medium");
  label.characters = text;
  label.fontSize = 12;
  bindFontSize(label, p.get("font/size/xs"));
  bindFill(label, t.get("muted-foreground"));
  row.appendChild(label);

  return row;
}

function buildMenuItem(inputs: ComponentsInputs, item: NavItem): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const row = figma.createFrame();
  row.name = item.active ? "Item (active)" : "Item";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "FIXED";
  row.primaryAxisAlignItems = "MIN";
  row.counterAxisAlignItems = "CENTER";
  // `h-8 rounded-md px-2 gap-2`.
  row.itemSpacing = 8;
  row.paddingLeft = 8;
  row.paddingRight = 8;
  row.resize(SIDEBAR_WIDTH - 16, 32);
  row.cornerRadius = 6;
  bindCornerRadii(row, p.get("radius/md"));
  row.strokes = [];

  const fg = item.active
    ? sidebarVar(t, "sidebar-accent-foreground", "accent-foreground")
    : sidebarVar(t, "sidebar-foreground", "foreground");

  if (item.active) {
    bindFill(row, sidebarVar(t, "sidebar-accent", "accent"));
  } else {
    row.fills = [];
  }

  const icon = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: item.icon,
    size: 16,
    color: fg,
  });
  if (icon) {
    icon.name = "Icon";
    row.appendChild(icon);
  }

  const label = figma.createText();
  applyFont(label, "body", "Medium");
  label.characters = item.label;
  label.fontSize = 14;
  bindFontSize(label, p.get("font/size/sm"));
  bindFill(label, fg);
  row.appendChild(label);

  return row;
}

function buildFooterRow(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const row = figma.createFrame();
  row.name = "Footer";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 8;
  row.paddingLeft = 8;
  row.paddingRight = 8;
  row.paddingTop = 8;
  row.paddingBottom = 8;
  row.cornerRadius = 6;
  bindCornerRadii(row, p.get("radius/md"));
  row.fills = [];
  row.strokes = [];

  // Avatar circle with initials.
  const avatar = figma.createFrame();
  avatar.name = "Avatar";
  avatar.layoutMode = "HORIZONTAL";
  avatar.primaryAxisAlignItems = "CENTER";
  avatar.counterAxisAlignItems = "CENTER";
  avatar.resize(32, 32);
  avatar.primaryAxisSizingMode = "FIXED";
  avatar.counterAxisSizingMode = "FIXED";
  avatar.cornerRadius = 9999;
  bindCornerRadii(avatar, p.get("radius/full"));
  bindFill(avatar, t.get("muted"));
  avatar.strokes = [];
  row.appendChild(avatar);

  const initials = figma.createText();
  applyFont(initials, "body", "Medium");
  initials.characters = "JD";
  initials.fontSize = 12;
  bindFontSize(initials, p.get("font/size/xs"));
  bindFill(initials, t.get("muted-foreground"));
  avatar.appendChild(initials);

  const textCol = figma.createFrame();
  textCol.name = "Text";
  textCol.layoutMode = "VERTICAL";
  textCol.primaryAxisSizingMode = "AUTO";
  textCol.counterAxisSizingMode = "AUTO";
  textCol.itemSpacing = 0;
  textCol.fills = [];
  textCol.strokes = [];
  row.appendChild(textCol);
  textCol.layoutGrow = 1;

  const name = figma.createText();
  applyFont(name, "body", "Medium");
  name.characters = "Jane Doe";
  name.fontSize = 14;
  bindFontSize(name, p.get("font/size/sm"));
  bindFill(name, sidebarVar(t, "sidebar-foreground", "foreground"));
  textCol.appendChild(name);

  const email = figma.createText();
  applyFont(email, "body", "Regular");
  email.characters = "jane@acme.com";
  email.fontSize = 12;
  bindFontSize(email, p.get("font/size/xs"));
  bindFill(email, t.get("muted-foreground"));
  textCol.appendChild(email);

  return row;
}
