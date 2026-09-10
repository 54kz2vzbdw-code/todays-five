// (e) Copy link's accent when it comes first.
import { launch, context, freshPage, wait, esc, openListsDetail, log } from "./lib.mjs";
const browser = await launch(); const ctx = await context(browser); const { page, errors } = await freshPage(ctx);
const read = () => page.$$eval("#ask .row-actions > *", els => els.map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { id: e.id || e.textContent.trim(), text: e.textContent.trim(), className: e.className, hidden: e.hidden, left: Math.round(r.left), width: Math.round(r.width), bg: cs.backgroundColor, color: cs.color }; }));
await openListsDetail(page, 1); await page.click('#p-list [data-lact="remove"]'); await page.waitForSelector("#ask[open]"); await wait(300);
log("[E0 saved link] title:", await page.textContent("#ask-title"), "| msg:", (await page.textContent("#ask-msg")).trim()); log("    buttons (DOM order):", await read());
await page.click('#ask [data-close]'); await wait(300); await esc(page);
await page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.lists[0].linkSaved = false; m.lists[0].created = true; m.device.savedGrandfathered = true; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
await page.reload(); await wait(1200); await esc(page); await wait(200);
await openListsDetail(page, 1); await page.click('#p-list [data-lact="remove"]'); await page.waitForSelector("#ask[open]"); await wait(300);
log("[E1 unsaved link] title:", await page.textContent("#ask-title"), "| msg:", (await page.textContent("#ask-msg")).trim()); log("    buttons (DOM order):", await read());
await page.click('#ask [data-close]'); await wait(300); await esc(page); log("page errors:", errors);
await browser.close();
