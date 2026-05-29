// Avatar: circular initials/image placeholder. Three sizes × two kinds.
//
// The "image" variants use real photos bundled at build time, surfaced as
// Figma paint styles (see ../avatarStyles). A designer can swap any avatar to a
// different bundled face from the fill-style picker. The "fallback" variants
// keep the initials-on-muted treatment from shadcn's AvatarFallback.

import { ensureAvatarStyles, type AvatarStyleMap } from "../avatarStyles";
import { bindCornerRadii, bindFill, bindFontSize } from "../bindings";
import { styleComponentSet } from "../layout";
import { SECTION_WIDTH, type ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const AVATAR_SIZES = ["sm", "default", "lg"] as const;
type AvatarSize = (typeof AVATAR_SIZES)[number];

const AVATAR_KINDS = ["image", "fallback"] as const;
type AvatarKind = (typeof AVATAR_KINDS)[number];

// Mirrors shadcn's Avatar (radix-ui primitive): size-8 default, size-6 sm,
// size-10 lg. Fallback text uses text-sm by default (text-xs for sm).
const AVATAR_DIMS: Record<
  AvatarSize,
  { size: number; fontSize: number; fontToken: string }
> = {
  sm: { size: 24, fontSize: 12, fontToken: "font/size/xs" },
  default: { size: 32, fontSize: 14, fontToken: "font/size/sm" },
  lg: { size: 40, fontSize: 14, fontToken: "font/size/sm" },
};

export async function addAvatarSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const styles = await ensureAvatarStyles();

  const components: ComponentNode[] = [];
  // Give each image variant a different bundled face so the set previews a
  // range of avatars; designers can still swap any of them from the picker.
  let imageSlot = 0;
  for (const size of AVATAR_SIZES) {
    for (const kind of AVATAR_KINDS) {
      const slot = kind === "image" ? imageSlot++ : -1;
      const comp = await buildAvatarComponent(inputs, size, kind, styles, slot);
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
  componentSet.primaryAxisSizingMode = "FIXED";
  componentSet.resize(SECTION_WIDTH, componentSet.height);

  return countDescendants(componentSet);
}

function buildAvatarComponent(
  inputs: ComponentsInputs,
  size: AvatarSize,
  kind: AvatarKind,
  styles: AvatarStyleMap,
  imageSlot: number,
): Promise<ComponentNode> {
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
    // Prefer a real bundled photo via its paint style; fall back to a tinted
    // fill + initials if no style is available (e.g. data module missing).
    const styleId = imageSlot >= 0 ? styles.idAt(imageSlot) : undefined;
    if (styleId) {
      return applyImageStyle(comp, styleId).then(() => comp);
    }
    bindFill(comp, t.get("chart-1"));
    appendInitials(comp, inputs, dims, "PJ", t.get("primary-foreground"));
    return Promise.resolve(comp);
  }

  bindFill(comp, t.get("muted"));
  appendInitials(comp, inputs, dims, "JD", t.get("muted-foreground"));
  return Promise.resolve(comp);
}

// Apply a bundled avatar photo to the component's fill via its paint style so
// the image stays editable/swappable from the Figma styles picker.
async function applyImageStyle(
  comp: ComponentNode,
  styleId: string,
): Promise<void> {
  try {
    await comp.setFillStyleIdAsync(styleId);
  } catch {
    // ignore — leaves the component's default fill in place
  }
}

function appendInitials(
  comp: ComponentNode,
  inputs: ComponentsInputs,
  dims: { fontSize: number; fontToken: string },
  characters: string,
  fillVar: Variable | undefined,
) {
  const p = inputs.primitives;
  const initials = figma.createText();
  initials.fontName = { family: "Inter", style: "Regular" };
  initials.characters = characters;
  initials.fontSize = dims.fontSize;
  bindFontSize(initials, p.get(dims.fontToken));
  bindFill(initials, fillVar);
  comp.appendChild(initials);
}
