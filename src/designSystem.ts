// Builds a "Design System" page in Figma that visualizes every variable
// produced by the generator: theme colors (light + dark), Tailwind palette,
// typography, radius, spacing, opacity, blur, border widths, and shadows.
//
// All visual nodes bind to the corresponding Figma variables, so any later
// edit to the variables flows through the page.

import {
  TAILWIND_COLOR_FAMILIES,
  TAILWIND_COLOR_SCALES,
  type Rgba,
} from "./colors";
import {
  BLUR_TOKENS,
  BORDER_WIDTH_TOKENS,
  FONT_LEADING_TOKENS,
  FONT_SIZE_TOKENS,
  FONT_TRACKING_TOKENS,
  FONT_WEIGHT_TOKENS,
  OPACITY_TOKENS,
  RADIUS_TOKENS,
  SPACING_TOKENS,
} from "./primitives";
import type {
  PrimitiveVariableMap,
  TailwindColorVarMap,
  ThemeVariableMaps,
} from "./generator";

// ---------- Layout constants ----------

const PAGE_NAME = "Design System";

// Each section is now its own top-level frame so designers can move them
// independently. The page just lays them out in a vertical stack.
const SECTION_WIDTH = 1120;
const SECTION_GAP = 32;

// Theme key groupings, ordered the way designers usually scan them.
const THEME_GROUPS: { title: string; pairs: [string, string | null][] }[] = [
  {
    title: "Surfaces",
    pairs: [
      ["background", "foreground"],
      ["card", "card-foreground"],
      ["popover", "popover-foreground"],
    ],
  },
  {
    title: "Brand",
    pairs: [
      ["primary", "primary-foreground"],
      ["secondary", "secondary-foreground"],
      ["accent", "accent-foreground"],
    ],
  },
  {
    title: "States",
    pairs: [
      ["muted", "muted-foreground"],
      ["destructive", "destructive-foreground"],
    ],
  },
  {
    title: "Lines",
    pairs: [
      ["border", null],
      ["input", null],
      ["ring", null],
    ],
  },
  {
    title: "Sidebar",
    pairs: [
      ["sidebar", "sidebar-foreground"],
      ["sidebar-primary", "sidebar-primary-foreground"],
      ["sidebar-accent", "sidebar-accent-foreground"],
      ["sidebar-border", null],
      ["sidebar-ring", null],
    ],
  },
  {
    title: "Charts",
    pairs: [
      ["chart-1", null],
      ["chart-2", null],
      ["chart-3", null],
      ["chart-4", null],
      ["chart-5", null],
    ],
  },
];

// ---------- Public entry ----------

export type DesignSystemInputs = {
  presetCode: string;
  presetSummary?: Record<string, string | undefined>;
  tailwindColors: TailwindColorVarMap;
  primitives: PrimitiveVariableMap;
  theme: ThemeVariableMaps;
  // Called once per section so the UI can show a determinate progress bar.
  onProgress?: (current: number, total: number, label: string) => void;
};

export type DesignSystemResult = { nodeCount: number };

// Each entry corresponds to one top-level section frame on the page. Adding
// a section here also extends the progress total reported to the UI.
type SectionBuilder = {
  label: string;
  build: (page: PageNode, inputs: DesignSystemInputs) => Promise<number>;
};

const SECTIONS: SectionBuilder[] = [
  { label: "Header", build: addHeader },
  { label: "Theme · Light", build: (p, i) => addThemeSection(p, i, "light") },
  { label: "Theme · Dark", build: (p, i) => addThemeSection(p, i, "dark") },
  { label: "Tailwind palette", build: addTailwindPalette },
  { label: "Typography", build: addTypography },
  { label: "Border radius", build: addRadiusScale },
  { label: "Spacing scale", build: addSpacingScale },
  { label: "Border widths", build: addBorderWidthScale },
  { label: "Box shadows", build: addBoxShadows },
  { label: "Blur & backdrop", build: addBlurAndBackdrop },
  { label: "Opacity scale", build: addOpacityScale },
];

