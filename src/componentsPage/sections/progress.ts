// Progress: full-width track with a primary fill indicator. Four
// representative values (0%, 33%, 66%, 100%).
//
// Mirrors shadcn's Progress (radix-ui primitive): h-2 rounded-full track
// with `bg-primary/20`, indicator `bg-primary` translated by 100 - value%.
//
// The 20%-tint effect is achieved with `node.opacity` on a dedicated track
// child rather than a paint-level opacity. Figma's
// `setBoundVariableForPaint` ignores `SolidPaint.opacity` once a colour
// variable is bound, so we layer two siblings instead.

import { bindCornerRadii, bindFill } from "../bindings";
import {
  createSectionFrame,
  createVertical,
  styleComponentSet,
} from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const PROGRESS_VALUES = [0, 33, 66, 100] as const;
type ProgressValue = (typeof PROGRESS_VALUES)[number];

const TRACK_WIDTH = 320;
const TRACK_HEIGHT = 8;

export async function addProgressSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const section = createSectionFrame("Progress", {
    title: "Progress",
    subtitle: "Indeterminate-style track with a primary-coloured indicator.",
  });

  const components: ComponentNode[] = [];
  for (const value of PROGRESS_VALUES) {
    const comp = buildProgressComponent(inputs, value);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Progress";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 16;
  styleComponentSet(componentSet);

  const showcase = createVertical(section, 12);
  for (const comp of components) {
    showcase.appendChild(comp.createInstance());
  }

  page.appendChild(section);
  return countDescendants(section) + countDescendants(componentSet);
}

function buildProgressComponent(
  inputs: ComponentsInputs,
  value: ProgressValue,
): ComponentNode {
  const t = inputs.theme.light;
  const p = inputs.primitives;

  const comp = figma.createComponent();
  comp.name = `Value=${value}`;
  // Absolute positioning so the track and indicator stack inside the comp.
  comp.layoutMode = "NONE";
  comp.resize(TRACK_WIDTH, TRACK_HEIGHT);
  comp.cornerRadius = TRACK_HEIGHT / 2;
  bindCornerRadii(comp, p.get("radius/full"));
  comp.clipsContent = true;
  comp.fills = [];
  comp.strokes = [];

  // Track — primary at 20% via node.opacity.
  const track = figma.createRectangle();
  track.name = "Track";
  track.resize(TRACK_WIDTH, TRACK_HEIGHT);
  track.x = 0;
  track.y = 0;
  bindFill(track, t.get("primary"));
  track.opacity = 0.2;
  comp.appendChild(track);

  // Indicator — primary at full opacity, sized to value%.
  if (value > 0) {
    const indicator = figma.createRectangle();
    indicator.name = "Indicator";
    const filled = (TRACK_WIDTH * value) / 100;
    indicator.resize(filled, TRACK_HEIGHT);
    indicator.x = 0;
    indicator.y = 0;
    bindFill(indicator, t.get("primary"));
    comp.appendChild(indicator);
  }

  return comp;
}
