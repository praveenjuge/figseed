// Sidebar block: shadcn's `sidebar-01` — the canonical app shell. A navigation
// rail on the left (the published Sidebar instance) sits beside a SidebarInset
// whose top bar carries a sidebar trigger glyph, a vertical separator, and a
// breadcrumb (the published Breadcrumb instance), over a content area: a
// three-column row of muted placeholder cards and a tall muted panel below
// (`bg-muted/50 rounded-xl`), exactly as sidebar-01's page renders.
//
// The rail reuses the published Sidebar instance and the breadcrumb reuses the
// published Breadcrumb instance, so editing either component once updates this
// shell too. Each reuse falls back to a drawn stand-in when the page has no
// matching component (isolated callers / tests).

import {
  bindCornerRadii,
  bindFill,
  bindStrokeColor,
} from "../../componentsPage/bindings";
import { createIcon, resolveIconLibrary } from "../../icons";
import {
  createBlockCanvas,
  createBody,
  createColumn,
  createRow,
} from "../layout";
import type { BlocksInputs } from "../types";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../types";
import {
  countDescendants,
  fillHeight,
  fillWidth,
  growWidth,
  instanceFromComponents,
} from "../utils";

const SIDEBAR_WIDTH = 256; // shadcn `--sidebar-width: 16rem`
const HEADER_HEIGHT = 64; // `h-16`
const CONTENT_PADDING = 16; // `p-4`
const CONTENT_GAP = 16; // `gap-4`

export async function addSidebarBlock(
  page: PageNode,
  inputs: BlocksInputs,
): Promise<number> {
  const canvas = createBlockCanvas(
    inputs,
    "Sidebar",
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
  );
  canvas.layoutMode = "HORIZONTAL";
  canvas.itemSpacing = 0;

  // --- Sidebar (reused) ---------------------------------------------------
  const sidebar = instanceFromComponents(inputs, "Sidebar");
  if (sidebar) {
    sidebar.resize(SIDEBAR_WIDTH, CANVAS_HEIGHT);
    canvas.appendChild(sidebar);
    fillHeight(sidebar);
  } else {
    canvas.appendChild(buildFallbackSidebar(inputs));
  }

  // --- Inset (main content column) ----------------------------------------
  const inset = createColumn("Inset", 0);
  inset.primaryAxisSizingMode = "FIXED";
  inset.counterAxisSizingMode = "FIXED";
  inset.layoutGrow = 1;
  bindFill(inset, inputs.theme.light.get("background"));
  canvas.appendChild(inset);
  fillHeight(inset);
  fillWidth(inset);

  // Top bar.
  const header = await buildHeader(inputs);
  inset.appendChild(header);
  fillWidth(header);

  // Content body.
  const body = createColumn("Content", CONTENT_GAP);
  body.paddingTop = CONTENT_PADDING;
  body.paddingBottom = CONTENT_PADDING;
  body.paddingLeft = CONTENT_PADDING;
  body.paddingRight = CONTENT_PADDING;
  body.primaryAxisSizingMode = "FIXED";
  body.counterAxisSizingMode = "FIXED";
  body.layoutGrow = 1;
  inset.appendChild(body);
  fillWidth(body);
  fillHeight(body);

  // Three-column row of muted placeholder cards (`md:grid-cols-3`).
  const cards = createRow("Cards", CONTENT_GAP);
  cards.primaryAxisSizingMode = "FIXED";
  cards.counterAxisAlignItems = "MIN";
  body.appendChild(cards);
  fillWidth(cards);
  for (let i = 0; i < 3; i++) {
    const card = buildMutedPanel(inputs, 220);
    cards.appendChild(card);
    growWidth(card);
  }

  // Tall muted panel filling the remaining space (`min-h flex-1`).
  const panel = buildMutedPanel(inputs, 440);
  body.appendChild(panel);
  fillWidth(panel);
  fillHeight(panel);

  page.appendChild(canvas);
  return countDescendants(canvas);
}

