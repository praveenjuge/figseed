// Plugin sandbox entry. Runs in Figma's main thread and has access to the
// figma.* APIs.

import { buildComponentsPage } from "./componentsPage";
import { buildDesignSystem } from "./designSystem";
import { generateFromRegistry } from "./generator";
import { decodePreset } from "./preset";
import { resolvePreset } from "./registry";
import type { PluginToUi, UiToPlugin } from "./messages";

figma.showUI(__html__, { width: 360, height: 360, themeColors: true });

// `figma.command` is set when the plugin is launched from a manifest menu item
// (the Figma quick-actions command palette / Plugins submenu). It's "" when the
// plugin is run without a menu entry. Forward it so the UI can act on it (e.g.
// auto-shuffle when launched from the "Shuffle a random preset" command).
post({ type: "ready", command: figma.command || undefined });

figma.ui.onmessage = async (message: UiToPlugin) => {
  if (!message || typeof message !== "object") return;

  if (message.type === "cancel") {
    figma.closePlugin();
    return;
  }

  if (message.type === "generate") {
    await handleGenerate(message.presetCode);
  }
};

async function handleGenerate(rawCode: string) {
  const presetCode = rawCode.trim();
  post({ type: "progress", message: "Resolving preset…" });

  const resolved = resolvePreset(presetCode);
  if (!resolved.ok) {
    post({ type: "error", message: resolved.error });
    return;
  }

  post({ type: "progress", message: "Generating Figma variables…" });

  try {
    const decoded = decodePreset(presetCode) ?? undefined;
    const presetSummary = decoded
      ? {
          style: decoded.style,
          baseColor: decoded.baseColor,
          theme: decoded.theme,
          font: decoded.font,
          fontHeading: decoded.fontHeading,
          radius: decoded.radius,
          iconLibrary: decoded.iconLibrary,
        }
      : undefined;

    const result = await generateFromRegistry(resolved.data, {
      presetCode: resolved.presetCode,
      presetSummary,
    });

    post({ type: "progress", message: "Building Design System page…" });

    const ds = await buildDesignSystem({
      presetCode: result.presetCode,
      presetSummary,
      tailwindColors: result.variables.tailwindColors,
      primitives: result.variables.primitives,
      theme: result.variables.theme,
      fonts: result.fonts,
      fontVars: result.variables.fonts,
      onProgress: (current, total, label) => {
        post({
          type: "progress",
          message: `Building ${label}…`,
          step: current,
          total,
        });
      },
    });

    post({ type: "progress", message: "Building Components page…" });

    const components = await buildComponentsPage({
      presetCode: result.presetCode,
      presetSummary,
      tailwindColors: result.variables.tailwindColors,
      primitives: result.variables.primitives,
      theme: result.variables.theme,
      fonts: result.fonts,
      fontVars: result.variables.fonts,
      onProgress: (current, total, label) => {
        post({
          type: "progress",
          message: `Building ${label}…`,
          step: current,
          total,
        });
      },
    });

    post({
      type: "done",
      presetCode: result.presetCode,
      summary: {
        collections: result.collections,
        fallbackThemeColors: result.fallbackThemeColors,
        designSystemNodes: ds.nodeCount,
        componentsNodes: components.nodeCount,
      },
    });

    const variableTotal = result.collections.reduce(
      (acc, collection) => acc + collection.variableCount,
      0,
    );
    figma.notify(
      `Figseed: ${variableTotal} variables · Design System (${ds.nodeCount} nodes) · Components (${components.nodeCount} nodes).`,
    );
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Unknown error.";
    post({ type: "error", message: messageText });
    figma.notify(`Figseed failed: ${messageText}`, { error: true });
  }
}

function post(message: PluginToUi) {
  figma.ui.postMessage(message);
}
