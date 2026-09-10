// v-bug4.mjs — verifier A's own checks of C-BUG-4: the finder's sequence with the Day slot on (colorScheme light), Back by Escape
// and by history.back() instead of the button, a different day theme, the phone viewport, step one's builder, a Night-slot control
// from Settings → Appearance → Night, and Back from step two itself for contrast.
import { launch, context, freshPage, s, wait, esc, header, theme, openMore, log, DESKTOP, PHONE } from "./vlib.mjs";
const browser = await launch();
const st = async (page, n, what) => { const x = await s(page); log(`[${n}] ${what}`, "| header:", await header(page), "| panels:", x.panels, "| open:", x.panel, "| data-theme:", await theme(page), "| slot on:", x.slot, "| day/night:", x.day + " / " + x.night, "| partner chip hidden:", await page.$eval("#partner-offer", e => e.hidden)); };
const back = async (page, how) => { if (how === "button") await page.click("dialog.panel[open] h2 .back"); else if (how === "escape") await page.keyboard.press("Escape"); else await page.evaluate(() => history.back()); await wait(800); };
async function scenario(name, opts, scheme, seq) { const ctx = await context(browser, opts, { scheme }); const { page, errors } = await freshPage(ctx); log(`\n=== ${name}`); try { await seq(page); } catch (e) { log("  !! " + String(e.message).split("\n")[0]); } log("page errors:", errors); await ctx.close(); }
const otherDay = (page, cur) => page.$eval("#sw-day", (el, cur) => { const sw = [...el.querySelectorAll(".swatch")].find(s => s.dataset.code !== cur); return sw ? sw.dataset.code : null; }, cur);
const twoStepThenBuilder = (how, code) => async page => {
  await openMore(page, "theme", "#p-theme"); await st(page, "0", "⋯ → Theme");
  const pick = code || await otherDay(page, (await s(page)).day);
  await page.click(`#sw-day .swatch[data-code="${pick}"]`); await wait(600); await st(page, "1", "picked " + pick + " on step one — the pre-builder state Back should restore");
  await page.click("#sw-build"); await page.waitForSelector("#p-builder[open]"); await wait(400); log("[2] Make your own", "| panels:", (await s(page)).panels, "| open:", (await s(page)).panel);
  await back(page, how); await st(page, "3", "‹ Back from the builder via " + how);
  if ((await s(page)).panel === "p-theme") { await back(page, how); await st(page, "4", "‹ Back again via " + how); }
  if ((await s(page)).panel === "p-theme") { await back(page, how); log("[5] ‹ Back again via " + how, "| panels:", (await s(page)).panels, "| open:", (await s(page)).panel); }
  await esc(page);
};
await scenario("V1 Day slot on (colorScheme light), Back button, Paper", DESKTOP, "light", twoStepThenBuilder("button", "T1:curated:paper"));
await scenario("V2 Night slot on (dark), Back by Escape, first day theme that is not the current one", DESKTOP, "dark", twoStepThenBuilder("escape"));
await scenario("V3 Night slot on (dark), Back by history.back() — the browser's own Back", DESKTOP, "dark", twoStepThenBuilder("history", "T1:curated:paper"));
await scenario("V4 phone 390×844 touch, Back button, Paper", PHONE, "dark", twoStepThenBuilder("button", "T1:curated:paper"));
await scenario("V5 step one's builder: ⋯ → Theme → Make your own → Back", DESKTOP, "dark", async page => {
  await openMore(page, "theme", "#p-theme"); await st(page, "0", "⋯ → Theme");
  await page.click("#sw-build"); await page.waitForSelector("#p-builder[open]"); await wait(400); log("[1] Make your own", "| panels:", (await s(page)).panels, "| open:", (await s(page)).panel);
  await back(page, "button"); await st(page, "2", "‹ Back from the builder (expected: Day theme, [p-menu,p-theme])");
  if ((await s(page)).panel === "p-theme") { await back(page, "button"); log("[3] ‹ Back again", "| panels:", (await s(page)).panels, "| open:", (await s(page)).panel); }
  await esc(page);
});
await scenario("V6 control: Settings → Appearance → Night → Make your own → Back", DESKTOP, "dark", async page => {
  await openMore(page, "settings", "#p-settings"); await page.click('#p-settings [data-set="night"]'); await page.waitForSelector("#p-theme[open]"); await wait(300); await st(page, "0", "Settings → Appearance → Night");
  await page.click("#sw-build"); await page.waitForSelector("#p-builder[open]"); await wait(300); await back(page, "button"); await st(page, "1", "‹ Back from the builder (expected: Night theme, [p-menu,p-settings,p-theme])");
  await esc(page);
});
await scenario("V7 contrast: Back from step two itself (no builder)", DESKTOP, "dark", async page => {
  await openMore(page, "theme", "#p-theme"); await page.click('#sw-day .swatch[data-code="T1:curated:paper"]'); await wait(600); await st(page, "0", "step two");
  await back(page, "button"); await st(page, "1", "‹ Back from step two (the code's own rule: step one again)");
  await esc(page);
});
await browser.close();
