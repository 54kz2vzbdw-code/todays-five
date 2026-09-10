// tools/quietd.js — how long a page takes to see a write when the doorbell was rung and nobody heard it.
//
// Run:  node tools/serve.js 8797 . &   then   node tools/quietd.js        (BASE=… for another port)
//       node tools/quietd.js --trials 10 --only deaf-next --json out.json
//
// A sibling of tools/polld.js, deliberately NOT an extension of it. polld.js measures the *writer* that
// never rings — its whole trial shape is built around a write that sends no broadcast, and its seeds and
// condition ids are what the Phase 4 numbers in DECISIONS-apple.md are pinned to. Here the writer always
// rings (Phase 4 shipped that), and the subject is the *receiver*: a page that believes it is live,
// sitting on a 240 s safety poll, holding a channel that has stopped carrying anything.
//
// WHY THIS EXISTS. Three lines of sync.js, read together:
//   * visible() is `visibilityState !== "hidden"`, so a visible-but-unfocused window polls normally;
//   * subscribe() is reachable only from open() and wake(), and wake() only from visibilitychange,
//     focus, pageshow and online — schedulePoll() has never re-subscribed;
//   * alive() was the channel's own opinion of itself, and the comment above wake() has said since v3
//     that it can read "joined" over a dead socket.
// Together: a page whose channel quietly died goes on believing it is live, polls every 240 s instead of
// every 60, and the only thing in *sync.js* that can rescue it is a person clicking the window. Which is
// the bug as reported from a real second monitor: the list does not move until you click it.
//
// AND THE LIMIT OF THAT SENTENCE, because `tools/socketd.mjs` narrowed it after this file was written:
// sync.js is not the only thing that can rescue such a page. Wherever the realtime client's own timers
// run, the client notices and reports — a socket held open that answers nothing is CHANNEL_ERROR within
// one heartbeat timeout, and a socket cut rudely is reconnected *and* rejoined, which re-fires SUBSCRIBED
// into sync.js's `onState` and puts the page back on the fast path with nobody touching anything. So the
// shape this harness produces — a channel that reports nothing ever again — is the case the client does
// *not* cover, and it is produced here by a hook rather than found in the wild. What this table measures
// is what the page does once it is in that state. Whether a real page reaches it is a reading of
// vendor/realtime.js plus `wake()`'s comment since v3, and it is on the unverified list, not in here.
//
// WHAT "UNFOCUSED" IS HERE, PRECISELY. It is not an OS-level unfocused window, and that is measured
// rather than assumed. Two contexts, both headless and headed, system Chrome via Playwright 1.62.1:
// whichever page was last `bringToFront`ed, **both** report visibilityState "visible" and hasFocus()
// true, and a `bringToFront` round trip delivers **zero** window `focus` events to the page that lost
// and regained the front. Playwright emulates focus so that tests are deterministic, so an unfocused
// window is not producible here at all — which is a real limit on this harness and is why the fix is
// argued from mechanism (`tools/socketd.mjs`, and the reading of vendor/realtime.js) and not from the
// table alone. What IS producible is the only thing sync.js keys on: whether a `focus` event arrives.
// sync.js has no notion of "is focused", only of "just gained focus" (onFocus), so a window focused for
// an hour and a window unfocused for an hour are the same page to it — the difference is the transition,
// and that is the `clicked` condition below. Everything else runs with no focus transition at all, which
// is the second monitor's whole day. So there is no `focused` condition in CONDITIONS, and a number quoted
// anywhere for "the focused case" is the `heard` trial — visible, no focus event, channel carrying — and
// not a separate measurement of a focused window, because this harness cannot produce one.
//
// WHAT THE TRANSPORT CAN AND CANNOT SAY. ?transport=local models the app's timer arithmetic exactly and
// the network not at all (Phase 4 wrote that down). Its channel is a BroadcastChannel in this process:
// there is no socket to drop, so the dead channel is produced by a test hook — tf/test/rtmute, which
// makes the page's first channel join, go on reporting itself alive, and hear nothing ever again. That is
// the *shape* of the failure, not a socket. Whether a real socket reaches that shape, and what the real
// client does about it, is a reading of vendor/realtime.js and is named as a reading in the write-up.
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
const { chromium } = require("playwright");
import { POLL_MS, POLL_LIVE_MS } from "../sync.js";

const BASE = process.env.BASE || "http://127.0.0.1:8797/";
const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf("--" + name); return i < 0 ? dflt : args[i + 1]; };

