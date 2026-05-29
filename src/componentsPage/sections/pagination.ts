// Pagination: a row of page controls with previous/next, numbered pages,
// an active page, and an ellipsis.
//
// Mirrors shadcn's Pagination: links rendered with button variants — the
// active page uses the `outline` variant (border + background), the rest use
// `ghost` (transparent). Previous/Next are labelled ghost buttons with a
// chevron; the ellipsis is a non-interactive glyph.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

type Item =
  | { kind: "prev" }
  | { kind: "next" }
  | { kind: "ellipsis" }
  | { kind: "page"; label: string; active: boolean };

const ITEMS: Item[] = [
  { kind: "prev" },
  { kind: "page", label: "1", active: false },
  { kind: "page", label: "2", active: true },
  { kind: "page", label: "3", active: false },
  { kind: "ellipsis" },
  { kind: "next" },
];

const CONTROL_HEIGHT = 36;

export async function addPaginationSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildPaginationComponent(inputs);
  page.appendChild(comp);
  return countDescendants(comp);
}

function buildPaginationComponent(inputs: ComponentsInputs): ComponentNode {
  const comp = figma.createComponent();
  comp.name = "Pagination";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.counterAxisAlignItems = "CENTER";
  comp.itemSpacing = 4;
  comp.fills = [];
  comp.strokes = [];

  for (const item of ITEMS) {
    comp.appendChild(buildItem(inputs, item));
  }

  return comp;
}

function buildItem(inputs: ComponentsInputs, item: Item): FrameNode {
  switch (item.kind) {
    case "prev":
      return buildNavButton(inputs, "Previous", "prev");
    case "next":
      return buildNavButton(inputs, "Next", "next");
    case "ellipsis":
      return buildEllipsis(inputs);
    case "page":
      return buildPageLink(inputs, item.label, item.active);
  }
}

// A square, icon-sized page link. Active = outline variant, else ghost.
function buildPageLink(
  inputs: ComponentsInputs,
  label: string,
  active: boolean,
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const link = figma.createFrame();
  link.name = active ? "Page (active)" : "Page";
  link.layoutMode = "HORIZONTAL";
  link.primaryAxisSizingMode = "FIXED";
  link.counterAxisSizingMode = "FIXED";
  link.primaryAxisAlignItems = "CENTER";
  link.counterAxisAlignItems = "CENTER";
  link.resize(CONTROL_HEIGHT, CONTROL_HEIGHT);
  link.cornerRadius = 6;
  bindCornerRadii(link, p.get("radius/md"));
  link.strokes = [];

  if (active) {
    bindFill(link, t.get("background"));
    bindStrokeColor(link, t.get("border"));
    link.strokeWeight = 1;
  } else {
    link.fills = [];
  }

  const text = figma.createText();
  text.fontName = { family: "Inter", style: "Medium" };
  text.characters = label;
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, t.get("foreground"));
  link.appendChild(text);

  return link;
}

// A ghost button with a chevron and label (Previous / Next).
function buildNavButton(
  inputs: ComponentsInputs,
  label: string,
  direction: "prev" | "next",
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const button = figma.createFrame();
  button.name = label;
  button.layoutMode = "HORIZONTAL";
  button.primaryAxisSizingMode = "AUTO";
  button.counterAxisSizingMode = "FIXED";
  button.primaryAxisAlignItems = "CENTER";
  button.counterAxisAlignItems = "CENTER";
  button.resize(button.width, CONTROL_HEIGHT);
  button.itemSpacing = 4;
  button.paddingLeft = 10;
  button.paddingRight = 10;
  button.cornerRadius = 6;
  bindCornerRadii(button, p.get("radius/md"));
  button.fills = [];
  button.strokes = [];

  const chevron = buildChevron(t, direction);

  const text = figma.createText();
  text.fontName = { family: "Inter", style: "Medium" };
  text.characters = label;
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, t.get("foreground"));

  if (direction === "prev") {
    button.appendChild(chevron);
    button.appendChild(text);
  } else {
    button.appendChild(text);
    button.appendChild(chevron);
  }

  return button;
}

function buildEllipsis(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const wrapper = figma.createFrame();
  wrapper.name = "Ellipsis";
  wrapper.layoutMode = "HORIZONTAL";
  wrapper.primaryAxisSizingMode = "FIXED";
  wrapper.counterAxisSizingMode = "FIXED";
  wrapper.primaryAxisAlignItems = "CENTER";
  wrapper.counterAxisAlignItems = "CENTER";
  wrapper.resize(CONTROL_HEIGHT, CONTROL_HEIGHT);
  wrapper.fills = [];
  wrapper.strokes = [];

  const text = figma.createText();
  text.fontName = { family: "Inter", style: "Medium" };
  text.characters = "…";
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, t.get("muted-foreground"));
  wrapper.appendChild(text);

  return wrapper;
}

function buildChevron(
  t: Map<string, Variable>,
  direction: "prev" | "next",
): VectorNode {
  const chevron = figma.createVector();
  chevron.name = "Chevron";
  chevron.resize(16, 16);
  chevron.vectorPaths = [
    {
      windingRule: "NONZERO",
      data:
        direction === "prev" ? "M 10 4 L 6 8 L 10 12" : "M 6 4 L 10 8 L 6 12",
    },
  ];
  chevron.strokeWeight = 1.5;
  chevron.strokeCap = "ROUND";
  chevron.strokeJoin = "ROUND";
  chevron.fills = [];
  bindStrokeColor(chevron, t.get("foreground"));
  return chevron;
}
