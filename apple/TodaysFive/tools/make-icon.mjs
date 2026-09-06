// apple/TodaysFive/tools/make-icon.mjs — the app icon, redrawn from the site's own mark.
//
// icons/ tops out at 512 and iOS wants a 1024, opaque and full-bleed (the system rounds the corners
// itself). Upscaling a 180 by 5.7× would be soft, so the mark is redrawn as vector at any size from
// geometry measured off icons/apple-touch-icon.png — which is already exactly the iOS composition:
// full-bleed #1A1D21, the check centred, no padding and no pre-rounded corners.
//
//   node apple/TodaysFive/tools/make-icon.mjs            writes the 1024 into the asset catalogue
//   node apple/TodaysFive/tools/make-icon.mjs --check    also renders a 180 and diffs it against
//                                                        icons/apple-touch-icon.png
//
// Nothing in icons/ is touched. This is the app's copy of the same mark, at the size iOS asks for.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");

const repo = fileURLToPath(new URL("../../../", import.meta.url));
const OUT = fileURLToPath(new URL("../TodaysFive/Assets.xcassets/AppIcon.appiconset/icon-1024.png", import.meta.url));

// Measured off icons/apple-touch-icon.png (180×180) and expressed as fractions of the side, so the
// same numbers draw the mark at any size. The check is a two-segment polyline with round caps and a
// round join; the arms were fitted by least squares over the skeleton, the ends from the ink's
// bounding box less the cap radius.
export const MARK = {
  background: "#1A1D21",          // the site's theme-color
  ink: "#D26128",                 // the modal orange in the site's own icon
  width: 0.0906,                  // stroke width
  points: [                       // left end, vertex, right tip
    [0.2897, 0.5017],
    [0.4244, 0.6658],
    [0.7139, 0.3342]
  ]
};

function svg(size) {
  const w = MARK.width * size;
  const d = MARK.points.map(([x, y], i) => `${i ? "L" : "M"}${(x * size).toFixed(2)} ${(y * size).toFixed(2)}`).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${MARK.background}"/>
  <path d="${d}" fill="none" stroke="${MARK.ink}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

async function render(browser, size) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;padding:0;background:${MARK.background}}</style>${svg(size)}`);
  const buf = await page.screenshot({ type: "png", omitBackground: false });
  await page.close();
  return buf;
}

/** How far the redraw is from the site's own icon, as a share of pixels off by more than a little. */
function diff(aBuf, bBuf) {
  const a = PNG.sync.read(aBuf), b = PNG.sync.read(bBuf);
  if (a.width !== b.width || a.height !== b.height) throw new Error("size mismatch");
  let off = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d > 90) off++;
  }
  return off / (a.width * a.height);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  if (process.argv.includes("--check")) {
    const mine = await render(browser, 180);
    const theirs = fs.readFileSync(path.join(repo, "icons/apple-touch-icon.png"));
    const share = diff(mine, theirs);
    console.log(`redraw vs icons/apple-touch-icon.png: ${(share * 100).toFixed(2)} % of pixels differ`);
    if (share > 0.02) {
      fs.writeFileSync("/tmp/icon-redraw-180.png", mine);
      console.error("that is more than 2 % — the geometry has drifted; /tmp/icon-redraw-180.png is the redraw");
      process.exitCode = 1;
    }
  }
  const big = await render(browser, 1024);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, big);
  const png = PNG.sync.read(big);
  let transparent = 0;
  for (let i = 3; i < png.data.length; i += 4) if (png.data[i] < 255) transparent++;
  console.log(`wrote ${path.relative(repo, OUT)} ${png.width}×${png.height}, ${transparent} transparent pixels (iOS requires none)`);
  if (transparent) process.exitCode = 1;
} finally {
  await browser.close();
}
