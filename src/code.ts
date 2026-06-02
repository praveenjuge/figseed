// Plugin sandbox entry. Runs in Figma's main thread and has access to the
// figma.* APIs.

import { buildComponentsPage } from "./componentsPage";
import { buildBlocksRegion } from "./blocksPage";
import { buildDesignSystem } from "./designSystem";
import { generateFromRegistry, withShadcnRadius } from "./generator";
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

    // Components and blocks bind their corners to the preset-driven shadcn
    // radius scale (which lives in `shadcn / Theme`), not the fixed Tailwind
    // `radius/*` primitives. Overlay that scale onto the primitives map so the
    // create-preset radius choice flows through every component/block while the
    // Design System reference keeps the canonical Tailwind scale.
    const componentPrimitives = withShadcnRadius(
      result.variables.primitives,
      result.variables.radiusScale,
    );

    post({ type: "progress", message: "Building Design System…" });

    const ds = await buildDesignSystem({
      presetCode: result.presetCode,
      presetSummary,
      tailwindColors: result.variables.tailwindColors,
      primitives: result.variables.primitives,
      theme: result.variables.theme,
      fonts: result.fonts,
      fontVars: result.variables.fonts,
      effectStyles: result.effectStyles,
      textStyles: result.textStyles,
      onProgress: (current, total, label) => {
        post({
          type: "progress",
          message: `Building ${label}…`,
          step: current,
          total,
        });
      },
    });

    post({ type: "progress", message: "Building Components…" });

    const components = await buildComponentsPage({
      presetCode: result.presetCode,
      presetSummary,
      tailwindColors: result.variables.tailwindColors,
      primitives: componentPrimitives,
      theme: result.variables.theme,
      fonts: result.fonts,
      fontVars: result.variables.fonts,
      effectStyles: result.effectStyles,
      textStyles: result.textStyles,
      iconComponents: ds.iconComponents,
      onProgress: (current, total, label) => {
        post({
          type: "progress",
          message: `Building ${label}…`,
          step: current,
          total,
        });
      },
    });

    post({ type: "progress", message: "Building Blocks…" });

    // Everything Niram generates lives on one page (Figma's Starter tier caps
    // a file at 3 pages). The Design System sections render at the top, the
    // Components grid below them, and the blocks region to the right of the
    // grid. The page is resolvable by name here (loadAllPagesAsync ran inside
    // buildComponentsPage) and already holds every component the blocks reuse as
    // live instances.
    const componentsPage = figma.root.children.find(
      (child) => child.type === "PAGE" && child.name === "Niram",
    ) as PageNode | undefined;

    const blocks = componentsPage
      ? await buildBlocksRegion({
          presetCode: result.presetCode,
          presetSummary,
          tailwindColors: result.variables.tailwindColors,
          primitives: componentPrimitives,
          theme: result.variables.theme,
          fonts: result.fonts,
          fontVars: result.variables.fonts,
          effectStyles: result.effectStyles,
          textStyles: result.textStyles,
          targetPage: componentsPage,
          onProgress: (current, total, label) => {
            post({
              type: "progress",
              message: `Building ${label}…`,
              step: current,
              total,
            });
          },
        })
      : { nodeCount: 0 };

    post({
      type: "done",
      presetCode: result.presetCode,
      summary: {
        collections: result.collections,
        fallbackThemeColors: result.fallbackThemeColors,
        designSystemNodes: ds.nodeCount,
        componentsNodes: components.nodeCount,
        blocksNodes: blocks.nodeCount,
      },
    });

    const variableTotal = result.collections.reduce(
      (acc, collection) => acc + collection.variableCount,
      0,
    );
    figma.notify(
      `Niram: ${variableTotal} variables · Design System (${ds.nodeCount} nodes) · Components (${components.nodeCount} nodes) · Blocks (${blocks.nodeCount} nodes).`,
    );
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Unknown error.";
    post({ type: "error", message: messageText });
    figma.notify(`Niram failed: ${messageText}`, { error: true });
  }
}

function post(message: PluginToUi) {
  figma.ui.postMessage(message);
}