export async function buildDesignSystem(
  inputs: DesignSystemInputs,
): Promise<DesignSystemResult> {
  // The "dynamic-page" manifest setting requires us to load all pages before
  // we can search for an existing page by name.
  await figma.loadAllPagesAsync();

  // Reset (or create) the page so the layout stays clean across re-runs.
  let page = figma.root.children.find(
    (child) => child.type === "PAGE" && child.name === PAGE_NAME,
  ) as PageNode | undefined;

  if (page) {
    for (const node of [...page.children]) node.remove();
  } else {
    page = figma.createPage();
    page.name = PAGE_NAME;
  }

  // Loading the regular sans family is enough for every text node we create.
  // Figma will fall back gracefully on machines that don't have Inter.
  await loadCommonFonts();

  const total = SECTIONS.length;
  let count = 0;

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i]!;
    inputs.onProgress?.(i, total, section.label);
    count += await section.build(page, inputs);
    // Yield to the event loop so the UI can paint between sections.
    await Promise.resolve();
  }
  inputs.onProgress?.(total, total, "Done");

  // Lay out the section frames in a single vertical stack down the page.
  layoutSectionsVertically(page);

  // Move the user to the page and frame the result.
  await figma.setCurrentPageAsync(page);
  if (page.children.length > 0) {
    page.selection = [page.children[0] as SceneNode];
    figma.viewport.scrollAndZoomIntoView(page.children as SceneNode[]);
  }

  return { nodeCount: count };
}

function layoutSectionsVertically(page: PageNode) {
  let y = 0;
  for (const child of page.children) {
    if (!("x" in child)) continue;
    (child as SceneNode & { x: number; y: number }).x = 0;
    (child as SceneNode & { x: number; y: number }).y = y;
    const height = (child as SceneNode & { height: number }).height ?? 0;
    y += height + SECTION_GAP;
  }
}

// ---------- Sections ----------

async function addHeader(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const frame = createSectionFrame("Figseed", {
    title: inputs.presetCode,
    titleSize: 28,
    subtitle: summarizePreset(inputs.presetSummary),
  });
  page.appendChild(frame);
  return countDescendants(frame);
}

async function addThemeSection(
  page: PageNode,
  inputs: DesignSystemInputs,
  scheme: "light" | "dark",
): Promise<number> {
  const map = scheme === "light" ? inputs.theme.light : inputs.theme.dark;
  const title = scheme === "light" ? "Theme · Light" : "Theme · Dark";

  const section = createSectionFrame(title, { title });

  // Two-column grid of group cards. The section content width is fixed, so
  // each column gets exactly half (minus the gap).
  const contentWidth = sectionContentWidth();
  const columnGap = 16;
  const columnWidth = Math.floor((contentWidth - columnGap) / 2);

  const grid = figma.createFrame();
  grid.layoutMode = "HORIZONTAL";
  grid.layoutWrap = "WRAP";
  grid.itemSpacing = columnGap;
  grid.counterAxisSpacing = columnGap;
  grid.fills = [];
  grid.resize(contentWidth, 1);
  grid.primaryAxisSizingMode = "FIXED";
  grid.counterAxisSizingMode = "AUTO";
  section.appendChild(grid);

  const swatchSize = 116; // compact theme swatch
  const swatchHeight = 64;

  for (const group of THEME_GROUPS) {
    const groupCard = figma.createFrame();
    groupCard.layoutMode = "VERTICAL";
    groupCard.itemSpacing = 8;
    groupCard.fills = [];
    groupCard.resize(columnWidth, 1);
    groupCard.primaryAxisSizingMode = "AUTO";
    groupCard.counterAxisSizingMode = "FIXED";

    const heading = figma.createText();
    heading.fontName = { family: "Inter", style: "Medium" };
    heading.characters = group.title;
    heading.fontSize = 11;
    heading.fills = [solidPaint(0.4)];
    groupCard.appendChild(heading);

    const itemRow = figma.createFrame();
    itemRow.layoutMode = "HORIZONTAL";
    itemRow.layoutWrap = "WRAP";
    itemRow.itemSpacing = 8;
    itemRow.counterAxisSpacing = 8;
    itemRow.fills = [];
    itemRow.resize(columnWidth, 1);
    itemRow.primaryAxisSizingMode = "FIXED";
    itemRow.counterAxisSizingMode = "AUTO";
    groupCard.appendChild(itemRow);

    for (const [bg, fg] of group.pairs) {
      const card = figma.createFrame();
      card.layoutMode = "VERTICAL";
      card.itemSpacing = 2;
      card.cornerRadius = 6;
      card.paddingTop = 10;
      card.paddingBottom = 10;
      card.paddingLeft = 12;
      card.paddingRight = 12;
      card.strokeWeight = 1;
      // Subtle outline so the card stays visible even when its fill matches
      // the page background (e.g. the literal "background" swatch).
      card.strokes = [solidPaint(scheme === "light" ? 0.9 : 0.25)];
      bindFill(card, map.get(bg));

      const swatchLabel = figma.createText();
      swatchLabel.characters = bg;
      swatchLabel.fontSize = 11;
      swatchLabel.fontName = { family: "Inter", style: "Semi Bold" };
      bindFill(
        swatchLabel,
        fg ? map.get(fg) : map.get("foreground"),
        scheme === "light" ? 0.1 : 0.9,
      );
      card.appendChild(swatchLabel);

      const swatchSub = figma.createText();
      swatchSub.characters = `--${bg}`;
      swatchSub.fontSize = 9;
      swatchSub.fontName = { family: "Inter", style: "Regular" };
      bindFill(
        swatchSub,
        fg ? map.get(fg) : map.get("foreground"),
        scheme === "light" ? 0.4 : 0.6,
      );
      card.appendChild(swatchSub);

      card.resize(swatchSize, swatchHeight);
      card.primaryAxisSizingMode = "FIXED";
      card.counterAxisSizingMode = "FIXED";
      itemRow.appendChild(card);
    }

    grid.appendChild(groupCard);
  }

  page.appendChild(section);
  return countDescendants(section);
}

