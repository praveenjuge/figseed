// Layout helpers shared by the Components page sections.

import { solidPaint } from "./paints";

// Standardised wrapper styling used by every component-set frame on the
// canvas (Button, Badge, Avatar, etc).
export function styleComponentSet(componentSet: ComponentSetNode) {
  componentSet.strokes = [solidPaint(0.9)];
  componentSet.fills = [solidPaint(1)];
  componentSet.strokeWeight = 1;
  componentSet.paddingTop = 16;
  componentSet.paddingBottom = 16;
  componentSet.paddingLeft = 16;
  componentSet.paddingRight = 16;
  componentSet.primaryAxisSizingMode = "AUTO";
  componentSet.counterAxisSizingMode = "AUTO";
}
