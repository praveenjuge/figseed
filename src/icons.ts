// Shared icon rendering used by both the Design System icon showcase and the
// components that embed icons (Button, Alert). It resolves the preset's
// selected icon library, turns curated SVG markup (bundled in src/data/icons.ts)
// into Figma geometry via figma.createNodeFromSvg, and recolors that geometry to
// a theme colour variable so icons follow the active theme.
//
// Sandbox-safe: no DOM, no network. Lives next to code.ts's other imports.
//
// Icon names differ between the five libraries (lucide / hugeicons / tabler /
// phosphor / remixicon), so components ask for a *semantic* icon (e.g. "info",
// "warning") and we pick the first candidate name that exists in the active
// library. The candidate lists below are verified to resolve in every library.

import { ICON_LIBRARIES, type IconLibraryName } from "./data/icons";

// createNodeFromSvg returns a wrapper FRAME holding the geometry as vector/shape
// leaves and resolves `currentColor` to a literal black paint. Container nodes
// (the wrapper frame, nested <g> groups) carry a background fill that would
// paint a solid square over the icon, so we clear it; shape leaves carry the
// real icon paint (stroke for stroke-based libraries, fill for fill-based ones)
// which we rebind to the target colour variable.
const CONTAINER_TYPES: Record<string, true> = {
  FRAME: true,
  GROUP: true,
  COMPONENT: true,
  INSTANCE: true,
  SECTION: true,
};

// Semantic icon name -> ordered candidate names. The first candidate present in
// the active library wins. Verified to resolve across all five libraries.
const SEMANTIC_ICONS = {
  info: ["info", "information-circle", "info-circle", "information-line"],
  warning: [
    "circle-alert",
    "alert-circle",
    "warning-circle",
    "error-warning-line",
    "alert-02",
  ],
  success: [
    "circle-check",
    "check-circle",
    "checkmark-circle-02",
    "checkbox-circle-line",
  ],
  check: ["check", "check-line", "checkmark-circle-02"],
  "arrow-right": ["arrow-right", "arrow-right-line", "arrow-right-01"],
  "chevron-right": [
    "chevron-right",
    "caret-right",
    "arrow-right-s-line",
    "arrow-right-01",
  ],
  "chevron-down": [
    "chevron-down",
    "caret-down",
    "arrow-down-s-line",
    "arrow-down-01",
  ],
  plus: ["plus", "plus-sign", "add-line", "add-circle-line"],
  star: ["star", "star-line"],
  bell: ["bell", "bell-line", "notification-02"],
  close: ["x", "close-line", "cancel-01", "multiplication-sign"],
  command: ["command", "command-line"],
} as const;

export type SemanticIconName = keyof typeof SEMANTIC_ICONS;

// The native size of the bundled markup; createNodeFromSvg yields a 24×24 frame.
const NATIVE_ICON_SIZE = 24;

function bindPaintColor(variable: Variable): SolidPaint {
  const base: SolidPaint = {
    type: "SOLID",
    color: { r: 0.5, g: 0.5, b: 0.5 },
    opacity: 1,
  };
  return figma.variables.setBoundVariableForPaint(
    base,
    "color",
    variable,
  ) as SolidPaint;
}

// Recolor every shape leaf in an icon node to `variable` and clear container
// background fills. Shared with the Design System icon showcase so both stay in
// sync. When `variable` is undefined the node is left at its rendered colour
// (black) — callers should always pass a theme variable.
export function recolorIcon(
  node: SceneNode,
  variable: Variable | undefined,
): void {
  if (CONTAINER_TYPES[node.type]) {
    const withFills = node as SceneNode & { fills?: unknown };
    if ("fills" in node && withFills.fills !== figma.mixed) {
      (node as unknown as { fills: Paint[] }).fills = [];
    }
  } else if (variable) {
    const withFills = node as SceneNode & {
      fills?: ReadonlyArray<Paint> | typeof figma.mixed;
    };
    if (Array.isArray(withFills.fills) && withFills.fills.length > 0) {
      (node as unknown as { fills: Paint[] }).fills = [
        bindPaintColor(variable),
      ];
    }

    const withStrokes = node as SceneNode & { strokes?: ReadonlyArray<Paint> };
    if (Array.isArray(withStrokes.strokes) && withStrokes.strokes.length > 0) {
      (node as unknown as { strokes: Paint[] }).strokes = [
        bindPaintColor(variable),
      ];
    }
  }

  if ("children" in node) {
    for (const child of (node as ChildrenMixin).children as SceneNode[]) {
      recolorIcon(child, variable);
    }
  }
}

export function resolveIconLibrary(
  presetSummary: Record<string, string | undefined> | undefined,
): IconLibraryName {
  const value = presetSummary ? presetSummary["iconLibrary"] : undefined;
  if (value !== undefined && value in ICON_LIBRARIES) {
    return value as IconLibraryName;
  }
  // shadcn defaults to lucide.
  return "lucide";
}

function findIconInner(
  library: IconLibraryName,
  name: SemanticIconName,
): string | undefined {
  const icons = ICON_LIBRARIES[library].icons;
  for (const candidate of SEMANTIC_ICONS[name]) {
    const inner = icons[candidate];
    if (inner !== undefined) return inner;
  }
  return undefined;
}

export type CreateIconOptions = {
  // Which icon library to draw from (use resolveIconLibrary on the preset).
  library: IconLibraryName;
  // Semantic icon to render.
  name: SemanticIconName;
  // Target square size in px (geometry is scaled from the native 24px).
  size: number;
  // Theme colour variable the icon should follow.
  color: Variable | undefined;
};

// Render a semantic icon as a Figma node recolored to `color` and scaled to
// `size`. Returns undefined when the active library has no candidate for the
// requested icon (callers fall back to their previous placeholder).
export function createIcon(options: CreateIconOptions): SceneNode | undefined {
  const inner = findIconInner(options.library, options.name);
  if (inner === undefined) return undefined;

  const svgOpen = ICON_LIBRARIES[options.library].svgOpen;
  const node = figma.createNodeFromSvg(`${svgOpen}${inner}</svg>`);
  node.name = "icon";
  recolorIcon(node, options.color);

  // createNodeFromSvg yields a 24×24 frame; rescale scales the geometry too
  // (plain resize would not). Guard the call so the Node-side test mock, which
  // doesn't implement rescale, simply keeps the 24px node.
  if (options.size !== NATIVE_ICON_SIZE && typeof node.rescale === "function") {
    node.rescale(options.size / NATIVE_ICON_SIZE);
  }

  return node;
}
