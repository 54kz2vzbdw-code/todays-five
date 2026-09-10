// (f) The Remove Undo chip: visible at t+1 s, gone by t+11 s. Three runs.
import { launch, context, freshPage, wait, openListsDetail, log } from "./lib.mjs";
const browser = await launch();
for (let run = 1; run <= 3; run++) {
  const ctx = await context(browser); const { page } = await freshPage(ctx);
  await openListsDetail(page, 1); await page.click('#p-list [data-lact="remove"]'); await page.waitForSelector("#ask[open]"); await wait(300);
  const t0 = Date.now(); await page.click("#ask-ok");
  const probe = async at => { const now = Date.now() - t0; if (at > now) await wait(at - now); const r = await page.$eval("#toast", t => ({ on: t.classList.contains("on"), msg: t.querySelector(".msg").textContent.trim(), undoHidden: document.getElementById("toast-undo").hidden, undoVisible: (() => { const u = document.getElementById("toast-undo"); const cs = getComputedStyle(u); const b = u.getBoundingClientRect(); return !u.hidden && cs.visibility !== "hidden" && b.width > 0 && getComputedStyle(t).opacity !== "0"; })() })); return { at: Date.now() - t0, ...r }; };
  log(`run ${run}:`, await probe(1000), await probe(9500), await probe(10300), await probe(11000));
  await ctx.close();
}
await browser.close();
