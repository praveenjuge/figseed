// Avatar: circular initials/image placeholder. Three sizes × two kinds.

import { bindCornerRadii, bindFill } from "../bindings";
import {
  createSectionFrame,
  createWrappingRow,
  styleComponentSet,
} from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const AVATAR_SIZES = ["sm", "default", "lg"] as const;
type AvatarSize = (typeof AVATAR_SIZES)[number];

const AVATAR_KINDS = ["image", "fallback"] as const;
type AvatarKind = (typeof AVATAR_KINDS)[number];

const AVATAR_DIMS: Record<AvatarSize, { size: number; fontSize: number }> = {
  sm: { size: 24, fontSize: 10 },
  default: { size: 32, fontSize: 12 },
  lg: { size: 40, fontSize: 14 },
};

export async function addAvatarSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Avatar", {
    title: "Avatar",
    subtitle: "Three sizes × two kinds (image placeholder, initials fallback).",
  });

  const components: ComponentNode[] = [];
  for (const size of AVATAR_SIZES) {
    for (const kind of AVATAR_KINDS) {
      const comp = buildAvatarComponent(inputs, size, kind);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Avatar";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.layoutWrap = "WRAP";
  componentSet.itemSpacing = 16;
  componentSet.counterAxisSpacing = 16;
  styleComponentSet(componentSet);

  const showcase = createWrappingRow(section, 16);
  for (const comp of components) {
    showcase.appendChild(comp.createInstance());
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildAvatarComponent(
  inputs: ComponentsInputs,
  size: AvatarSize,
  kind: AvatarKind,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;
  const dims = AVATAR_DIMS[size];

  const comp = figma.createComponent();
  comp.name = `Size=${size}, Kind=${kind}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  comp.resize(dims.size, dims.size);
  comp.cornerRadius = 9999;
  bindCornerRadii(comp, p.get("radius/full"));
  comp.clipsContent = true;

  if (kind === "image") {
    bindFill(comp, t.get("chart-1"));
  } else {
    bindFill(comp, t.get("muted"));
  }

  const initials = figma.createText();
  initials.fontName = { family: "Inter", style: "Semi Bold" };
  initials.characters = kind === "image" ? "PJ" : "JD";
  initials.fontSize = dims.fontSize;

  if (kind === "image") {
    bindFill(initials, t.get("primary-foreground"));
  } else {
    bindFill(initials, t.get("muted-foreground"));
  }

  comp.appendChild(initials);
  return comp;
}
