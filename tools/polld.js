// tools/polld.js — how long a phone takes to see a write nobody rang the bell for.
//
// Run:  node tools/serve.js 8791 . &   then   node tools/polld.js       (BASE=… for another port)
//       node tools/polld.js --trials 10 --only fg-live --doorbell --json out.json
//
// No backend, no list creations, no network past 127.0.0.1. The whole measurement is the web app's
// own timer arithmetic against a virtual clock, so four minutes of waiting costs a few hundred
// milliseconds and forty trials cost about six.
//
// WHY THIS EXISTS. sync.js:331 is the only line in the system that broadcasts. SyncEngine.push() is
// that same block with the line absent, put_list_v3 ends at an `update` (no trigger, no realtime.send,
// no pg_notify), and RealtimeTransport has zero conformers. So a write from a Watch, from `tfive` or
// from the App Intent lands on the server and nothing tells the phone. Meanwhile the phone, having
// joined the channel successfully, has moved its safety-net poll from POLL_MS (60 s) to POLL_LIVE_MS
// (240 s) on the strength of a doorbell nobody rings — a phone whose realtime is *working* is four
// times slower to notice than one whose realtime is dead.
//
// HOW A TRIAL IS SHAPED. One browser context per trial:
//
//   * the phone opens ?transport=local and makes a list, so the "server" is a localStorage row and
//     the identical sync and crypto engine is exercised;
//   * page.clock.install fakes Date and every timer; once the list is made and settled, pauseAt
//     stops real time flowing into the fake clock, so from then on only runFor moves it and the
//     seconds reported are the app's seconds, not the wall's;
//   * a random phase offset is run off first, because a poll is a sawtooth: without it every trial
//     lands at the same point in the period and reports an anecdote instead of a distribution;
//   * THE WRITE IS DONE THE WAY SupabaseTransport.put DOES IT — import the app's own crypto.js,
//     decrypt tf/v2/localserver/<lookupId>, add a line, re-seal, write the row back at rev + 1.
//     Deliberately NOT a BroadcastChannel.postMessage: the local transport's channel is the doorbell,
//     and ringing it here would simulate away the exact bug being measured. The one condition that
//     does ring it is named `doorbell` and is the model of the fix, not of today.
//   * then the clock is stepped in 2 s slices until the line appears in the phone's Today list.
//
// WHAT IT CAN AND CANNOT PROVE. It models the timer arithmetic exactly — POLL_MS, POLL_LIVE_MS, the
// visible() gate, setLive — and the network not at all: no round trips, no radio wake, no WKWebView
// suspend. The `doorbell` condition therefore measures the *arrival* path (a broadcast reaching a
// subscribed page and turning into a pull), not what the real socket costs to carry it.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
const { chromium } = require("playwright");
import { POLL_MS, POLL_LIVE_MS } from "../sync.js";

const BASE = process.env.BASE || "http://127.0.0.1:8791/";
const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf("--" + name); return i < 0 ? dflt : args[i + 1]; };
const has = name => args.includes("--" + name);

const TRIALS = +(flag("trials", 10));
const ONLY = flag("only", "");
const SEED = +(flag("seed", 20260907));           // the phase offsets are seeded, so a run repeats
const STEP_MS = +(flag("step", 2000));            // the resolution of every number below
const OUT = flag("json", "");

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Seeded rather than Math.random: two runs of this file with the same --seed draw the same phases,
   which is what makes a before-and-after comparison worth reading. mulberry32 rather than the LCG
   this file started with — an LCG's first few outputs are visibly clustered, and with ten draws per
   condition "the first few" is the whole sample. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A per-condition seed: two conditions whose ids happen to be the same length must not draw the same phases. */
function seedFor(id) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (SEED ^ h) >>> 0;
}

/* ---------------- the conditions ---------------- */

