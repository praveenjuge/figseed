// Renders the master plugin-listing SVG (assets/icon.svg) at the sizes
// Figma's Community listing accepts.
//
// Outputs:
//   assets/icon.png       128×128 — the size Figma uses on the Community page
//   assets/icon@512.png   512×512 — handy for README headers
//   assets/icon@1024.png  1024×1024 — high-res master, useful for press/cover
//
// Run with: node scripts/gen-plugin-icon.mjs
//
// (Separate from scripts/gen-icons.mjs, which builds the in-product shadcn
// icon-library subsets in src/data/icons.ts.)

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const assetsDir = resolve(root, "assets");
mkdirSync(assetsDir, { recursive: true });

const svgPath = resolve(assetsDir, "icon.svg");
const svg = readFileSync(svgPath);

const sizes = [
  { size: 128, out: "icon.png" },
  { size: 512, out: "icon@512.png" },
  { size: 1024, out: "icon@1024.png" },
];

// The SVG viewBox is 1024×1024, so a render density of 96 already produces a
// 1024-wide raster. Cap it to keep us well under sharp's pixel limit while
// still giving the downscaler enough source pixels for AA.
for (const { size, out } of sizes) {
  const density = Math.min(384, Math.max(96, size));
  const buffer = await sharp(svg, { density })
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const outPath = resolve(assetsDir, out);
  writeFileSync(outPath, buffer);
  console.log(`[plugin-icon] wrote ${out} (${buffer.length} bytes)`);
}
