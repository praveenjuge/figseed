// Misc helpers shared by the Design System page.

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
