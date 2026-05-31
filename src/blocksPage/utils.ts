// Helpers shared by the Blocks page.
//
// Blocks lean on the Components page's reuse helpers (findInstanceSource /
// instantiateBuiltComponent / countDescendants) so a block embeds the exact
// same component instances a designer would drag onto the canvas themselves.

import { loadPresetFonts } from "../fonts";
import {
  findInstanceSource,
  instantiateBuiltComponent,
} from "../componentsPage/utils";
import type { BlocksInputs } from "./types";

export { countDescendants } from "../componentsPage/utils";

// Load the preset fonts for the Blocks page and activate them. Falls back to
// Inter when the inputs don't carry preset fonts (older callers/tests).
export async function loadBlocksFonts(inputs: BlocksInputs): Promise<void> {
  const body = inputs.fonts ? inputs.fonts.body : "Inter";
  const heading = inputs.fonts ? inputs.fonts.heading : "Inter";
  await loadPresetFonts({ body, heading, fontVars: inputs.fontVars });
}

// Instantiate a component the Components page already published, so a block
// embeds a live instance that stays in sync with the source. `name` is the
// component-set name (e.g. "Button") and `variant` the specific variant
// (e.g. "Variant=default, Size=default, State=default"); when `variant` is
// omitted the first variant is used. Searches the target page (the Components
// page) itself, since the blocks region renders alongside the component grid.
// Returns undefined when the page has no matching component, so callers fall
// back to a drawn stand-in.
export function instanceFromComponents(
  inputs: BlocksInputs,
  name: string,
  variant?: string,
  overrideText?: string,
): InstanceNode | undefined {
  const page = inputs.targetPage;
  if (!page) return undefined;
  const source = findInstanceSource(
    page as unknown as SceneNode,
    name,
    variant,
  );
  if (!source) return undefined;
  return instantiateBuiltComponent(source, overrideText);
}

// Set the characters of the first text node found anywhere in the subtree.
// Mirrors the Components page's instance relabel behaviour for cases where the
// target text layer isn't reliably named. Best-effort.
export function overrideFirstText(root: SceneNode, text: string): boolean {
  if (root.type === "TEXT") {
    try {
      (root as unknown as { characters: string }).characters = text;
      return true;
    } catch {
      return false;
    }
  }
  const children = (root as unknown as { children?: SceneNode[] }).children;
  if (children) {
    for (const child of children) {
      if (overrideFirstText(child, text)) return true;
    }
  }
  return false;
}

// Best-effort `layoutSizingHorizontal = "FILL"` for a node freshly appended to
// an auto-layout frame. Some hosts/instances reject FILL; the node then keeps
// its intrinsic width.
export function fillWidth(node: SceneNode): void {
  try {
    (
      node as unknown as { layoutSizingHorizontal: string }
    ).layoutSizingHorizontal = "FILL";
  } catch {
    // Leave the node at its built width.
  }
}
