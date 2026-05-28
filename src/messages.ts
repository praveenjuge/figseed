// Message contract between the Figma plugin sandbox (code.ts) and UI (ui.ts).

export type UiToPlugin =
  | { type: "generate"; presetCode: string }
  | { type: "cancel" };

export type PluginToUi =
  | { type: "ready" }
  | { type: "progress"; message: string }
  | {
      type: "done";
      presetCode: string;
      summary: {
        collections: { name: string; variableCount: number }[];
        fallbackThemeColors: number;
      };
    }
  | { type: "error"; message: string };
