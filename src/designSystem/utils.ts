// Misc helpers shared by the Design System page.

import { loadPresetFonts } from "../fonts";
import type { DesignSystemInputs } from "./types";

export function summarizePreset(
  summary: Record<string, string | undefined> | undefined,
): string {
  if (!summary) return "";
  const parts: string[] = [];
  for (const key of [
    "style",
    "baseColor",
    "theme",
    "font",
    "fontHeading",
    "radius",
  ] as const) {
    const value = summary[key];
    if (value) parts.push(`${key}: ${value}`);
  }
  return parts.join(" · ");
}

export function weightStyleName(weight: number): string {
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

// Load the preset fonts for the Design System page and activate them. Falls
// back to Inter when the inputs don't carry preset fonts (older callers/tests).
export async function loadDesignSystemFonts(
  inputs: DesignSystemInputs,
): Promise<void> {
  const body = inputs.fonts ? inputs.fonts.body : "Inter";
  const heading = inputs.fonts ? inputs.fonts.heading : "Inter";
  await loadPresetFonts({ body, heading, fontVars: inputs.fontVars });
}

// Loads the Inter weights the typography showcase relies on. Kept for hosts
// that want the fallback family available even when the preset uses another
// font; loadDesignSystemFonts already loads Inter as a fallback.
export async function loadCommonFonts(): Promise<void> {
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

export function countDescendants(node: SceneNode): number {
  let count = 1;
  if ("children" in node) {
    for (const child of node.children) count += countDescendants(child);
  }
  return count;
}
