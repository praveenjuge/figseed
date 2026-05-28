// Builds a "Components" page with real Figma components (ComponentNode /
// ComponentSetNode) so designers can drag instances and swap variants.
//
// Each component is created via figma.createComponent(), grouped into a
// ComponentSet when there are multiple variants. The showcase page then
// places instances of each variant for reference.

import type { PrimitiveVariableMap, ThemeVariableMaps } from "./generator";

// ---------- Layout constants ----------

const PAGE_NAME = "Components";
const SECTION_WIDTH = 1120;
const SECTION_GAP = 32;

// ---------- Public entry ----------

export type ComponentsInputs = {
  presetCode: string;
  presetSummary?: Record<string, string | undefined>;
  primitives: PrimitiveVariableMap;
  theme: ThemeVariableMaps;
  onProgress?: (current: number, total: number, label: string) => void;
};

export type ComponentsResult = { nodeCount: number };

type SectionBuilder = {
  label: string;
  build: (page: PageNode, inputs: ComponentsInputs) => Promise<number>;
};

const SECTIONS: SectionBuilder[] = [
  { label: "Header", build: addHeader },
  { label: "Button", build: addButtonSection },
  { label: "Badge", build: addBadgeSection },
  { label: "Avatar", build: addAvatarSection },
  { label: "Input", build: addInputSection },
  { label: "Card", build: addCardSection },
  { label: "Alert", build: addAlertSection },
  { label: "Switch", build: addSwitchSection },
];

export async function buildComponentsPage(
  inputs: ComponentsInputs,
): Promise<ComponentsResult> {
  await figma.loadAllPagesAsync();

  let page = figma.root.children.find(
    (child) => child.type === "PAGE" && child.name === PAGE_NAME,
  ) as PageNode | undefined;

  if (page) {
    for (const node of [...page.children]) node.remove();
  } else {
    page = figma.createPage();
    page.name = PAGE_NAME;
  }

  await loadCommonFonts();

  const total = SECTIONS.length;
  let count = 0;

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i]!;
    inputs.onProgress?.(i, total, section.label);
    count += await section.build(page, inputs);
    await Promise.resolve();
  }
  inputs.onProgress?.(total, total, "Done");

  layoutSectionsVertically(page);
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

// ---------- Header ----------

async function addHeader(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const frame = createSectionFrame("Components", {
    title: "Components",
    titleSize: 28,
    subtitle: `Starter sheet for ${inputs.presetCode} — every variant and state, bound to the active preset. Each element is a real Figma component you can instance and swap.`,
  });
  page.appendChild(frame);
  return countDescendants(frame);
}

// ---------- BUTTON ----------

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const;
type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const BUTTON_SIZES = ["xs", "sm", "default", "lg", "icon"] as const;
type ButtonSize = (typeof BUTTON_SIZES)[number];