const CONDITIONS = [
  { id: "fg-live",   label: "foreground, realtime connected",     hidden: false, rtfail: false, doorbell: false, period: POLL_LIVE_MS, horizon: 300000 },
  { id: "fg-dead",   label: "foreground, realtime NOT connected", hidden: false, rtfail: true,  doorbell: false, period: POLL_MS,      horizon: 120000 },
  { id: "bg-live",   label: "backgrounded, realtime connected",   hidden: true,  rtfail: false, doorbell: false, period: POLL_LIVE_MS, horizon: 600000 },
  { id: "bg-dead",   label: "backgrounded, realtime NOT connected", hidden: true, rtfail: true, doorbell: false, period: POLL_MS,      horizon: 600000 },
  // The fix, modelled: a writer that rings list:<lookupId> the way sync.js:331 does. Off unless asked
  // for, because it measures the arrival path and not today's behaviour.
  { id: "doorbell",  label: "foreground, realtime connected, writer rings the doorbell", hidden: false, rtfail: false, doorbell: true, period: POLL_LIVE_MS, horizon: 60000 }
];

/* ---------------- one trial ---------------- */

const T0 = Date.UTC(2026, 8, 7, 15, 0, 0);        // mid-afternoon: no rollover inside any horizon

async function trial(browser, cond, phaseMs) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  try {
    if (cond.rtfail) await ctx.addInitScript(`try { localStorage.setItem("tf/test/rtfail", "1"); } catch (e) {}`);
    const page = await ctx.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.clock.install({ time: T0 });
    await page.goto(BASE + "?transport=local");

    // through the welcome, keeping the three seed lines, and past the save sheet
    await page.waitForSelector("#welcome:not([hidden])");
    await page.evaluate(() => document.getElementById("w-keep").click());
    await page.waitForSelector("#p-save[open]");
    await page.click("#save-done");
    await page.waitForSelector("#list .row");

    // settle: the list is on the server row and the channel has answered
    let st = null;
    for (let i = 0; i < 60; i++) {
      st = await page.evaluate(() => window.__tf());
      if (st.status === "synced" && st.live === !cond.rtfail) break;
      await sleep(100);
    }
    if (st.status !== "synced") throw new Error("the list never synced: status " + st.status);
    if (st.live !== !cond.rtfail) throw new Error(`live=${st.live} where the condition wants ${!cond.rtfail}`);
    const lookupId = st.lookupId, R = st.R;
    if (!lookupId || !R) throw new Error("the test hook gave no local-transport ref");

    // From here the clock only moves when this file moves it. pauseAt takes a moment in the future so
    // the drift between reading Date.now() in the page and the driver acting on it cannot go negative.
    const pageNow = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(pageNow + 5000);
    await sleep(200);

    if (cond.hidden) {
      // the person put the phone away: schedulePoll's visible() gate is upstream of the timer
      await page.evaluate(() => {
        Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await sleep(120);
    }

    // a random phase into the poll period, so the trials are a distribution and not one anecdote
    for (let t = 0; t < phaseMs; t += STEP_MS) {
      await page.clock.runFor(Math.min(STEP_MS, phaseMs - t));
      await sleep(8);
    }

    // ---- the write: what a Watch, `tfive` or the App Intent does today ----
    const itemId = await page.evaluate(async ({ R, lookupId, doorbell }) => {
      const C = await import("./crypto.js");
      const M = await import("./model.js");
      const ref = await C.fromRead(R);                       // R gives the lookup id and the key
      const key = "tf/v2/localserver/" + lookupId;
      const row = JSON.parse(localStorage.getItem(key));
      const doc = await C.open(ref.key, row.doc);            // the row holds an envelope, not a document
      const id = M.shortId();
      const at = Date.now();
      let order = 0;
      for (const it of Object.values(doc.items || {})) if (it && !it.deleted) order = Math.max(order, it.todayOrder || it.order || 0);
      doc.items[id] = { id, sectionId: "", text: "written by another device", note: "", done: false, doneAt: 0, today: true, order: order + 1000, todayOrder: order + 1000, updatedAt: at };
      doc.updatedAt = at;
      // the server never sees `id`; the row we read had it stripped and the row we write keeps it that way
      row.doc = await C.seal(ref.key, doc);
      row.rev = (row.rev | 0) + 1;
      localStorage.setItem(key, JSON.stringify(row));
      if (doorbell) {
        // the mirror of sync.js:331 — { rev, from } and nothing else, from a device that is not this one
        new BroadcastChannel("tf-local-transport").postMessage({ topic: lookupId, payload: { rev: row.rev, from: "polld:" + M.shortId() } });
      }
      return id;
    }, { R, lookupId, doorbell: cond.doorbell });

    // ---- step the clock until the phone shows it ----
    const seen = async () => page.evaluate(id => ({
      hit: !!document.querySelector(`#list .row[data-id="${id}"]`),
      status: window.__tf().status
    }), itemId);

    // The doorbell arrives on a task rather than a timer, so look once before moving the clock at
    // all, and then walk the first two seconds in tenths — otherwise a fix that lands in 15 ms is
    // reported as one step, which is the harness's resolution and not the number.
    let r = await seen();
    if (r.hit) return { ms: 0, errors };

    let t = 0;
    while (t < cond.horizon) {
      const step = t < 2000 ? 100 : STEP_MS;
      await page.clock.runFor(step);
      t += step;
      // real time for the pull's crypto to finish: the fake clock does not drive it and must not count it
      for (let i = 0; i < 8; i++) {
        r = await seen();
        if (r.hit || r.status !== "syncing") break;
        await sleep(15);
      }
      if (!r.hit) { await sleep(10); r = await seen(); }
      if (r.hit) return { ms: t, errors };
    }
    return { ms: null, errors };                               // never, inside the horizon
  } finally {
    await ctx.close();
  }
}

/* ---------------- the run ---------------- */

function median(xs) {
  const v = xs.slice().sort((a, b) => a - b);
  if (!v.length) return null;
  const i = v.length >> 1;
  return v.length % 2 ? v[i] : (v[i - 1] + v[i]) / 2;
}

const wanted = CONDITIONS.filter(c => (ONLY ? c.id === ONLY : (c.id !== "doorbell" || has("doorbell"))));
if (!wanted.length) { console.error("no such condition; one of: " + CONDITIONS.map(c => c.id).join(", ")); process.exit(2); }

console.log(`polld — ${TRIALS} trial(s) per condition, ${STEP_MS / 1000} s steps, seed ${SEED}, against ${BASE}`);
console.log(`POLL_MS ${POLL_MS / 1000} s, POLL_LIVE_MS ${POLL_LIVE_MS / 1000} s (read from sync.js)\n`);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = { base: BASE, seed: SEED, stepMs: STEP_MS, trials: TRIALS, pollMs: POLL_MS, pollLiveMs: POLL_LIVE_MS, conditions: [] };
let pageErrors = 0;

try {
  for (const cond of wanted) {
    const draw = rng(seedFor(cond.id));
    const got = [], never = [];
    process.stdout.write(cond.id.padEnd(9) + " ");
    for (let i = 0; i < TRIALS; i++) {
      const phase = Math.floor(draw() * cond.period / STEP_MS) * STEP_MS;
      let out;
      try {
        out = await trial(browser, cond, phase);
      } catch (e) {
        console.log("\n  trial " + (i + 1) + " could not be measured: " + (e.message || e).split("\n")[0]);
        continue;
      }
      pageErrors += out.errors.length;
      if (out.errors.length) console.log("\n  page error: " + out.errors[0]);
      if (out.ms == null) { never.push(cond.horizon); process.stdout.write("·"); }
      else { got.push(out.ms / 1000); process.stdout.write("."); }
    }
    const line = { id: cond.id, label: cond.label, seen: got.slice().sort((a, b) => a - b), never: never.length, horizonS: cond.horizon / 1000, medianS: median(got), maxS: got.length ? Math.max(...got) : null };
    report.conditions.push(line);
    process.stdout.write("\n");
  }
} finally {
  await browser.close();
}

console.log("\n| condition | trials (s) | median |");
console.log("| --- | --- | --- |");
for (const c of report.conditions) {
  const trials = c.seen.length
    ? c.seen.join(", ") + (c.never ? `, and ${c.never} never` : "")
    : `never, ${c.never}/${c.never} in ${c.horizonS} s`;
  const med = c.medianS == null ? "—" : `${c.medianS} (max ${c.maxS})`;
  console.log(`| ${c.label} | ${trials} | ${med} |`);
}
console.log(`\npage errors: ${pageErrors}`);
if (OUT) { fs.writeFileSync(OUT, JSON.stringify(report, null, 2)); console.log("wrote " + OUT); }
