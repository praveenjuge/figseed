// Skeleton: loading placeholder shapes filled with the accent colour.
// Mirrors shadcn's Skeleton: `bg-accent rounded-md`.
//
// We ship a few shapes that designers commonly need: an avatar circle,
// short and full-width text rows, and a card-sized block.

import { bindCornerRadii, bindFill } from "../bindings";
import {
  createSectionFrame,
  createVertical,
  styleComponentSet,
} from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const SKELETON_SHAPES = ["circle", "line-sm", "line-lg", "block"] as const;
type SkeletonShape = (typeof SKELETON_SHAPES)[number];

const SKELETON_DIMS: Record<SkeletonShape, { w: number; h: number }> = {
  circle: { w: 40, h: 40 },
  "line-sm": { w: 160, h: 16 },
  "line-lg": { w: 320, h: 16 },
  block: { w: 320, h: 96 },
};

export async function addSkeletonSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Skeleton", {
    title: "Skeleton",
    subtitle:
      "Loading placeholders bound to the accent colour. Drop them in for empty states.",
  });

  const components: ComponentNode[] = [];
  for (const shape of SKELETON_SHAPES) {
    const comp = buildSkeletonComponent(inputs, shape);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Skeleton";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 12;
  styleComponentSet(componentSet);

  const showcase = createVertical(section, 12);
  for (const comp of components) {
    showcase.appendChild(comp.createInstance());
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildSkeletonComponent(
  inputs: ComponentsInputs,
  shape: SkeletonShape,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;
  const dims = SKELETON_DIMS[shape];

  const comp = figma.createComponent();
  comp.name = `Shape=${shape}`;
  comp.layoutMode = "NONE";
  comp.resize(dims.w, dims.h);

  if (shape === "circle") {
    comp.cornerRadius = 9999;
    bindCornerRadii(comp, p.get("radius/full"));
  } else {
    comp.cornerRadius = 6;
    bindCornerRadii(comp, p.get("radius/md"));
  }

  bindFill(comp, t.get("accent"));
  return comp;
}
