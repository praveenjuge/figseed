// Chart: shadcn's Chart wraps Recharts inside a ChartContainer that maps each
// series colour onto the `--chart-1…5` theme variables. Figma can't render a
// live chart, so we draw representative placeholders for the chart families
// shadcn ships — Bar, Line, Area, Pie, Radar, Radial — and bind their shapes
// to the `chart-1…5` theme variables. Editing those variables recolours every
// chart, mirroring how the real ChartContainer themes its series.
//
// The six families are grouped into one Figma ComponentSet (`Type=Bar`,
// `Type=Line`, …) so designers get a variant picker, matching how the rest of
// the Components page exposes variants (Button, Badge, Toggle, …).
//
// Bars are real Figma rectangles (one per datapoint). The curved/angular
// families (line, area, pie, radar, radial) are drawn as SVG via
// figma.createNodeFromSvg and recoloured through the shared `recolorIcon`
// helper, so each series' geometry binds to its chart colour exactly like the
// icon showcase recolours icons — sandbox-safe, no DOM, no network.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { recolorIcon } from "../../icons";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const CHART_WIDTH = 360;
const PLOT_HEIGHT = 160;
// Plot width = card width minus the 16px padding on each side.
const PLOT_WIDTH = CHART_WIDTH - 32;

// Bar geometry.
const BAR_WIDTH = 14;
const PAIR_GAP = 4;
const GROUP_GAP = 24;

const CHART_TYPES = ["Bar", "Line", "Area", "Pie", "Radar", "Radial"] as const;
type ChartType = (typeof CHART_TYPES)[number];

const TITLES: Record<ChartType, string> = {
  Bar: "Bar Chart",
  Line: "Line Chart",
  Area: "Area Chart",
  Pie: "Pie Chart",
  Radar: "Radar Chart",
  Radial: "Radial Chart",
};

type LegendItem = { label: string; key: string };

const SERIES_LEGEND: LegendItem[] = [
  { label: "Desktop", key: "chart-1" },
  { label: "Mobile", key: "chart-2" },
];

const PIE_LEGEND: LegendItem[] = [
  { label: "Chrome", key: "chart-1" },
  { label: "Safari", key: "chart-2" },
  { label: "Firefox", key: "chart-3" },
  { label: "Edge", key: "chart-4" },
  { label: "Other", key: "chart-5" },
];

const RADIAL_LEGEND: LegendItem[] = [
  { label: "Chrome", key: "chart-1" },
  { label: "Safari", key: "chart-2" },
  { label: "Firefox", key: "chart-3" },
];

const LEGENDS: Record<ChartType, LegendItem[]> = {
  Bar: SERIES_LEGEND,
  Line: SERIES_LEGEND,
  Area: SERIES_LEGEND,
  Pie: PIE_LEGEND,
  Radar: [{ label: "Desktop", key: "chart-1" }],
  Radial: RADIAL_LEGEND,
};

// Six month groups, each a [series1, series2] pair as a 0–1 fraction of the
// plot height — shared by the Bar, Line, and Area cartesian charts.
const SERIES_1 = [0.45, 0.6, 0.5, 0.75, 0.65, 0.85];
const SERIES_2 = [0.3, 0.4, 0.35, 0.5, 0.45, 0.6];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

// Pie slice fractions (sum to 1), one per PIE_LEGEND entry.
const PIE_SLICES = [0.34, 0.24, 0.2, 0.13, 0.09];

// Radar series values per axis (0–1 fraction of the outer radius).
const RADAR_VALUES = [0.85, 0.6, 0.75, 0.55, 0.9, 0.65];

// Radial bars: [radius, value fraction] per RADIAL_LEGEND entry.
const RADIAL_BARS = [0.95, 0.72, 0.5];