async function addTailwindPalette(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Tailwind palette");

  const stack = createVertical(section, 8);
  const rowWidth = sectionContentWidth();
  const labelWidth = 64;

  for (const family of TAILWIND_COLOR_FAMILIES) {
    const row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisSizingMode = "FIXED";
    row.counterAxisSizingMode = "AUTO";
    row.itemSpacing = 0;
    row.resize(rowWidth, 1);
    row.fills = [];

    const label = figma.createText();
    label.characters = family;
    label.fontSize = 10;
    label.fontName = { family: "Inter", style: "Medium" };
    label.fills = [solidPaint(0.4)];
    label.resize(labelWidth, 16);
    row.appendChild(label);

    for (const scale of TAILWIND_COLOR_SCALES) {
      const swatch = figma.createFrame();
      swatch.layoutMode = "VERTICAL";
      swatch.primaryAxisAlignItems = "MAX";
      swatch.counterAxisAlignItems = "MIN";
      swatch.paddingLeft = 4;
      swatch.paddingRight = 4;
      swatch.paddingTop = 4;
      swatch.paddingBottom = 4;
      swatch.layoutGrow = 1;
      // Slightly shorter than the previous version — keeps the row compact.
      swatch.resize(64, 36);
      bindFill(swatch, inputs.tailwindColors.get(`${family}/${scale}`));

      const tag = figma.createText();
      tag.characters = scale;
      tag.fontSize = 9;
      tag.fontName = { family: "Inter", style: "Medium" };
      // Light text on dark shades, dark text on light shades.
      const isDark = parseInt(scale, 10) >= 500;
      tag.fills = [solidPaint(isDark ? 0.95 : 0.1)];
      swatch.appendChild(tag);

      row.appendChild(swatch);
    }

    stack.appendChild(row);
  }

  // Neutrals that live outside the family table.
  const neutralRow = figma.createFrame();
  neutralRow.layoutMode = "HORIZONTAL";
  neutralRow.primaryAxisSizingMode = "AUTO";
  neutralRow.counterAxisSizingMode = "AUTO";
  neutralRow.itemSpacing = 12;
  neutralRow.fills = [];
  for (const name of ["white", "black", "transparent"]) {
    const cell = createVertical(neutralRow, 4);
    const swatch = figma.createFrame();
    swatch.resize(64, 36);
    swatch.cornerRadius = 4;
    swatch.strokeWeight = 1;
    swatch.strokes = [solidPaint(0.85)];
    bindFill(swatch, inputs.tailwindColors.get(name));

    const cap = figma.createText();
    cap.characters = name;
    cap.fontSize = 9;
    cap.fontName = { family: "Inter", style: "Medium" };
    cap.fills = [solidPaint(0.4)];

    cell.appendChild(swatch);
    cell.appendChild(cap);
  }
  stack.appendChild(neutralRow);

  page.appendChild(section);
  return countDescendants(section);
}