const TRIALS = +(flag("trials", 10));
const ONLY = flag("only", "");
const SEED = +(flag("seed", 20260909));           // the phase offsets are seeded, so a run repeats
const STEP_MS = +(flag("step", 2000));            // the resolution of every number below, after the first 2 s
const OUT = flag("json", "");

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* mulberry32, as in polld.js: two runs with the same --seed draw the same phases, which is what makes a
   before-and-after comparison worth reading. */
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

/* ---------------- the conditions ----------------
   Every one of them is a page that is visible, has synced, and reports live === true — i.e. a page that
   believes its channel is there. That belief is the bug's signature, so a trial where the page does not
   hold it is thrown and marked, never quietly averaged in. Both checks are throws, and they have to be:
   the second one is the trap. A `slept` trial whose eight-hour jump left `live` false has fallen to the
   60 s poll, so its latency is drawn against a 60 s bound while every other trial in that column was drawn
   against 240 s — and a mixed column reads exactly like the uniform one the whole argument rests on. That
   is what `NotTheCondition` is for: such a trial never reaches `seen`, it is printed as its own count in
   the table, and it fails the run. */

/** Thrown when a trial stopped being the condition it was set up to be. Kept apart from every other
    failure: "could not run" is usually a dead server, this is the page having moved out from under the
    measurement, and the two must not print alike or be counted alike. */
class NotTheCondition extends Error {}

const CONDITIONS = [
  { id: "heard", label: "visible, no focus event, channel carrying — the doorbell is heard",
    mute: false, preroll: "", clickAfterMs: 0, period: POLL_LIVE_MS, horizon: 60000 },
  { id: "deaf", label: "visible, no focus event, channel gone quiet — first write",
    mute: true, preroll: "", clickAfterMs: 0, period: POLL_LIVE_MS, horizon: 250000 },
  { id: "clicked", label: "visible, channel gone quiet, the window is clicked 2 s after the write",
    mute: true, preroll: "", clickAfterMs: 2000, period: POLL_LIVE_MS, horizon: 60000 },
  { id: "deaf-next", label: "visible, channel gone quiet, one whole poll period has already passed",
    mute: true, preroll: "poll", clickAfterMs: 0, period: POLL_LIVE_MS, horizon: 250000 },
  { id: "slept", label: "visible, channel gone quiet, the lid was shut for eight hours",
    mute: true, preroll: "lid", clickAfterMs: 0, period: POLL_LIVE_MS, horizon: 250000 }
];

/* ---------------- one trial ---------------- */

const T0 = Date.UTC(2026, 8, 9, 15, 0, 0);        // mid-afternoon: no rollover inside any horizon
const LID_MS = 8 * 3600 * 1000;