export async function addChartSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  // One ComponentNode per chart family, combined into a single ComponentSet so
  // Figma exposes a `Type` variant picker.
  const components: ComponentNode[] = [];
  for (const type of CHART_TYPES) {
    const comp = buildChartComponent(inputs, type);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Chart";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildChartComponent(
  inputs: ComponentsInputs,
  type: ChartType,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Type=${type}`;
  comp.layoutMode = "VERTICAL";
  comp.resize(CHART_WIDTH, 10);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  comp.itemSpacing = 16;
  comp.paddingTop = 16;
  comp.paddingBottom = 16;
  comp.paddingLeft = 16;
  comp.paddingRight = 16;
  comp.cornerRadius = 12;
  bindCornerRadii(comp, p.get("radius/xl"));
  bindFill(comp, t.get("card"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";

  // Title.
  const title = figma.createText();
  applyFont(title, "heading", "Medium");
  title.characters = TITLES[type];
  title.fontSize = 16;
  bindFontSize(title, p.get("font/size/base"));
  bindFill(title, t.get("card-foreground"));
  comp.appendChild(title);
  title.layoutSizingHorizontal = "FILL";

  // Plot area.
  comp.appendChild(buildPlot(inputs, type));

  // Cartesian charts get a month axis row under the plot.
  if (type === "Bar" || type === "Line" || type === "Area") {
    comp.appendChild(buildMonthLabels(inputs));
  }

  // Legend.
  const legend = buildLegend(inputs, LEGENDS[type]);
  comp.appendChild(legend);
  legend.layoutSizingHorizontal = "FILL";

  return comp;
}

function buildPlot(inputs: ComponentsInputs, type: ChartType): FrameNode {
  switch (type) {
    case "Bar":
      return buildBarPlot(inputs);
    case "Line":
      return buildLinePlot(inputs);
    case "Area":
      return buildAreaPlot(inputs);
    case "Pie":
      return buildPiePlot(inputs);
    case "Radar":
      return buildRadarPlot(inputs);
    case "Radial":
      return buildRadialPlot(inputs);
  }
}

// --- Bar -------------------------------------------------------------------

function buildBarPlot(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;

  const plot = figma.createFrame();
  plot.name = "Plot";
  plot.layoutMode = "HORIZONTAL";
  plot.primaryAxisSizingMode = "FIXED";
  plot.counterAxisSizingMode = "FIXED";
  plot.primaryAxisAlignItems = "CENTER";
  plot.counterAxisAlignItems = "MAX"; // bars sit on the baseline
  plot.itemSpacing = GROUP_GAP;
  plot.resize(PLOT_WIDTH, PLOT_HEIGHT);
  plot.fills = [];
  applyBaselineAxis(plot, t);

  for (let i = 0; i < SERIES_1.length; i++) {
    plot.appendChild(buildBarGroup(inputs, SERIES_1[i]!, SERIES_2[i]!));
  }

  return plot;
}

function buildBarGroup(
  inputs: ComponentsInputs,
  v1: number,
  v2: number,
): FrameNode {
  const t = inputs.theme.light;

  const group = figma.createFrame();
  group.name = "Group";
  group.layoutMode = "HORIZONTAL";
  group.primaryAxisSizingMode = "AUTO";
  group.counterAxisSizingMode = "FIXED";
  group.primaryAxisAlignItems = "CENTER";
  group.counterAxisAlignItems = "MAX";
  group.itemSpacing = PAIR_GAP;
  group.resize(BAR_WIDTH * 2 + PAIR_GAP, PLOT_HEIGHT);
  group.fills = [];
  group.strokes = [];

  group.appendChild(buildBar(t, v1, "chart-1"));
  group.appendChild(buildBar(t, v2, "chart-2"));

  return group;
}

function buildBar(
  t: Map<string, Variable>,
  value: number,
  colorKey: string,
): RectangleNode {
  const bar = figma.createRectangle();
  bar.name = "Bar";
  bar.resize(BAR_WIDTH, Math.max(2, Math.round(PLOT_HEIGHT * value)));
  bar.topLeftRadius = 3;
  bar.topRightRadius = 3;
  bindFill(bar, t.get(colorKey));
  return bar;
}

// --- Line / Area (SVG) -----------------------------------------------------

function buildLinePlot(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const plot = createSvgPlot(t, true);

  addGridLines(plot, t);
  addSvg(plot, pathSvg(linePath(SERIES_2), { stroke: 2 }), t.get("chart-2"));
  addSvg(plot, pathSvg(linePath(SERIES_1), { stroke: 2 }), t.get("chart-1"));

  return plot;
}

function buildAreaPlot(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const plot = createSvgPlot(t, true);

  addGridLines(plot, t);
  // Larger series drawn first so the smaller one layers on top.
  addSvg(
    plot,
    pathSvg(areaPath(SERIES_1), { fill: true }),
    t.get("chart-1"),
    0.4,
  );
  addSvg(
    plot,
    pathSvg(areaPath(SERIES_2), { fill: true }),
    t.get("chart-2"),
    0.55,
  );

  return plot;
}

function linePath(values: number[]): string {
  let d = "";
  const last = values.length - 1;
  for (let i = 0; i < values.length; i++) {
    const x = (i / last) * PLOT_WIDTH;
    const y = PLOT_HEIGHT - values[i]! * PLOT_HEIGHT;
    d += (i === 0 ? "M" : "L") + " " + f(x) + " " + f(y) + " ";
  }
  return d.trim();
}

function areaPath(values: number[]): string {
  return (
    linePath(values) +
    " L " +
    f(PLOT_WIDTH) +
    " " +
    f(PLOT_HEIGHT) +
    " L 0 " +
    f(PLOT_HEIGHT) +
    " Z"
  );
}

// --- Pie (SVG) -------------------------------------------------------------

function buildPiePlot(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const plot = createSvgPlot(t, false);

  const cx = PLOT_WIDTH / 2;
  const cy = PLOT_HEIGHT / 2;
  const r = Math.min(PLOT_WIDTH, PLOT_HEIGHT) / 2 - 8;

  let angle = 0;
  for (let i = 0; i < PIE_SLICES.length; i++) {
    const sweep = PIE_SLICES[i]! * 360;
    const d = wedgePath(cx, cy, r, angle, angle + sweep);
    addSvg(plot, pathSvg(d, { fill: true }), t.get(`chart-${i + 1}`));
    angle += sweep;
  }

  return plot;
}

function wedgePath(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
): string {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  /* v8 ignore next -- defensive: the bundled PIE_SLICES top out at ~122°, so no pie wedge ever exceeds the 180° large-arc threshold */
  const large = a1 - a0 > 180 ? 1 : 0;
  return (
    "M " +
    f(cx) +
    " " +
    f(cy) +
    " L " +
    f(p0.x) +
    " " +
    f(p0.y) +
    " A " +
    f(r) +
    " " +
    f(r) +
    " 0 " +
    large +
    " 1 " +
    f(p1.x) +
    " " +
    f(p1.y) +
    " Z"
  );
}

// --- Radar (SVG) -----------------------------------------------------------

function buildRadarPlot(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const plot = createSvgPlot(t, false);

  const cx = PLOT_WIDTH / 2;
  const cy = PLOT_HEIGHT / 2;
  const R = PLOT_HEIGHT / 2 - 12;
  const n = RADAR_VALUES.length;

  // Grid: concentric polygons + spokes, drawn in the border colour.
  let grid = "";
  for (const level of [0.33, 0.66, 1]) {
    grid += `<path d="${radarPolygon(cx, cy, R, level, n)}" fill="none" stroke="currentColor" stroke-width="1"/>`;
  }
  for (let i = 0; i < n; i++) {
    const p = polar(cx, cy, R, i * (360 / n));
    grid += `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(p.x)}" y2="${f(p.y)}" stroke="currentColor" stroke-width="1"/>`;
  }
  addSvg(plot, svg(grid), t.get("border"));

  // Data polygon.
  let data = "M ";
  for (let i = 0; i < n; i++) {
    const p = polar(cx, cy, R * RADAR_VALUES[i]!, i * (360 / n));
    data += (i === 0 ? "" : "L ") + f(p.x) + " " + f(p.y) + " ";
  }
  data = data.trim() + " Z";
  addSvg(
    plot,
    `<svg width="${PLOT_WIDTH}" height="${PLOT_HEIGHT}" viewBox="0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}" xmlns="http://www.w3.org/2000/svg"><path d="${data}" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    t.get("chart-1"),
    0.55,
  );

  return plot;
}

function radarPolygon(
  cx: number,
  cy: number,
  R: number,
  scale: number,
  n: number,
): string {
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = polar(cx, cy, R * scale, i * (360 / n));
    d += (i === 0 ? "M " : "L ") + f(p.x) + " " + f(p.y) + " ";
  }
  return d.trim() + " Z";
}

// --- Radial (SVG) ----------------------------------------------------------

function buildRadialPlot(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const plot = createSvgPlot(t, false);

  const cx = PLOT_WIDTH / 2;
  const cy = PLOT_HEIGHT / 2;
  const outer = PLOT_HEIGHT / 2 - 8;
  const thickness = 12;
  const gap = 6;

  for (let i = 0; i < RADIAL_BARS.length; i++) {
    const r = outer - i * (thickness + gap);
    // Faint full-circle track.
    addSvg(plot, arcSvg(cx, cy, r, 0, 359.99, thickness), t.get("border"), 0.4);
    // Coloured value arc.
    addSvg(
      plot,
      arcSvg(cx, cy, r, 0, RADIAL_BARS[i]! * 360, thickness),
      t.get(`chart-${i + 1}`),
    );
  }

  return plot;
}

function arcSvg(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  width: number,
): string {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  const d =
    "M " +
    f(p0.x) +
    " " +
    f(p0.y) +
    " A " +
    f(r) +
    " " +
    f(r) +
    " 0 " +
    large +
    " 1 " +
    f(p1.x) +
    " " +
    f(p1.y);
  return `<svg width="${PLOT_WIDTH}" height="${PLOT_HEIGHT}" viewBox="0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round"/></svg>`;
}

// --- Shared SVG helpers ----------------------------------------------------

// A fixed-size, non-auto-layout frame the SVG series are positioned inside. The
// optional baseline axis matches the bar chart's bottom rule.
function createSvgPlot(t: Map<string, Variable>, axis: boolean): FrameNode {
  const plot = figma.createFrame();
  plot.name = "Plot";
  plot.layoutMode = "NONE";
  plot.resize(PLOT_WIDTH, PLOT_HEIGHT);
  plot.fills = [];
  plot.clipsContent = true;
  if (axis) applyBaselineAxis(plot, t);
  return plot;
}

function applyBaselineAxis(plot: FrameNode, t: Map<string, Variable>): void {
  bindStrokeColor(plot, t.get("border"));
  plot.strokeWeight = 1;
  plot.strokeAlign = "INSIDE";
  plot.strokeBottomWeight = 1;
  plot.strokeTopWeight = 0;
  plot.strokeLeftWeight = 0;
  plot.strokeRightWeight = 0;
}

// Build an SVG node from markup, clear its wrapper background + recolour its
// geometry to `colorVar` (via the shared icon recolour pass), and drop it into
// the plot at the origin.
function addSvg(
  plot: FrameNode,
  markup: string,
  colorVar: Variable | undefined,
  opacity?: number,
): void {
  const node = figma.createNodeFromSvg(markup);
  node.name = "Series";
  recolorIcon(node, colorVar);
  if (opacity !== undefined) node.opacity = opacity;
  plot.appendChild(node);
  node.x = 0;
  node.y = 0;
}

function addGridLines(plot: FrameNode, t: Map<string, Variable>): void {
  let inner = "";
  for (let i = 1; i <= 3; i++) {
    const y = (i / 4) * PLOT_HEIGHT;
    inner += `<line x1="0" y1="${f(y)}" x2="${f(PLOT_WIDTH)}" y2="${f(y)}" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4"/>`;
  }
  addSvg(plot, svg(inner), t.get("border"), 0.6);
}

