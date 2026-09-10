// (d) Preview vs slot: after the two-step flow the page must be back on the slot that is on.
import { launch, context, freshPage, s, wait, esc, header, theme, openMore, log, DESKTOP } from "./lib.mjs";
const browser = await launch();
for (const scheme of ["light", "dark"]) {
  const ctx = await context(browser, DESKTOP, { scheme }); const { page, errors } = await freshPage(ctx);
  const st = async (n, what) => { const x = await s(page); log(`[${scheme} ${n}] ${what}`, "| data-theme:", await theme(page), "| slot:", x.slot, "auto:", x.auto, "hold:", x.hold, "| day/night:", x.day + " / " + x.night, "| panels:", x.panels, (await page.$("#p-theme[open]")) ? "| header: " + await header(page) : ""); };
  await st("D0", "fresh (colorScheme " + scheme + ", switch: system)");
  await openMore(page, "theme", "#p-theme"); await st("D1", "⋯ → Theme");
  await page.click('#sw-day .swatch[data-code="T1:curated:paper"]'); await wait(600); await st("D2", "step one: Paper");
  await page.click('#sw-night .swatch[data-code="T1:curated:dusk"]'); await wait(800); await st("D3", "step two: Dusk (the flow closes)");
  await wait(600); await st("D4", "+600 ms");
  // the other way round: step one, then Back out through the menu and Escape — the preview must go with it
  await openMore(page, "theme", "#p-theme"); await page.click('#sw-day .swatch[data-code="T1:curated:harbor"]'); await wait(600); await st("D5", "⋯ → Theme, step one: Harbor (previewed)");
  await page.click("#p-theme h2 .back"); await wait(600); await st("D6", "‹ Back to step one");
  await page.click("#p-theme h2 .back"); await wait(600); await st("D7", "‹ Back to the menu");
  await esc(page); await wait(500); await st("D8", "Escape");
  log("page errors:", errors); await ctx.close();
}
await browser.close();
