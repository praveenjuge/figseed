// Chart: a bar-chart placeholder. shadcn's Chart wraps Recharts inside a
// ChartContainer that maps series colours onto the `--chart-1…5` theme
// variables. Figma can't render a live chart, so we draw a representative
// grouped bar chart whose bars bind to the `chart-1` / `chart-2` theme
// variables — editing those variables recolours the chart, mirroring how the
// real ChartContainer themes its series.
//
// Layout: a card with a title, a plotting area of paired bars over a baseline
// axis, and a small two-series legend.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { wrapInSectionCard } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const CHART_WIDTH = 360;
const PLOT_HEIGHT = 160;
const BAR_WIDTH = 14;
const PAIR_GAP = 4;
const GROUP_GAP = 24;

// Six month groups, each a [series1, series2] pair as a 0–1 fraction of the
// plot height.
const GROUPS: Array<[number, number]> = [
  [0.55, 0.4],
  [0.7, 0.55],
  [0.4, 0.65],
  [0.85, 0.6],
  [0.6, 0.45],
  [0.75, 0.7],
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export async function addChartSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildChartComponent(inputs);
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
}

function buildChartComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Chart";
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
  title.characters = "Bar Chart";
  title.fontSize = 16;
  bindFontSize(title, p.get("font/size/base"));
  bindFill(title, t.get("card-foreground"));
  comp.appendChild(title);
  title.layoutSizingHorizontal = "FILL";

  // Plot area: a baseline with grouped bars sitting on top.
  comp.appendChild(buildPlot(inputs));

  // Month labels row, aligned under the groups.
  comp.appendChild(buildMonthLabels(inputs));

  // Legend.
  comp.appendChild(buildLegend(inputs));

  return comp;
}

function buildPlot(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;

  const plot = figma.createFrame();
  plot.name = "Plot";
  plot.layoutMode = "HORIZONTAL";
  plot.primaryAxisSizingMode = "FIXED";
  plot.counterAxisSizingMode = "FIXED";
  plot.primaryAxisAlignItems = "CENTER";
  plot.counterAxisAlignItems = "MAX"; // bars sit on the baseline
  plot.itemSpacing = GROUP_GAP;
  plot.resize(CHART_WIDTH - 32, PLOT_HEIGHT);
  plot.fills = [];
  // Baseline axis along the bottom edge.
  bindStrokeColor(plot, t.get("border"));
  plot.strokeWeight = 1;
  plot.strokeAlign = "INSIDE";
  plot.strokeBottomWeight = 1;
  plot.strokeTopWeight = 0;
  plot.strokeLeftWeight = 0;
  plot.strokeRightWeight = 0;

  for (let i = 0; i < GROUPS.length; i++) {
    plot.appendChild(buildGroup(inputs, GROUPS[i]!));
  }

  return plot;
}

function buildGroup(
  inputs: ComponentsInputs,
  pair: [number, number],
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

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

  const bar1 = figma.createRectangle();
  bar1.name = "Series 1";
  bar1.resize(BAR_WIDTH, Math.max(2, Math.round(PLOT_HEIGHT * pair[0])));
  bar1.topLeftRadius = 3;
  bar1.topRightRadius = 3;
  bindFill(bar1, t.get("chart-1"));
  group.appendChild(bar1);

  const bar2 = figma.createRectangle();
  bar2.name = "Series 2";
  bar2.resize(BAR_WIDTH, Math.max(2, Math.round(PLOT_HEIGHT * pair[1])));
  bar2.topLeftRadius = 3;
  bar2.topRightRadius = 3;
  bindFill(bar2, t.get("chart-2"));
  group.appendChild(bar2);

  void p;
  return group;
}

function buildMonthLabels(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const row = figma.createFrame();
  row.name = "Axis";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.primaryAxisAlignItems = "SPACE_BETWEEN";
  row.resize(CHART_WIDTH - 32, 16);
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

function buildLegend(inputs: ComponentsInputs): FrameNode {
  const legend = figma.createFrame();
  legend.name = "Legend";
  legend.layoutMode = "HORIZONTAL";
  legend.primaryAxisSizingMode = "AUTO";
  legend.counterAxisSizingMode = "AUTO";
  legend.counterAxisAlignItems = "CENTER";
  legend.itemSpacing = 16;
  legend.fills = [];
  legend.strokes = [];

  legend.appendChild(buildLegendItem(inputs, "Desktop", "chart-1"));
  legend.appendChild(buildLegendItem(inputs, "Mobile", "chart-2"));

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
