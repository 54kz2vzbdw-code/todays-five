// (a) Cross-tab removal fights re-adding — two pages in one context, one build (BASE, the head on 8891).
import { launch, context, freshPage, s, meta, wait, esc, openListsDetail, openMore, log, BASE } from "./lib.mjs";
const browser = await launch(); const ctx = await context(browser);
const step = async (n, what, page) => log(`\n[${n}] ${what}`, "| storage:", await meta(page), "| this tab:", { listId: (await s(page)).listId, panels: (await s(page)).panels, demo: (await s(page)).demo });
const { page: A } = await freshPage(ctx); const X = (await s(A)).listId;
await step("S0", "A fresh, holds X=" + X, A);
const B = await ctx.newPage(); B.setDefaultTimeout(8000); await B.goto(BASE + "?transport=local"); await B.waitForFunction(() => window.__tf && window.__tf().listId); await wait(600);
await step("S1", "B opened in the same context (same origin, same localStorage); B shows", B);
await A.bringToFront(); await openListsDetail(A, 1); await A.click('#p-list [data-lact="remove"]'); await A.waitForSelector("#ask[open]"); await wait(200); await A.click("#ask-ok"); await wait(1500);
await step("S2", "A: Remove from this device → Remove (A had only X, so A shows the welcome)", A);
await B.bringToFront(); await B.goto(BASE + "?transport=local#/l/" + X); await wait(1500); if (await B.$("#whose[open]")) { await B.click('#whose [data-whose="mine"]'); await wait(900); }
await step("S3", "B: pasted X's link (a full navigation, so B re-read storage; registerList cleared the mark)", B);
await A.bringToFront(); await A.evaluate(() => document.getElementById("daynight").click()); await wait(500);
await step("S4", "A: one settings change (the sun/moon flip → saveDevice) with A's in-memory meta.removed=[X]", A);
await B.bringToFront(); await B.evaluate(() => document.getElementById("daynight").click()); await wait(500);
await step("S5", "B: one settings change (flip → saveDevice) — B still has X on screen", B);
await openMore(B, "lists", "#p-lists"); log("    B's Lists panel rows:", await B.locator("#lists-menu .row").count(), "| #listname:", (await B.textContent("#listname")).trim()); await esc(B);
await B.reload(); await wait(1800);
await step("S6", "B: reload", B);
log("    B after reload: welcome visible =", await B.locator("#welcome").isVisible(), "| #list rows =", await B.locator("#list .row").count());
// and is `removed` ever pruned? A reloads: the id is still there
await A.reload(); await wait(1500); await step("S7", "A: reload (is X still in `removed`?)", A);
await browser.close();
