// firstpaint.mjs — re-measure PLAN.md's "Lighthouse, and what stands in for it" table: first paint of the 1.11 tree
// (0e03143, build 151) against the 1.12 tree (74bf09f, build 157), both served by the repo's own tools/serve.js from
// one static root on 127.0.0.1:8894, through CDP with the nominal numbers the write-up names (150 ms RTT, 1.6 Mbps
// down, 4x CPU) for the phone viewport, unthrottled for the desktop one. Eight rounds, the order flipped every round.
// Fresh context per load, service workers blocked, ?transport=local so nothing leaves the loopback.
// Usage: node firstpaint.mjs [rounds]   (needs the server up: node tools/serve.js 8894 <trees dir>)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:8894/";
const BUILDS = [["1.11 b151", "0e03143"], ["1.12 b157", "74bf09f"]];
const VIEWPORTS = [
  ["desktop", { viewport: { width: 1440, height: 900 } }, false],
  ["mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }, true],
];
const rounds = +(process.argv[2] || 8);
const median = a => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const results = {};
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
for (let r = 0; r < rounds; r++) {
  const order = r % 2 ? [...BUILDS].reverse() : BUILDS;
  for (const [label, dir] of order) for (const [vpName, opts, throttle] of VIEWPORTS) {
    const ctx = await browser.newContext({ ...opts, serviceWorkers: "block" });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    let wire = 0, requests = 0; cdp.on("Network.loadingFinished", e => { wire += e.encodedDataLength; }); cdp.on("Network.requestWillBeSent", () => requests++);
    if (throttle) {
      await cdp.send("Network.[REDACTED]", { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    }
    await page.addInitScript(() => { window.__lcp = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp.push(e.startTime); }).observe({ type: "largest-contentful-paint", buffered: true }); } catch (e) {} });
    await page.goto(BASE + dir + "/?transport=local", { waitUntil: "load" });
    await page.waitForTimeout(600);
    const m = await page.evaluate(() => ({ fcp: (performance.getEntriesByName("first-contentful-paint")[0] || {}).startTime, lcp: Math.max(0, ...window.__lcp), welcome: !!document.querySelector("#welcome:not([hidden])") }));
    await ctx.close();
    const k = label + " " + vpName; (results[k] ||= { fcp: [], lcp: [], wire: [], req: [] });
    results[k].fcp.push(m.fcp); results[k].lcp.push(m.lcp); results[k].wire.push(wire); results[k].req.push(requests);
    console.log(`round ${r + 1} ${k.padEnd(18)} FCP ${m.fcp.toFixed(0).padStart(5)} ms  LCP ${m.lcp.toFixed(0).padStart(5)} ms  wire ${wire} B  reqs ${requests}  welcome=${m.welcome}`);
  }
}
await browser.close();
console.log("\nmedians (range) over " + rounds + " interleaved, order-flipped rounds:");
for (const [k, v] of Object.entries(results)) {
  const f = a => `${median(a).toFixed(0)} (${Math.min(...a).toFixed(0)}–${Math.max(...a).toFixed(0)})`;
  console.log(`  ${k.padEnd(18)} FCP ${f(v.fcp)} ms   LCP ${f(v.lcp)} ms   wire ${(median(v.wire) / 1024).toFixed(1)} KB (${Math.min(...v.wire)}–${Math.max(...v.wire)} B)   requests ${median(v.req)}`);
}
