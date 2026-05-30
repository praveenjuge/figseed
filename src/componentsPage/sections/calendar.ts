// Calendar: a single-month date picker. Mirrors radix-nova's Calendar
// (react-day-picker): `bg-background p-2 [--cell-radius:var(--radius-md)]
// [--cell-size:--spacing(7)]` (28px cells). A nav row carries ghost
// prev/next icon buttons (`size-(--cell-size)`) flanking the centred month
// caption (`text-sm font-medium`); a weekday header row (`text-[0.8rem]
// text-muted-foreground`) sits over the day grid.
//
// Day cells are ghost buttons rounded to `--cell-radius`. The selected day is
// `bg-primary text-primary-foreground`; "today" is `bg-muted text-foreground`;
// outside (adjacent-month) days are `text-muted-foreground`. We render June
// 2025 (which starts on a Sunday) so the grid reads as a clean 5×7 month.

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

const CELL_SIZE = 28; // --cell-size: --spacing(7)
const COLUMNS = 7;
const GRID_WIDTH = CELL_SIZE * COLUMNS; // 196

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

// A day cell descriptor. `outside` days belong to the adjacent month; `today`
// and `selected` drive the highlighted states.
type Day = {
  label: string;
  outside?: boolean;
  today?: boolean;
  selected?: boolean;
};

// June 2025 starts on a Sunday and has 30 days, giving a clean 5-row grid with
// July's 1–5 as the trailing outside days. Today = the 1st, selected = the 17th.
const WEEKS: Day[][] = buildJune2025();

export async function addCalendarSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildCalendarComponent(inputs);
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
}

function buildCalendarComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Calendar";
  comp.layoutMode = "VERTICAL";
  comp.resize(GRID_WIDTH, 10);
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  // `bg-background p-2`, month gap `gap-4`.
  comp.itemSpacing = 16;
  comp.paddingTop = 8;
  comp.paddingBottom = 8;
  comp.paddingLeft = 8;
  comp.paddingRight = 8;
  bindFill(comp, t.get("background"));
  comp.strokes = [];

  comp.appendChild(buildNav(inputs));
  comp.appendChild(buildMonthGrid(inputs));

  return comp;
}

// Nav + caption row: prev icon button, centred "June 2025" caption, next icon
// button (`justify-between`).
function buildNav(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const nav = figma.createFrame();
  nav.name = "Nav";
  nav.layoutMode = "HORIZONTAL";
  nav.primaryAxisSizingMode = "FIXED";
  nav.counterAxisSizingMode = "AUTO";
  nav.primaryAxisAlignItems = "SPACE_BETWEEN";
  nav.counterAxisAlignItems = "CENTER";
  nav.resize(GRID_WIDTH, CELL_SIZE);
  nav.fills = [];
  nav.strokes = [];

  nav.appendChild(buildNavButton(inputs, "chevron-left"));

  const caption = figma.createText();
  applyFont(caption, "body", "Medium");
  caption.characters = "June 2025";
  caption.fontSize = 14;
  bindFontSize(caption, p.get("font/size/sm"));
  bindFill(caption, t.get("foreground"));
  nav.appendChild(caption);

  nav.appendChild(buildNavButton(inputs, "chevron-right"));

  return nav;
}

// A ghost icon button (`size-(--cell-size)`) holding a chevron. The chevrons
// are drawn as simple vectors (like the Select section) so they don't depend
// on the preset icon library having a left-chevron candidate.
function buildNavButton(
  inputs: ComponentsInputs,
  direction: "chevron-left" | "chevron-right",
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const btn = figma.createFrame();
  btn.name = direction === "chevron-left" ? "Previous" : "Next";
  btn.layoutMode = "HORIZONTAL";
  btn.primaryAxisSizingMode = "FIXED";
  btn.counterAxisSizingMode = "FIXED";
  btn.primaryAxisAlignItems = "CENTER";
  btn.counterAxisAlignItems = "CENTER";
  btn.resize(CELL_SIZE, CELL_SIZE);
  btn.cornerRadius = 6;
  bindCornerRadii(btn, p.get("radius/md"));
  btn.fills = [];
  btn.strokes = [];

  btn.appendChild(buildChevron(t, direction));
  return btn;
}

// A 16px chevron pointing left or right, drawn as an open vector path.
function buildChevron(
  t: Map<string, Variable>,
  direction: "chevron-left" | "chevron-right",
): VectorNode {
  const chevron = figma.createVector();
  chevron.name = "Chevron";
  chevron.resize(16, 16);
  chevron.vectorPaths = [
    {
      windingRule: "NONZERO",
      data:
        direction === "chevron-left"
          ? "M 10 4 L 6 8 L 10 12"
          : "M 6 4 L 10 8 L 6 12",
    },
  ];
  chevron.strokeWeight = 1.5;
  chevron.strokeCap = "ROUND";
  chevron.strokeJoin = "ROUND";
  chevron.fills = [];
  bindStrokeColor(chevron, t.get("foreground"));
  return chevron;
}

