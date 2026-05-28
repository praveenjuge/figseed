// UI thread — runs in an iframe inside Figma. Sends messages to code.ts via
// parent.postMessage and receives them via window.message events.

import { extractPresetCode } from "./preset";
import type { PluginToUi, UiToPlugin } from "./messages";

const input = document.getElementById("preset") as HTMLInputElement;
const generateButton = document.getElementById("generate") as HTMLButtonElement;
const cancelButton = document.getElementById("cancel") as HTMLButtonElement;
const status = document.getElementById("status") as HTMLDivElement;

let busy = false;

function postToPlugin(message: UiToPlugin) {
  parent.postMessage({ pluginMessage: message }, "*");
}

function setStatus(text: string, variant: "info" | "error" | "done" = "info") {
  status.textContent = text;
  status.classList.toggle("error", variant === "error");
  status.classList.toggle("done", variant === "done");
}

function syncGenerateButton() {
  if (busy) {
    generateButton.disabled = true;
    return;
  }
  generateButton.disabled = extractPresetCode(input.value) === null;
}

input.addEventListener("input", syncGenerateButton);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !generateButton.disabled) {
    generateButton.click();
  }
});

generateButton.addEventListener("click", () => {
  const presetCode = extractPresetCode(input.value);
  if (!presetCode) {
    setStatus("Couldn't find a preset code in that input.", "error");
    return;
  }
  busy = true;
  syncGenerateButton();
  setStatus(`Working on it (${presetCode})…`);
  postToPlugin({ type: "generate", presetCode });
});

cancelButton.addEventListener("click", () => {
  postToPlugin({ type: "cancel" });
});

window.addEventListener("message", (event: MessageEvent) => {
  const message = event.data?.pluginMessage as PluginToUi | undefined;
  if (!message) return;

  if (message.type === "ready") {
    syncGenerateButton();
    return;
  }

  if (message.type === "progress") {
    setStatus(message.message);
    return;
  }

  if (message.type === "error") {
    busy = false;
    setStatus(message.message, "error");
    syncGenerateButton();
    return;
  }

  if (message.type === "done") {
    busy = false;
    const total = message.summary.collections.reduce(
      (acc, collection) => acc + collection.variableCount,
      0,
    );
    setStatus(
      `Created ${total} variables across ${message.summary.collections.length} collections.`,
      "done",
    );
    syncGenerateButton();
    return;
  }
});
