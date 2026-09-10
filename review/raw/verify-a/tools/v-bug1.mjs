// v-bug1.mjs — verifier A's own check of C-BUG-1: phone viewport (390×844, touch), the roles reversed (tab B removes,
// tab A re-adds by pasting the link), and different ordinary saves: B starts a new list from the welcome (Keep), A uses ⋯ → Sound.
import { launch, context, freshPage, s, wait, esc, openMore, log, BASE, PHONE, mr, tab, save, removeFirst, second } from "./vlib.mjs";
const browser = await launch(); const ctx = await context(browser, PHONE);
const step = async (n, what, page, X) => log(`\n[${n}] ${what}`, "| storage:", await mr(page, X), "| this tab:", await tab(page, X));
const { page: A, errors: errA } = await freshPage(ctx); const X = (await s(A)).listId;
await step("R0", "A fresh on the phone viewport, holds X", A, X);
const { page: B, errors: errB } = await second(ctx, BASE, "&tab=b"); await step("R1", "B: a second tab of the same profile, holds X", B, X);
const msg = await removeFirst(B); await step("R2", "B: Remove from this device → Remove (sheet: " + JSON.stringify(msg.slice(0, 60)) + "…)", B, X);
await A.bringToFront(); await A.goto(BASE + "?transport=local&tab=a#/l/" + X); await wait(1500);
const asked = !!(await A.$("#whose[open]")); if (asked) { await A.click('#whose [data-whose="mine"]'); await wait(900); }
await step("R3", "A: pasted X's link as a real navigation (Whose? asked=" + asked + ", answered mine)", A, X);
await B.bringToFront(); await B.evaluate(() => document.getElementById("w-keep").click()); await B.waitForSelector("#p-save[open]"); await B.click("#save-done"); await wait(700); await B.waitForSelector("#list .row");
const Y = (await s(B)).listId; await step("R4", "B: Keep on the welcome → a new list Y (registerList → saveDevice) with B's in-memory removed=[X]; B now holds " + (Y && Y !== X ? "Y" : "?"), B, X);
const how = await save(A); await step("R5", "A: ordinary save via " + how + " — X is on A's screen", A, X);
await openMore(A, "lists", "#p-lists"); log("    A's Lists rows:", await A.locator("#lists-menu .row").count(), "| rows of X on A's screen:", await A.locator("#list .row").count(), "| #listname:", (await A.textContent("#listname")).trim()); await esc(A);
await A.reload(); await wait(1800); await step("R6", "A: reload", A, X);
await B.reload(); await wait(1800); await step("R7", "B: reload (B holds Y)", B, X);
if (await A.$("#whose[open]")) { await A.click('#whose [data-whose="mine"]'); await wait(1200); await step("R8", "A: answered Whose? → mine a second time", A, X); }
if (await B.$("#whose[open]")) { await B.click('#whose [data-whose="mine"]'); await wait(1200); await step("R9", "B: answered Whose? → mine (B is the tab that removed X)", B, X); }
log("page errors A:", errA, "B:", errB);
await browser.close();
