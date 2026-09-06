// tools/leak.mjs — the 1.9 open bug: a three-snapshot heap diff around Settings open/close and Today↔Everything.
//   BASE=http://127.0.0.1:8791/ OUT=audit-out node tools/leak.mjs settings|view|theme [N]   (WARM=0 for the audit's own protocol, ENV=phone, CLOSE=x)
// Warm-up, snapshot A, N cycles, snapshot B, N cycles, snapshot C. Reports what grew from A→B and B→C alike
// (linear growth), the detached DOM nodes new in C, and a retainer path for each kind of new detached node.
import fs from "node:fs";
import { launch, openApp, wait } from "./audit/harness.mjs";

const scenario = process.argv[2] || "settings";
const N = +(process.argv[3] || 20);
const browser = await launch();
const t = await openApp(browser, { env: process.env.ENV || "desktop", fixture: process.env.FIXTURE || "longtime" });
const page = t.page;
const cdp = await page.context().newCDPSession(page);
await cdp.send("HeapProfiler.enable");
await cdp.send("Performance.enable");

async function metrics() {
  await cdp.send("HeapProfiler.collectGarbage"); await wait(100); await cdp.send("HeapProfiler.collectGarbage");
  const { metrics } = await cdp.send("Performance.getMetrics");
  const m = Object.fromEntries(metrics.map(x => [x.name, x.value]));
  return { nodes: m.Nodes, listeners: m.JSEventListeners, heapKB: Math.round(m.JSHeapUsedSize / 1024) };
}
async function snapshot() {
  const chunks = [];
  const on = e => chunks.push(e.chunk);
  cdp.on("HeapProfiler.addHeapSnapshotChunk", on);
  await cdp.send("HeapProfiler.collectGarbage"); await wait(100); await cdp.send("HeapProfiler.collectGarbage");
  await cdp.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false, treatGlobalObjectsAsRoots: true, captureNumericValue: false });
  cdp.off("HeapProfiler.addHeapSnapshotChunk", on);
  return parse(JSON.parse(chunks.join("")));
}
function parse(snap) {
  const meta = snap.snapshot.meta, nf = meta.node_fields, ef = meta.edge_fields, NF = nf.length, EF = ef.length;
  const nodes = snap.nodes, edges = snap.edges, strings = snap.strings;
  const iType = nf.indexOf("type"), iName = nf.indexOf("name"), iId = nf.indexOf("id"), iEdges = nf.indexOf("edge_count"), iDet = nf.indexOf("detachedness");
  const eType = ef.indexOf("type"), eName = ef.indexOf("name_or_index"), eTo = ef.indexOf("to_node");
  const nodeTypes = meta.node_types[0], edgeTypes = meta.edge_types[0];
  const count = nodes.length / NF;
  const firstEdge = new Uint32Array(count + 1);
  for (let i = 0, e = 0; i < count; i++) { firstEdge[i] = e; e += nodes[i * NF + iEdges] * EF; firstEdge[count] = e; }
  const byId = new Map();
  for (let i = 0; i < count; i++) byId.set(nodes[i * NF + iId], i);
  const name = i => strings[nodes[i * NF + iName]];
  const type = i => nodeTypes[nodes[i * NF + iType]];
  const id = i => nodes[i * NF + iId];
  const detached = i => iDet >= 0 && nodes[i * NF + iDet] === 2;
  // reverse edges, built lazily
  let rev = null;
  function reverse() {
    if (rev) return rev;
    const cnt = new Uint32Array(count + 1);
    for (let i = 0; i < count; i++) for (let e = firstEdge[i]; e < firstEdge[i + 1]; e += EF) { const et = edgeTypes[edges[e + eType]]; if (et === "weak" || et === "shortcut") continue; cnt[edges[e + eTo] / NF + 1]++; }
    for (let i = 0; i < count; i++) cnt[i + 1] += cnt[i];
    const from = new Uint32Array(cnt[count]), via = new Uint32Array(cnt[count]), fill = cnt.slice();
    for (let i = 0; i < count; i++) for (let e = firstEdge[i]; e < firstEdge[i + 1]; e += EF) { const et = edgeTypes[edges[e + eType]]; if (et === "weak" || et === "shortcut") continue; const to = edges[e + eTo] / NF; from[fill[to]] = i; via[fill[to]] = e; fill[to]++; }
    return rev = { cnt, from, via };
  }
  const edgeLabel = e => { const et = edgeTypes[edges[e + eType]]; const n = edges[e + eName]; return et + ":" + ((et === "element" || et === "hidden") ? "[" + n + "]" : strings[n]); };
  /** the shortest retainer path from node i up to a GC root (a synthetic node), as text */
  function retainers(i, maxDepth = 14) {
    const { cnt, from, via } = reverse();
    const prev = new Map([[i, null]]); let frontier = [i];
    for (let d = 0; d < maxDepth && frontier.length; d++) {
      const next = [];
      for (const n of frontier) for (let k = cnt[n]; k < cnt[n + 1]; k++) {
        const f = from[k]; if (prev.has(f)) continue; prev.set(f, [n, via[k]]);
        if (type(f) === "synthetic" || name(f) === "(GC roots)" || /^Window /.test(name(f))) { // walk back
          const path = []; let cur = f; while (prev.get(cur)) { const [child, e] = prev.get(cur); path.push(label(cur) + " --" + edgeLabel(e) + "--> "); cur = child; } path.push(label(i)); return path.join("");
        }
        next.push(f);
      }
      frontier = next;
    }
    return "(no root within " + maxDepth + ")";
  }
  const label = i => type(i) + " " + JSON.stringify(name(i)).slice(0, 60) + "@" + id(i);
  return { count, byId, name, type, id, detached, retainers, label };
}
function tally(snap, ids) { const m = new Map(); for (const i of ids) { const k = snap.type(i) + " " + snap.name(i); m.set(k, (m.get(k) || 0) + 1); } return m; }
function newIn(later, earlier) { const out = []; for (const [id, i] of later.byId) if (!earlier.byId.has(id)) out.push(i); return out; }

