// Sheet: a side panel that slides in from an edge. Mirrors radix-nova's
// SheetContent: `flex flex-col gap-4 bg-popover text-sm text-popover-foreground
// shadow-lg` with `w-3/4 sm:max-w-sm` on the right side and a ghost icon-sm
// close button pinned to the top-right.
//
// Demo content (sheet-demo): a SheetHeader (`flex flex-col gap-0.5 p-4`) with
// `text-base font-medium` title + `text-muted-foreground` description, a body
// (`grid gap-6 px-4`) of label + input pairs, and a SheetFooter (`mt-auto flex
// flex-col gap-2 p-4`) with "Save changes" + "Close" buttons.

import {
  bindCornerRadii,
  bindFill,
  bindFontSize,
  bindStrokeColor,
} from "../bindings";
import { applyFont } from "../../fonts";
import { applyEffectStyle } from "../../effectStyles";
import { createIcon, resolveIconLibrary } from "../../icons";
import { wrapInSectionCard } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const SHEET_WIDTH = 384; // sm:max-w-sm
const SHEET_HEIGHT = 420; // representative panel height (data-[side]:h-full).

export async function addSheetSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const comp = buildSheetComponent(inputs);
  // radix-nova SheetContent uses `shadow-lg`; reference the published style.
  await applyEffectStyle(comp, inputs.effectStyles?.idFor("Shadow/lg"));
  const card = wrapInSectionCard(comp);
  page.appendChild(card);
  return countDescendants(card);
}

function buildSheetComponent(inputs: ComponentsInputs): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = "Sheet";
  comp.layoutMode = "VERTICAL";
  // resize() pins both axes to FIXED; the sheet is a fixed-height side panel,
  // so we keep both axes fixed (it does not hug its content vertically).
  comp.resize(SHEET_WIDTH, SHEET_HEIGHT);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  // `flex flex-col gap-4`. The left border (`data-[side=right]:border-l`)
  // reads as a 1px stroke; padding lives on the inner sections.
  comp.itemSpacing = 16;
  comp.paddingTop = 0;
  comp.paddingBottom = 0;
  comp.paddingLeft = 0;
  comp.paddingRight = 0;
  bindFill(comp, t.get("popover"));
  bindStrokeColor(comp, t.get("border"));
  comp.strokeWeight = 1;
  comp.strokeAlign = "INSIDE";
  comp.clipsContent = true;

  // Header: `flex flex-col gap-0.5 p-4`, with a trailing close button laid out
  // over the top-right corner.
  const headerRow = figma.createFrame();
  headerRow.name = "Header Row";
  headerRow.layoutMode = "HORIZONTAL";
  headerRow.primaryAxisSizingMode = "FIXED";
  headerRow.counterAxisSizingMode = "AUTO";
  headerRow.primaryAxisAlignItems = "SPACE_BETWEEN";
  headerRow.counterAxisAlignItems = "MIN";
  headerRow.itemSpacing = 8;
  headerRow.paddingTop = 16;
  headerRow.paddingBottom = 0;
  headerRow.paddingLeft = 16;
  headerRow.paddingRight = 12;
  headerRow.fills = [];
  headerRow.strokes = [];
  comp.appendChild(headerRow);
  headerRow.layoutSizingHorizontal = "FILL";

  const header = figma.createFrame();
  header.name = "Header";
  header.layoutMode = "VERTICAL";
  header.primaryAxisSizingMode = "AUTO";
  header.counterAxisSizingMode = "AUTO";
  header.itemSpacing = 2;
  header.fills = [];
  header.strokes = [];
  headerRow.appendChild(header);
  header.layoutSizingHorizontal = "FILL";

  const title = figma.createText();
  applyFont(title, "heading", "Medium");
  title.characters = "Edit profile";
  title.fontSize = 16;
  bindFontSize(title, p.get("font/size/base"));
  bindFill(title, t.get("foreground"));
  header.appendChild(title);
  title.layoutSizingHorizontal = "FILL";

  const desc = figma.createText();
  applyFont(desc, "body", "Regular");
  desc.characters =
    "Make changes to your profile here. Click save when you're done.";
  desc.fontSize = 14;
  bindFontSize(desc, p.get("font/size/sm"));
  bindFill(desc, t.get("muted-foreground"));
  header.appendChild(desc);
  desc.layoutSizingHorizontal = "FILL";

  headerRow.appendChild(buildCloseButton(inputs));

  // Body: `grid flex-1 auto-rows-min gap-6 px-4`.
  const body = figma.createFrame();
  body.name = "Body";
  body.layoutMode = "VERTICAL";
  body.primaryAxisSizingMode = "AUTO";
  body.counterAxisSizingMode = "AUTO";
  body.itemSpacing = 24;
  body.paddingLeft = 16;
  body.paddingRight = 16;
  body.fills = [];
  body.strokes = [];
  comp.appendChild(body);
  body.layoutSizingHorizontal = "FILL";

  body.appendChild(buildField(inputs, "Name", "Pedro Duarte"));
  body.appendChild(buildField(inputs, "Username", "@peduarte"));
  for (const child of body.children) {
    (child as FrameNode).layoutSizingHorizontal = "FILL";
  }

  // Footer: `mt-auto flex flex-col gap-2 p-4`. The mt-auto pins it to the
  // bottom; we approximate by letting the body hug and the footer sit last.
  const footer = figma.createFrame();
  footer.name = "Footer";
  footer.layoutMode = "VERTICAL";
  footer.primaryAxisSizingMode = "AUTO";
  footer.counterAxisSizingMode = "AUTO";
  footer.itemSpacing = 8;
  footer.paddingTop = 16;
  footer.paddingBottom = 16;
  footer.paddingLeft = 16;
  footer.paddingRight = 16;
  footer.fills = [];
  footer.strokes = [];
  comp.appendChild(footer);
  footer.layoutSizingHorizontal = "FILL";

  const save = buildButton(inputs, "Save changes", "default");
  footer.appendChild(save);
  save.layoutSizingHorizontal = "FILL";
  save.primaryAxisAlignItems = "CENTER";

  const close = buildButton(inputs, "Close", "outline");
  footer.appendChild(close);
  close.layoutSizingHorizontal = "FILL";
  close.primaryAxisAlignItems = "CENTER";

  // Let the body absorb the extra vertical space so the footer sits at the
  // bottom edge (mirrors `mt-auto`).
  body.layoutGrow = 1;

  return comp;
}

