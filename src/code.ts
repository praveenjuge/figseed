// Plugin sandbox entry. Runs in Figma's main thread and has access to the
// figma.* APIs.

import { buildDesignSystem } from "./designSystem";
import { generateFromRegistry } from "./generator";
import { decodePreset } from "./preset";
import { resolvePreset } from "./registry";
import type { PluginToUi, UiToPlugin } from "./messages";

figma.showUI(__html__, { width: 360, height: 360, themeColors: true });

post({ type: "ready" });

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
          radius: decoded.radius,
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
      },
    });

    const variableTotal = result.collections.reduce(
      (acc, collection) => acc + collection.variableCount,
      0,
    );
    figma.notify(
      `Figseed: ${variableTotal} variables · Design System page ready (${ds.nodeCount} nodes).`,
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