// --- Top bar ---------------------------------------------------------------
// `flex h-16 items-center gap-2 border-b px-4` with a sidebar trigger glyph, a
// vertical separator, and the breadcrumb.
async function buildHeader(inputs: BlocksInputs): Promise<FrameNode> {
  const t = inputs.theme.light;

  const header = figma.createFrame();
  header.name = "Header";
  header.layoutMode = "HORIZONTAL";
  header.primaryAxisSizingMode = "FIXED";
  header.counterAxisSizingMode = "FIXED";
  header.counterAxisAlignItems = "CENTER";
  header.resize(CANVAS_WIDTH - SIDEBAR_WIDTH, HEADER_HEIGHT);
  header.itemSpacing = 8;
  header.paddingLeft = 16;
  header.paddingRight = 16;
  header.fills = [];
  bindStrokeColor(header, t.get("border"));
  header.strokeWeight = 1;
  header.strokeAlign = "INSIDE";
  header.strokeBottomWeight = 1;
  header.strokeTopWeight = 0;
  header.strokeLeftWeight = 0;
  header.strokeRightWeight = 0;

  // Sidebar trigger glyph (`-ml-1`).
  const trigger = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: "command",
    size: 16,
    color: t.get("foreground"),
  });
  if (trigger) {
    trigger.name = "Trigger";
    header.appendChild(trigger);
  }

  // Vertical separator (`h-4`).
  const sep = figma.createRectangle();
  sep.name = "Separator";
  sep.resize(1, 16);
  bindFill(sep, t.get("border"));
  header.appendChild(sep);

  // Breadcrumb — reuse the published Breadcrumb instance.
  const breadcrumb = instanceFromComponents(inputs, "Breadcrumb");
  if (breadcrumb) {
    header.appendChild(breadcrumb);
  } else {
    header.appendChild(
      createBody(
        inputs,
        "Build Your Application / Data Fetching",
        14,
        "foreground",
      ),
    );
  }

  return header;
}

// A muted placeholder surface (`bg-muted/50 rounded-xl`).
function buildMutedPanel(inputs: BlocksInputs, height: number): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const panel = figma.createFrame();
  panel.name = "Panel";
  panel.layoutMode = "VERTICAL";
  panel.primaryAxisSizingMode = "FIXED";
  panel.counterAxisSizingMode = "FIXED";
  panel.resize(220, height);
  panel.cornerRadius = 12;
  bindCornerRadii(panel, p.get("radius/xl"));
  bindFill(panel, t.get("muted"));
  panel.strokes = [];
  return panel;
}

// ----- Fallback (used only when the page has no matching components) --------

function buildFallbackSidebar(inputs: BlocksInputs): FrameNode {
  const t = inputs.theme.light;

  const rail = figma.createFrame();
  rail.name = "Sidebar";
  rail.layoutMode = "VERTICAL";
  rail.primaryAxisSizingMode = "FIXED";
  rail.counterAxisSizingMode = "FIXED";
  rail.resize(SIDEBAR_WIDTH, CANVAS_HEIGHT);
  rail.itemSpacing = 8;
  rail.paddingTop = 16;
  rail.paddingBottom = 16;
  rail.paddingLeft = 12;
  rail.paddingRight = 12;
  bindFill(rail, t.get("sidebar") ?? t.get("card"));
  bindStrokeColor(rail, t.get("sidebar-border") ?? t.get("border"));
  rail.strokeWeight = 1;
  rail.strokeAlign = "INSIDE";

  const brand = createBody(inputs, "Acme Inc.", 16, "foreground", "Medium");
  rail.appendChild(brand);
  for (const item of ["Installation", "Routing", "Data Fetching", "Caching"]) {
    rail.appendChild(createBody(inputs, item, 14, "muted-foreground"));
  }
  return rail;
}
