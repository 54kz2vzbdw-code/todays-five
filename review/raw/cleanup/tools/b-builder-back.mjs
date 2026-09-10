// (b) Back from the builder on step two lands on step one — and leaves a stale frame.
import { launch, context, freshPage, s, wait, esc, header, theme, openMore, log } from "./lib.mjs";
const browser = await launch(); const ctx = await context(browser); const { page, errors } = await freshPage(ctx);
const st = async (n, what) => log(`[${n}] ${what}`, "| header:", await header(page), "| panels:", (await s(page)).panels, "| open:", (await s(page)).panel, "| data-theme:", await theme(page), "| day/night:", (await s(page)).day + " / " + (await s(page)).night);
await openMore(page, "theme", "#p-theme"); await st("B0", "⋯ → Theme");
await page.click('#sw-day .swatch[data-code="T1:curated:paper"]'); await wait(600); await st("B1", "picked Paper on step one");
await page.click("#sw-build"); await page.waitForSelector("#p-builder[open]"); await wait(400); log("[B2] Make your own", "| panels:", (await s(page)).panels, "| open:", (await s(page)).panel, "| data-theme:", await theme(page));
await page.click("#p-builder h2 .back"); await wait(700); await st("B3", "‹ Back from the builder (expected: Night theme, panels [p-menu,p-theme])");
if (await page.$("#p-theme[open] h2 .back")) { await page.click("#p-theme h2 .back"); await wait(700); await st("B4", "‹ Back again"); }
if (await page.$("#p-theme[open] h2 .back")) { await page.click("#p-theme h2 .back"); await wait(700); log("[B5] ‹ Back again", "| panels:", (await s(page)).panels, "| open:", (await s(page)).panel, "| data-theme:", await theme(page)); }
else log("[B5] no Back left on p-theme;", "| panels:", (await s(page)).panels, "| open:", (await s(page)).panel);
await esc(page);
// control: the 1.9 path (Settings → Appearance → Day → Make your own → Back) is unchanged
await openMore(page, "settings", "#p-settings"); await page.click('#p-settings [data-set="day"]'); await page.waitForSelector("#p-theme[open]"); await wait(300); await st("C0", "Settings → Appearance → Day");
await page.click("#sw-build"); await page.waitForSelector("#p-builder[open]"); await wait(300); await page.click("#p-builder h2 .back"); await wait(700); await st("C1", "‹ Back from the builder (control)");
await esc(page); log("page errors:", errors);
await browser.close();