// The weekday header row over the week rows (`flex flex-col` of `flex` rows).
function buildMonthGrid(inputs: ComponentsInputs): FrameNode {
  const grid = figma.createFrame();
  grid.name = "Month";
  grid.layoutMode = "VERTICAL";
  // Resize before declaring sizing modes — resize() pins both axes to FIXED;
  // re-setting the primary axis to AUTO afterwards lets the grid hug its
  // weekday + week rows vertically at the fixed grid width.
  grid.resize(GRID_WIDTH, 10);
  grid.primaryAxisSizingMode = "AUTO";
  grid.counterAxisSizingMode = "FIXED";
  // `week` rows carry `mt-2` (8px) between them; the header sits flush.
  grid.itemSpacing = 8;
  grid.fills = [];
  grid.strokes = [];

  grid.appendChild(buildWeekdayRow(inputs));
  for (const week of WEEKS) grid.appendChild(buildWeekRow(inputs, week));

  return grid;
}

function buildWeekdayRow(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const row = figma.createFrame();
  row.name = "Weekdays";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.itemSpacing = 0;
  row.resize(GRID_WIDTH, CELL_SIZE);
  row.fills = [];
  row.strokes = [];

  for (const day of WEEKDAYS) {
    const cell = figma.createFrame();
    cell.name = "Weekday";
    cell.layoutMode = "HORIZONTAL";
    cell.primaryAxisSizingMode = "FIXED";
    cell.counterAxisSizingMode = "FIXED";
    cell.primaryAxisAlignItems = "CENTER";
    cell.counterAxisAlignItems = "CENTER";
    cell.resize(CELL_SIZE, CELL_SIZE);
    cell.fills = [];
    cell.strokes = [];

    const text = figma.createText();
    applyFont(text, "body", "Regular");
    text.characters = day;
    text.fontSize = 13; // text-[0.8rem]
    bindFill(text, t.get("muted-foreground"));
    cell.appendChild(text);
    row.appendChild(cell);
  }

  return row;
}

function buildWeekRow(inputs: ComponentsInputs, week: Day[]): FrameNode {
  const row = figma.createFrame();
  row.name = "Week";
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "FIXED";
  row.counterAxisSizingMode = "AUTO";
  row.itemSpacing = 0;
  row.resize(GRID_WIDTH, CELL_SIZE);
  row.fills = [];
  row.strokes = [];

  for (const day of week) row.appendChild(buildDayCell(inputs, day));
  return row;
}

function buildDayCell(inputs: ComponentsInputs, day: Day): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const cell = figma.createFrame();
  cell.name = "Day";
  cell.layoutMode = "HORIZONTAL";
  cell.primaryAxisSizingMode = "FIXED";
  cell.counterAxisSizingMode = "FIXED";
  cell.primaryAxisAlignItems = "CENTER";
  cell.counterAxisAlignItems = "CENTER";
  cell.resize(CELL_SIZE, CELL_SIZE);
  cell.cornerRadius = 6;
  bindCornerRadii(cell, p.get("radius/md"));
  cell.fills = [];
  cell.strokes = [];

  // Resting label colour.
  let labelColor = t.get("foreground");

  if (day.selected) {
    // `data-[selected-single=true]:bg-primary text-primary-foreground`.
    bindFill(cell, t.get("primary"));
    labelColor = t.get("primary-foreground");
  } else if (day.today) {
    // `today: bg-muted text-foreground`.
    bindFill(cell, t.get("muted"));
    labelColor = t.get("foreground");
  } else if (day.outside) {
    labelColor = t.get("muted-foreground");
  }

  const text = figma.createText();
  applyFont(text, "body", "Regular");
  text.characters = day.label;
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(text, labelColor);
  cell.appendChild(text);

  return cell;
}

// Build the June 2025 month: 5 rows of 7 days, with July 1–5 as trailing
// outside days. Today = June 1, selected = June 17.
function buildJune2025(): Day[][] {
  const weeks: Day[][] = [];
  let dayNum = 1;
  for (let w = 0; w < 5; w++) {
    const week: Day[] = [];
    for (let d = 0; d < COLUMNS; d++) {
      if (dayNum <= 30) {
        week.push({
          label: String(dayNum),
          today: dayNum === 1,
          selected: dayNum === 17,
        });
        dayNum++;
      } else {
        // Trailing outside days from the next month.
        week.push({ label: String(dayNum - 30), outside: true });
        dayNum++;
      }
    }
    weeks.push(week);
  }
  return weeks;
}