async function addTypography(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Typography");

  const fgVar = inputs.theme.light.get("foreground");
  const mutedVar = inputs.theme.light.get("muted-foreground");

  // Consistent metrics so the columns line up across all four sub-sections.
  const labelColumnWidth = 160;
  const sampleColumnWidth = sectionContentWidth() - labelColumnWidth - 16;

  // ----- Sizes -----
  const sizeStack = createSubSection(section, "Font sizes");
  for (const token of FONT_SIZE_TOKENS) {
    const row = createTableRow(sizeStack, labelColumnWidth);
    addLabel(row, `font/size/${token.name}`, mutedVar, labelColumnWidth);

    const sample = figma.createText();
    sample.fontName = { family: "Inter", style: "Regular" };
    sample.characters = `The quick brown fox · ${token.value}px`;
    sample.fontSize = token.value;
    bindFontSize(sample, inputs.primitives.get(`font/size/${token.name}`));
    bindFill(sample, fgVar);
    row.appendChild(sample);
  }

  // ----- Weights -----
  // The earlier version put the weight name, value, and sample in a single
  // text node. Inter's per-style metrics shifted the leading column, so the
  // labels looked misaligned. Splitting into a fixed-width name column +
  // value column + sample column keeps everything on the same baseline.
  const weightStack = createSubSection(section, "Font weights");
  const weightNameWidth = 90;
  const weightValueWidth = 50;
  for (const token of FONT_WEIGHT_TOKENS) {
    const row = createTableRow(weightStack, labelColumnWidth);

    const styleName = weightStyleName(token.value);
    const fontName: FontName = { family: "Inter", style: styleName };

    const nameLabel = figma.createText();
    try {
      nameLabel.fontName = fontName;
    } catch {
      nameLabel.fontName = { family: "Inter", style: "Regular" };
    }
    nameLabel.characters = token.name;
    nameLabel.fontSize = 14;
    bindFill(nameLabel, fgVar);
    nameLabel.resize(weightNameWidth, 20);
    row.appendChild(nameLabel);

    const valueLabel = figma.createText();
    valueLabel.fontName = { family: "Inter", style: "Regular" };
    valueLabel.characters = `${token.value}`;
    valueLabel.fontSize = 12;
    bindFill(valueLabel, mutedVar);
    valueLabel.resize(weightValueWidth, 20);
    row.appendChild(valueLabel);

    const sample = figma.createText();
    try {
      sample.fontName = fontName;
    } catch {
      sample.fontName = { family: "Inter", style: "Regular" };
    }
    sample.characters = "The quick brown fox jumps over the lazy dog";
    sample.fontSize = 14;
    bindFill(sample, fgVar);
    row.appendChild(sample);
  }

  // ----- Tracking -----
  const trackingStack = createSubSection(section, "Letter spacing (tracking)");
  for (const token of FONT_TRACKING_TOKENS) {
    const row = createTableRow(trackingStack, labelColumnWidth);
    addLabel(row, `font/tracking/${token.name}`, mutedVar, labelColumnWidth);

    const sample = figma.createText();
    sample.characters = `Letter spacing ${token.value}px`;
    sample.fontSize = 14;
    sample.fontName = { family: "Inter", style: "Regular" };
    sample.letterSpacing = { value: token.value, unit: "PIXELS" };
    bindFill(sample, fgVar);
    row.appendChild(sample);
  }

  // ----- Leading -----
  // Leading rows need extra height so the two-line sample doesn't visually
  // collide with the next row. We set the row's counter-axis to AUTO and
  // give the sample a fixed width so the wrap is predictable.
  const leadingStack = createSubSection(section, "Line height (leading)");
  for (const token of FONT_LEADING_TOKENS) {
    const row = createTableRow(leadingStack, labelColumnWidth);
    row.counterAxisAlignItems = "MIN";
    addLabel(row, `font/leading/${token.name}`, mutedVar, labelColumnWidth);

    const sample = figma.createText();
    sample.characters = `Two lines of body copy\nshare leading ${token.value}px`;
    sample.fontSize = 13;
    sample.fontName = { family: "Inter", style: "Regular" };
    sample.lineHeight = { value: token.value, unit: "PIXELS" };
    sample.resize(sampleColumnWidth, sample.height);
    bindFill(sample, fgVar);
    row.appendChild(sample);
  }

  page.appendChild(section);
  return countDescendants(section);
}

async function addRadiusScale(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Border radius");

  const row = createWrappingRow(section, 16);

  for (const token of RADIUS_TOKENS) {
    const cell = createVertical(row, 6);
    const tile = figma.createFrame();
    tile.resize(72, 72);
    bindFill(tile, inputs.theme.light.get("primary"));
    const radius = Math.min(token.value, 36);
    tile.topLeftRadius = radius;
    tile.topRightRadius = radius;
    tile.bottomLeftRadius = radius;
    tile.bottomRightRadius = radius;
    bindCornerRadii(tile, inputs.primitives.get(`radius/${token.name}`));

    const label = figma.createText();
    label.characters = token.name;
    label.fontSize = 11;
    label.fontName = { family: "Inter", style: "Medium" };
    bindFill(label, inputs.theme.light.get("foreground"));

    const sub = figma.createText();
    sub.characters = `${token.value}px`;
    sub.fontSize = 10;
    sub.fontName = { family: "Inter", style: "Regular" };
    bindFill(sub, inputs.theme.light.get("muted-foreground"));

    cell.appendChild(tile);
    cell.appendChild(label);
    cell.appendChild(sub);
  }

  page.appendChild(section);
  return countDescendants(section);
}

