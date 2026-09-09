// tools/mark.mjs — every raster in the project, from one drawing, through one script.
//
// Until 1.11 there were two raster paths and neither started from a drawing. `tools/og.mjs`
// screenshotted `tools/og.html` for the card. `apple/TodaysFive/tools/make-icon.mjs` re-drew the app
// icon from geometry *measured off a PNG*, with a `--check` flag that diffed the redraw against
// `icons/apple-touch-icon.png` so the two copies could not drift apart. Both are retired here.
// `icons/mark.svg` is the drawing now — the same mark, traced from that fitted geometry, not
// redrawn — and everything else is a render of it.
//
//   node tools/mark.mjs                        every raster, in the chosen colourway
//   node tools/mark.mjs --check                measure only; writes nothing, non-zero if a rule breaks
//   node tools/mark.mjs --trace                prove the SVG is still the old icon (see below)
//   node tools/mark.mjs --colourway paper-ink  override the colourway
//   node tools/mark.mjs --accent '#9938FE'     override the accent
//   node tools/mark.mjs --sheet out.png        the contact sheet: every colourway × every accent
//
// The card needs the stylesheet's @font-face rules, so anything that renders it wants a server:
//   node tools/serve.js 8791 . &   (or BASE=http://127.0.0.1:PORT/)
//
// What it writes:
//   icons/icon-192.png  icons/icon-512.png            the manifest set (192 is also <link rel=icon>)
//   icons/icon-512-maskable.png                       purpose=maskable
//   icons/apple-touch-icon.png                        180, what iOS captures for a Home Screen icon
//   icons/og.png                                      1200×630, the card a texted link shows
//   apple/.../AppIcon.appiconset/icon-1024{,-dark,-tinted}.png   iOS 18's three appearances
//
// Every size is a render of the vector at that size — never a downscale of a bigger PNG, which is
// what made the old app icon soft. The mark is NOT scaled per surface: 1.11 keeps the tile and the
// check exactly as they were, and the check already sits well inside the maskable safe circle
// (worst painted radius 323.5 of the 409 allowed), so one geometry serves every surface and
// icon-512 and icon-512-maskable are legitimately the same picture.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { BRAND, brandColourways, brandTiles, brandDark } from "../theme.js";

const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const sharp = require("sharp");

const repo = fileURLToPath(new URL("../", import.meta.url));
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const has = f => process.argv.includes(f);
const abs = p => path.isAbsolute(p) ? p : path.join(repo, p);
const SVG = fs.readFileSync(path.join(repo, "icons/mark.svg"), "utf8");

/* ---------------- rendering ----------------
   The drawing names its two colours as custom properties with fallbacks, so the file opens
   correctly in a browser on its own and this script re-tints it by setting them on :root.       */
