// tools/contrast.mjs — 1.12 b318: the words over a scene, frame by frame. The grain rule holds a still ground to the
// kit's ink; a scene moves, so this measures instead: every piece of text on screen against the pixels actually behind
// it, over the quiet mode, the whole fifteen-second loop and the finale, and the same text over the plain ground for
// comparison. The glyphs are hidden (-webkit-text-fill-color, so `color` still reads true) and each frame's pixels are
// the background; a line's colour and its opacity chain (the idle fade) are read per frame. The ratio is WCAG's.
// Run: node tools/serve.js 8791 . &  then  node tools/contrast.mjs [kit,kit,…=forest,harbor] [desktop,phone]
// FIXTURE=1 opens the long-time fixture (tools/audit: seven Today lines, eighty-four in Everything) instead of the
// welcome's three, and VIEW=all reads Everything; both leave the finale out (it is the three seed lines' moment).
// Both runs go through the same three phases on the same clock — in use (a key now and then), left alone (the scene's
// loop; the app's own idle fade dims its tools there, on the plain ground too) and the finale (the lines struck) — so a
// row compares like with like: for each phase, the plain ground's worst frame and the scene's, as the 1st percentile of
// the pixels behind that text ("p1": a lone pixel under a letter's edge is a firefly passing, not a line you cannot
// read), and after the arrow the scene's single worst pixel. Screen-reader-only text is left out.
import { createRequire } from "node:module";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const BASE = process.env.BASE || "http://127.0.0.1:8791/";
const KITS = (process.argv[2] || "forest,harbor").split(",");
const VPS = (process.argv[3] || "desktop,phone").split(",");
const VP = { desktop: { viewport: { width: 1440, height: 900 } }, phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } };
const DARK = { forest: true, harbor: false }; // which system scheme puts the kit on (Harbor in Day, Forest in Night)
const wait = ms => new Promise(r => setTimeout(r, ms));
const FIXTURE = !!process.env.FIXTURE, VIEW = process.env.VIEW || "today";
const { seedScript } = await import("./audit/harness.mjs");
const { VERSION } = await import("../version.js"); // the device has seen this version's news: no toast over the words
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
const lum = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
const ratio = (a, b) => { const x = Math.max(a, b), y = Math.min(a, b); return (x + .05) / (y + .05); };

/** every visible piece of text in the app, its colour, its opacity chain and its boxes */
const TEXTS = () => {
  const out = [], shell = document.getElementById("shell");
  const w = document.createTreeWalker(shell, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.textContent.trim() ? 1 : 2) });
  for (let n; (n = w.nextNode());) {
    const el = n.parentElement, cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || el.closest("[hidden], dialog:not([open]), .sr-only")) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const rects = [...rg.getClientRects()].filter(q => q.width > 2 && q.height > 2 && q.bottom > 0 && q.top < innerHeight && q.right > 0 && q.left < innerWidth);
    if (!rects.length) continue;
    let op = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    if (op < .03) continue;
    const c = cs.color.match(/[\d.]+/g).map(Number);
    if ((c[3] === undefined ? 1 : c[3]) * op < .05) continue; // text laid out but not drawn (the finale's line types into a transparent remainder)
    const row = el.closest("#list .row"), id = el.closest("[id]"), cls = el.classList.length ? "." + el.classList[0] : "";
    // a line's own words, or something that rides along inside it (the repeat mark, a section caption): its own row
    let part = ""; for (let e = el; e && row && !e.classList.contains("tx") && e !== row; e = e.parentElement) if (e.classList.length) { part = "." + e.classList[0]; }
    const inTx = row && el.closest(".tx");
    const key = row ? (inTx && !part ? (row.classList.contains("done") ? "line, struck" : "line") : "line's " + (part || cls || el.tagName.toLowerCase())) : (id ? "#" + id.id : "") + cls;
    out.push({ key, text: n.textContent.trim().slice(0, 18), size: parseFloat(cs.fontSize), bold: +cs.fontWeight >= 600, c: [c[0], c[1], c[2], c[3] === undefined ? 1 : c[3]], op, rects: rects.map(q => [q.left, q.top, q.right, q.bottom]) });
  }
  return out;
};
// the glyphs go and their shadows stay: a halo (scenes.css) is part of what a letter sits on
const HIDE = "#shell, #shell * { -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; caret-color: transparent !important; } #shell .ink, #fx, #toast, #whatsnew, #install, #shake-ask, #mark { visibility: hidden !important; } #finale span span { background: none !important; }";
// #fx: the finale's confetti, the app's own and over everything; the toasts and one-time hints: overlays, not the words
// over the picture; the span in the span: the caret the finale's line types behind

