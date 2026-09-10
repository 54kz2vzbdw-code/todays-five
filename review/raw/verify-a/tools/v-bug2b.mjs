// v-bug2b.mjs — scenarios B and C of v-bug2 (A already ran). 1.11's Remove from this device archives on the spot with no sheet,
// so the 1.11 tab's remove is one click; the 1.12/head tab's remove goes through the sheet.
import { launch, context, freshPage, s, wait, esc, openMore, openListsDetail, log, mr, tab, save, removeFirst, second } from "./vlib.mjs";
const OLD = "http://127.0.0.1:8896/old/", HEAD = "http://127.0.0.1:8896/head/", NEW = "http://127.0.0.1:8896/new/";
const browser = await launch();
const step = async (n, what, page, X) => log(`\n[${n}] ${what}`, "| storage:", await mr(page, X), "| this tab:", await tab(page, X));
const flags = page => page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta") || "{}"); return { archivedFlags: (m.lists || []).map(l => !!l.archived), removedKeyPresent: "removed" in m }; });
const removeOld = async page => { await page.bringToFront(); await openListsDetail(page, 1); await page.click('#p-list [data-lact="remove"]'); await wait(1500); if (await page.$("#ask[open]")) { await page.click("#ask-ok"); await wait(1500); } };
{ const ctx = await context(browser); const { page: N } = await freshPage(ctx, HEAD); const X = (await s(N)).listId; await step("B0", "N (head 7341981) fresh, holds X", N, X);
  const { page: O } = await second(ctx, OLD, "&tab=o"); await step("B1", "O (1.11) opened", O, X);
  await removeOld(O); await step("B2", "O (1.11): Remove from this device (1.11 archives, no sheet) — " + JSON.stringify(await flags(O)), O, X);
  let h = await save(N); await step("B3", "N (head): save via " + h + " (normalizeRegistry finishes the archived entry) — " + JSON.stringify(await flags(N)), N, X);
  h = await save(O); await step("B4", "O (1.11): save via " + h + " — " + JSON.stringify(await flags(O)), O, X);
  await N.bringToFront(); await N.reload(); await wait(1800); await step("B5", "N: reload — " + JSON.stringify(await flags(N)), N, X);
  h = await save(N); await step("B6", "N: save via " + h + " after the reload — " + JSON.stringify(await flags(N)), N, X);
  await O.bringToFront(); await O.reload(); await wait(1800); await step("B7", "O: reload — " + JSON.stringify(await flags(O)), O, X);
  await openMore(O, "lists", "#p-lists"); log("    O's Lists after reload: active rows", await O.locator("#lists-menu .row").count(), "| Removed-group rows", await O.locator("#lists-removed .row").count()); await esc(O);
  await ctx.close(); }
{ const ctx = await context(browser); const { page: N } = await freshPage(ctx, NEW); const X = (await s(N)).listId; await step("C0", "N (1.12, 67f35a5) fresh, holds X", N, X);
  const { page: O } = await second(ctx, OLD, "&tab=o"); await step("C1", "O (1.11) opened", O, X);
  await removeFirst(N); await step("C2", "N: Remove", N, X);
  const h = await save(O); await step("C3", "O (1.11): one save via " + h, O, X);
  await N.bringToFront(); await N.reload(); await wait(1800); await step("C4", "N: reload straight away — is the removed list open again?", N, X);
  await ctx.close(); }
await browser.close();