async function addSpacingScale(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Spacing scale");

  const stack = createVertical(section, 4);

  for (const token of SPACING_TOKENS) {
    const row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisSizingMode = "AUTO";
    row.counterAxisSizingMode = "AUTO";
    row.itemSpacing = 12;
    row.fills = [];

    const label = figma.createText();
    label.characters = `spacing/${token.name}`;
    label.fontSize = 10;
    label.fontName = { family: "Inter", style: "Regular" };
    bindFill(label, inputs.theme.light.get("muted-foreground"));
    label.resize(96, 16);

    const value = figma.createText();
    value.characters = `${token.value}px`;
    value.fontSize = 10;
    value.fontName = { family: "Inter", style: "Regular" };
    bindFill(value, inputs.theme.light.get("foreground"));
    value.resize(40, 16);

    const bar = figma.createFrame();
    // Add a 1px floor so 0px tokens still produce a visible node — Figma
    // refuses to keep a zero-width frame on canvas otherwise.
    bar.resize(Math.max(token.value, 1), 12);
    bar.cornerRadius = 2;
    bindFill(bar, inputs.theme.light.get("primary"));
    bindWidth(bar, inputs.primitives.get(`spacing/${token.name}`));

    row.appendChild(label);
    row.appendChild(value);
    row.appendChild(bar);
    stack.appendChild(row);
  }

  page.appendChild(section);
  return countDescendants(section);
}

async function addBorderWidthScale(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Border widths");

  const row = createWrappingRow(section, 16);

  for (const token of BORDER_WIDTH_TOKENS) {
    const cell = createVertical(row, 6);
    const tile = figma.createFrame();
    tile.resize(72, 72);
    tile.cornerRadius = 6;
    tile.fills = [];
    tile.strokes = [solidPaint(0.4)];
    tile.strokeWeight = Math.max(token.value, 1);
    // Use the theme primary color so the borders pick up the active palette.
    bindStrokeColor(tile, inputs.theme.light.get("primary"));
    bindStrokeWeight(tile, inputs.primitives.get(`border-width/${token.name}`));

    const label = figma.createText();
    label.characters = `${token.name} · ${token.value}px`;
    label.fontSize = 11;
    label.fontName = { family: "Inter", style: "Regular" };
    bindFill(label, inputs.theme.light.get("foreground"));

    cell.appendChild(tile);
    cell.appendChild(label);
  }

  page.appendChild(section);
  return countDescendants(section);
}

async function addBoxShadows(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Box shadows");

  const row = createWrappingRow(section, 24);

  // Shadows aren't first-class Figma variables, so we apply them as
  // literal effects. Each one mirrors Tailwind v4's preset.
  const shadows: Array<{ name: string; effects: Effect[] }> = [
    {
      name: "shadow/2xs",
      effects: [dropShadow(0, 1, 0, { r: 0, g: 0, b: 0, a: 0.05 })],
    },
    {
      name: "shadow/xs",
      effects: [dropShadow(0, 1, 2, { r: 0, g: 0, b: 0, a: 0.05 })],
    },
    {
      name: "shadow/sm",
      effects: [
        dropShadow(0, 1, 3, { r: 0, g: 0, b: 0, a: 0.1 }),
        dropShadow(0, 1, 2, { r: 0, g: 0, b: 0, a: 0.06 }),
      ],
    },
    {
      name: "shadow/md",
      effects: [
        dropShadow(0, 4, 6, { r: 0, g: 0, b: 0, a: 0.07 }),
        dropShadow(0, 2, 4, { r: 0, g: 0, b: 0, a: 0.06 }),
      ],
    },
    {
      name: "shadow/lg",
      effects: [
        dropShadow(0, 10, 15, { r: 0, g: 0, b: 0, a: 0.1 }),
        dropShadow(0, 4, 6, { r: 0, g: 0, b: 0, a: 0.05 }),
      ],
    },
    {
      name: "shadow/xl",
      effects: [
        dropShadow(0, 20, 25, { r: 0, g: 0, b: 0, a: 0.1 }),
        dropShadow(0, 8, 10, { r: 0, g: 0, b: 0, a: 0.04 }),
      ],
    },
    {
      name: "shadow/2xl",
      effects: [dropShadow(0, 25, 50, { r: 0, g: 0, b: 0, a: 0.25 })],
    },
    {
      name: "shadow/inner",
      effects: [innerShadow(0, 2, 4, { r: 0, g: 0, b: 0, a: 0.05 })],
    },
  ];

  for (const shadow of shadows) {
    const cell = createVertical(row, 8);
    const tile = figma.createFrame();
    tile.resize(80, 80);
    tile.cornerRadius = 10;
    tile.fills = [solidPaint(1)];
    tile.effects = shadow.effects;

    const label = figma.createText();
    label.characters = shadow.name;
    label.fontSize = 11;
    label.fontName = { family: "Inter", style: "Medium" };
    bindFill(label, inputs.theme.light.get("foreground"));

    cell.appendChild(tile);
    cell.appendChild(label);
  }

  page.appendChild(section);
  return countDescendants(section);
}