async function measure(vp, kit, on) {
  const ctx = await browser.newContext({ ...VP[vp], colorScheme: DARK[kit] ? "dark" : "light", bypassCSP: true });
  const device = `{ day: "T1:curated:harbor", night: "T1:curated:forest", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" }, seenVersion: "${VERSION}"${on ? ", scenes: true" : ""} }`;
  if (FIXTURE) await ctx.addInitScript(seedScript() + `;try { if (!sessionStorage.getItem("tf-contrast")) { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device = Object.assign(m.device || {}, ${device}); localStorage.setItem("tf/v2/meta", JSON.stringify(m)); sessionStorage.setItem("tf-contrast", "1"); } } catch (e) {}`);
  else await ctx.addInitScript(`try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: ${device} })); } catch (e) {}`);
  const page = await ctx.newPage(); page.setDefaultTimeout(9000);
  await page.goto(BASE + "?transport=local");
  if (!FIXTURE) { await page.waitForSelector("#welcome:not([hidden])"); await page.evaluate(() => document.getElementById("w-keep").click()); await page.waitForSelector("#p-save[open]"); await page.click("#save-done"); }
  await page.waitForSelector("#list .row"); await wait(900);
  if (VIEW === "all") { await page.click("#v-all"); await page.waitForSelector("#all .row"); await wait(900); }
  const x = await page.$("#install-x"); if (x && await x.isVisible()) await x.click();
  if (on) await page.waitForFunction(() => { const s = window.__tf().scene; return s && s.frames > 0 && (s.running || s.busy); }, null, { timeout: 9000 }); // (on Everything a light kit's is covered, and still)
  if (!VP[vp].hasTouch) await page.mouse.move(2, 2);
  await wait(1200); // the scene's fade-in, the crossfade
  await page.addStyleTag({ content: HIDE });
  const dpr = VP[vp].deviceScaleFactor || 1, phases = { quiet: new Map(), loop: new Map(), finale: new Map() };
  const sample = async (phase) => {
    const texts = await page.evaluate(TEXTS), t = on ? (await page.evaluate(() => window.__tf().scene.t)) : 0;
    const img = PNG.sync.read(await page.screenshot());
    const by = new Map(), most = new Map();
    for (const tx of texts) most.set(tx.key, Math.max(most.get(tx.key) || 0, tx.c[3] * tx.op));
    for (const tx of texts) {
      const a = tx.c[3] * tx.op, tl = [tx.c[0], tx.c[1], tx.c[2]];
      if (a < most.get(tx.key) * .9) continue; // a letter still fading in beside one that has landed (the finale's line) is not read yet either
      const rs = by.get(tx.key) || { ratios: [], meta: tx, a: 0 }; by.set(tx.key, rs); rs.a = Math.max(rs.a, a);
      for (const [l, tp, r, b] of tx.rects) {
        for (let y = Math.max(0, Math.floor(tp * dpr)); y < Math.min(img.height, Math.ceil(b * dpr)); y += 1)
          for (let xx = Math.max(0, Math.floor(l * dpr)); xx < Math.min(img.width, Math.ceil(r * dpr)); xx += 1) {
            const i = (y * img.width + xx) * 4, bg = [img.data[i], img.data[i + 1], img.data[i + 2]];
            const fg = tl.map((v, k) => v * a + bg[k] * (1 - a));
            rs.ratios.push(ratio(lum(...fg), lum(...bg)));
          }
      }
    }
    const rows = phases[phase];
    for (const [key, { ratios, meta, a }] of by) {
      if (!ratios.length) continue;
      ratios.sort((p, q) => p - q);
      const row = rows.get(key) || { meta, frames: [] }; rows.set(key, row);
      row.frames.push({ a, p1: ratios[Math.floor(ratios.length * .01)], min: ratios[0], t: on ? t.toFixed(1) : "" });
    }
  };
  /* a frame counts for a text only while that text is showing: at 90 % of the most it shows in that phase. A line
     fading in, or the tools in the app's own idle fade, are not a line anyone is reading yet (or still). */
  const settle = () => { for (const rows of Object.values(phases)) for (const row of rows.values()) {
    const top = Math.max(...row.frames.map(f => f.a)), live = row.frames.filter(f => f.a >= top * .9);
    const w = live.reduce((x, f) => (f.p1 < x.p1 ? f : x));
    Object.assign(row, { p1: w.p1, at: w.t, min: Math.min(...live.map(f => f.min)), faded: top < .5 });
  } };
  // in use: a key now and then keeps the scene quiet and the app's tools up
  for (let i = 0; i < 6; i++) { await page.keyboard.press("Shift"); await wait(350); await sample("quiet"); }
  // left alone: the loop, read as fast as frames can be for sixteen seconds of it (the plain ground on the same clock)
  // (on Everything the loop waits for Today, so there "left alone" is the quiet scene under the app's own idle fade)
  if (on && VIEW !== "all") { await page.evaluate(() => window.__tfTest.sceneIdle()); await page.waitForFunction(() => window.__tf().scene.level > .95, null, { timeout: 6000 }); } else await wait(1500);
  const t0 = Date.now(); while (Date.now() - t0 < 16000) await sample("loop");
  // the finale: the lines crossed off, and the scene's own moment
  if (!FIXTURE && VIEW !== "all") {
    for (const box of await page.$$("#list .row:not(.done) .check")) { await box.click(); await wait(120); }
    if (on) await page.waitForFunction(() => window.__tf().scene.finale, null, { timeout: 4000 }).catch(() => {}); else await wait(200);
    const t1 = Date.now(); while (Date.now() - t1 < 3400) await sample("finale");
  }
  await ctx.close();
  settle();
  return phases;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const f = r => (r ? r.p1.toFixed(2) : "—").padStart(5);
for (const vp of VPS) for (const kit of KITS) {
  const plain = await measure(vp, kit, false), scene = await measure(vp, kit, true);
  console.log(`\n== ${kit}, ${vp}      p1 of the pixels behind each text, worst frame: plain → scene (the scene's worst single pixel)`);
  console.log("text                          size       in use              left alone (loop)          finale");
  const keys = [...new Set(["quiet", "loop", "finale"].flatMap(ph => [...scene[ph].keys()]))];
  for (const key of keys) {
    const m = (scene.quiet.get(key) || scene.loop.get(key) || scene.finale.get(key)).meta;
    const cell = ph => { const p = plain[ph].get(key), q = scene[ph].get(key); return !q ? "".padEnd(24) : q.faded ? "(not showing)".padEnd(24) : `${f(p)} → ${f(q)} (${q.min.toFixed(2)})`.padEnd(24); };
    console.log(`${(key + " " + JSON.stringify(m.text)).slice(0, 29).padEnd(29)} ${(m.size.toFixed(0) + (m.bold ? "b" : "")).padStart(4)}   ${cell("quiet")}  ${cell("loop")}  ${cell("finale")}`);
  }
}
await browser.close();