function html(svg, { paper, mark, size }) {
  const bare = paper === "transparent";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  :root{--brand-paper:${paper};--brand-mark:${mark}}
  html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden;background:${bare ? "transparent" : paper}}
  svg{display:block;width:${size}px;height:${size}px}
  ${bare ? "#ground{display:none}" : ""}
  </style></head><body>${svg}</body></html>`;
}
async function render(browser, opts, svg = SVG) {
  const p = await browser.newPage({ viewport: { width: opts.size, height: opts.size }, deviceScaleFactor: 1 });
  await p.setContent(html(svg, opts));
  const buf = await p.screenshot({ type: "png", omitBackground: opts.paper === "transparent" });
  await p.close();
  return buf;
}
const dataUri = buf => "data:image/png;base64," + buf.toString("base64");

/* ---------------- measurements ---------------- */

/** Every painted pixel must sit inside the maskable safe circle (80 % of the icon). */
function safeZone(buf, paperHex) {
  const png = PNG.sync.read(buf), n = png.width, c = n / 2, r = 0.4 * n;
  const [pr, pg, pb] = [1, 3, 5].map(i => parseInt(paperHex.slice(i, i + 2), 16));
  let worst = 0, outside = 0, ink = 0;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = (y * n + x) * 4;
    if (Math.abs(png.data[i] - pr) + Math.abs(png.data[i + 1] - pg) + Math.abs(png.data[i + 2] - pb) < 40) continue;
    ink++;
    const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
    if (d > r) { outside++; worst = Math.max(worst, d); }
    else worst = Math.max(worst, d);
  }
  return { outside, worst: worst / n, inkShare: ink / (n * n) };
}
/** iOS refuses an app icon with any transparency. */
function transparentPixels(buf) {
  const png = PNG.sync.read(buf);
  let t = 0;
  for (let i = 3; i < png.data.length; i += 4) if (png.data[i] < 255) t++;
  return t;
}
/** Share of pixels more than a little different between two same-sized PNGs. */
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
/** The drawing with its palette divided out: for each pixel, is it nearer the mark's colour or the
    tile's? That boolean image is the *shape*, and comparing two of them is what "geometry only" has
    to mean once the render and the shipped icon are in different colourways — which they have been
    since 1.11 recoloured the icon with this very script. Before this, `--trace` diffed raw colour
    under a comment promising geometry, and reported 93.84 % of pixels differing for two files whose
    drawing is identical. A guard that cannot pass is not a guard. */
function inkMask(buf, tile, mark) {
  const png = PNG.sync.read(buf);
  const rgb = h => { const c = h.replace("#", ""); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); };
  const t = rgb(tile), m = rgb(mark), sq = x => x * x;
  const bits = new Uint8Array(png.width * png.height);
  for (let i = 0, p = 0; i < png.data.length; i += 4, p++) {
    const dt = sq(png.data[i] - t[0]) + sq(png.data[i + 1] - t[1]) + sq(png.data[i + 2] - t[2]);
    const dm = sq(png.data[i] - m[0]) + sq(png.data[i + 1] - m[1]) + sq(png.data[i + 2] - m[2]);
    bits[p] = dm < dt ? 1 : 0;
  }
  return { bits, width: png.width, height: png.height };
}
/** Share of pixels where two ink masks disagree about being mark or tile. */
function maskDiff(a, b) {
  if (a.width !== b.width || a.height !== b.height) throw new Error("size mismatch");
  let off = 0;
  for (let i = 0; i < a.bits.length; i++) if (a.bits[i] !== b.bits[i]) off++;
  return off / a.bits.length;
}

/* ---------------- the OG card ----------------
   The card is the Today screen, not the mark: what the old card was, on the new palette. The mark
   is deliberately not drawn on it — 1.11 puts the mark where the old one was and nowhere new, and
   the old card never carried one.                                                               */
function ogHtml({ ink, ink2, text, muted, dim, accent, accentHi, hair, hairSolid }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="../styles.css">
<style>
  html,body{width:1200px;height:630px;overflow:hidden;background:${ink}}
  body{font-family:"Lato","Helvetica Neue",Helvetica,Arial,sans-serif;color:${text};position:relative}
  #glow{position:absolute;inset:0;background:radial-gradient(125% 78% at 50% 34%, ${accent}29, ${accent}00 62%)}
  .og-card{position:absolute;inset:0;padding:50px 72px 0 72px;display:flex;flex-direction:column}
  .og-rail{display:flex;align-items:center;justify-content:space-between;font-family:"PT Sans","Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:700;font-size:17px;letter-spacing:.15em;text-transform:uppercase;color:${dim};padding-bottom:18px;border-bottom:1px solid ${hair}}
  .og-rail .og-r{display:flex;align-items:center;gap:22px}
  .og-rail .og-count{color:${muted};letter-spacing:.09em}
  .og-rail .og-count b{color:${accentHi}}
  .og-rail .og-seg{display:inline-flex;border:1px solid ${hair};border-radius:999px;overflow:hidden}
  .og-rail .og-seg span{padding:9px 16px}
  .og-rail .og-seg span.og-on{color:${accentHi};background:${ink2}}
  .og-rail .og-dot{width:9px;height:9px;border-radius:50%;background:${accent};display:inline-block}
  .og-lines{margin-top:70px;display:flex;flex-direction:column;gap:14px}
  .og-row{display:flex;align-items:flex-start;gap:24px;font-size:74px;font-weight:900;letter-spacing:-.025em;line-height:1.1;position:relative}
  .og-box{flex:0 0 auto;width:48px;height:48px;margin-top:20px;border:4px solid ${hairSolid};border-radius:8px;display:grid;place-items:center}
  .og-row.done{color:${dim}}
  .og-row.done .og-box{border-color:${accent};background:${accent}}
  .og-row.done .og-box svg{width:32px;height:32px}
  .og-row.done .og-box path{fill:none;stroke:${ink};stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
  .og-row.done .og-tx{position:relative}
  .og-row.done .og-tx::after{content:"";position:absolute;left:-2px;right:-2px;top:56%;height:6px;border-radius:999px;background:${accent};box-shadow:0 0 12px ${accent}80}
  .og-title{margin-top:auto;padding:30px 0 50px;border-top:1px solid ${hair};display:flex;align-items:baseline;justify-content:space-between;gap:32px}
  .og-title h1{font-size:46px;font-weight:900;letter-spacing:-.02em;color:${text};white-space:nowrap}
  .og-title p{font-family:"PT Sans","Helvetica Neue",Helvetica,Arial,sans-serif;font-size:24px;color:${muted};text-align:right;white-space:nowrap}
</style></head><body>
<div id="glow"></div>
<div class="og-card">
  <div class="og-rail"><span>Monday · September 8</span><span class="og-r"><span class="og-count"><b>1</b>/3</span><span class="og-dot"></span><span class="og-seg"><span class="og-on">Today</span><span>Everything</span></span></span></div>
  <div class="og-lines">
    <div class="og-row done"><span class="og-box"><svg viewBox="0 0 24 24"><path d="M4.5 12.6l5 5.2L19.5 6.4"/></svg></span><span class="og-tx">Call the bank before noon</span></div>
    <div class="og-row"><span class="og-box"></span><span class="og-tx">Walk after lunch</span></div>
    <div class="og-row"><span class="og-box"></span><span class="og-tx">Send the draft to Tatianna</span></div>
  </div>
  <div class="og-title"><h1>Today's Five</h1><p>A short list you keep open on screen all day. Free, no account.</p></div>
</div></body></html>`;
}
// The card is written to a file under tools/ and *navigated to*, never set with setContent: the
// page's own CSP (the <meta> in index.html) survives a setContent on the same document and blocks
// the inline <style>, which renders the card as unstyled black-on-white. It also has to be served
// rather than opened from disk, because it wants the @font-face rules in styles.css.
async function ogPng(browser) {
  const t = brandDark();
  const base = process.env.BASE || "http://127.0.0.1:8791/";
  const tmp = path.join(repo, "tools/.og-render.html");
  fs.writeFileSync(tmp, ogHtml(t));
  try {
    const p = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const res = await p.goto(base + "tools/.og-render.html", { waitUntil: "domcontentloaded" });
    if (!res || !res.ok()) throw new Error(`the card needs a server: node tools/serve.js 8791 . &  (BASE=${base})`);
    await p.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 350));
    const png = await p.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1200, height: 630 } });
    await p.close();
    return png;
  } finally { fs.unlinkSync(tmp); }
}

