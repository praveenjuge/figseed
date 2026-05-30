// Empty: a centered empty-state placeholder. Mirrors radix-nova's Empty:
// `flex-col items-center justify-center gap-4 rounded-xl border-dashed p-6
// text-center`. Inside sits an EmptyMedia in its `icon` variant (`size-8
// rounded-lg bg-muted`), an EmptyTitle (`text-sm font-medium tracking-tight`),
// an EmptyDescription (`text-sm text-muted-foreground`), and an EmptyContent
// row with a primary action button.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { createIcon, resolveIconLibrary } from "../../icons";
import { wrapInSectionCard } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const EMPTY_WIDTH = 384;

export async function addEmptySection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildEmptyComponent(inputs);
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
}

function buildEmptyComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Empty";
  comp.layoutMode = "VERTICAL";
  comp.resize(EMPTY_WIDTH, 10);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  // `gap-4 p-6 rounded-xl border-dashed`.
  comp.itemSpacing = 16;
  comp.paddingTop = 24;
  comp.paddingBottom = 24;
  comp.paddingLeft = 24;
  comp.paddingRight = 24;
  comp.cornerRadius = 12;
  bindCornerRadii(comp, p.get("radius/xl"));
  comp.fills = [];
  // border-dashed — Figma renders the dash via dashPattern on the stroke.
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";
  comp.dashPattern = [4, 4];

  // Header: media + title + description (`max-w-sm items-center gap-2`).
  const header = figma.createFrame();
  header.name = "Empty Header";
  header.layoutMode = "VERTICAL";
  header.primaryAxisSizingMode = "AUTO";
  header.counterAxisSizingMode = "AUTO";
  header.primaryAxisAlignItems = "CENTER";
  header.counterAxisAlignItems = "CENTER";
  header.itemSpacing = 8;
  header.fills = [];
  header.strokes = [];
  comp.appendChild(header);

  // Media (`icon` variant): `size-8 rounded-lg bg-muted` with a `size-4` icon.
  const media = figma.createFrame();
  media.name = "Empty Media";
  media.layoutMode = "HORIZONTAL";
  media.primaryAxisSizingMode = "FIXED";
  media.counterAxisSizingMode = "FIXED";
  media.primaryAxisAlignItems = "CENTER";
  media.counterAxisAlignItems = "CENTER";
  media.resize(32, 32);
  media.cornerRadius = 8;
  bindCornerRadii(media, p.get("radius/lg"));
  bindFill(media, t.get("muted"));
  media.strokes = [];
  // `mb-2` below the media before the title.
  header.appendChild(media);

  const icon = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: "folder",
    size: 16,
    color: t.get("foreground"),
  });
  if (icon) {
    icon.name = "Icon";
    media.appendChild(icon);
  } else {
    const dot = figma.createFrame();
    dot.name = "Icon";
    dot.resize(16, 16);
    dot.cornerRadius = 4;
    bindCornerRadii(dot, p.get("radius/sm"));
    bindFill(dot, t.get("foreground"));
    media.appendChild(dot);
  }

  const title = figma.createText();
  applyFont(title, "heading", "Medium");
  title.characters = "No projects yet";
  title.fontSize = 14;
  bindFontSize(title, p.get("font/size/sm"));
  bindFill(title, t.get("foreground"));
  title.textAlignHorizontal = "CENTER";
  header.appendChild(title);

  const desc = figma.createText();
  applyFont(desc, "body", "Regular");
  desc.characters =
    "Create your first project to get started. You can always add more later.";
  desc.fontSize = 14;
  bindFontSize(desc, p.get("font/size/sm"));
  bindFill(desc, t.get("muted-foreground"));
  desc.textAlignHorizontal = "CENTER";
  desc.resize(288, desc.height);
  header.appendChild(desc);

  // Content: a primary action button (`gap-2.5`).
  const content = figma.createFrame();
  content.name = "Empty Content";
  content.layoutMode = "HORIZONTAL";
  content.primaryAxisSizingMode = "AUTO";
  content.counterAxisSizingMode = "AUTO";
  content.primaryAxisAlignItems = "CENTER";
  content.counterAxisAlignItems = "CENTER";
  content.itemSpacing = 10;
  content.fills = [];
  content.strokes = [];
  comp.appendChild(content);

  content.appendChild(buildActionButton(inputs));

  return comp;
}

// A primary default-size button (`h-8 px-2.5 rounded-lg bg-primary`).
function buildActionButton(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const btn = figma.createFrame();
  btn.name = "Button";
  btn.layoutMode = "HORIZONTAL";
  btn.primaryAxisSizingMode = "AUTO";
  btn.counterAxisSizingMode = "FIXED";
  btn.primaryAxisAlignItems = "CENTER";
  btn.counterAxisAlignItems = "CENTER";
  btn.itemSpacing = 6;
  btn.paddingLeft = 10;
  btn.paddingRight = 10;
  btn.resize(btn.width, 32);
  btn.primaryAxisSizingMode = "AUTO";
  btn.cornerRadius = 8;
  bindCornerRadii(btn, p.get("radius/lg"));
  bindFill(btn, t.get("primary"));
  btn.strokes = [];

  const icon = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: "plus",
    size: 16,
    color: t.get("primary-foreground"),
  });
  if (icon) {
    icon.name = "Icon";
    btn.appendChild(icon);
  }

  const text = figma.createText();
  applyFont(text, "body", "Medium");
  text.characters = "New Project";
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, t.get("primary-foreground"));
  btn.appendChild(text);

  return btn;
}
