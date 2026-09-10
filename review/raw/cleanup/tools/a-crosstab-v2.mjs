// (a) v2: the paste in tab B is a REAL navigation (a different query, so the page reloads and re-reads storage);
// page errors captured in both tabs; the local copy `tf/v3/list/<id>` watched; then the two-list Undo case.
import { launch, context, freshPage, s, meta, wait, esc, openListsDetail, openMore, log, BASE } from "./lib.mjs";
const browser = await launch(); const ctx = await context(browser);
const keys = page => page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("tf/")).map(k => k.replace(/[0-9A-Za-z]{22,}/g, "<id>")).sort());
const localCopy = (page, id) => page.evaluate(id => { const v = localStorage.getItem("tf/v3/list/" + id); return v ? { present: true, bytes: v.length, keys: Object.keys(JSON.parse(v)), lines: Object.keys(JSON.parse(v).doc.items || {}).length } : { present: false }; }, id);
const step = async (n, what, page) => { const x = await s(page); log(`\n[${n}] ${what}`, "| storage:", await meta(page), "| this tab:", { listId: x.listId, demo: x.demo, whoseOpen: !!(await page.$("#whose[open]")), welcome: await page.locator("#welcome").isVisible() }); };
const { page: A, errors: errA } = await freshPage(ctx); const X = (await s(A)).listId;
await step("S0", "A fresh, holds X", A); log("    storage keys:", await keys(A), "| local copy of X:", await localCopy(A, X));
const B = await ctx.newPage(); B.setDefaultTimeout(8000); const errB = []; B.on("pageerror", e => errB.push(e.message)); await B.goto(BASE + "?transport=local"); await B.waitForFunction(() => window.__tf && window.__tf().listId); await wait(600);
await step("S1", "B opened in the same context", B);
await A.bringToFront(); await openListsDetail(A, 1); await A.click('#p-list [data-lact="remove"]'); await A.waitForSelector("#ask[open]"); await wait(200); await A.click("#ask-ok"); await wait(1500);
await step("S2", "A: Remove from this device → Remove", A); log("    storage keys:", await keys(A), "| local copy of X after Remove:", await localCopy(A, X));
await B.bringToFront(); await B.goto(BASE + "?transport=local&tab=b#/l/" + X); await wait(1500); if (await B.$("#whose[open]")) { log("    B: the Whose-list-is-this? dialog appeared; answering mine"); await B.click('#whose [data-whose="mine"]'); await wait(900); }
await step("S3", "B: pasted X's link as a real navigation (page reloaded, storage re-read)", B);
await A.bringToFront(); await A.evaluate(() => document.getElementById("daynight").click()); await wait(500);
await step("S4", "A: one settings change (flip → saveDevice) with A's in-memory meta.removed=[X]", A);
await B.bringToFront(); await B.evaluate(() => document.getElementById("daynight").click()); await wait(500);
await step("S5", "B: one settings change (flip → saveDevice) — X is on B's screen", B);
await openMore(B, "lists", "#p-lists"); log("    B's Lists panel rows:", await B.locator("#lists-menu .row").count()); await esc(B);
await B.reload(); await wait(1800); await step("S6", "B: reload", B);
await A.reload(); await wait(1800); await step("S7", "A: reload", A);
log("page errors A:", errA, "B:", errB);
// ---- the two-list case: Remove the OPEN list while another exists — the awaited switchTo is what keeps the Undo on screen
const ctx2 = await context(browser); const { page: P, errors: errP } = await freshPage(ctx2);
await openMore(P, "lists", "#p-lists"); await P.click("#l-new"); await P.waitForSelector("#ask[open]"); await P.fill("#ask-input", "Second"); await P.click("#ask-ok"); await wait(900); if (await P.$("#p-save[open]")) { await P.click("#save-done"); await wait(400); } await esc(P);
const before = await s(P); log("\n[T0] two lists; open:", before.listId ? "second" : null, "| registry size:", (await meta(P)).lists.length);
await openMore(P, "lists", "#p-lists"); const cur = await P.$("#lists-menu .row:has(.cur) .more"); await cur.click(); await P.waitForSelector("#p-list[open]"); await wait(200);
await P.click('#p-list [data-lact="remove"]'); await P.waitForSelector("#ask[open]"); await wait(200); const t0 = Date.now(); await P.click("#ask-ok"); await wait(1000);
const after = await s(P); log("[T1] removed the open list, +1 s:", { switchedTo: after.listId !== before.listId ? "the other list" : "same", toastOn: await P.$eval("#toast", t => t.classList.contains("on")), msg: (await P.textContent("#toast .msg")).trim(), undoHidden: await P.$eval("#toast-undo", e => e.hidden), at: Date.now() - t0 });
await P.click("#toast-undo"); await wait(1200); log("[T2] Undo:", { listId: (await s(P)).listId === before.listId ? "back on the removed list" : "elsewhere", registry: (await meta(P)).lists.length, removed: (await meta(P)).removed });
log("page errors P:", errP);
await browser.close();
