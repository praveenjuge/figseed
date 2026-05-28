import { build, context } from "esbuild";
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = resolve(root, "dist");
mkdirSync(distDir, { recursive: true });

const watch = process.argv.includes("--watch");

// The plugin sandbox runs in QuickJS, which doesn't support optional chaining
// or other ES2020 syntax. Target an older spec so esbuild downlevels it.
const codeOptions = {
  entryPoints: [resolve(root, "src/code.ts")],
  bundle: true,
  outfile: resolve(distDir, "code.js"),
  platform: "browser",
  target: ["es2017"],
  format: "iife",
  logLevel: "info",
  supported: {
    "optional-chain": false,
    "nullish-coalescing": false,
    "logical-assignment": false,
  },
};

const uiOptions = {
  entryPoints: [resolve(root, "src/ui.ts")],
  bundle: true,
  outfile: resolve(distDir, "ui.js"),
  platform: "browser",
  target: ["es2020"],
  format: "iife",
  logLevel: "info",
};

function buildHtml() {
  const template = readFileSync(resolve(root, "src/ui.html"), "utf8");
  const js = readFileSync(resolve(distDir, "ui.js"), "utf8");
  const html = template.replace(
    "<!-- INJECT_UI_SCRIPT -->",
    `<script>${js}</script>`,
  );
  writeFileSync(resolve(distDir, "ui.html"), html);
}

if (watch) {
  const codeCtx = await context(codeOptions);
  const uiCtx = await context({
    ...uiOptions,
    plugins: [
      {
        name: "html-rebuild",
        setup(build) {
          build.onEnd(() => buildHtml());
        },
      },
    ],
  });
  await Promise.all([codeCtx.watch(), uiCtx.watch()]);
  console.log("[figseed] watching for changes…");
} else {
  await build(codeOptions);
  await build(uiOptions);
  buildHtml();
  console.log("[figseed] build complete.");
}
