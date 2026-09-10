#!/usr/bin/env node
// ring.mjs — INK review instrument. Drives a served tree (?transport=local, no backend) with Playwright, applies a
// T2: theme code built from a given accent, opens the danger confirmations (Delete this list everywhere; Remove from
// this device) and the ⋯ menu's Delete row, moves focus there with Tab, and reads (a) the computed outline of the
// focused control, (b) the nearest painted ground behind it, (c) the actual pixels of the ring and of the ground from
// a screenshot. Contrast is WCAG 2.x relative-luminance contrast, computed with the served tree's own theme.js.
//
// usage: node ring.mjs --base http://127.0.0.1:8893/ --theme <path/theme.js of the served tree> --label branch
//                      --codes "026F38:dark,F57185:light" --out <dir>
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith("--") ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true] : []).filter(Boolean));
const BASE = args.base, LABEL = args.label || "tree", OUT = args.out; fs.mkdirSync(OUT, { recursive: true });
const T = await import(pathToFileURL(args.theme).href);
const wait = ms => new Promise(r => setTimeout(r, ms));
const rgbToHex = s => { const m = String(s).match(/\d+(\.\d+)?/g); if (!m) return s; const [r, g, b, a] = m.map(Number); return (a === 0) ? "transparent" : "#" + [r, g, b].map(n => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase(); };
const pxHex = (png, x, y) => { const i = (Math.round(y) * png.width + Math.round(x)) * 4; return "#" + [png.data[i], png.data[i + 1], png.data[i + 2]].map(n => n.toString(16).padStart(2, "0")).join("").toUpperCase(); };
const ratio = (a, b) => (a && b && a !== "transparent" && b !== "transparent") ? +T.contrast(a, b).toFixed(4) : null;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
for (const spec of String(args.codes).split(",").filter(Boolean)) {
  const [hex, base] = spec.split(":");
  const theme = T.derive({ accent: "#" + hex, base, name: "Worst" });
  const code = T.themeCode(theme);
  const ctx = await browser.newContext({ colorScheme: base === "dark" ? "dark" : "light", viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  // the same device shape tools/e2e4.js's fresh() pins, with both slots on the made theme
  await ctx.addInitScript(`try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: { day: ${JSON.stringify(code)}, night: ${JSON.stringify(code)}, switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" } } })); } catch (e) {}`);
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(BASE + "?transport=local");
  await page.waitForSelector("#welcome:not([hidden])");
  await page.evaluate(() => document.getElementById("w-keep").click()); await page.waitForSelector("#p-save[open]"); await page.click("#save-done"); await wait(500);
  await page.waitForSelector("#list .row"); await page.mouse.move(2, 2); await wait(300);
  const tokens = await page.evaluate(() => { const cs = getComputedStyle(document.documentElement); const g = k => cs.getPropertyValue(k).trim(); return { theme: document.documentElement.dataset.theme, base: document.documentElement.dataset.base, accent: g("--accent"), ink: g("--ink"), ink2: g("--ink-2"), ink3: g("--ink-3"), danger: g("--danger"), accentText: g("--accent-text") }; });

  /** Tab until `sel` is the active element and matches :focus-visible (max 20 presses). */
  const tabTo = async sel => { for (let i = 0; i < 20; i++) { const ok = await page.evaluate(s => { const el = document.querySelector(s); return el && document.activeElement === el && el.matches(":focus-visible"); }, sel); if (ok) return i; await page.keyboard.press("Tab"); await wait(60); } return -1; };
  /** Computed outline + nearest painted ancestor ground. */
  const computed = sel => page.evaluate(s => {
    const el = document.querySelector(s); const cs = getComputedStyle(el);
    let g = el.parentElement, ground = null;
    while (g) { const bg = getComputedStyle(g).backgroundColor; if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") { ground = { el: g.tagName.toLowerCase() + (g.id ? "#" + g.id : "") + (g.className && typeof g.className === "string" ? "." + g.className.trim().split(/\s+/).join(".") : ""), bg }; break; } g = g.parentElement; }
    const r = el.getBoundingClientRect();
    return { text: el.textContent.trim(), classes: el.className, focusVisible: el.matches(":focus-visible"), isActive: document.activeElement === el, outlineColor: cs.outlineColor, outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineOffset: cs.outlineOffset, boxShadow: cs.boxShadow, controlBg: cs.backgroundColor, color: cs.color, borderColor: cs.borderTopColor, ground, rect: { x: r.x, y: r.y, w: r.width, h: r.height } };
  }, sel);
  /** Pixels: the ring (outline-offset 2px + 2px width ⇒ 2–4px outside the border box) and the ground beyond it, on the left edge and the bottom edge. */
  const pixels = async (rect, file) => {
    const buf = await page.screenshot({ type: "png" }); fs.writeFileSync(file, buf);
    const png = PNG.sync.read(buf); const cy = rect.y + rect.h / 2, cx = rect.x + rect.w / 2;
    return { ringLeft: pxHex(png, rect.x - 3, cy), groundLeft: pxHex(png, rect.x - 8, cy), ringBottom: pxHex(png, cx, rect.y + rect.h + 3), groundBottom: pxHex(png, cx, rect.y + rect.h + 8), insideControl: pxHex(png, rect.x + 6, cy) };
  };
  const measure = async (flow, sel, file) => {
    const tabs = await tabTo(sel);
    const c = await computed(sel);
    const p = await pixels(c.rect, file);
    const groundHex = c.ground ? rgbToHex(c.ground.bg) : null, ringHex = rgbToHex(c.outlineColor);
    return { flow, sel, tabsPressed: tabs, computed: c, ringHex, groundHex, ringIsAccent: ringHex === tokens.accent.toUpperCase(),
      groundIs: groundHex === tokens.ink2.toUpperCase() ? "--ink-2" : groundHex === tokens.ink3.toUpperCase() ? "--ink-3" : groundHex === tokens.ink.toUpperCase() ? "--ink" : "other",
      contrastComputed: ratio(ringHex, groundHex), pixels: p, contrastPixelsLeft: ratio(p.ringLeft, p.groundLeft), contrastPixelsBottom: ratio(p.ringBottom, p.groundBottom),
      accentOnInk3: ratio(tokens.accent, tokens.ink3), accentOnInk2: ratio(tokens.accent, tokens.ink2), accentOnInk: ratio(tokens.accent, tokens.ink), screenshot: path.basename(file) };
  };
  const escAll = async () => { for (let i = 0; i < 6; i++) { await page.keyboard.press("Escape"); await wait(150); if (!(await page.$("dialog.panel[open]"))) break; } await wait(150); };
  const flows = [];
  // 1. the ⋯ menu's Delete row, then its confirm (Delete this list everywhere)
  await page.click("#more"); await page.waitForSelector("#p-menu[open]"); await wait(250);
  flows.push(await measure("menu: Delete this list everywhere (row)", "#menu-delete", path.join(OUT, `ring-${LABEL}-${hex}-${base}-menu-delete.png`)));
  await page.click('#p-menu [data-act="delete"]'); await page.waitForSelector("#ask[open]"); await wait(300);
  flows.push(await measure("confirm: Delete everywhere (#ask-ok.danger)", "#ask-ok", path.join(OUT, `ring-${LABEL}-${hex}-${base}-ask-delete.png`)));
  await escAll();
  // 2. Lists → › → Remove from this device → its confirm
  await page.click("#more"); await page.waitForSelector("#p-menu[open]"); await wait(200);
  await page.click('#p-menu [data-act="lists"]'); await page.waitForSelector("#p-lists[open]"); await wait(250);
  await page.click("#p-lists .more"); await page.waitForSelector("#p-list[open]"); await wait(250);
  await page.click('#list-detail-menu [data-lact="remove"]'); await page.waitForSelector("#ask[open]"); await wait(300);
  flows.push(await measure("confirm: Remove from this device (#ask-ok.danger)", "#ask-ok", path.join(OUT, `ring-${LABEL}-${hex}-${base}-ask-remove.png`)));
  await escAll();
  results.push({ label: LABEL, base, accentAsked: "#" + hex, code, tokens, flows, pageErrors: errors });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, `ring-${LABEL}.json`), JSON.stringify(results, null, 2) + "\n");
for (const r of results) { console.log(`\n[${r.label}] ${r.base} accent asked #${r.accentAsked.slice(1)} → --accent ${r.tokens.accent} on --ink-2 ${r.tokens.ink2} / --ink-3 ${r.tokens.ink3}; page errors: ${r.pageErrors.length}`); for (const f of r.flows) console.log(`  ${f.flow}: ring ${f.ringHex} (${f.ringIsAccent ? "= --accent" : "NOT the accent"}) on ${f.groundIs} ${f.groundHex} → ${f.contrastComputed}:1 computed; pixels L ${f.pixels.ringLeft}/${f.pixels.groundLeft} → ${f.contrastPixelsLeft}:1, B ${f.pixels.ringBottom}/${f.pixels.groundBottom} → ${f.contrastPixelsBottom}:1; focus-visible=${f.computed.focusVisible} tabs=${f.tabsPressed}; accent on ink-3 ${f.accentOnInk3}, on ink-2 ${f.accentOnInk2}, on ink ${f.accentOnInk}`); }
