// Local resolver that mirrors shadcn's buildRegistryTheme + buildRegistryBase.
// We ship the theme catalogue as JSON so the plugin can run offline — Figma
// plugin iframes have a null origin and ui.shadcn.com doesn't send
// Access-Control-Allow-Origin, so a direct fetch is blocked by CORS.

import {
  decodePreset,
  extractPresetCode,
  isPresetCode,
  type PresetConfig,
} from "./preset";
import themesData from "./data/themes.json";

type ThemeEntry = {
  name: string;
  title?: string;
  type?: string;
  cssVars?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
    theme?: Record<string, string>;
  };
};

const THEMES = themesData as ThemeEntry[];

const BASE_COLOR_NAMES = new Set([
  "neutral",
  "stone",
  "zinc",
  "gray",
  "mauve",
  "olive",
  "mist",
  "taupe",
]);

const RADIUS_VALUES: Record<PresetConfig["radius"], string> = {
  default: "0.625rem",
  none: "0",
  small: "0.45rem",
  medium: "0.625rem",
  large: "0.875rem",
};

export type ResolvedRegistry = {
  name: string;
  config: PresetConfig;
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
};

export type ResolveResult =
  | { ok: true; data: ResolvedRegistry; presetCode: string }
  | { ok: false; error: string };

// Resolve a preset code locally. Returns the same shape we used to fetch.
export function resolvePreset(rawCode: string): ResolveResult {
  const code = extractPresetCode(rawCode) ?? rawCode.trim();
  if (!isPresetCode(code)) {
    return { ok: false, error: "That doesn't look like a shadcn preset code." };
  }
  const decoded = decodePreset(code);
  if (!decoded) {
    return { ok: false, error: "Couldn't decode that preset code." };
  }
  return {
    ok: true,
    presetCode: code,
    data: buildRegistry(decoded),
  };
}

function getTheme(name: string): ThemeEntry | undefined {
  return THEMES.find((theme) => theme.name === name);
}

// Mirrors apps/v4/registry/config.ts buildRegistryTheme + buildRegistryBase,
// minus the icon/dependency wiring we don't need.
function buildRegistry(config: PresetConfig): ResolvedRegistry {
  const baseColor = getTheme(config.baseColor);
  const theme = getTheme(config.theme);

  if (!baseColor || !theme) {
    throw new Error(
      `Missing theme entry for baseColor="${config.baseColor}" or theme="${config.theme}". ` +
        `Update src/data/themes.json from shadcn-ui.`,
    );
  }

  const light: Record<string, string> = {
    ...(baseColor.cssVars?.light ?? {}),
    ...(theme.cssVars?.light ?? {}),
  };
  const dark: Record<string, string> = {
    ...(baseColor.cssVars?.dark ?? {}),
    ...(theme.cssVars?.dark ?? {}),
  };

  // Chart color override (shadcn lets the chart family differ from the theme).
  const chartTheme = getTheme(config.chartColor);
  if (chartTheme) {
    const chartLight = chartTheme.cssVars?.light ?? {};
    const chartDark = chartTheme.cssVars?.dark ?? {};
    for (let i = 1; i <= 5; i++) {
      const key = `chart-${i}`;
      const lightValue = chartLight[key];
      const darkValue = chartDark[key];
      if (lightValue) light[key] = lightValue;
      if (darkValue) dark[key] = darkValue;
    }
  }

  // Menu accent: bold pulls accent from primary.
  if (config.menuAccent === "bold") {
    if (light["primary"]) light["accent"] = light["primary"];
    if (light["primary-foreground"]) {
      light["accent-foreground"] = light["primary-foreground"];
    }
    if (dark["primary"]) dark["accent"] = dark["primary"];
    if (dark["primary-foreground"]) {
      dark["accent-foreground"] = dark["primary-foreground"];
    }
  }

  // Radius: only the light side carries it (matches shadcn behaviour).
  if (config.radius && config.radius !== "default") {
    light["radius"] = RADIUS_VALUES[config.radius];
  }

  return {
    name: `${config.baseColor}-${config.theme}`,
    config,
    cssVars: { light, dark },
  };
}

// Used in tests/inspection — exported so the UI can label what was generated.
export function listAvailableThemes(): string[] {
  return THEMES.map((theme) => theme.name);
}

export function isBaseColor(name: string): boolean {
  return BASE_COLOR_NAMES.has(name);
}
