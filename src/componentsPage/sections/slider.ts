// Slider: track + range fill + thumb. Three representative values.
//
// Mirrors shadcn's Slider (radix-ui primitive): muted track, primary range,
// circular thumb with primary border.

import { bindFill, bindStrokeColor } from "../bindings";
import { styleComponentSet } from "../layout";
import type { ComponentsInputs } from "../types";
import { countDescendants } from "../utils";

const SLIDER_VALUES = [25, 50, 75] as const;
type SliderValue = (typeof SLIDER_VALUES)[number];

const TRACK_WIDTH = 280;
const TRACK_HEIGHT = 6;
const THUMB_SIZE = 16;
// Total component height — give the thumb room above and below the track.
const COMP_HEIGHT = THUMB_SIZE;

export async function addSliderSection(
  page: PageNode,
  inputs: ComponentsInputs,
): Promise<number> {
  const components: ComponentNode[] = [];
  for (const value of SLIDER_VALUES) {
    const comp = buildSliderComponent(inputs, value);
    page.appendChild(comp);
    components.push(comp);
  }

  const componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Slider";
  componentSet.layoutMode = "VERTICAL";
  componentSet.itemSpacing = 24;
  styleComponentSet(componentSet);

  return countDescendants(componentSet);
}

function buildSliderComponent(
  inputs: ComponentsInputs,
  value: SliderValue,
): ComponentNode {
  const t = inputs.theme.light;

  const comp = figma.createComponent();
  comp.name = `Value=${value}`;
  // Absolute layout so the track, range, and thumb stack precisely.
  comp.layoutMode = "NONE";
  comp.resize(TRACK_WIDTH, COMP_HEIGHT);
  comp.fills = [];
  comp.clipsContent = false;

  // Track — muted, full width, vertically centred.
  const track = figma.createRectangle();
  track.name = "Track";
  track.resize(TRACK_WIDTH, TRACK_HEIGHT);
  track.x = 0;
  track.y = (COMP_HEIGHT - TRACK_HEIGHT) / 2;
  track.cornerRadius = TRACK_HEIGHT / 2;
  bindFill(track, t.get("muted"));
  comp.appendChild(track);

  // Range — primary fill, from 0 to value%.
  const range = figma.createRectangle();
  range.name = "Range";
  const rangeWidth = Math.max(0, (TRACK_WIDTH * value) / 100);
  range.resize(rangeWidth, TRACK_HEIGHT);
  range.x = 0;
  range.y = (COMP_HEIGHT - TRACK_HEIGHT) / 2;
  range.cornerRadius = TRACK_HEIGHT / 2;
  bindFill(range, t.get("primary"));
  comp.appendChild(range);

  // Thumb — circle, primary border on background fill, centred on range end.
  const thumb = figma.createEllipse();
  thumb.name = "Thumb";
  thumb.resize(THUMB_SIZE, THUMB_SIZE);
  thumb.x = Math.max(0, rangeWidth - THUMB_SIZE / 2);
  thumb.y = (COMP_HEIGHT - THUMB_SIZE) / 2;
  bindFill(thumb, t.get("background"));
  bindStrokeColor(thumb, t.get("primary"));
  thumb.strokeWeight = 1;
  thumb.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.1 },
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