async function trial(browser, cond, phaseMs) {
  // 1440×900: the reported bug is a desktop window on a second monitor, not a phone.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    if (cond.mute) await ctx.addInitScript(`try { localStorage.setItem("tf/test/rtmute", "1"); } catch (e) {}`);
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

    // settle: the list is on the server row and the page believes the channel is there
    let st = null;
    for (let i = 0; i < 60; i++) {
      st = await page.evaluate(() => window.__tf());
      if (st.status === "synced" && st.live === true) break;
      await sleep(100);
    }
    if (st.status !== "synced") throw new Error("the list never synced: status " + st.status);
    if (st.live !== true) throw new Error("the page does not believe it is live, so this is not the condition");
    const lookupId = st.lookupId, R = st.R;
    if (!lookupId || !R) throw new Error("the test hook gave no local-transport ref");

    // From here the clock only moves when this file moves it.
    const pageNow = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(pageNow + 5000);
    await sleep(200);

    // the pre-roll: what the window has already been through before the write happens
    if (cond.preroll === "poll") {
      // one whole safety-poll period with the channel quiet — the occasion the fix is supposed to use
      for (let t = 0; t < POLL_LIVE_MS + 10000; t += STEP_MS) { await page.clock.runFor(STEP_MS); await sleep(8); }
    } else if (cond.preroll === "lid") {
      // fastForward, not runFor: Playwright documents it as the laptop-lid jump, firing each due timer once
      await page.clock.fastForward(LID_MS);
      await sleep(250);
    }
    // The integrity check the CONDITIONS comment promises, and it is a throw for the reason written there:
    // a page that has stopped believing it is live is on the 60 s poll, so its latency would be drawn
    // against a different bound from the rest of its column and would silently change the column's shape.
    const liveAfterPreroll = (await page.evaluate(() => window.__tf())).live;
    if (liveAfterPreroll !== true) throw new NotTheCondition("the page had stopped believing it was live before the write, so its latency is drawn against the 60 s bound and not this column's");

    // a random phase into the poll period, so the trials are a distribution and not one anecdote
    for (let t = 0; t < phaseMs; t += STEP_MS) {
      await page.clock.runFor(Math.min(STEP_MS, phaseMs - t));
      await sleep(8);
    }

    // ---- the write: a Watch, `tfive` or the App Intent, as they behave since Phase 4 — ring the bell ----
    // The write itself is done the way SupabaseTransport.put does it (polld.js's note applies: a bare
    // BroadcastChannel.postMessage would simulate away the thing being measured). The ring is separate
    // and is the mirror of sync.js:331 — { rev, from } and nothing else.
    const itemId = await page.evaluate(async ({ R, lookupId }) => {
      const C = await import("./crypto.js");
      const M = await import("./model.js");
      const ref = await C.fromRead(R);
      const key = "tf/v2/localserver/" + lookupId;
      const row = JSON.parse(localStorage.getItem(key));
      const doc = await C.open(ref.key, row.doc);
      const id = M.shortId();
      const at = Date.now();
      let order = 0;
      for (const it of Object.values(doc.items || {})) if (it && !it.deleted) order = Math.max(order, it.todayOrder || it.order || 0);
      doc.items[id] = { id, sectionId: "", text: "written by another device", note: "", done: false, doneAt: 0, today: true, order: order + 1000, todayOrder: order + 1000, updatedAt: at };
      doc.updatedAt = at;
      row.doc = await C.seal(ref.key, doc);
      row.rev = (row.rev | 0) + 1;
      localStorage.setItem(key, JSON.stringify(row));
      new BroadcastChannel("tf-local-transport").postMessage({ topic: lookupId, payload: { rev: row.rev, from: "quietd:" + M.shortId() } });
      return id;
    }, { R, lookupId });

    // ---- step the clock until the page shows it ----
    const seen = async () => page.evaluate(id => ({
      hit: !!document.querySelector(`#list .row[data-id="${id}"]`),
      status: window.__tf().status
    }), itemId);

    // The doorbell arrives on a task rather than a timer, so look once before moving the clock at all,
    // then walk the first two seconds in tenths — otherwise a win that lands in 15 ms is reported as one
    // step, which is the harness's resolution and not the number.
    let r = await seen();
    if (r.hit) return { ms: 0, errors };

    let t = 0, clicked = false;
    while (t < cond.horizon) {
      const step = t < 2000 ? 100 : STEP_MS;
      await page.clock.runFor(step);
      t += step;
      if (cond.clickAfterMs && !clicked && t >= cond.clickAfterMs) {
        // what clicking an unfocused window actually delivers to the page: a window `focus` event, which
        // is the event listen() binds. Not a simulation of focus — the same event, from the same target.
        clicked = true;
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        // The focus pull's round trip is the local transport's 15 ms lag, and that lag is a setTimeout,
        // so it is on the fake clock: without a small step here the click's cost is rounded up to the
        // next 2 s slice, which would be the harness's resolution and not the number.
        for (let i = 0; i < 12; i++) { r = await seen(); if (r.hit) break; await page.clock.runFor(100); t += 100; await sleep(20); }
        if (r.hit) return { ms: t, errors };
      }
      // real time for the pull's crypto to finish: the fake clock does not drive it and must not count it
      for (let i = 0; i < 8; i++) {
        r = await seen();
        if (r.hit || r.status !== "syncing") break;
        await sleep(15);
      }
      if (!r.hit) { await sleep(10); r = await seen(); }
      if (r.hit) return { ms: t, errors };
    }
    return { ms: null, errors };      // never, inside the horizon
  } finally {
    await ctx.close();
  }
}

/* ---------------- the run ---------------- */

const wanted = CONDITIONS.filter(c => !ONLY || c.id === ONLY);
if (!wanted.length) { console.error("no such condition; one of: " + CONDITIONS.map(c => c.id).join(", ")); process.exit(2); }