const CLOSE = process.env.CLOSE || "esc"; // esc | x | back (how each cycle closes the panel)
const closePanel = async () => {
  if (CLOSE === "x") { const x = await page.$("dialog.panel[open] h2 .x"); if (x) await x.click(); }
  else if (CLOSE === "backdrop") { await page.mouse.click(5, 5); }
  else await page.keyboard.press("Escape");
  await wait(320); if (await page.$("dialog.panel[open]")) { await page.keyboard.press("Escape"); await wait(320); }
};
const cycle = scenario === "settings"
  ? async () => { await t.press("#more"); await page.waitForSelector("#p-menu[open]"); await page.click('#p-menu [data-act="settings"]'); await page.waitForSelector("#p-settings[open]"); await wait(150); await closePanel(); }
  : scenario === "theme"
  ? async () => { await t.press("#more"); await page.waitForSelector("#p-menu[open]"); await page.click('#p-menu [data-act="theme"]'); await page.waitForSelector("#p-theme[open]"); await wait(150); await closePanel(); }
  : async () => { await t.press("#v-all"); await wait(160); await t.press("#v-today"); await wait(160); };

const WARM = process.env.WARM === undefined ? 4 : +process.env.WARM; for (let i = 0; i < WARM; i++) await cycle();
const mA = await metrics(); const A = await snapshot();
for (let i = 0; i < N; i++) await cycle();
const mB = await metrics(); const B = await snapshot();
for (let i = 0; i < N; i++) await cycle();
const mC = await metrics(); const C = await snapshot();
console.log("metrics A/B/C", JSON.stringify([mA, mB, mC]), "per cycle B→C: nodes", ((mC.nodes - mB.nodes) / N).toFixed(2), "listeners", ((mC.listeners - mB.listeners) / N).toFixed(2));

const nB = newIn(B, A), nC = newIn(C, B);
const tB = tally(B, nB), tC = tally(C, nC);
const rows = [...tC.entries()].map(([k, c]) => [k, tB.get(k) || 0, c]).filter(r => r[2] >= N * 0.5 && r[1] >= N * 0.5).sort((a, b) => b[2] - a[2]);
console.log("\n== grew A→B and B→C alike (kind, +A→B, +B→C):"); for (const r of rows.slice(0, 40)) console.log("  ", r[2], r[1], r[0]);
const det = nC.filter(i => C.detached(i) || /^Detached /.test(C.name(i)));
const tDet = tally(C, det);
console.log("\n== detached DOM nodes new in C:", det.length); for (const [k, c] of [...tDet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log("  ", c, k);
const domB = tally(B, nB.filter(i => /^(HTML|SVG)\w*Element$|^Text$|^Comment$/.test(B.name(i)) && B.type(i) === "object"));
console.log("\n== DOM element wrappers new in B (A→B), the one-time set:", [...domB.values()].reduce((a, b) => a + b, 0)); for (const [k, c] of [...domB.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log("  ", c, k);
const domC = tally(C, nC.filter(i => /^(HTML|SVG)\w*Element$|^Text$|^Comment$/.test(C.name(i)) && C.type(i) === "object"));
console.log("== DOM element wrappers new in C (B→C):", [...domC.values()].reduce((a, b) => a + b, 0)); for (const [k, c] of [...domC.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log("  ", c, k);
fs.mkdirSync(process.env.OUT || "audit-out", { recursive: true });
fs.writeFileSync((process.env.OUT || "audit-out") + "/leak-" + scenario + ".json", JSON.stringify({ scenario, base: process.env.BASE, env: process.env.ENV || "desktop", fixture: process.env.FIXTURE || "longtime", warmup: WARM, cyclesPerStep: N, close: CLOSE, metrics: { A: mA, B: mB, C: mC }, perCycle: { AtoB: { nodes: (mB.nodes - mA.nodes) / N, listeners: (mB.listeners - mA.listeners) / N }, BtoC: { nodes: (mC.nodes - mB.nodes) / N, listeners: (mC.listeners - mB.listeners) / N } }, detachedNewInC: det.length, growingAlike: rows.slice(0, 40).map(r => ({ kind: r[0], AtoB: r[1], BtoC: r[2] })), domNewInB: Object.fromEntries([...domB.entries()].sort((a, b) => b[1] - a[1])), domNewInC: Object.fromEntries([...domC.entries()].sort((a, b) => b[1] - a[1])) }, null, 2));
const seen = new Set();
console.log("\n== retainer paths (one per kind of new detached node, plus the top growing kinds):");
for (const i of det) { const k = C.name(i); if (seen.has(k)) continue; seen.add(k); if (seen.size > 6) break; console.log("\n" + k + ":\n  " + C.retainers(i)); }
for (const r of rows.slice(0, 6)) { const k = r[0]; if (seen.has(k)) continue; seen.add(k); const i = nC.find(i => C.type(i) + " " + C.name(i) === k); if (i !== undefined) console.log("\n" + k + ":\n  " + C.retainers(i)); }
await t.close(); await browser.close();
