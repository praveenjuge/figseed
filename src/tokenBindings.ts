// Post-process pass that binds the *non-color* primitive variables (spacing,
// padding, gaps, border widths, corner radii, font sizes) to the nodes the
// Design System and Components pages build.
//
// The section builders set literal pixel values first (so the canvas looks
// right even before a variable resolves) and explicitly bind the handful of
// fields that need precise control (theme color fills, per-size font sizes,
// corner radii). This pass then sweeps the finished tree and binds every
// *remaining* field whose literal value matches a primitive token, so a later
// edit to e.g. `spacing/4` reflows padding and gaps across the generated
// pages instead of leaving them frozen as literals.
//
// It is deliberately conservative:
//   - only binds a field when its literal exactly matches a token value,
//   - never overrides a field a builder already bound,
//   - skips zero values (binding everything to `spacing/0` would be noise),
//   - swallows bindings the host rejects (e.g. padding on a non-auto-layout
//     frame), so it can run over the whole tree without per-node guards.

import {
  BORDER_WIDTH_TOKENS,
  FONT_SIZE_TOKENS,
  RADIUS_TOKENS,
  SPACING_TOKENS,
  type NumberToken,
} from "./primitives";

type VarMap = Map<string, Variable>;

// Reverse a token table into value → name. The first token wins when two
// share a value, which never happens in the current tables.
function byValue(tokens: NumberToken[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const token of tokens) {
    if (!map.has(token.value)) map.set(token.value, token.name);
  }
  return map;
}

const SPACING_BY_VALUE = byValue(SPACING_TOKENS);
const BORDER_WIDTH_BY_VALUE = byValue(BORDER_WIDTH_TOKENS);
const RADIUS_BY_VALUE = byValue(RADIUS_TOKENS);
const FONT_SIZE_BY_VALUE = byValue(FONT_SIZE_TOKENS);

// Auto-layout numeric fields. Padding + gaps map onto the `spacing/*` scale.
const SPACING_FIELDS = [
  "itemSpacing",
  "counterAxisSpacing",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
];

// Uniform + per-side stroke weights map onto the `border-width/*` scale.
const STROKE_FIELDS = [
  "strokeWeight",
  "strokeTopWeight",
  "strokeRightWeight",
  "strokeBottomWeight",
  "strokeLeftWeight",
];

const RADIUS_FIELDS = [
  "topLeftRadius",
  "topRightRadius",
  "bottomLeftRadius",
  "bottomRightRadius",
];

function numberField(node: SceneNode, field: string): number | undefined {
  const value = (node as unknown as Record<string, unknown>)[field];
  // Figma returns `figma.mixed` (a symbol) for mixed values; only act on a
  // concrete number so we never bind a token over a mixed property.
  return typeof value === "number" ? value : undefined;
}

function isBound(node: SceneNode, field: string): boolean {
  const bound = (
    node as unknown as { boundVariables?: Record<string, unknown> }
  ).boundVariables;
  return Boolean(bound && bound[field]);
}

function bindField(
  node: SceneNode,
  field: string,
  value: number | undefined,
  lookup: Map<number, string>,
  group: string,
  primitives: VarMap,
): void {
  if (value === undefined || value <= 0) return;
  if (isBound(node, field)) return;
  const name = lookup.get(value);
  if (name === undefined) return;
  const variable = primitives.get(`${group}/${name}`);
  if (!variable) return;
  try {
    (
      node as unknown as {
        setBoundVariable(field: string, variable: Variable): void;
      }
    ).setBoundVariable(field, variable);
  } catch {
    // The host rejected the binding for this node type — keep the literal.
  }
}

function hasAutoLayout(node: SceneNode): boolean {
  const mode = (node as unknown as { layoutMode?: string }).layoutMode;
  return mode === "HORIZONTAL" || mode === "VERTICAL";
}

function bindNode(node: SceneNode, primitives: VarMap): void {
  // Spacing + padding only resolve on auto-layout frames/components/sets.
  if (hasAutoLayout(node)) {
    for (const field of SPACING_FIELDS) {
      bindField(
        node,
        field,
        numberField(node, field),
        SPACING_BY_VALUE,
        "spacing",
        primitives,
      );
    }
  }

  // Border widths: uniform plus any per-side overrides.
  for (const field of STROKE_FIELDS) {
    bindField(
      node,
      field,
      numberField(node, field),
      BORDER_WIDTH_BY_VALUE,
      "border-width",
      primitives,
    );
  }

  // Corner radius. A uniform `cornerRadius` fans out to the four corner
  // fields; otherwise bind whatever per-corner literals are present. Either
  // way `isBound` skips corners a builder already bound individually.
  const uniformRadius = numberField(node, "cornerRadius");
  for (const field of RADIUS_FIELDS) {
    const value =
      uniformRadius !== undefined ? uniformRadius : numberField(node, field);
    bindField(node, field, value, RADIUS_BY_VALUE, "radius", primitives);
  }

  // Font size on text nodes.
  if (node.type === "TEXT") {
    bindField(
      node,
      "fontSize",
      numberField(node, "fontSize"),
      FONT_SIZE_BY_VALUE,
      "font/size",
      primitives,
    );
  }
}

// Walk a node subtree, binding matching primitive variables on each node.
export function applyTokenBindings(root: SceneNode, primitives: VarMap): void {
  bindNode(root, primitives);
  const children = (root as unknown as { children?: SceneNode[] }).children;
  if (children) {
    for (const child of children) applyTokenBindings(child, primitives);
  }
}
