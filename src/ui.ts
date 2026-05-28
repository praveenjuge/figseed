// UI thread — runs in an iframe inside Figma. Sends messages to code.ts via
// parent.postMessage and receives them via window.message events.

import { extractPresetCode } from "./preset";
import { POPULAR_PRESETS } from "./popularPresets";
import type { PluginToUi, UiToPlugin } from "./messages";

const input = document.getElementById("preset") as HTMLInputElement;
const generateButton = document.getElementById("generate") as HTMLButtonElement;
const cancelButton = document.getElementById("cancel") as HTMLButtonElement;
const status = document.getElementById("status") as HTMLDivElement;
const progress = document.getElementById("progress") as HTMLDivElement;
const progressBar = progress.querySelector(".bar") as HTMLSpanElement;
const presetsList = document.getElementById("presets-list") as HTMLDivElement;

let busy = false;

function postToPlugin(message: UiToPlugin) {
  parent.postMessage({ pluginMessage: message }, "*");
}

function setStatus(text: string, variant: "info" | "error" | "done" = "info") {
  status.textContent = text;
  status.classList.toggle("error", variant === "error");
  status.classList.toggle("done", variant === "done");
}

// Show the bar and either drive it directly (step + total provided) or run
// the indeterminate stripe while we wait for the next tick.
function updateProgress(step?: number, total?: number) {
  progress.classList.add("visible");
  if (typeof step === "number" && typeof total === "number" && total > 0) {
    progress.classList.remove("indeterminate");
    const pct = Math.max(0, Math.min(100, (step / total) * 100));
    progressBar.style.width = `${pct}%`;
  } else {
    progress.classList.add("indeterminate");
    progressBar.style.width = "";
  }
}

function finishProgress() {
  progress.classList.remove("indeterminate");
  progressBar.style.width = "100%";
  // Fade the bar back out once the run completes — keeps the resting UI
  // clean without removing the element entirely.
  setTimeout(() => {
    progress.classList.remove("visible");
    progressBar.style.width = "0%";
  }, 600);
}

function resetProgress() {
  progress.classList.remove("visible", "indeterminate");
  progressBar.style.width = "0%";
}

function syncGenerateButton() {
  if (busy) {
    generateButton.disabled = true;
    setPresetButtonsDisabled(true);
    return;
  }
  generateButton.disabled = extractPresetCode(input.value) === null;
  setPresetButtonsDisabled(false);
}

function setPresetButtonsDisabled(disabled: boolean) {
  const buttons = presetsList.querySelectorAll<HTMLButtonElement>(
    "button.preset-badge",
  );
  buttons.forEach((button) => {
    button.disabled = disabled;
  });
}

function runPreset(presetCode: string) {
  busy = true;
  syncGenerateButton();
  setStatus(`Working on it (${presetCode})…`);
  updateProgress();
  postToPlugin({ type: "generate", presetCode });
}

function renderPopularPresets() {
  for (const preset of POPULAR_PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-badge";
    button.title = `${preset.description} · ${preset.code}`;
    button.setAttribute("aria-label", `Import ${preset.name} preset`);
    button.textContent = preset.name;

    button.addEventListener("click", () => {
      if (busy) return;
      input.value = preset.code;
      runPreset(preset.code);
    });

    presetsList.appendChild(button);
  }
}

renderPopularPresets();

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
  runPreset(presetCode);
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
    updateProgress(message.step, message.total);
    return;
  }

  if (message.type === "error") {
    busy = false;
    setStatus(message.message, "error");
    resetProgress();
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
      `Created ${total} variables · Design System (${message.summary.designSystemNodes} nodes) · Components (${message.summary.componentsNodes} nodes).`,
      "done",
    );
    finishProgress();
    syncGenerateButton();
    return;
  }
});
