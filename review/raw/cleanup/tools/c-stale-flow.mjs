// (c) Stale `flow` after × on step two — does any later path read it?
import { launch, context, freshPage, s, wait, esc, header, theme, openMore, log } from "./lib.mjs";
const browser = await launch(); const ctx = await context(browser); const { page, errors } = await freshPage(ctx);
const offerPos = () => page.$eval("#partner-offer", e => ({ hidden: e.hidden, prev: e.[REDACTED] && (e.[REDACTED].id || e.[REDACTED].className), text: e.querySelector("#partner-use").textContent }));
await openMore(page, "theme", "#p-theme"); await page.click('#sw-day .swatch[data-code="T1:curated:paper"]'); await wait(600);
log("[C0] ⋯ → Theme → Paper: header", await header(page), "| offer:", await offerPos(), "| panels:", (await s(page)).panels);
await page.click("#p-theme .x"); await wait(600); log("[C1] × on step two: panels", (await s(page)).panels, "| data-theme:", await theme(page), "(flow is now stale at {step:2} in panels.js)");
// path 1: Settings → Appearance → Night, then a choice — a stale step 2 would close the panel and toast "for Night"
await openMore(page, "settings", "#p-settings"); await page.click('#p-settings [data-set="night"]'); await page.waitForSelector("#p-theme[open]"); await wait(300);
log("[C2] Settings → Appearance → Night: header", await header(page), "| offer:", await offerPos(), "| panels:", (await s(page)).panels);
await page.click('#sw-night .swatch[data-code="T1:curated:dusk"]'); await wait(700);
log("[C3] picked Dusk there: still open?", !!(await page.$("#p-theme[open]")), "| header:", (await page.$("#p-theme[open]")) ? await header(page) : "(closed)", "| offer:", await offerPos(), "| panels:", (await s(page)).panels, "| toast:", (await page.textContent("#toast .msg")).trim(), "| toast on:", await page.$eval("#toast", e => e.classList.contains("on")));
await esc(page);
// path 2: ⋯ → Theme again starts over at step one
await openMore(page, "theme", "#p-theme"); log("[C4] ⋯ → Theme again: header", await header(page), "| offer:", await offerPos(), "| panels:", (await s(page)).panels); await esc(page);
// path 3: × on step two, then the builder from Appearance and Back (the opener with a stale flow?)
await openMore(page, "theme", "#p-theme"); await page.click('#sw-day .swatch[data-code="T1:curated:paper"]'); await wait(500); await page.click("#p-theme .x"); await wait(600);
await openMore(page, "settings", "#p-settings"); await page.click('#p-settings [data-set="night"]'); await page.waitForSelector("#p-theme[open]"); await wait(300); await page.click("#sw-build"); await page.waitForSelector("#p-builder[open]"); await wait(300); await page.click("#p-builder h2 .back"); await wait(700);
log("[C5] × on step two → Appearance → Night → builder → Back: header", await header(page), "| panels:", (await s(page)).panels, "| offer:", await offerPos());
await esc(page); log("page errors:", errors);
await browser.close();
