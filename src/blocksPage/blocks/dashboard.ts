// Dashboard block: shadcn's `dashboard-01` — an app shell with the Sidebar on
// the left and a main column holding a top bar, a row of stat cards, and a
// chart beside a data table.
//
// Every major surface reuses a live instance of a page-built component:
//   - Sidebar      → the published Sidebar
//   - stat cards   → the published Card (simple variant)
//   - chart        → the published Chart (Area variant)
//   - table        → the published Table
//   - top-bar CTA  → the published Button (default variant)
// Each reuse falls back to a light drawn stand-in when the Components page
// isn't available (isolated callers / tests).

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../../componentsPage/bindings";
import { applyFont } from "../../fonts";
import {
  createBlockCanvas,
  createBody,
  createColumn,
  createHeading,
  createRow,
  createSurface,
} from "../layout";
import type { BlocksInputs } from "../types";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../types";
import { countDescendants, fillWidth, instanceFromComponents } from "../utils";

const SIDEBAR_WIDTH = 256;
const CONTENT_PADDING = 24;
const CONTENT_GAP = 24;

// Three KPI cards across the top of the main column.
type Stat = { label: string; value: string; delta: string };
const STATS: Stat[] = [
  {
    label: "Total Revenue",
    value: "$15,231.89",
    delta: "+20.1% from last month",
  },
  { label: "Subscriptions", value: "+2,350", delta: "+180.1% from last month" },
  { label: "Active Now", value: "+573", delta: "+201 since last hour" },
];

export async function addDashboardBlock(
  page: PageNode,
  inputs: BlocksInputs,
): Promise<number> {
  const canvas = createBlockCanvas(
    inputs,
    "Dashboard",
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
    try {
      (
        sidebar as unknown as { layoutSizingVertical: string }
      ).layoutSizingVertical = "FILL";
    } catch {
      // Keep the instance's intrinsic height.
    }
  } else {
    canvas.appendChild(buildFallbackSidebar(inputs));
  }

  // --- Main column --------------------------------------------------------
  const main = createColumn("Main", CONTENT_GAP);
  main.paddingTop = CONTENT_PADDING;
  main.paddingBottom = CONTENT_PADDING;
  main.paddingLeft = CONTENT_PADDING;
  main.paddingRight = CONTENT_PADDING;
  main.layoutGrow = 1;
  main.primaryAxisSizingMode = "FIXED";
  main.counterAxisSizingMode = "FIXED";
  canvas.appendChild(main);
  try {
    (main as unknown as { layoutSizingVertical: string }).layoutSizingVertical =
      "FILL";
    (
      main as unknown as { layoutSizingHorizontal: string }
    ).layoutSizingHorizontal = "FILL";
  } catch {
    // Fall back to intrinsic sizing.
  }

  // Top bar: page title on the left, a primary CTA on the right.
  const topBar = createRow("Top Bar", 16);
  topBar.primaryAxisSizingMode = "FIXED";
  topBar.counterAxisAlignItems = "CENTER";
  topBar.primaryAxisAlignItems = "SPACE_BETWEEN";
  main.appendChild(topBar);
  fillWidth(topBar);

  topBar.appendChild(createHeading(inputs, "Dashboard", 24, "foreground"));

  const cta = instanceFromComponents(
    inputs,
    "Button",
    "Variant=default, Size=default, State=default",
    "Download",
  );
  if (cta) {
    topBar.appendChild(cta);
  } else {
    topBar.appendChild(buildFallbackButton(inputs, "Download"));
  }

  // Stat cards row.
  const statsRow = createRow("Stats", CONTENT_GAP);
  statsRow.primaryAxisSizingMode = "FIXED";
  main.appendChild(statsRow);
  fillWidth(statsRow);
  for (const stat of STATS) {
    const card = buildStatCard(inputs, stat);
    statsRow.appendChild(card);
    try {
      (card as unknown as { layoutGrow: number }).layoutGrow = 1;
    } catch {
      // Keep intrinsic width.
    }
  }

  // Chart + table row.
  const lowerRow = createRow("Panels", CONTENT_GAP);
  lowerRow.primaryAxisSizingMode = "FIXED";
  lowerRow.counterAxisAlignItems = "MIN";
  main.appendChild(lowerRow);
  fillWidth(lowerRow);

  const chart = instanceFromComponents(inputs, "Chart", "Type=Area");
  if (chart) {
    lowerRow.appendChild(chart);
    try {
      (chart as unknown as { layoutGrow: number }).layoutGrow = 1;
    } catch {
      // Keep intrinsic width.
    }
  } else {
    const fallbackChart = buildFallbackPanel(inputs, "Overview");
    lowerRow.appendChild(fallbackChart);
    try {
      (fallbackChart as unknown as { layoutGrow: number }).layoutGrow = 1;
    } catch {
      // Keep intrinsic width.
    }
  }

  const table = instanceFromComponents(inputs, "Table");
  if (table) {
    lowerRow.appendChild(table);
    try {
      (table as unknown as { layoutGrow: number }).layoutGrow = 1;
    } catch {
      // Keep intrinsic width.
    }
  } else {
    const fallbackTable = buildFallbackPanel(inputs, "Recent Sales");
    lowerRow.appendChild(fallbackTable);
    try {
      (fallbackTable as unknown as { layoutGrow: number }).layoutGrow = 1;
    } catch {
      // Keep intrinsic width.
    }
  }

  page.appendChild(canvas);
  return countDescendants(canvas);
}

