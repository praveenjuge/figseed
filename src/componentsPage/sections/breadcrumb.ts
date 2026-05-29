// Breadcrumb: navigation crumbs separated by chevrons, with the current
// page rendered in the foreground colour.
//
// Mirrors shadcn's Breadcrumb: muted-foreground links, foreground current
// page, chevron separator (drawn here as a small vector glyph).

import { bindFill, bindFontSize, bindStrokeColor } from "../bindings";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

type CrumbKind = "link" | "page";
type Crumb = { label: string; kind: CrumbKind };

const CRUMBS: Crumb[] = [
  { label: "Home", kind: "link" },
  { label: "Components", kind: "link" },
  { label: "Breadcrumb", kind: "page" },
];

export async function addBreadcrumbSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildBreadcrumbComponent(inputs);
  page.appendChild(comp);
  return countDescendants(comp);
}

function buildBreadcrumbComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Breadcrumb";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  comp.itemSpacing = 8;
  comp.fills = [];
  comp.strokes = [];

  for (let i = 0; i < CRUMBS.length; i++) {
    const crumb = CRUMBS[i]!;
    const label = figma.createText();
    label.fontName =
      crumb.kind === "page"
        ? { family: "Inter", style: "Medium" }
        : { family: "Inter", style: "Regular" };
    label.characters = crumb.label;
    label.fontSize = 14;
    bindFontSize(label, p.get("font/size/sm"));
    if (crumb.kind === "page") {
      bindFill(label, t.get("foreground"));
    } else {
      bindFill(label, t.get("muted-foreground"));
    }
    comp.appendChild(label);

    if (i < CRUMBS.length - 1) {
      comp.appendChild(buildChevron(t));
    }
  }

  return comp;
}

function buildChevron(t: Map<string, Variable>): VectorNode {
  // Right-pointing chevron at 14px to match the surrounding text size.
  const chevron = figma.createVector();
  chevron.name = "Separator";
  chevron.resize(14, 14);
  chevron.vectorPaths = [
    {
      windingRule: "NONZERO",
      data: "M 5 3 L 9 7 L 5 11",
    },
  ];
  chevron.strokeWeight = 1.5;
  chevron.strokeCap = "ROUND";
  chevron.strokeJoin = "ROUND";
  chevron.fills = [];
  bindStrokeColor(chevron, t.get("muted-foreground"));
  return chevron;
}
