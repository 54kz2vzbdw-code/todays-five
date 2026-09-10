// v-bug2.mjs — verifier A's own check of C-BUG-2 on a root of my own: old/ = 0e03143 (1.11), head/ = 7341981, new/ = 67f35a5.
// (A) old vs head, the 1.11 tab saves twice in a row before the head tab saves, ⋯ → Sound where the build has it;
// (B) the 1.11 tab does its own Remove (1.11 archives), the head tab saves, the 1.11 tab saves — the archived-flag ping-pong;
// (C) the finder's pair (old vs 67f35a5) in my order: one 1.11 save, then the 1.12 tab reloads at once.
import { launch, context, freshPage, s, wait, esc, openMore, log, mr, tab, save, removeFirst, second } from "./vlib.mjs";
const OLD = "http://127.0.0.1:8896/old/", HEAD = "http://127.0.0.1:8896/head/", NEW = "http://127.0.0.1:8896/new/";
const browser = await launch();
const step = async (n, what, page, X) => log(`\n[${n}] ${what}`, "| storage:", await mr(page, X), "| this tab:", await tab(page, X));
const flags = page => page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta") || "{}"); return { archivedFlags: (m.lists || []).map(l => !!l.archived), removedKeyPresent: "removed" in m }; });
{ const ctx = await context(browser); const { page: N } = await freshPage(ctx, HEAD); const X = (await s(N)).listId; await step("A0", "N (head 7341981) fresh, holds X", N, X);
  const { page: O } = await second(ctx, OLD, "&tab=o"); await step("A1", "O (1.11, 0e03143) opened on the same origin", O, X);
  await removeFirst(N); await step("A2", "N: Remove from this device → Remove", N, X);
  let h = await save(O); await step("A3", "O (1.11): ordinary save via " + h, O, X);
  h = await save(O); await step("A4", "O (1.11): a second save in a row via " + h, O, X);
  h = await save(N); await step("A5", "N (head): ordinary save via " + h, N, X);
  h = await save(O); await step("A6", "O (1.11): a third save via " + h, O, X);
  await N.bringToFront(); await N.reload(); await wait(1800); await step("A7", "N: reload", N, X);
  await O.bringToFront(); await O.reload(); await wait(1800); await step("A8", "O: reload", O, X);
  await ctx.close(); }
{ const ctx = await context(browser); const { page: N } = await freshPage(ctx, HEAD); const X = (await s(N)).listId; await step("B0", "N (head) fresh, holds X", N, X);
  const { page: O } = await second(ctx, OLD, "&tab=o"); await step("B1", "O (1.11) opened", O, X);
  await removeFirst(O); await step("B2", "O (1.11): Remove from this device (1.11 archives) — " + JSON.stringify(await flags(O)), O, X);
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
