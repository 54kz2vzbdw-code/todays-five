// v-bug3.mjs — verifier A's own check of C-BUG-3: the key set and the local copy's size before Remove, +1.5 s, +11.5 s (past the
// Undo window), after a reload and after a second reload; then two lists with the one NOT open removed; then Delete everywhere as the control.
import { launch, context, freshPage, s, wait, esc, openMore, log, DESKTOP, PHONE, keys, localCopy, mr, tab, removeFirst } from "./vlib.mjs";
const browser = await launch();
const toast = async page => ({ on: await page.$eval("#toast", t => t.classList.contains("on")), undoHidden: await page.$eval("#toast-undo", e => e.hidden), msg: (await page.textContent("#toast .msg")).trim() });
const snap = async (page, X, n, what) => log(`\n[${n}] ${what}`, "| keys:", await keys(page), "| local copy of X:", await localCopy(page, X), "| registry:", await mr(page, X), "| toast:", await toast(page), "| tab:", await tab(page, X));
{ const ctx = await context(browser, DESKTOP); const { page, errors } = await freshPage(ctx); const X = (await s(page)).listId;
  await snap(page, X, "M0", "fresh, X open (desktop)");
  const msg = await removeFirst(page); log("    the sheet's sentence:", JSON.stringify(msg));
  await snap(page, X, "M1", "+1.5 s after Remove (Undo on screen)");
  await wait(10000); await snap(page, X, "M2", "+11.5 s (past the ten-second Undo)");
  await page.reload(); await wait(1800); await snap(page, X, "M3", "after a reload");
  await page.reload(); await wait(1800); await snap(page, X, "M4", "after a second reload");
  log("page errors:", errors); await ctx.close(); }
{ const ctx = await context(browser, PHONE); const { page: P, errors } = await freshPage(ctx); const X1 = (await s(P)).listId;
  await openMore(P, "lists", "#p-lists"); await P.click("#l-new"); await P.waitForSelector("#ask[open]"); await P.fill("#ask-input", "Second"); await P.click("#ask-ok"); await wait(900); if (await P.$("#p-save[open]")) { await P.click("#save-done"); await wait(400); } await esc(P);
  const X2 = (await s(P)).listId; log(`\n[N0] phone: two lists, the second open;`, "keys:", await keys(P), "| local copies: X1", await localCopy(P, X1), "X2", await localCopy(P, X2));
  await openMore(P, "lists", "#p-lists"); await P.click("#lists-menu .row:not(:has(.cur)) .more"); await P.waitForSelector("#p-list[open]"); await wait(200);
  await P.click('#p-list [data-lact="remove"]'); await P.waitForSelector("#ask[open]"); await wait(200); await P.click("#ask-ok"); await wait(1500);
  log("[N1] removed X1 (not the open one):", "keys:", await keys(P), "| local copy of X1:", await localCopy(P, X1), "| registry:", await mr(P, X1), "| open:", (await s(P)).listId === X2 ? "X2" : "other");
  await wait(10000); await P.reload(); await wait(1800);
  log("[N2] +11.5 s, reload:", "keys:", await keys(P), "| local copy of X1:", await localCopy(P, X1), "| registry:", await mr(P, X1), "| open:", (await s(P)).listId === X2 ? "X2" : ((await s(P)).listId === X1 ? "X1" : "none"), "| whoseOpen:", !!(await P.$("#whose[open]")));
  // control: Delete everywhere on X2 (the open one) — does its local copy go?
  await P.click("#more"); await P.waitForSelector("#p-menu[open]"); await P.click('#p-menu [data-act="delete"]'); await P.waitForSelector("#ask[open]"); await wait(200); await P.click("#ask-ok"); await wait(1500);
  log("[N3] control — Delete everywhere on X2:", "keys:", await keys(P), "| local copy of X2:", await localCopy(P, X2), "| local copy of X1 (removed earlier):", await localCopy(P, X1), "| registry:", await mr(P, X2), "| dead-has-X2:", await P.evaluate(id => ((JSON.parse(localStorage.getItem("tf/v2/meta") || "{}").dead) || []).includes(id), X2), "| toast:", await toast(P));
  log("page errors:", errors); await ctx.close(); }
await browser.close();