console.log(`quietd — ${TRIALS} trial(s) per condition, ${STEP_MS / 1000} s steps, seed ${SEED}, against ${BASE}`);
console.log(`POLL_MS ${POLL_MS / 1000} s, POLL_LIVE_MS ${POLL_LIVE_MS / 1000} s (read from sync.js)`);
console.log(`engine: system Chrome via Playwright ${require("playwright/package.json").version} (the only engine installed here: no ms-playwright cache, so no bundled Chromium, no Firefox, no WebKit)\n`);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = { base: BASE, seed: SEED, stepMs: STEP_MS, trials: TRIALS, pollMs: POLL_MS, pollLiveMs: POLL_LIVE_MS, conditions: [] };
let pageErrors = 0;

try {
  for (const cond of wanted) {
    const draw = rng(seedFor(cond.id));
    const got = [], never = [];
    let broke = 0, notLive = 0;
    process.stdout.write(cond.id.padEnd(10) + " ");
    for (let i = 0; i < TRIALS; i++) {
      const phase = Math.floor(draw() * cond.period / STEP_MS) * STEP_MS;
      let out;
      try {
        out = await trial(browser, cond, phase);
      } catch (e) {
        if (e instanceof NotTheCondition) {
          notLive++;
          process.stdout.write("!");
          console.log("\n  trial " + (i + 1) + " stopped being this condition and is NOT in the numbers below: " + e.message);
          continue;
        }
        broke++;
        process.stdout.write("x");
        console.log("\n  trial " + (i + 1) + " could not be measured: " + (e.message || e).split("\n")[0]);
        continue;
      }
      pageErrors += out.errors.length;
      if (out.errors.length) console.log("\n  page error: " + out.errors[0]);
      if (out.ms == null) { never.push(cond.horizon); process.stdout.write("·"); }
      else { got.push(out.ms / 1000); process.stdout.write("."); }
    }
    const seen = got.slice().sort((a, b) => a - b);
    report.conditions.push({
      id: cond.id, label: cond.label, seen, never: never.length, broke, notLive,
      horizonS: cond.horizon / 1000, periodS: cond.period / 1000,
      maxS: seen.length ? seen[seen.length - 1] : null,
      underASecond: seen.filter(s => s <= 1).length
    });
    process.stdout.write("\n");
  }
} finally {
  await browser.close();
}

// The distribution and the bound it is drawn against, never a median: ten draws from a uniform
// distribution have a sampling error of tens of seconds, and Phase 4 lost three medians to that. What
// reproduces is the shape — "inside a second" against "somewhere in the poll period".
console.log("\n| condition | trials (s) | inside 1 s | max vs period |");
console.log("| --- | --- | --- | --- |");
for (const c of report.conditions) {
  // A trial that threw is NOT a trial that saw nothing, and the two must never print alike.
  const trials = c.seen.length ? c.seen.join(", ") + (c.never ? `, and ${c.never} never` : "")
    : c.never ? `never, ${c.never}/${c.never} in ${c.horizonS} s`
    : "NOT MEASURED";
  const bound = c.maxS == null ? "—" : `${c.maxS} / ${c.periodS}`;
  // Every trial that was thrown out is named in its own cell: a column that lost trials must never be
  // readable as a column that did not.
  const lost = (c.broke ? ` (${c.broke} could not run)` : "") + (c.notLive ? ` (${c.notLive} excluded: not the condition)` : "");
  console.log(`| ${c.label} | ${trials}${lost} | ${c.seen.length ? `${c.underASecond}/${c.seen.length}` : "—"} | ${bound} |`);
}
const notLive = report.conditions.reduce((n, c) => n + c.notLive, 0);
console.log(`\npage errors: ${pageErrors}`);
const broken = report.conditions.reduce((n, c) => n + c.broke, 0);
if (OUT) { fs.writeFileSync(OUT, JSON.stringify(report, null, 2)); console.log("wrote " + OUT); }
if (broken) {
  console.log(`\n${broken} trial(s) could not run — is \`node tools/serve.js 8797 .\` up? These numbers are not a measurement.`);
  process.exit(1);
}
if (notLive) {
  console.log(`\n${notLive} trial(s) had stopped believing they were live before the write. They are excluded from every`);
  console.log(`number above — their latency would have been drawn against the 60 s bound, not the column's 240 s — and`);
  console.log(`they are an exit code rather than a footnote, because a condition that stops holding is a condition that`);
  console.log(`needs rebuilding before the table is quoted.`);
  process.exit(1);
}
if (report.conditions.some(c => !c.seen.length && !c.never)) {
  console.log(`\na condition measured nothing at all. These numbers are not a measurement.`);
  process.exit(1);
}
