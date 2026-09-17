// tools/paint.mjs — first paint, two builds side by side, under Lighthouse's own mobile numbers. Lighthouse itself
// cannot be run on this machine (PLAN.md, 1.12: not in the Node runtime, no npm to add it), so this is what
// stood in for it there and stands in for it here: FCP and LCP read off the page through CDP with 150 ms RTT,
// 1.6 Mbps down and a 4× CPU slowdown applied, N runs a side, interleaved and order-flipped every other pass so
// neither build owns the warm machine, plus the bytes on the wire. Medians and the range.
// Run: node tools/serve.js 8791 . &  node tools/serve.js 8792 <a worktree of the previous build> &
//      node tools/paint.mjs [runs=8] [http://127.0.0.1:8792/=old,http://127.0.0.1:8791/=new]
import { createRequire } from "node:module";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const RUNS = +(process.argv[2] || 8);
const SIDES = (process.argv[3] || "http://127.0.0.1:8792/=old,http://127.0.0.1:8791/=new").split(",").map(s => { const [url, name] = s.split("="); return { url, name }; });
const PROFILES = [["desktop", false], ["mobile", true]];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const once = async (url, mobile) => {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (mobile) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  let bytes = 0; page.on("response", async r => { try { const b = await r.body(); bytes += b.length; } catch (e) { /* a redirect or a preflight */ } });
  await page.addInitScript(() => { window.__lcp = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); });
  await page.goto(url + "?transport=local", { waitUntil: "load" });
  await page.waitForSelector("#welcome:not([hidden])"); await page.waitForTimeout(mobile ? 1500 : 600);
  const m = await page.evaluate(() => ({ fcp: (performance.getEntriesByName("first-contentful-paint")[0] || {}).startTime || 0, lcp: window.__lcp }));
  await ctx.close();
  return { fcp: Math.round(m.fcp), lcp: Math.round(m.lcp), bytes };
};
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
for (const [prof, mobile] of PROFILES) {
  const got = Object.fromEntries(SIDES.map(s => [s.name, []]));
  for (let i = 0; i < RUNS; i++) { const order = i % 2 ? [...SIDES].reverse() : SIDES; for (const s of order) got[s.name].push(await once(s.url, mobile)); }
  for (const s of SIDES) { const g = got[s.name]; const f = g.map(x => x.fcp), l = g.map(x => x.lcp); console.log(`${prof.padEnd(8)} ${s.name.padEnd(5)} FCP ${med(f)} ms (${Math.min(...f)}–${Math.max(...f)})  LCP ${med(l)} ms (${Math.min(...l)}–${Math.max(...l)})  on the wire ${(med(g.map(x => x.bytes)) / 1024).toFixed(1)} KB  n=${RUNS}`); }
}
await browser.close();