async function addBlurAndBackdrop(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Blur & backdrop");

  const row = createWrappingRow(section, 16);

  for (const token of BLUR_TOKENS) {
    const cell = createVertical(row, 8);

    // The blurred surface sits over a tile bound to the theme primary so
    // the backdrop blur produces a visible difference. We bind the radius
    // to the variable so updates flow through.
    const stage = figma.createFrame();
    stage.resize(96, 96);
    stage.cornerRadius = 10;
    stage.clipsContent = true;
    bindFill(stage, inputs.theme.light.get("primary"));

    // Inner stripes give the blur something to chew on.
    const stripes = figma.createFrame();
    stripes.resize(96, 96);
    stripes.layoutMode = "VERTICAL";
    stripes.primaryAxisSizingMode = "FIXED";
    stripes.counterAxisSizingMode = "FIXED";
    stripes.itemSpacing = 0;
    stripes.fills = [];
    for (let i = 0; i < 6; i++) {
      const stripe = figma.createFrame();
      stripe.resize(96, 16);
      stripe.fills = [solidPaint(i % 2 === 0 ? 0.2 : 0.85)];
      stripes.appendChild(stripe);
    }
    stage.appendChild(stripes);

    const overlay = figma.createFrame();
    overlay.resize(76, 50);
    overlay.x = 10;
    overlay.y = 23;
    overlay.cornerRadius = 6;
    overlay.fills = [solidPaintRgba({ r: 1, g: 1, b: 1, a: 0.35 })];
    overlay.effects = [
      {
        type: "BACKGROUND_BLUR",
        blurType: "NORMAL",
        radius: Math.max(token.value, 0.01),
        visible: true,
      },
    ];
    bindEffectRadius(overlay, 0, inputs.primitives.get(`blur/${token.name}`));
    stage.appendChild(overlay);

    const label = figma.createText();
    label.characters = `blur/${token.name}`;
    label.fontSize = 11;
    label.fontName = { family: "Inter", style: "Medium" };
    bindFill(label, inputs.theme.light.get("foreground"));

    const sub = figma.createText();
    sub.characters = `${token.value}px`;
    sub.fontSize = 10;
    sub.fontName = { family: "Inter", style: "Regular" };
    bindFill(sub, inputs.theme.light.get("muted-foreground"));

    cell.appendChild(stage);
    cell.appendChild(label);
    cell.appendChild(sub);
  }

  page.appendChild(section);
  return countDescendants(section);
}

async function addOpacityScale(
  page: PageNode,
  inputs: DesignSystemInputs,
): Promise<number> {
  const section = createSectionFrame("Opacity scale");

  const row = createWrappingRow(section, 8);

  for (const token of OPACITY_TOKENS) {
    const cell = figma.createFrame();
    cell.layoutMode = "VERTICAL";
    cell.itemSpacing = 6;
    cell.counterAxisAlignItems = "CENTER";
    cell.fills = [];
    cell.resize(56, 80);
    cell.primaryAxisSizingMode = "FIXED";
    cell.counterAxisSizingMode = "FIXED";

    const tile = figma.createFrame();
    tile.resize(48, 48);
    tile.cornerRadius = 4;
    bindFill(tile, inputs.theme.light.get("primary"));
    tile.opacity = Math.max(0.0001, token.value / 100);
    bindOpacity(tile, inputs.primitives.get(`opacity/${token.name}`));

    const label = figma.createText();
    label.characters = token.name;
    label.fontSize = 10;
    label.fontName = { family: "Inter", style: "Medium" };
    bindFill(label, inputs.theme.light.get("foreground"));

    const sub = figma.createText();
    sub.characters = `${token.value}%`;
    sub.fontSize = 9;
    sub.fontName = { family: "Inter", style: "Regular" };
    bindFill(sub, inputs.theme.light.get("muted-foreground"));

    cell.appendChild(tile);
    cell.appendChild(label);
    cell.appendChild(sub);
    row.appendChild(cell);
  }

  page.appendChild(section);
  return countDescendants(section);
}

// ---------- Layout helpers ----------