// Wrap inner SVG markup in a plot-sized <svg> root.
function svg(inner: string): string {
  return `<svg width="${PLOT_WIDTH}" height="${PLOT_HEIGHT}" viewBox="0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// A single <path>, either stroked (line) or filled (area/pie/radar wedge).
function pathSvg(d: string, opts: { stroke?: number; fill?: boolean }): string {
  const fillAttr = opts.fill ? `fill="currentColor"` : `fill="none"`;
  const strokeAttr =
    opts.stroke !== undefined
      ? `stroke="currentColor" stroke-width="${opts.stroke}" stroke-linecap="round" stroke-linejoin="round"`
      : `stroke="none"`;
  return svg(`<path d="${d}" ${fillAttr} ${strokeAttr}/>`);
}

// Polar→cartesian with 0° at the top, sweeping clockwise.
function polar(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// Compact number formatting for SVG coordinates (≤2 decimals).
function f(value: number): string {
  return String(Math.round(value * 100) / 100);
}

// --- Axis + legend ---------------------------------------------------------

function buildMonthLabels(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const row = figma.createFrame();
  row.name = "Axis";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.primaryAxisAlignItems = "SPACE_BETWEEN";
  row.resize(PLOT_WIDTH, 16);
  row.fills = [];
  row.strokes = [];

  for (const month of MONTHS) {
    const label = figma.createText();
    applyFont(label, "body", "Regular");
    label.characters = month;
    label.fontSize = 12;
    bindFontSize(label, p.get("font/size/xs"));
    bindFill(label, t.get("muted-foreground"));
    row.appendChild(label);
  }

  return row;
}

function buildLegend(inputs: ComponentsInputs, items: LegendItem[]): FrameNode {
  const legend = figma.createFrame();
  legend.name = "Legend";
  legend.layoutMode = "HORIZONTAL";
  legend.layoutWrap = "WRAP";
  legend.primaryAxisSizingMode = "FIXED";
  legend.counterAxisSizingMode = "AUTO";
  legend.counterAxisAlignItems = "CENTER";
  legend.itemSpacing = 12;
  legend.counterAxisSpacing = 6;
  legend.resize(PLOT_WIDTH, 10);
  legend.fills = [];
  legend.strokes = [];

  for (const item of items) {
    legend.appendChild(buildLegendItem(inputs, item.label, item.key));
  }

  return legend;
}

function buildLegendItem(
  inputs: ComponentsInputs,
  label: string,
  colorKey: string,
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const item = figma.createFrame();
  item.name = "Legend Item";
  item.layoutMode = "HORIZONTAL";
  item.primaryAxisSizingMode = "AUTO";
  item.counterAxisSizingMode = "AUTO";
  item.counterAxisAlignItems = "CENTER";
  item.itemSpacing = 6;
  item.fills = [];
  item.strokes = [];

  const swatch = figma.createRectangle();
  swatch.name = "Swatch";
  swatch.resize(10, 10);
  swatch.cornerRadius = 2;
  bindCornerRadii(swatch as unknown as FrameNode, p.get("radius/xs"));
  bindFill(swatch, t.get(colorKey));
  item.appendChild(swatch);

  const text = figma.createText();
  applyFont(text, "body", "Regular");
  text.characters = label;
  text.fontSize = 12;
  bindFontSize(text, p.get("font/size/xs"));
  bindFill(text, t.get("muted-foreground"));
  item.appendChild(text);

  return item;
}
