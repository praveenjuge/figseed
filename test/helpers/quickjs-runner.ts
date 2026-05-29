// Host-side driver for the QuickJS sandbox harness (Layer 2).
//
// It compiles the *real* sandbox entry (src/code.ts) with the production
// esbuild settings, then runs it inside a genuine QuickJS engine — the same
// family of engine Figma uses in the plugin sandbox. This catches syntax/engine
// gaps (e.g. a stray modern builtin) that the Vitest-transpiled unit tests,
// which run src/*.ts through Vite, would silently let through.
//
// Flow: eval bootstrap (installs figma mock + __figseedDrive) → eval sandbox
// bundle (registers figma.ui.onmessage) → call __figseedDrive(presetCode) →
// drain the VM job queue → read back the JSON result string.

import { build } from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getQuickJS } from "quickjs-emscripten";
import { makeCodeOptions } from "../../scripts/esbuild-config.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

export type PostedMessage = { type: string; [key: string]: unknown };
export type DriveResult = {
  posted: PostedMessage[];
  summary: { collections: { name: string; variableCount: number }[] };
};

async function bundle(entry: string, supported?: Record<string, boolean>) {
  const options = supported
    ? makeCodeOptions({ entry })
    : {
        entryPoints: [entry],
        bundle: true,
        platform: "browser" as const,
        target: ["es2017"],
        format: "iife" as const,
        logLevel: "silent" as const,
      };
  const result = await build({ ...options, write: false, logLevel: "silent" });
  const file = result.outputFiles?.[0];
  if (!file) throw new Error(`esbuild produced no output for ${entry}`);
  return file.text;
}

let cache: { sandbox: string; bootstrap: string } | null = null;

// Both bundles are deterministic per source tree, so build once per process.
async function buildBundles() {
  if (cache) return cache;
  const [sandbox, bootstrap] = await Promise.all([
    // Production downlevel flags — the whole point of the layer.
    bundle(resolve(root, "src/code.ts"), {}),
    bundle(resolve(here, "quickjs-bootstrap.ts")),
  ]);
  cache = { sandbox, bootstrap };
  return cache;
}

// Pump the VM microtask queue to completion. The mock's async methods all
// resolve synchronously (Promise.resolve), so a bounded loop fully settles the
// generate() chain without real async I/O.
function drainJobs(
  runtime: ReturnType<Awaited<ReturnType<typeof getQuickJS>>["newRuntime"]>,
) {
  for (let i = 0; i < 10_000; i++) {
    const pending = runtime.executePendingJobs();
    if (pending.error) {
      const message = pending.error.consume(
        (handle) => handle.toString?.() ?? "unknown job error",
      );
      throw new Error(`QuickJS job error: ${message}`);
    }
    if (pending.value === 0) return; // queue drained
  }
  throw new Error("QuickJS job queue did not drain (possible infinite loop)");
}

export async function runSandboxInQuickJS(
  presetCode: string,
): Promise<DriveResult> {
  const { sandbox, bootstrap } = await buildBundles();
  const QuickJS = await getQuickJS();
  const runtime = QuickJS.newRuntime();
  const context = runtime.newContext();

  try {
    // 1. Bootstrap: figma mock + __html__ + __figseedDrive.
    const boot = context.evalCode(bootstrap);
    if (boot.error) {
      throw new Error(
        `bootstrap eval failed: ${boot.error.consume((h) => context.dump(h))}`,
      );
    }
    boot.value.dispose();

    // 2. The real, downleveled sandbox. This is the assertion that matters:
    //    if code.js uses anything QuickJS can't run, this throws.
    const code = context.evalCode(sandbox);
    if (code.error) {
      throw new Error(
        `sandbox eval failed: ${code.error.consume((h) => context.dump(h))}`,
      );
    }
    code.value.dispose();

    // 3. Kick off the async drive. Returns a VM promise handle.
    const driveCall = context.evalCode(
      `__figseedDrive(${JSON.stringify(presetCode)})`,
    );
    if (driveCall.error) {
      throw new Error(
        `drive call failed: ${driveCall.error.consume((h) => context.dump(h))}`,
      );
    }

    const vmPromise = context.resolvePromise(driveCall.value);
    driveCall.value.dispose();

    // Let the VM settle the promise chain, then read the host-side result.
    drainJobs(runtime);
    const settled = await vmPromise;

    if (settled.error) {
      throw new Error(
        `drive rejected: ${settled.error.consume((h) => context.dump(h))}`,
      );
    }

    const json = settled.value.consume((h) => context.getString(h));
    return JSON.parse(json) as DriveResult;
  } finally {
    context.dispose();
    runtime.dispose();
  }
}