/* ---------------- the run ---------------- */
const accent = arg("--accent", BRAND.accent);
const tiles = brandTiles(arg("--colourway", BRAND.colourway), accent);
const darkTile = BRAND.darkTile;
const browser = await chromium.launch({ channel: "chrome", headless: true });
let bad = 0;
try {
  if (has("--trace")) {
    // The one test that says the drawing is still the artwork: render it in the OLD colours and
    // compare it with the icon that shipped. **Geometry only**, and since 1.12 b216 that is what it
    // actually does: both images are reduced to an ink mask — mark or tile, per pixel — so the two
    // colourways divide out and what is left is the shape. Rendering in the old colours is now
    // arbitrary rather than load-bearing; it is kept because it proves the mask is doing the work.
    const mine = await render(browser, { paper: "#1A1D21", mark: "#D26128", size: 180 });
    const theirs = fs.readFileSync(path.join(repo, "icons/apple-touch-icon.png"));
    const share = maskDiff(inkMask(mine, "#1A1D21", "#D26128"), inkMask(theirs, tiles.paper, tiles.mark));
    console.log(`trace vs the icon that shipped: ${(share * 100).toFixed(2)} % of pixels differ`);
    if (share > 0.02) { fs.writeFileSync("/tmp/mark-trace-180.png", mine); console.error("over 2 % — the trace has drifted; /tmp/mark-trace-180.png is the render"); bad++; }
  } else if (has("--sheet")) {
    await sheet(arg("--sheet", "shots/contact-sheet.png"));
  } else {
    const probe = await render(browser, { ...tiles, size: 512 });
    const z = safeZone(probe, tiles.paper);
    console.log(`${tiles.id} · ${tiles.paper} tile · ${tiles.mark} check`);
    console.log(`  safe zone ${z.outside === 0 ? "clear" : `BROKEN — ${z.outside} px outside r=0.400`}; worst painted radius ${z.worst.toFixed(3)} of 0.400; ink covers ${(z.inkShare * 100).toFixed(1)} %`);
    if (z.outside) bad++;
    if (!has("--check")) {
      for (const [file, size] of [["icons/icon-192.png", 192], ["icons/icon-512.png", 512], ["icons/icon-512-maskable.png", 512], ["icons/apple-touch-icon.png", 180]]) {
        fs.writeFileSync(path.join(repo, file), await render(browser, { ...tiles, size }));
        console.log(`  ${file} ${size}×${size}`);
      }
      const appdir = path.join(repo, "apple/TodaysFive/TodaysFive/Assets.xcassets/AppIcon.appiconset");
      fs.mkdirSync(appdir, { recursive: true });
      // The dark appearance is Cocoa's ground and accent (BRAND.darkTile), not a darkened version of
      // the light one. iOS composites this variant on its own dark surround, and #D9A066 on #2A1F1A
      // is 7.00:1 — the strongest tile drawn this round. It is the icon's dark half and nothing
      // else: the UI accent is #A86014 on both themes regardless.
      for (const [name, opts, opaque] of [
        ["icon-1024.png", { ...tiles, size: 1024 }, true],
        ["icon-1024-dark.png", { paper: darkTile.tile, mark: darkTile.mark, size: 1024 }, true],
        ["icon-1024-tinted.png", { paper: "transparent", mark: "#FFFFFF", size: 1024 }, false],
      ]) {
        const buf = await render(browser, opts);
        fs.writeFileSync(path.join(appdir, name), buf);
        const t = transparentPixels(buf);
        console.log(`  ${name} 1024×1024, ${t} transparent px${opaque ? " (iOS requires none)" : ""}`);
        if (opaque && t) bad++;
      }
      fs.writeFileSync(path.join(appdir, "Contents.json"), JSON.stringify({
        images: [
          { filename: "icon-1024.png", idiom: "universal", platform: "ios", size: "1024x1024" },
          { appearances: [{ appearance: "luminosity", value: "dark" }], filename: "icon-1024-dark.png", idiom: "universal", platform: "ios", size: "1024x1024" },
          { appearances: [{ appearance: "luminosity", value: "tinted" }], filename: "icon-1024-tinted.png", idiom: "universal", platform: "ios", size: "1024x1024" },
        ], info: { author: "xcode", version: 1 },
      }, null, 2) + "\n");
      const out = path.join(repo, "icons/og.png");
      await sharp(await ogPng(browser)).png({ palette: true, quality: 90, colours: 128, compressionLevel: 9 }).toFile(out);
      const kb = Math.round(fs.statSync(out).size / 1024);
      console.log(`  icons/og.png 1200×630, ${kb} KB${kb > 150 ? " — OVER 150 KB" : ""}`);
      if (kb > 150) bad++;
    }
  }
} finally { await browser.close(); }
process.exitCode = bad ? 1 : 0;

