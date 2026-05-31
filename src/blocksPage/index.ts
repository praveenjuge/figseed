// Builds a "Blocks" region: pre-composed shadcn screens (login, signup,
// dashboard) assembled from live instances of the components the Components
// page already published. Each block embeds real component instances (Button,
// Input, Label, Card, Chart, Table, Sidebar) so editing a component once flows
// through every block — the same reuse model the Components page's Form section
// uses, scaled up to whole screens.
//
// Figma's free/Starter tier caps a file at 3 pages (Design System, Components,
// and the user's own page), so the blocks render as a distinct region on the
// *Components* page — placed to the right of the component grid — rather than on
// a page of their own. Idempotency is inherited from the Components page, which
// clears all its children at the start of every rebuild before the components
// and then this region are re-appended.

import { addHeader } from "./blocks/header";
import { addLoginBlock } from "./blocks/login";
import { addSignupBlock } from "./blocks/signup";
import { addDashboardBlock } from "./blocks/dashboard";
import {
  BLOCK_GAP,
  REGION_GAP,
  type BlockBuilder,
  type BlocksInputs,
  type BlocksResult,
} from "./types";
import { loadBlocksFonts } from "./utils";
import { ensureEffectStyles } from "../effectStyles";
import { ensureTextStyles, applyTextStyles } from "../textStyles";
import { applyTokenBindings } from "../tokenBindings";

export type { BlocksInputs, BlocksResult } from "./types";

// The header renders first; the blocks follow in a fixed, curated order
// (auth screens first, then the dashboard) since they read as a showcase rather
// than an alphabetical index.
const HEADER_BLOCK: BlockBuilder = { label: "Header", build: addHeader };

const BLOCKS: BlockBuilder[] = [
  { label: "Login", build: addLoginBlock },
  { label: "Signup", build: addSignupBlock },
  { label: "Dashboard", build: addDashboardBlock },
];

const ORDERED_BLOCKS: BlockBuilder[] = [HEADER_BLOCK, ...BLOCKS];

export async function buildBlocksRegion(
  inputs: BlocksInputs,
): Promise<BlocksResult> {
  const page = inputs.targetPage;

  await loadBlocksFonts(inputs);

  // Publish/refresh the shadow + blur effect styles (idempotent) so blocks can
  // reference real styles instead of literal effects.
  const effectStyles =
    inputs.effectStyles ?? (await ensureEffectStyles(inputs.primitives));
  const inputsWithStyles: BlocksInputs = { ...inputs, effectStyles };

  // Publish/refresh the Tailwind typography text styles so matching text nodes
  // can be mapped onto a published style after the build.
  const textStyles =
    inputs.textStyles ??
    (await ensureTextStyles(inputs.primitives, inputs.fontVars));

  // Remember which children already existed (the component grid) so we only
  // sweep + lay out the nodes this region adds, leaving the components alone.
  const preexisting = new Set<SceneNode>(page.children as SceneNode[]);

  const total = ORDERED_BLOCKS.length;
  let count = 0;

  for (let i = 0; i < ORDERED_BLOCKS.length; i++) {
    const block = ORDERED_BLOCKS[i]!;
    inputs.onProgress?.(i, total, block.label);
    count += await block.build(page, inputsWithStyles);
    await Promise.resolve();
  }
  inputs.onProgress?.(total, total, "Done");

  const newNodes = (page.children as SceneNode[]).filter(
    (child) => !preexisting.has(child),
  );

  // Map eligible text nodes onto their Tailwind text style before the token
  // sweep, so the style owns each node's font size + line height. (Instances
  // embedded from the component grid keep their own styling — the sweep only
  // touches the nodes this region drew.)
  for (const child of newNodes) {
    await applyTextStyles(child, textStyles);
  }

  // Bind the remaining non-color primitives (spacing, padding, gaps, border
  // widths, radii, font sizes) wherever a literal matches a token, so later
  // variable edits reflow the blocks instead of leaving frozen literals.
  for (const child of newNodes) {
    applyTokenBindings(child, inputs.primitives);
  }

  layoutBlocksRegion(page, preexisting, newNodes);
  return { nodeCount: count };
}

// Stack the region's header and blocks top-to-bottom in a single column placed
// to the right of the existing component grid, so the two areas read as clearly
// separate zones on the same page.
function layoutBlocksRegion(
  page: PageNode,
  preexisting: Set<SceneNode>,
  newNodes: SceneNode[],
) {
  const originX = regionOriginX(page, preexisting);
  let y = 0;
  for (const child of newNodes) {
    if (!("x" in child)) continue;
    const node = child as SceneNode & { x: number; y: number; height: number };
    node.x = originX;
    node.y = y;
    y += (node.height ?? 0) + BLOCK_GAP;
  }
}

// The x where the blocks region starts: just past the right edge of the
// existing component grid, plus a wide gutter. Falls back to 0 when the page is
// empty (isolated callers / tests rendering onto a bare page).
function regionOriginX(page: PageNode, preexisting: Set<SceneNode>): number {
  let maxRight = 0;
  let seen = false;
  for (const child of page.children as SceneNode[]) {
    if (!preexisting.has(child)) continue;
    if (!("x" in child)) continue;
    const node = child as SceneNode & { x: number; width: number };
    const right = (node.x ?? 0) + (node.width ?? 0);
    if (right > maxRight) maxRight = right;
    seen = true;
  }
  return seen ? maxRight + REGION_GAP : 0;
}
