// verify-c (P11 supplementary): the first probe read #ask-extra's colour synchronously after adding `accent`, which
// returns the start of a CSS transition. This one waits 600 ms before reading, and reads --accent-text for comparison.
// Usage: BASE=http://127.0.0.1:8898/ node p11b-accent-probe.mjs   (unmutated 7341981 copy on 8898)
import { launch, context, freshPage, wait, esc, openListsDetail, log } from "../cleanup/tools/lib.mjs";
const browser = await launch(); const ctx = await context(browser); const { page, errors } = await freshPage(ctx);
await openListsDetail(page, 1); await page.click('#p-list [data-lact="remove"]'); await page.waitForSelector("#ask[open]"); await wait(300);
const readChip = () => page.$eval("#ask-extra", e => { const cs = getComputedStyle(e); return { className: e.className, color: cs.color, border: cs.borderColor, bg: cs.backgroundColor, transition: cs.transitionProperty + " " + cs.transitionDuration }; });
log("[P11b] tokens: --accent-text =", await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent-text").trim()), "| --muted =", await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--muted").trim()), "| html[data-theme] =", await page.$eval("html", e => e.dataset.theme));
log("[P11b] #ask-extra as shipped:", await readChip());
await page.$eval("#ask-extra", e => e.classList.add("accent")); await wait(600);
log("[P11b] #ask-extra with `accent` forced on, read after 600 ms:", await readChip());
await page.$eval("#ask-extra", e => e.classList.remove("accent")); await wait(600);
log("[P11b] #ask-extra after removing it again:", await readChip());
await page.click('#ask [data-close]'); await wait(300); await esc(page); log("page errors:", errors);
await browser.close();