function sectionContentWidth(): number {
  // Section frame total width minus its 24px horizontal padding on each side.
  return SECTION_WIDTH - 48;
}

function createSectionFrame(
  name: string,
  meta?: { title?: string; titleSize?: number; subtitle?: string },
): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "FIXED";
  frame.itemSpacing = 16;
  frame.paddingTop = 24;
  frame.paddingBottom = 24;
  frame.paddingLeft = 24;
  frame.paddingRight = 24;
  frame.cornerRadius = 12;
  frame.fills = [solidPaint(1)];
  frame.strokes = [solidPaint(0.92)];
  frame.strokeWeight = 1;
  frame.resize(SECTION_WIDTH, 100);

  const heading = figma.createText();
  heading.fontName = { family: "Inter", style: "Semi Bold" };
  heading.characters = meta?.title ?? name;
  heading.fontSize = meta?.titleSize ?? 16;
  heading.fills = [solidPaint(0.1)];
  frame.appendChild(heading);

  if (meta?.subtitle) {
    const sub = figma.createText();
    sub.fontName = { family: "Inter", style: "Regular" };
    sub.characters = meta.subtitle;
    sub.fontSize = 12;
    sub.fills = [solidPaint(0.4)];
    frame.appendChild(sub);
  }

  return frame;
}

function createSubSection(parent: FrameNode, title: string): FrameNode {
  const frame = figma.createFrame();
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = 8;
  frame.fills = [];

  const heading = figma.createText();
  heading.fontName = { family: "Inter", style: "Medium" };
  heading.characters = title;
  heading.fontSize = 12;
  heading.fills = [solidPaint(0.3)];

  frame.appendChild(heading);
  parent.appendChild(frame);
  return frame;
}

// Create a horizontal row whose width matches the parent's content area, so
// children can wrap predictably. Used for radius / shadow / blur grids.
function createWrappingRow(parent: FrameNode, spacing: number): FrameNode {
  const frame = figma.createFrame();
  frame.layoutMode = "HORIZONTAL";
  frame.itemSpacing = spacing;
  frame.fills = [];
  const width =
    (parent.width || SECTION_WIDTH) -
    ((parent.paddingLeft ?? 0) + (parent.paddingRight ?? 0));
  frame.resize(Math.max(width, 100), 1);
  frame.primaryAxisSizingMode = "FIXED";
  frame.counterAxisSizingMode = "AUTO";
  frame.layoutWrap = "WRAP";
  frame.counterAxisSpacing = spacing;
  parent.appendChild(frame);
  return frame;
}

function createVertical(parent: FrameNode, spacing: number): FrameNode {
  const frame = figma.createFrame();
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = spacing;
  frame.fills = [];
  parent.appendChild(frame);
  return frame;
}

// One row in a label / value table. Fixed counter-axis alignment keeps the
// label baseline aligned with the sample even when the sample is taller.
function createTableRow(parent: FrameNode, _labelWidth: number): FrameNode {
  const frame = figma.createFrame();
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.counterAxisAlignItems = "CENTER";
  frame.itemSpacing = 16;
  frame.fills = [];
  parent.appendChild(frame);
  return frame;
}

function addLabel(
  parent: FrameNode,
  text: string,
  variable: Variable | undefined,
  width: number,
): TextNode {
  const label = figma.createText();
  label.characters = text;
  label.fontSize = 10;
  label.fontName = { family: "Inter", style: "Regular" };
  bindFill(label, variable);
  label.resize(width, 16);
  parent.appendChild(label);
  return label;
}

// ---------- Variable / paint binding helpers ----------

function bindFill(
  node: SceneNode & { fills: ReadonlyArray<Paint> | typeof figma.mixed },
  variable: Variable | undefined,
  fallbackTone?: number,
) {
  if (!variable) {
    if (fallbackTone !== undefined) {
      (node as unknown as { fills: Paint[] }).fills = [
        solidPaint(fallbackTone),
      ];
    }
    return;
  }
  const base: SolidPaint = {
    type: "SOLID",
    color: { r: 0.5, g: 0.5, b: 0.5 },
    opacity: 1,
  };
  const bound = figma.variables.setBoundVariableForPaint(
    base,
    "color",
    variable,
  );
  (node as unknown as { fills: Paint[] }).fills = [bound];
}

function bindStrokeColor(
  node: SceneNode & {
    strokes: ReadonlyArray<Paint>;
  },
  variable: Variable | undefined,
) {
  if (!variable) return;
  const base: SolidPaint = {
    type: "SOLID",
    color: { r: 0.5, g: 0.5, b: 0.5 },
    opacity: 1,
  };
  const bound = figma.variables.setBoundVariableForPaint(
    base,
    "color",
    variable,
  );
  (node as unknown as { strokes: Paint[] }).strokes = [bound];
}