function buildCloseButton(inputs: ComponentsInputs): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const btn = figma.createFrame();
  btn.name = "Close";
  btn.layoutMode = "HORIZONTAL";
  btn.primaryAxisAlignItems = "CENTER";
  btn.counterAxisAlignItems = "CENTER";
  btn.resize(28, 28);
  btn.primaryAxisSizingMode = "FIXED";
  btn.counterAxisSizingMode = "FIXED";
  btn.cornerRadius = 6;
  bindCornerRadii(btn, p.get("radius/md"));
  btn.fills = [];
  btn.strokes = [];

  const icon = createIcon({
    library: resolveIconLibrary(inputs.presetSummary),
    name: "close",
    size: 16,
    color: t.get("muted-foreground"),
  });
  if (icon) {
    icon.name = "Icon";
    btn.appendChild(icon);
    return btn;
  }

  const glyph = figma.createText();
  applyFont(glyph, "body", "Regular");
  glyph.characters = "✕";
  glyph.fontSize = 14;
  bindFontSize(glyph, p.get("font/size/sm"));
  bindFill(glyph, t.get("muted-foreground"));
  btn.appendChild(glyph);
  return btn;
}

// A label + input pair stacked vertically (`grid gap-3`), matching the sheet
// demo form rows.
function buildField(
  inputs: ComponentsInputs,
  labelText: string,
  value: string,
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const field = figma.createFrame();
  field.name = "Field";
  field.layoutMode = "VERTICAL";
  field.primaryAxisSizingMode = "AUTO";
  field.counterAxisSizingMode = "AUTO";
  field.itemSpacing = 12;
  field.fills = [];
  field.strokes = [];

  const label = figma.createText();
  applyFont(label, "body", "Medium");
  label.characters = labelText;
  label.fontSize = 14;
  bindFontSize(label, p.get("font/size/sm"));
  bindFill(label, t.get("foreground"));
  field.appendChild(label);

  // Input — mirrors radix-nova's Input (`h-8 px-2.5 rounded-lg`).
  const input = figma.createFrame();
  input.name = "Input";
  input.layoutMode = "HORIZONTAL";
  input.counterAxisSizingMode = "FIXED";
  input.primaryAxisSizingMode = "FIXED";
  input.counterAxisAlignItems = "CENTER";
  input.resize(160, 32);
  input.paddingLeft = 10;
  input.paddingRight = 10;
  input.cornerRadius = 8;
  bindCornerRadii(input, p.get("radius/lg"));
  bindFill(input, t.get("background"));
  bindStrokeColor(input, t.get("input"));
  input.strokeWeight = 1;
  field.appendChild(input);
  input.layoutSizingHorizontal = "FILL";

  const inputText = figma.createText();
  applyFont(inputText, "body", "Regular");
  inputText.characters = value;
  inputText.fontSize = 14;
  bindFontSize(inputText, p.get("font/size/sm"));
  bindFill(inputText, t.get("foreground"));
  input.appendChild(inputText);

  return field;
}

function buildButton(
  inputs: ComponentsInputs,
  label: string,
  variant: "default" | "outline",
): FrameNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const btn = figma.createFrame();
  btn.name = `Button (${variant})`;
  btn.layoutMode = "HORIZONTAL";
  btn.primaryAxisSizingMode = "FIXED";
  btn.counterAxisSizingMode = "FIXED";
  btn.primaryAxisAlignItems = "CENTER";
  btn.counterAxisAlignItems = "CENTER";
  btn.paddingLeft = 10;
  btn.paddingRight = 10;
  btn.resize(120, 32);
  btn.cornerRadius = 8;
  bindCornerRadii(btn, p.get("radius/lg"));
  btn.strokes = [];

  if (variant === "outline") {
    bindFill(btn, t.get("background"));
    bindStrokeColor(btn, t.get("border"));
    btn.strokeWeight = 1;
  } else {
    bindFill(btn, t.get("primary"));
  }

  const text = figma.createText();
  applyFont(text, "body", "Medium");
  text.characters = label;
  text.fontSize = 14;
  bindFontSize(text, p.get("font/size/sm"));
  bindFill(
    text,
    t.get(variant === "outline" ? "foreground" : "primary-foreground"),
  );
  btn.appendChild(text);

  return btn;
}