async function addButtonSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Button", {
    title: "Button",
    subtitle:
      "Six variants × five sizes. Each cell is an instance of the Button component set.",
  });

  // Build one ComponentNode per (variant, size) combination, then group
  // them into a ComponentSet so Figma shows a variant picker.
  const components: ComponentNode[] = [];

  for (const variant of BUTTON_VARIANTS) {
    for (const size of BUTTON_SIZES) {
      const comp = buildButtonComponent(inputs, variant, size);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  // Create the component set from all variants.
  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Button";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.layoutWrap = "WRAP";
  componentSet.itemSpacing = 16;
  componentSet.counterAxisSpacing = 16;
  componentSet.paddingTop = 16;
  componentSet.paddingBottom = 16;
  componentSet.paddingLeft = 16;
  componentSet.paddingRight = 16;
  componentSet.primaryAxisSizingMode = "AUTO";
  componentSet.counterAxisSizingMode = "AUTO";
  componentSet.fills = [solidPaint(0.98)];
  componentSet.strokes = [solidPaint(0.9)];
  componentSet.strokeWeight = 1;
  componentSet.cornerRadius = 8;

  // Showcase: place instances in the section frame for visual reference.
  const showcase = createWrappingRow(section, 12);
  for (const variant of BUTTON_VARIANTS) {
    for (const size of BUTTON_SIZES) {
      const comp = components.find(
        (c) => c.name === `Variant=${variant}, Size=${size}`,
      );
      if (comp) {
        const inst = comp.createInstance();
        showcase.appendChild(inst);
      }
    }
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildButtonComponent(
  inputs: ComponentsInputs,
  variant: ButtonVariant,
  size: ButtonSize,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;
  const dims = buttonDimensions(size);

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}, Size=${size}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  comp.itemSpacing = 8;
  comp.fills = [];
  comp.strokes = [];

  if (size === "icon") {
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";
    comp.resize(dims.height, dims.height);
  } else {
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "AUTO";
    comp.paddingLeft = dims.paddingX;
    comp.paddingRight = dims.paddingX;
    comp.paddingTop = dims.paddingY;
    comp.paddingBottom = dims.paddingY;
  }

  comp.cornerRadius = 6;
  bindCornerRadii(comp, p.get("radius/md"));

  // Apply variant fill/stroke.
  applyButtonVariant(comp, variant, t);

  // Label text.
  const label = figma.createText();
  label.fontName = { family: "Inter", style: "Medium" };
  label.characters = size === "icon" ? "★" : "Button";
  label.fontSize = size === "xs" ? 12 : 14;
  bindFontSize(
    label,
    size === "xs" ? p.get("font/size/xs") : p.get("font/size/sm"),
  );
  applyButtonLabelColor(label, variant, t);
  if (variant === "link") {
    label.textDecoration = "UNDERLINE";
  }
  comp.appendChild(label);

  return comp;
}

type ButtonDims = { height: number; paddingX: number; paddingY: number };

function buttonDimensions(size: ButtonSize): ButtonDims {
  switch (size) {
    case "xs":
      return { height: 24, paddingX: 8, paddingY: 4 };
    case "sm":
      return { height: 32, paddingX: 12, paddingY: 6 };
    case "default":
      return { height: 36, paddingX: 16, paddingY: 8 };
    case "lg":
      return { height: 40, paddingX: 24, paddingY: 8 };
    case "icon":
      return { height: 36, paddingX: 0, paddingY: 0 };
  }
}

function applyButtonVariant(
  node: FrameNode | ComponentNode,
  variant: ButtonVariant,
  t: Map<string, Variable>,
) {
  switch (variant) {
    case "default":
      bindFill(node, t.get("primary"));
      break;
    case "secondary":
      bindFill(node, t.get("secondary"));
      break;
    case "destructive":
      bindFill(node, t.get("destructive"));
      break;
    case "outline":
      bindFill(node, t.get("background"));
      bindStrokeColor(node, t.get("border"));
      node.strokeWeight = 1;
      break;
    case "ghost":
      node.fills = [];
      break;
    case "link":
      node.fills = [];
      break;
  }
}

function applyButtonLabelColor(
  node: TextNode,
  variant: ButtonVariant,
  t: Map<string, Variable>,
) {
  switch (variant) {
    case "default":
      bindFill(node, t.get("primary-foreground"));
      break;
    case "secondary":
      bindFill(node, t.get("secondary-foreground"));
      break;
    case "destructive":
      bindFill(node, t.get("destructive-foreground"));
      break;
    case "outline":
    case "ghost":
      bindFill(node, t.get("foreground"));
      break;
    case "link":
      bindFill(node, t.get("primary"));
      break;
  }
}

// ---------- BADGE ----------

const BADGE_VARIANTS = [
  "default",
  "secondary",
  "destructive",
  "outline",
] as const;
type BadgeVariant = (typeof BADGE_VARIANTS)[number];

async function addBadgeSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Badge", {
    title: "Badge",
    subtitle:
      "Four variants — pill-shaped labels for status, counts, and tags.",
  });

  const components: ComponentNode[] = [];
  for (const variant of BADGE_VARIANTS) {
    const comp = buildBadgeComponent(inputs, variant);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Badge";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.itemSpacing = 16;
  componentSet.paddingTop = 16;
  componentSet.paddingBottom = 16;
  componentSet.paddingLeft = 16;
  componentSet.paddingRight = 16;
  componentSet.primaryAxisSizingMode = "AUTO";
  componentSet.counterAxisSizingMode = "AUTO";
  componentSet.fills = [solidPaint(0.98)];
  componentSet.strokes = [solidPaint(0.9)];
  componentSet.strokeWeight = 1;
  componentSet.cornerRadius = 8;

  const showcase = createWrappingRow(section, 12);
  for (const comp of components) {
    showcase.appendChild(comp.createInstance());
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildBadgeComponent(
  inputs: ComponentsInputs,
  variant: BadgeVariant,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  comp.itemSpacing = 4;
  comp.paddingLeft = 10;
  comp.paddingRight = 10;
  comp.paddingTop = 4;
  comp.paddingBottom = 4;
  comp.cornerRadius = 9999;
  bindCornerRadii(comp, p.get("radius/full"));
  comp.fills = [];
  comp.strokes = [];

  switch (variant) {
    case "default":
      bindFill(comp, t.get("primary"));
      break;
    case "secondary":
      bindFill(comp, t.get("secondary"));
      break;
    case "destructive":
      bindFill(comp, t.get("destructive"));
      break;
    case "outline":
      bindStrokeColor(comp, t.get("border"));
      comp.strokeWeight = 1;
      break;
  }

  const label = figma.createText();
  label.fontName = { family: "Inter", style: "Medium" };
  label.characters = "Badge";
  label.fontSize = 12;
  bindFontSize(label, p.get("font/size/xs"));

  switch (variant) {
    case "default":
      bindFill(label, t.get("primary-foreground"));
      break;
    case "secondary":
      bindFill(label, t.get("secondary-foreground"));
      break;
    case "destructive":
      bindFill(label, t.get("destructive-foreground"));
      break;
    case "outline":
      bindFill(label, t.get("foreground"));
      break;
  }

  comp.appendChild(label);
  return comp;
}

// ---------- AVATAR ----------

const AVATAR_SIZES = ["sm", "default", "lg"] as const;
type AvatarSize = (typeof AVATAR_SIZES)[number];

const AVATAR_KINDS = ["image", "fallback"] as const;
type AvatarKind = (typeof AVATAR_KINDS)[number];

const AVATAR_DIMS: Record<AvatarSize, { size: number; fontSize: number }> = {
  sm: { size: 24, fontSize: 10 },
  default: { size: 32, fontSize: 12 },
  lg: { size: 40, fontSize: 14 },
};

async function addAvatarSection(
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
  componentSet.paddingTop = 16;
  componentSet.paddingBottom = 16;
  componentSet.paddingLeft = 16;
  componentSet.paddingRight = 16;
  componentSet.primaryAxisSizingMode = "AUTO";
  componentSet.counterAxisSizingMode = "AUTO";
  componentSet.fills = [solidPaint(0.98)];
  componentSet.strokes = [solidPaint(0.9)];
  componentSet.strokeWeight = 1;
  componentSet.cornerRadius = 8;

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

// ---------- INPUT ----------

const INPUT_STATES = ["default", "focused", "disabled", "invalid"] as const;
type InputState = (typeof INPUT_STATES)[number];

async function addInputSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Input", {
    title: "Input",
    subtitle: "Four states: default, focused, disabled, and invalid.",
  });

  const components: ComponentNode[] = [];
  for (const state of INPUT_STATES) {
    const comp = buildInputComponent(inputs, state);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Input";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  componentSet.paddingTop = 16;
  componentSet.paddingBottom = 16;
  componentSet.paddingLeft = 16;
  componentSet.paddingRight = 16;
  componentSet.primaryAxisSizingMode = "AUTO";
  componentSet.counterAxisSizingMode = "AUTO";
  componentSet.fills = [solidPaint(0.98)];
  componentSet.strokes = [solidPaint(0.9)];
  componentSet.strokeWeight = 1;
  componentSet.cornerRadius = 8;

  const showcase = createVertical(section, 12);
  for (const comp of components) {
    showcase.appendChild(comp.createInstance());
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildInputComponent(
  inputs: ComponentsInputs,
  state: InputState,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `State=${state}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  comp.resize(280, 36);
  comp.paddingLeft = 12;
  comp.paddingRight = 12;
  comp.paddingTop = 8;
  comp.paddingBottom = 8;
  comp.cornerRadius = 6;
  bindCornerRadii(comp, p.get("radius/md"));
  bindFill(comp, t.get("background"));

  // Border per state.
  switch (state) {
    case "focused":
      bindStrokeColor(comp, t.get("ring"));
      comp.strokeWeight = 2;
      comp.effects = [
        {
          type: "DROP_SHADOW",
          color: { r: 0, g: 0, b: 0, a: 0.08 },
          offset: { x: 0, y: 0 },
          radius: 0,
          spread: 3,
          visible: true,
          blendMode: "NORMAL",
          showShadowBehindNode: true,
        },
      ];
      break;
    case "invalid":
      bindStrokeColor(comp, t.get("destructive"));
      comp.strokeWeight = 2;
      break;
    default:
      bindStrokeColor(comp, t.get("input"));
      comp.strokeWeight = 1;
      break;
  }

  const text = figma.createText();
  text.fontName = { family: "Inter", style: "Regular" };
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));

  switch (state) {
    case "default":
      text.characters = "you@example.com";
      bindFill(text, t.get("muted-foreground"));
      break;
    case "focused":
      text.characters = "designer@figma.com";
      bindFill(text, t.get("foreground"));
      break;
    case "disabled":
      text.characters = "you@example.com";
      bindFill(text, t.get("muted-foreground"));
      break;
    case "invalid":
      text.characters = "not-an-email";
      bindFill(text, t.get("foreground"));
      break;
  }

  comp.appendChild(text);

  if (state === "disabled") {
    comp.opacity = 0.5;
  }

  return comp;
}

// ---------- CARD ----------

async function addCardSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Card", {
    title: "Card",
    subtitle:
      "A composable card component with header, content, and footer slots.",
  });

  const comp = buildCardComponent(inputs);
  page.appendChild(comp);

  const showcase = createWrappingRow(section, 24);
  showcase.appendChild(comp.createInstance());

  page.appendChild(section);
  return countDescendants(section) + countDescendants(comp);
}

function buildCardComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Card";
  comp.layoutMode = "VERTICAL";
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  comp.resize(360, 100);
  comp.itemSpacing = 24;
  comp.paddingTop = 24;
  comp.paddingBottom = 24;
  comp.paddingLeft = 24;
  comp.paddingRight = 24;
  comp.cornerRadius = 12;
  bindCornerRadii(comp, p.get("radius/xl"));
  bindFill(comp, t.get("card"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;
  comp.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.05 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
      showShadowBehindNode: true,
    },
  ];

  // Card Header.
  const header = figma.createFrame();
  header.name = "Card Header";
  header.layoutMode = "VERTICAL";
  header.primaryAxisSizingMode = "AUTO";
  header.counterAxisSizingMode = "AUTO";
  header.itemSpacing = 6;
  header.fills = [];

  const title = figma.createText();
  title.fontName = { family: "Inter", style: "Semi Bold" };
  title.characters = "Card Title";
  title.fontSize = 16;
  bindFontSize(title, p.get("font/size/base"));
  bindFill(title, t.get("card-foreground"));
  header.appendChild(title);

  const desc = figma.createText();
  desc.fontName = { family: "Inter", style: "Regular" };
  desc.characters = "Card description goes here with supporting text.";
  desc.fontSize = 14;
  bindFontSize(desc, p.get("font/size/sm"));
  bindFill(desc, t.get("muted-foreground"));
  header.appendChild(desc);

  comp.appendChild(header);

  // Card Content.
  const content = figma.createFrame();
  content.name = "Card Content";
  content.layoutMode = "VERTICAL";
  content.primaryAxisSizingMode = "AUTO";
  content.counterAxisSizingMode = "AUTO";
  content.itemSpacing = 8;
  content.fills = [];

  const body = figma.createText();
  body.fontName = { family: "Inter", style: "Regular" };
  body.characters =
    "This is the card body content area. It can contain any layout.";
  body.fontSize = 14;
  bindFontSize(body, p.get("font/size/sm"));
  bindFill(body, t.get("foreground"));
  content.appendChild(body);

  comp.appendChild(content);

  // Card Footer.
  const footer = figma.createFrame();
  footer.name = "Card Footer";
  footer.layoutMode = "HORIZONTAL";
  footer.primaryAxisSizingMode = "AUTO";
  footer.counterAxisSizingMode = "AUTO";
  footer.primaryAxisAlignItems = "MIN";
  footer.counterAxisAlignItems = "CENTER";
  footer.itemSpacing = 8;
  footer.fills = [];

  const footerText = figma.createText();
  footerText.fontName = { family: "Inter", style: "Regular" };
  footerText.characters = "Card footer";
  footerText.fontSize = 12;
  bindFontSize(footerText, p.get("font/size/xs"));
  bindFill(footerText, t.get("muted-foreground"));
  footer.appendChild(footerText);

  comp.appendChild(footer);

  return comp;
}

// ---------- ALERT ----------

const ALERT_VARIANTS = ["default", "destructive"] as const;
type AlertVariant = (typeof ALERT_VARIANTS)[number];

async function addAlertSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Alert", {
    title: "Alert",
    subtitle: "Default and destructive variants with title and description.",
  });

  const components: ComponentNode[] = [];
  for (const variant of ALERT_VARIANTS) {
    const comp = buildAlertComponent(inputs, variant);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Alert";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  componentSet.paddingTop = 16;
  componentSet.paddingBottom = 16;
  componentSet.paddingLeft = 16;
  componentSet.paddingRight = 16;
  componentSet.primaryAxisSizingMode = "AUTO";
  componentSet.counterAxisSizingMode = "AUTO";
  componentSet.fills = [solidPaint(0.98)];
  componentSet.strokes = [solidPaint(0.9)];
  componentSet.strokeWeight = 1;
  componentSet.cornerRadius = 8;

  const showcase = createVertical(section, 12);
  for (const comp of components) {
    showcase.appendChild(comp.createInstance());
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildAlertComponent(
  inputs: ComponentsInputs,
  variant: AlertVariant,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Variant=${variant}`;
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "MIN";
  comp.resize(480, 10);
  comp.itemSpacing = 12;
  comp.paddingLeft = 16;
  comp.paddingRight = 16;
  comp.paddingTop = 12;
  comp.paddingBottom = 12;
  comp.cornerRadius = 8;
  bindCornerRadii(comp, p.get("radius/lg"));
  bindFill(comp, t.get("card"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;

  // Icon placeholder — a small filled square.
  const icon = figma.createFrame();
  icon.name = "Icon";
  icon.resize(16, 16);
  icon.cornerRadius = 4;
  bindCornerRadii(icon, p.get("radius/sm"));
  if (variant === "destructive") {
    bindFill(icon, t.get("destructive"));
  } else {
    bindFill(icon, t.get("foreground"));
  }
  comp.appendChild(icon);

  // Text column.
  const textCol = figma.createFrame();
  textCol.name = "Text";
  textCol.layoutMode = "VERTICAL";
  textCol.primaryAxisSizingMode = "AUTO";
  textCol.counterAxisSizingMode = "AUTO";
  textCol.itemSpacing = 4;
  textCol.fills = [];
  textCol.layoutGrow = 1;

  const title = figma.createText();
  title.fontName = { family: "Inter", style: "Medium" };
  title.fontSize = 14;
  bindFontSize(title, p.get("font/size/sm"));
  if (variant === "destructive") {
    title.characters = "Error";
    bindFill(title, t.get("destructive"));
  } else {
    title.characters = "Heads up!";
    bindFill(title, t.get("card-foreground"));
  }
  textCol.appendChild(title);

  const desc = figma.createText();
  desc.fontName = { family: "Inter", style: "Regular" };
  desc.fontSize = 14;
  bindFontSize(desc, p.get("font/size/sm"));
  desc.characters =
    variant === "destructive"
      ? "Your session has expired. Please sign in again."
      : "You can add components to your app using the CLI.";
  if (variant === "destructive") {
    bindFill(desc, t.get("destructive"));
    desc.opacity = 0.9;
  } else {
    bindFill(desc, t.get("muted-foreground"));
  }
  textCol.appendChild(desc);

  comp.appendChild(textCol);
  return comp;
}

// ---------- SWITCH ----------

const SWITCH_STATES = ["unchecked", "checked"] as const;
type SwitchState = (typeof SWITCH_STATES)[number];

const SWITCH_SIZES = ["sm", "default"] as const;
type SwitchSize = (typeof SWITCH_SIZES)[number];

const SWITCH_DIMS: Record<SwitchSize, { w: number; h: number; thumb: number }> =
  {
    sm: { w: 28, h: 16, thumb: 12 },
    default: { w: 36, h: 20, thumb: 16 },
  };

async function addSwitchSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Switch", {
    title: "Switch",
    subtitle: "Two sizes × two states (unchecked, checked).",
  });

  const components: ComponentNode[] = [];
  for (const size of SWITCH_SIZES) {
    for (const state of SWITCH_STATES) {
      const comp = buildSwitchComponent(inputs, size, state);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Switch";
  componentSet.layoutMode = "HORIZONTAL";
  componentSet.layoutWrap = "WRAP";
  componentSet.itemSpacing = 16;
  componentSet.counterAxisSpacing = 16;
  componentSet.paddingTop = 16;
  componentSet.paddingBottom = 16;
  componentSet.paddingLeft = 16;
  componentSet.paddingRight = 16;
  componentSet.primaryAxisSizingMode = "AUTO";
  componentSet.counterAxisSizingMode = "AUTO";
  componentSet.fills = [solidPaint(0.98)];
  componentSet.strokes = [solidPaint(0.9)];
  componentSet.strokeWeight = 1;
  componentSet.cornerRadius = 8;

  const showcase = createWrappingRow(section, 16);
  for (const comp of components) {
    showcase.appendChild(comp.createInstance());
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildSwitchComponent(
  inputs: ComponentsInputs,
  size: SwitchSize,
  state: SwitchState,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;
  const dims = SWITCH_DIMS[size];

  const comp = figma.createComponent();
  comp.name = `Size=${size}, State=${state}`;
  // Use absolute positioning for the thumb inside the track.
  comp.layoutMode = "NONE";
  comp.resize(dims.w, dims.h);
  comp.cornerRadius = 9999;
  bindCornerRadii(comp, p.get("radius/full"));

  if (state === "checked") {
    bindFill(comp, t.get("primary"));
  } else {
    bindFill(comp, t.get("input"));
  }

  // Thumb.
  const thumb = figma.createEllipse();
  thumb.name = "Thumb";
  thumb.resize(dims.thumb, dims.thumb);
  bindFill(thumb, t.get("background"));
  const yOffset = (dims.h - dims.thumb) / 2;
  thumb.y = yOffset;
  if (state === "checked") {
    thumb.x = dims.w - dims.thumb - 2;
  } else {
    thumb.x = 2;
  }
  thumb.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.12 },
      offset: { x: 0, y: 1 },
      radius: 2,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
      showShadowBehindNode: true,
    },
  ];
  comp.appendChild(thumb);

  return comp;
}

// ---------- Layout helpers ----------

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

function createWrappingRow(parent: FrameNode, spacing: number): FrameNode {
  const frame = figma.createFrame();
  frame.layoutMode = "HORIZONTAL";
  frame.itemSpacing = spacing;
  frame.fills = [];
  const width =
    (parent.width || SECTION_WIDTH) -
    ((parent.paddingLeft ?? 0) + (parent.paddingRight ?? 0));
  frame.resize(Math.max(width, 100), 10);
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

// ---------- Variable / paint binding helpers ----------

function bindFill(
  node: SceneNode & { fills: ReadonlyArray<Paint> | typeof figma.mixed },
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
  (node as unknown as { fills: Paint[] }).fills = [bound];
}

function bindStrokeColor(
  node: SceneNode & { strokes: ReadonlyArray<Paint> },
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

function bindCornerRadii(
  node: FrameNode | ComponentNode,
  variable: Variable | undefined,
) {
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

function bindFontSize(node: TextNode, variable: Variable | undefined) {
  if (!variable) return;
  try {
    node.setBoundVariable("fontSize", variable);
  } catch {
    // ignore
  }
}

// ---------- Paint primitives ----------

function solidPaint(tone: number): SolidPaint {
  const v = Math.max(0, Math.min(1, tone));
  return { type: "SOLID", color: { r: v, g: v, b: v }, opacity: 1 };
}

// ---------- Misc ----------

async function loadCommonFonts(): Promise<void> {
  const fonts: FontName[] = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "Bold" },
  ];
  await Promise.all(fonts.map((font) => figma.loadFontAsync(font)));
}

function countDescendants(node: SceneNode): number {
  let count = 1;
  if ("children" in node) {
    for (const child of node.children) count += countDescendants(child);
  }
  return count;
}
