// (a, cross-build) A 1.11 tab and a 1.12 tab on ONE origin: tools/serve.js serving a root with old/ (0e03143) and
// new/ (67f35a5) side by side on 8896, so both paths share localStorage the way one origin does across a deploy.
import { launch, context, freshPage, s, meta, wait, esc, openListsDetail, openMore, log } from "./lib.mjs";
const OLD = "http://127.0.0.1:8896/old/", NEW = "http://127.0.0.1:8896/new/";
const browser = await launch(); const ctx = await context(browser);
const step = async (n, what, page) => { const x = await s(page); log(`\n[${n}] ${what}`, "| storage:", await meta(page), "| this tab:", { version: x.version, listId: x.listId, demo: x.demo }); };
const { page: N } = await freshPage(ctx, NEW); const X = (await s(N)).listId; await step("X0", "N (1.12) fresh, holds X=" + X, N);
const O = await ctx.newPage(); O.setDefaultTimeout(8000); await O.goto(OLD + "?transport=local"); await O.waitForFunction(() => window.__tf && window.__tf().listId); await wait(600);
await step("X1", "O (1.11) opened on the same origin", O);
await N.bringToFront(); await openListsDetail(N, 1); await N.click('#p-list [data-lact="remove"]'); await N.waitForSelector("#ask[open]"); await wait(200); await N.click("#ask-ok"); await wait(1500);
await step("X2", "N: Remove from this device → Remove", N);
await O.bringToFront(); await O.evaluate(() => document.getElementById("daynight").click()); await wait(500);
await step("X3", "O (1.11): one settings change (flip → its saveDevice)", O);
await N.bringToFront(); await N.evaluate(() => document.getElementById("daynight").click()); await wait(500);
await step("X4", "N (1.12): one settings change (flip → saveDevice)", N);
await O.bringToFront(); await openMore(O, "lists", "#p-lists"); log("    O's Lists rows:", await O.locator("#lists-menu .row").count(), "| removed-group rows:", await O.locator("#lists-removed .row").count()); await esc(O);
await O.evaluate(() => document.getElementById("daynight").click()); await wait(500); await step("X5", "O (1.11): another settings change", O);
await O.reload(); await wait(1800); await step("X6", "O: reload", O); log("    O after reload: welcome visible =", await O.locator("#welcome").isVisible());
await N.bringToFront(); await N.reload(); await wait(1800); await step("X7", "N: reload", N);
await browser.close();