function bindStrokeWeight(node: FrameNode, variable: Variable | undefined) {
  if (!variable) return;
  try {
    node.setBoundVariable("strokeWeight", variable);
  } catch {
    // Some node types don't accept the binding — ignore silently.
  }
}

function bindWidth(node: FrameNode, variable: Variable | undefined) {
  if (!variable) return;
  try {
    node.setBoundVariable("width", variable);
  } catch {
    // ignore
  }
}

function bindOpacity(node: FrameNode, variable: Variable | undefined) {
  if (!variable) return;
  try {
    node.setBoundVariable("opacity", variable);
  } catch {
    // ignore
  }
}

function bindFontSize(node: TextNode, variable: Variable | undefined) {
  if (!variable) return;
  try {
    node.setBoundVariable("fontSize", variable);
  } catch {
    // ignore
  }
}

function bindCornerRadii(node: FrameNode, variable: Variable | undefined) {
  if (!variable) return;
  try {
    node.setBoundVariable("topLeftRadius", variable);
    node.setBoundVariable("topRightRadius", variable);
    node.setBoundVariable("bottomLeftRadius", variable);
    node.setBoundVariable("bottomRightRadius", variable);
  } catch {
    // ignore
  }
}

function bindEffectRadius(
  node: FrameNode,
  effectIndex: number,
  variable: Variable | undefined,
) {
  if (!variable) return;
  const next = node.effects.map((effect, idx) =>
    idx === effectIndex
      ? figma.variables.setBoundVariableForEffect(effect, "radius", variable)
      : effect,
  );
  node.effects = next;
}

// ---------- Paint / effect primitives ----------

function solidPaint(tone: number): SolidPaint {
  const v = Math.max(0, Math.min(1, tone));
  return { type: "SOLID", color: { r: v, g: v, b: v }, opacity: 1 };
}

function solidPaintRgba(rgba: Rgba): SolidPaint {
  return {
    type: "SOLID",
    color: { r: rgba.r, g: rgba.g, b: rgba.b },
    opacity: rgba.a,
  };
}

function dropShadow(
  x: number,
  y: number,
  radius: number,
  color: RGBA,
): DropShadowEffect {
  return {
    type: "DROP_SHADOW",
    color,
    offset: { x, y },
    radius,
    spread: 0,
    visible: true,
    blendMode: "NORMAL",
    showShadowBehindNode: true,
  };
}

function innerShadow(
  x: number,
  y: number,
  radius: number,
  color: RGBA,
): InnerShadowEffect {
  return {
    type: "INNER_SHADOW",
    color,
    offset: { x, y },
    radius,
    spread: 0,
    visible: true,
    blendMode: "NORMAL",
  };
}

// ---------- Misc helpers ----------

function summarizePreset(
  summary: Record<string, string | undefined> | undefined,
): string {
  if (!summary) return "";
  const parts: string[] = [];
  for (const key of [
    "style",
    "baseColor",
    "theme",
    "font",
    "radius",
  ] as const) {
    const value = summary[key];
    if (value) parts.push(`${key}: ${value}`);
  }
  return parts.join(" · ");
}

function weightStyleName(weight: number): string {
  // Inter ships these named styles; mirror them where possible.
  switch (weight) {
    case 100:
      return "Thin";
    case 200:
      return "Extra Light";
    case 300:
      return "Light";
    case 400:
      return "Regular";
    case 500:
      return "Medium";
    case 600:
      return "Semi Bold";
    case 700:
      return "Bold";
    case 800:
      return "Extra Bold";
    case 900:
      return "Black";
    default:
      return "Regular";
  }
}

async function loadCommonFonts(): Promise<void> {
  const fonts: FontName[] = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "Bold" },
  ];
  // Inter weights used in the typography showcase. Failures are non-fatal —
  // the Figma host may substitute a fallback font with no visible impact.
  const optional: FontName[] = [
    { family: "Inter", style: "Thin" },
    { family: "Inter", style: "Extra Light" },
    { family: "Inter", style: "Light" },
    { family: "Inter", style: "Extra Bold" },
    { family: "Inter", style: "Black" },
  ];
  await Promise.all(fonts.map((font) => figma.loadFontAsync(font)));
  await Promise.allSettled(optional.map((font) => figma.loadFontAsync(font)));
}

function countDescendants(node: SceneNode): number {
  let count = 1;
  if ("children" in node) {
    for (const child of node.children) count += countDescendants(child);
  }
  return count;
}
