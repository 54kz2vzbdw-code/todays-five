// verify-c (P11 + P10 probe): one Playwright run against an UNMUTATED 7341981 copy served on 8898.
//   P10: what window.__tf().panels says after ⋯ → Settings (the app.js:1790 comment says the menu is a launcher, not a parent).
//   P11: the Remove sheet's chips — class list, DOM order, computed background/colour — in the saved-link and the
//        never-saved-link variants; plus what the chip WOULD look like with `accent` (toggled in-page for one read).
// Usage: BASE=http://127.0.0.1:8898/ node p11-copylink-accent.mjs   (lib.mjs is the cleanup track's shared Playwright helper)
import { launch, context, freshPage, wait, esc, openListsDetail, openMore, log } from "../cleanup/tools/lib.mjs";
const browser = await launch(); const ctx = await context(browser); const { page, errors } = await freshPage(ctx);
const read = () => page.$$eval("#ask .row-actions > *", els => els.map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { id: e.id || e.textContent.trim(), text: e.textContent.trim(), className: e.className, hidden: e.hidden, left: Math.round(r.left), bg: cs.backgroundColor, color: cs.color }; }));
const probeAccent = () => page.$eval("#ask-extra", e => { e.classList.add("accent"); const cs = getComputedStyle(e); const out = { bg: cs.backgroundColor, color: cs.color }; e.classList.remove("accent"); return out; });

// ---- P10: the panel stack after ⋯ → Settings, and after ⋯ → Lists
log("[P10] viewport 1440x900, ?transport=local");
await openMore(page, "settings", "#p-settings"); log("[P10] panels after ⋯ → Settings:", (await page.evaluate(() => window.__tf())).panels, "| #p-settings has ‹ Back:", !!(await page.$("#p-settings h2 .back")));
await esc(page);
await openMore(page, "lists", "#p-lists"); log("[P10] panels after ⋯ → Lists:", (await page.evaluate(() => window.__tf())).panels, "| #p-lists has ‹ Back:", !!(await page.$("#p-lists h2 .back")));
await esc(page);

// ---- P11 E0: the saved-link variant
await openListsDetail(page, 1); await page.click('#p-list [data-lact="remove"]'); await page.waitForSelector("#ask[open]"); await wait(300);
log("[P11 E0 saved link] title:", await page.textContent("#ask-title"), "| msg:", (await page.textContent("#ask-msg")).trim());
log("    chips (DOM order):", await read()); log("    #ask-extra WITH accent (probe):", await probeAccent());
await page.click('#ask [data-close]'); await wait(300); await esc(page);

// ---- P11 E1: the never-saved-link variant, seeded the way tools/e2e4.js:2363 seeds it
await page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.lists[0].linkSaved = false; m.lists[0].created = true; m.device.savedGrandfathered = true; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
await page.reload(); await wait(1200); await esc(page); await wait(200);
await openListsDetail(page, 1); await page.click('#p-list [data-lact="remove"]'); await page.waitForSelector("#ask[open]"); await wait(300);
log("[P11 E1 unsaved link] title:", await page.textContent("#ask-title"), "| msg:", (await page.textContent("#ask-msg")).trim());
log("    chips (DOM order):", await read()); log("    #ask-extra WITH accent (probe):", await probeAccent());
log("    lists on this device:", await page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists.length));
await page.click('#ask [data-close]'); await wait(300); await esc(page);
log("page errors:", errors);
await browser.close();
