// Message contract between the Figma plugin sandbox (code.ts) and UI (ui.ts).

export type UiToPlugin =
  | { type: "generate"; presetCode: string }
  | { type: "cancel" };

export type PluginToUi =
  | { type: "ready" }
  | {
      type: "progress";
      message: string;
      // step/total are optional so legacy progress messages still render. The
      // UI uses them to drive a determinate progress bar.
      step?: number;
      total?: number;
    }
  | {
      type: "done";
      presetCode: string;
      summary: {
        collections: { name: string; variableCount: number }[];
        fallbackThemeColors: number;
        designSystemNodes: number;
        componentsNodes: number;
      };
    }
  | { type: "error"; message: string };
