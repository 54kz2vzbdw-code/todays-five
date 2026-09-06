// tools/shots.js — a screenshot of every surface at 1440×900 and 390×844, for PLAN.md's before/after sets.
// Run: node tools/serve.js 8790 . &  then  node tools/shots.js shots/1.1/after   (the directory is created)
// Steps that a version does not have (the tour before 1.1, the hints after, the Day and Night surfaces before 1.2) are skipped,
// so one script takes both sets.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
let sharp = null; try { sharp = require("sharp"); } catch (e) { /* plain PNGs then */ }
const BASE = process.env.BASE || "http://127.0.0.1:8790/";
const OUT = path.resolve(process.argv[2] || "shots/1.1/after");
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const VIEWPORTS = [["desktop", { viewport: { width: 1440, height: 900 } }, false], ["phone", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, true]];
const wait = ms => new Promise(r => setTimeout(r, ms));
let n = 0;
for (const [label, opts, touch] of VIEWPORTS) {
  const ctx = await browser.newContext({ ...opts, colorScheme: "dark" }); // a dark system, so the after set matches the before set
  const page = await ctx.newPage(); page.setDefaultTimeout(5000);
  const shot = async name => {
    const file = path.join(OUT, label + "-" + name + ".png");
    const hint = await page.$("#install:not([hidden])"); if (hint) { await page.click("#install-x"); await wait(150); }
    await wait(120);
    const buf = await page.screenshot();
    if (sharp) await sharp(buf).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(file); else fs.writeFileSync(file, buf);
    n++; console.log("shot", label, name);
  };
  const press = async sel => { const h = await page.$(sel); if (!h) throw new Error("no " + sel); if (touch) await h.tap(); else { await h.hover(); await h.click(); } };
  const step = async (name, fn) => { try { await fn(); } catch (e) { console.log("skip", label, name, "—", (e.message || e).split("\n")[0]); try { await page.keyboard.press("Escape"); } catch (x) { /* ignore */ } } };
  const esc = async () => { for (let i = 0; i < 5; i++) { if (!(await page.$("dialog[open]"))) break; await page.keyboard.press("Escape"); await wait(250); } }; // 1.4: Escape goes back a level, so keep going until the stack is closed
  const mark = async name => { if (await page.$("#mark:not([hidden])")) await shot(name); };
  const openMore = async act => { await press("#more"); await page.waitForSelector("#p-menu[open]"); if (act) { await page.click(`#p-menu [data-act="${act}"]`); } };
  const hold = async (sel, ms) => { const b = await (await page.$(sel)).boundingBox(); const cdp = await ctx.newCDPSession(page); const x = b.x + Math.min(60, b.width / 2), y = b.y + b.height / 2; await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await wait(ms); return async () => { await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach(); }; };

  await page.goto(BASE + "?transport=local");
  await step("welcome", async () => { await page.waitForSelector("#welcome:not([hidden])"); await wait(200); await shot("welcome"); });
  await step("welcome-played", async () => { if (!(await page.$("#w-keep"))) return; await press("#list .row:first-child .check"); await wait(900); await shot("welcome-played"); }); // 1.3: the welcome is a live list; a tap strikes
  await step("save-link", async () => { if (await page.$("#w-keep")) { await press("#w-skip"); } else await page.click("#w-new"); await page.waitForSelector("#p-save[open]"); await wait(400); await shot("save-link"); if (await page.$("#save-phone:not([hidden])")) { await page.click("#save-phone summary"); await wait(400); await shot("save-link-phone"); } await page.click("#save-done"); await wait(700); });
  await step("tour", async () => { const t = await page.$("#tour:not([hidden])"); if (!t) return; await wait(300); await shot("tour"); await page.click("#tour-skip"); await wait(300); });
  await step("today", async () => { await page.waitForSelector("#list .row"); await page.mouse.move(2, 2); await wait(400); await shot("today"); });
  if (!touch) await step("today-hover", async () => { await page.hover("#list .row:nth-child(2) .tx"); await wait(400); await shot("today-hover"); await page.mouse.move(2, 2); await wait(200); });
  await step("flip", async () => { if (!(await page.$("#daynight"))) return; await press("#daynight"); await wait(170); await shot("flip-mid"); await wait(500); await page.mouse.move(2, 2); await wait(200); await shot("flip-day"); await press("#daynight"); await wait(700); await page.mouse.move(2, 2); await wait(200); });
  await step("menu", async () => { await openMore(); await wait(400); await shot("menu"); await esc(); });
  await step("line-menu", async () => {
    if (touch) {
      const tool = await page.$("#list .row:nth-child(2) .tool.lmenu");
      if (tool && (await tool.boundingBox() || { width: 0 }).width > 2) await tool.tap(); // 1.0 had a ⋯ on the phone; 1.1 hides it from fingers (a hold opens the menu)
      else { const release = await hold("#list .row:nth-child(2) .tx", 650); await mark("hint-drag"); await release(); }
    } else { await page.hover("#list .row:nth-child(2) .tx"); await wait(200); await page.click("#list .row:nth-child(2) .tool.lmenu"); }
    await page.waitForSelector("#p-line[open]"); await wait(400); await shot("line-menu"); await esc();
    await page.mouse.move(2, 2); await wait(200);
  });
  await step("everything", async () => {
    await press("#v-all"); await page.waitForSelector("#all:not([hidden])"); await wait(500);
    await mark("hint-today");
    if (await page.$("#mark:not([hidden])")) { await esc(); await wait(200); }
    await page.mouse.move(2, 2); await wait(200); await shot("everything");
  });
  if (!touch) await step("everything-hover", async () => {
    await page.hover("#all .row:nth-child(2) .tx"); await wait(400); await shot("everything-hover");
    const grip = await page.$("#all .row:nth-child(2) .tool.lmenu"); if (grip) { await grip.hover(); await wait(500); await mark("hint-drag"); await esc(); }
    await page.mouse.move(2, 2); await wait(200);
  });
  await step("hint-menu", async () => {
    if (touch) { const tool = await page.$("#all .row:nth-child(3) .tool.lmenu"); if (tool && (await tool.boundingBox() || { width: 0 }).width > 2) await tool.tap(); else { const r = await hold("#all .row:nth-child(3) .tx", 650); await r(); } await page.waitForSelector("#p-line[open]"); await page.click('#p-line [data-lact="edit"]'); }
    else await page.dblclick("#all .row:nth-child(3) .tx");
    await page.waitForSelector("#all .row.editing"); await wait(200); await page.keyboard.press("Escape"); await wait(500);
    await mark("hint-menu"); if (await page.$("#mark:not([hidden])")) await esc();
  });
  await step("section-menu", async () => {
    await page.click("#addsec"); await page.waitForSelector("#ask[open]"); await page.fill("#ask-input", "Work"); await page.click("#ask-ok"); await wait(400);
    const sel = '#all .sec:not([data-id=""]) .sec-more'; if (!touch) await page.hover('#all .sec:not([data-id=""]) .sec-h'); await press(sel); await page.waitForSelector("#p-sec[open]"); await wait(400); await shot("section-menu"); await esc();
  });
  await step("settings", async () => { await openMore("settings"); await page.waitForSelector("#p-settings[open]"); await wait(400); await shot("settings"); await page.$eval("#p-settings h3:last-of-type", el => el.scrollIntoView({ block: "start" })); await wait(300); await shot("settings-advanced"); await esc(); });
  await step("settings-sound", async () => { await openMore("settings"); await page.waitForSelector("#p-settings[open]"); if (!(await page.$("#set-pack"))) { await esc(); return; } const fresh = await page.$("#set-pack option[value=kalimba]"); if (fresh) { await page.selectOption("#set-pack", "kalimba"); await wait(300); } await page.evaluate(() => { const h = Array.from(document.querySelectorAll("#p-settings h3")).find(x => x.textContent.trim() === "Sound"); if (h) h.scrollIntoView({ block: "start" }); }); await wait(300); await shot("settings-sound"); if (fresh) { await page.selectOption("#set-pack", ""); await wait(150); } await esc(); }); // 1.5: the Sound section, with one of the new packs picked for this device
  await step("settings-theme-back", async () => { if (!(await page.$("#p-theme h2"))) return; await openMore("settings"); await page.waitForSelector("#p-settings[open]"); await page.click('#p-settings [data-set="day"]'); await page.waitForSelector("#p-theme[open]"); await wait(400); if (!(await page.$("#p-theme h2 .back"))) { await esc(); return; } await shot("settings-theme-back"); await esc(); }); // 1.4: ‹ Back at the top-left of a sub-panel
  await step("export-back", async () => { await openMore("settings"); await page.waitForSelector("#p-settings[open]"); await page.click('#p-settings [data-set="export"]'); await page.waitForSelector("#p-export[open]"); await wait(400); if (!(await page.$("#p-export h2 .back"))) { await esc(); return; } await shot("export-back"); await esc(); });
  await step("theme", async () => {
    const chip = await page.$("#theme:not([hidden])");
    if (chip && await chip.isVisible()) await press("#theme");
    else if (await page.$('#p-menu [data-act="theme"]')) { await openMore("theme"); if (await page.$('[data-set="night"]')) { await page.waitForSelector("#p-settings[open]"); await wait(300); await shot("appearance"); await page.click('[data-set="night"]'); } }
    else { await openMore("settings"); await page.waitForSelector("#p-settings[open]"); await page.click('[data-set="theme"]'); }
    await page.waitForSelector("#p-theme[open]"); await wait(400); await shot("theme");
    if (await page.$("#sw-night")) { await page.click('#sw-night .swatch[data-code="T1:curated:dusk"]'); await wait(400); await shot("theme-partner"); }
    await page.$eval("#p-theme h3", el => el.scrollIntoView({ block: "start" })); await wait(300); await shot("theme-builder"); await esc();
  });
  await step("share", async () => { const chip = await page.$("#share"); if (chip && await chip.isVisible()) await press("#share"); else await openMore("share"); await page.waitForSelector("#p-share[open]"); await wait(500); await shot("share"); if (await page.$("#share-friend")) { await page.$eval("#p-share .body", e => { e.scrollTop = e.scrollHeight; }); await wait(300); await shot("share-bottom"); } await esc(); });
  await step("one-thing", async () => { if (!(await page.$("#shuffle"))) return; if (touch) await page.tap("#count"); else await page.keyboard.press("o"); await wait(500); await shot("one-thing"); if (touch) await page.tap("#count"); else await page.keyboard.press("o"); await wait(300); }); // 1.3: ↻ beside the count
  await step("help", async () => { await openMore("help"); await page.waitForSelector("#p-help[open]"); await wait(400); await shot("help"); await esc(); });
  await step("keys", async () => { if (touch) { await openMore("help"); await page.waitForSelector("#p-help[open]"); const b = await page.$("#help-keys"); if (!b) { await esc(); return; } await b.tap(); } else await page.keyboard.press("?"); await page.waitForSelector("#p-keys[open]"); await wait(400); await shot("keys"); await esc(); });
  await step("today-again", async () => { await press("#v-today"); await page.waitForSelector("#today:not([hidden])"); await page.mouse.move(2, 2); await wait(300); });
  if (!touch) await step("idle", async () => { if (!(await page.evaluate(() => "idle" in window.__tf()))) return; await wait(5600); await shot("idle"); await page.mouse.move(700, 400); await wait(400); });
  await step("finale", async () => { // 1.3: three seed lines, and the earlier steps may have crossed them all off — add two, then finish the list
    if (!(await page.$("#list .row:not(.done) .check"))) { const id = await page.evaluate(() => window.__tf().listId); await page.goto(BASE + "?transport=local#/l/" + id + "/add?text=Walk%20the%20dog%0ACall%20the%20engineer%20back"); await wait(1200); }
    for (let i = 0; i < 5; i++) { if (!(await page.$("#list .row:not(.done) .check"))) break; await press("#list .row:not(.done) .check"); await wait(650); } await wait(3200); await shot("finale"); });
  await step("whose", async () => { // 1.4: a second list this device then forgets, opened from a bare link — the one question
    if (!(await page.$("#whose"))) return;
    await openMore("lists"); await page.waitForSelector("#p-lists[open]"); await page.click("#l-new"); await page.waitForSelector("#ask[open]"); await page.fill("#ask-input", "Groceries"); await page.click("#ask-ok"); await wait(1800);
    const other = await page.evaluate(() => window.__tf().listId); const home = await page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists.find(l => l.id !== window.__tf().listId).id);
    await page.goto(BASE + "?transport=local#/l/" + home); await wait(1500);
    await page.evaluate(id => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.lists = m.lists.filter(l => l.id !== id); localStorage.setItem("tf/v2/meta", JSON.stringify(m)); localStorage.removeItem("tf/v3/list/" + id); }, other);
    await page.reload(); await page.waitForFunction(() => window.__tf && window.__tf().listId); await wait(400); // the page's own registry is rebuilt from storage
    await page.goto(BASE + "?transport=local#/l/" + other); await page.waitForFunction(() => document.getElementById("whose").open, null, { timeout: 9000 }); await wait(400); await shot("whose");
    await press('#whose [data-whose="shared"]'); await page.waitForFunction(id => window.__tf().listId === id && !document.getElementById("whose").open, other, { timeout: 9000 }); await wait(800);
    await openMore("lists"); await page.waitForSelector("#p-lists[open]"); await page.click("#l-rename"); await page.waitForSelector("#ask[open]"); await page.fill("#ask-input", "Sarah's groceries"); await page.click("#ask-ok"); await wait(500);
    await shot("today-shared");
    await openMore("lists"); await page.waitForSelector("#p-lists[open]"); await wait(400); await shot("lists-grouped");
    await page.click("#lists-menu .row:last-child .more"); await page.waitForSelector("#p-list[open]"); await wait(400); await shot("list-detail"); await esc();
  });
  // 1.6: the Secret pair, on a version that has it (SECRET=0 leaves it out). The group, both themes, both finales
  // mid-flight; the run ends here because the device keeps the key and the themes it chose.
  if (process.env.SECRET !== "0") await step("secret", async () => {
    if (!(await page.$("#sw-secret"))) return;
    await openMore("theme"); await page.waitForSelector("#p-settings[open]"); await page.click('[data-set="night"]'); await page.waitForSelector("#p-theme[open]");
    await page.fill("#c-import", "SuperPink"); await press("#c-import-go"); await wait(900);
    await page.$eval("#sw-secret-h", el => el.scrollIntoView({ block: "center" })); await wait(300);
    await shot("theme-secret");
    await press('#sw-secret .swatch[data-code="T1:curated:superpink"]'); await wait(500);
    await press("#partner-use"); await wait(500);
    await esc(); await wait(900); await page.mouse.move(2, 2); await wait(500);
    await shot("superpink");
    const refill = async () => {
      const id = await page.evaluate(() => window.__tf().listId);
      for (const box of await page.$$("#list .row.done .check")) { await box.click(); await wait(220); }
      if (!(await page.$("#list .row:not(.done) .check"))) { await page.goto(BASE + "?transport=local#/l/" + id + "/add?text=Walk%20the%20dog%0ACall%20the%20engineer%20back"); await wait(1400); }
      await page.mouse.move(2, 2); await wait(300);
    };
    await refill();
    for (let i = 0; i < 6; i++) { if (!(await page.$("#list .row:not(.done) .check"))) break; await press("#list .row:not(.done) .check"); await wait(600); }
    await wait(1100); await shot("finale-superpink");                              // mid-bloom
    await refill();
    await press("#daynight"); await wait(1000); await page.mouse.move(2, 2); await wait(400);
    await shot("birthday");
    for (let i = 0; i < 6; i++) { if (!(await page.$("#list .row:not(.done) .check"))) break; await press("#list .row:not(.done) .check"); await wait(600); }
    await wait(2600); await shot("finale-birthday");                               // the candles lit, before they go out
  });
  await step("about", async () => { await page.goto(BASE + "about.html"); await wait(600); await shot("about"); });
  await ctx.close();
}
await browser.close();
console.log(`\n${n} screenshots in ${path.relative(process.cwd(), OUT)}`);