/* ---------------- the contact sheet ----------------
   Every colourway against every accent, at the three sizes that decide it: 1024 (the App Store),
   180 (a Home Screen) and 32 (a browser tab). A colourway with no accent in it appears once.
   `--home <dir>` folds in Home Screen screenshots named <colourway>.png.                        */
async function sheet(out) {
  const homeDir = arg("--home", "");
  const home = (cw, mode) => {
    const f = homeDir && path.join(abs(homeDir), `${cw}-${mode}.png`);
    return f && fs.existsSync(f) ? dataUri(fs.readFileSync(f)) : "";
  };
  const cells = [];
  for (const cw of brandColourways()) {
    const t = brandTiles(cw.id, accent);
    const shots = {};
    for (const size of [1024, 180, 32]) shots[size] = dataUri(await render(browser, { ...t, size }));
    cells.push({ t, chosen: cw.id === BRAND.colourway, shots });
  }
  const darkShot = dataUri(await render(browser, { paper: darkTile.tile, mark: darkTile.mark, size: 1024 }));
  const card = dataUri(await ogPng(browser));

  const cell = c => `<div class="cell${c.chosen ? " on" : ""}">
    <img class="big" src="${c.shots[1024]}" alt="">
    <div class="row"><img class="mid" src="${c.shots[180]}" alt=""><img class="msk" src="${c.shots[180]}" alt=""><img class="sml" src="${c.shots[32]}" alt=""><span class="cap">180 · circle · 32</span></div>
    <div class="lab"><b>${c.t.name}</b>${c.chosen ? " — chosen" : ""}<br>tile <code>${c.t.paper}</code> · check <code>${c.t.mark}</code></div>
    ${["light", "dark"].map(m => home(c.t.id, m) ? `<img class="home" src="${home(c.t.id, m)}" alt=""><div class="cap">Home Screen, ${m}</div>` : "").join("")}</div>`;

  const html = `<style>
    body{margin:0;background:#6E6E72;font:12px/1.45 -apple-system,Helvetica,Arial;padding:20px;color:#fff}
    h1{font-size:17px;margin:0 0 4px} h2{font-size:13px;font-weight:400;opacity:.86;margin:0 0 16px;max-width:1150px}
    h3{font-size:14px;margin:26px 0 10px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start}
    .cell{background:#4A4A4E;border-radius:10px;padding:10px}
    .cell.on{outline:2px solid #A86014}
    .big{width:100%;display:block;border-radius:16px}
    .row{display:flex;align-items:center;gap:10px;margin-top:10px}
    .mid{width:56px;height:56px;border-radius:12px}.msk{width:44px;height:44px;border-radius:50%}.sml{width:32px;height:32px;border-radius:6px}
    .cap{font-size:10px;opacity:.6;margin:4px 0 8px}
    .lab{margin-top:8px;font-size:11px;line-height:1.5}
    .home{width:100%;border-radius:6px;display:block;margin-top:10px}
    .pair{display:grid;grid-template-columns:1fr 2fr;gap:14px;align-items:start}
    .pair img{width:100%;border-radius:10px;display:block}
    code{font-size:10.5px;background:rgba(0,0,0,.25);padding:1px 3px;border-radius:3px}
  </style>
  <h1>Today's Five 1.11 — the mark, recoloured</h1>
  <h2>Same tile, same check, same proportions. <code>node tools/mark.mjs --trace</code> renders the drawing in the old colours and diffs it against the icon that shipped. Big tile is 1024; then 180 (a Home Screen), the same 180 under a circular Android mask, and 32 (a browser tab).</h2>
  <div class="grid">${cells.map(cell).join("")}</div>
  <h3>The app icon's dark appearance, and the card</h3>
  <div class="pair"><img src="${darkShot}" alt=""><img src="${card}" alt=""></div>`;
  const p = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
  await p.setContent(html);
  const dest = abs(out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await p.screenshot({ path: dest, fullPage: true });
  await p.close();
  console.log(`wrote ${out} — ${cells.length} colourways`);
}