// A single KPI card: a label, a big value, and a muted delta line. Built fresh
// (rather than reusing the Card instance) because the KPI layout differs from
// the demo Card's header/body/footer — but every surface still binds to the
// theme variables so it tracks the preset.
function buildStatCard(inputs: BlocksInputs, stat: Stat): FrameNode {
  const surface = createSurface(inputs, 240, { padding: 20, gap: 8 });
  surface.name = "Stat Card";

  const label = createBody(
    inputs,
    stat.label,
    14,
    "muted-foreground",
    "Medium",
  );
  surface.appendChild(label);
  fillWidth(label);

  const value = createHeading(inputs, stat.value, 30, "card-foreground");
  surface.appendChild(value);
  fillWidth(value);

  const delta = createBody(inputs, stat.delta, 12, "muted-foreground");
  surface.appendChild(delta);
  fillWidth(delta);

  return surface;
}

// ----- Fallbacks (used only when the Components page isn't available) -----

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

  const brand = createBody(inputs, "Acme Inc", 14, "foreground", "Medium");
  rail.appendChild(brand);
  for (const item of ["Dashboard", "Orders", "Products", "Settings"]) {
    rail.appendChild(createBody(inputs, item, 14, "muted-foreground"));
  }
  return rail;
}

function buildFallbackButton(inputs: BlocksInputs, label: string): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const button = figma.createFrame();
  button.name = "Button";
  button.layoutMode = "HORIZONTAL";
  button.primaryAxisSizingMode = "AUTO";
  button.counterAxisSizingMode = "FIXED";
  button.primaryAxisAlignItems = "CENTER";
  button.counterAxisAlignItems = "CENTER";
  button.resize(100, 32);
  button.paddingLeft = 10;
  button.paddingRight = 10;
  button.cornerRadius = 8;
  bindCornerRadii(button, p.get("radius/lg"));
  bindFill(button, t.get("primary"));

  const text = figma.createText();
  applyFont(text, "body", "Medium");
  text.characters = label;
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, t.get("primary-foreground"));
  button.appendChild(text);
  return button;
}

function buildFallbackPanel(inputs: BlocksInputs, title: string): FrameNode {
  const surface = createSurface(inputs, 360, { padding: 20, gap: 12 });
  surface.name = title;
  const heading = createHeading(inputs, title, 16, "card-foreground");
  surface.appendChild(heading);
  fillWidth(heading);
  const body = createBody(
    inputs,
    "Content panel — replace with a chart or table.",
    14,
    "muted-foreground",
  );
  surface.appendChild(body);
  fillWidth(body);
  surface.resize(360, 200);
  surface.primaryAxisSizingMode = "FIXED";
  return surface;
}
