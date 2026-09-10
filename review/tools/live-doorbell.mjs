// review/tools/live-doorbell.mjs — re-measure `5cd559f`'s 0.63 seconds: a Swift write reaching the
// DEPLOYED page, with `live=true` asserted before every write, three trials on one list.
//
// Run (from the repo root, with the core built so `apple/TodaysFiveCore/.build/debug/tfive` exists):
//   node review/tools/live-doorbell.mjs [--trials 3] [--site https://…/todays-five/]
//
// What it does: `tfive new` makes ONE list on the real backend (one create from the twelve-an-hour
// budget); a fresh Playwright profile opens the deployed site on that list, answers "whose list is
// this?" once, waits for `status=synced` and `live=true` — a page that never joined the channel could
// not observe a broadcast at all, so without that the check has no witness and passes on a poll —
// then three times: `tfive add` (the same `SyncEngine.push` → `ringDoorbell` the Watch and the App
// Intent use) and a 25 ms poll of the page's rows until the line is there. The unchanged poll is
// weighed with `tfive raw`. The list is deleted at the end, and on every error path.
//
// What leaves this process: numbers only. `tfive` prints the list's links on purpose; every line it
// prints is kept in memory, parsed for the id, and never echoed. The id goes to the git-ignored
// ledger `tools/.realsync-created.txt` and nowhere else. Every string this script prints goes through
// `safe()`, which strikes any run of 22 or more base62 characters — the shape of a secret — so even a
// mistake above cannot put one on a terminal or in a file. A `[doorbell] 202, 138 bytes` line is a
// status and a byte count, which is why it may be quoted.
//
// What it cannot see: a real Watch (tfive stands in for it; they share the engine), a WKWebView
// suspend/resume, or a page that is backgrounded. It measures the deployed site as it is today.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
const { chromium } = require("playwright");

const REPO = fileURLToPath(new URL("../../", import.meta.url));
const TFIVE = process.env.TFIVE || path.join(REPO, "apple/TodaysFiveCore/.build/debug/tfive");
const LEDGER = path.join(REPO, "tools/.realsync-created.txt");
const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf("--" + name); return i < 0 ? dflt : args[i + 1]; };
const SITE = flag("site", "https://54kz2vzbdw-code.github.io/todays-five/");
const TRIALS = +flag("trials", 3);
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), "tf-review-live-"));   // tfive's store, never the user's

const SECRET_SHAPED = /(?<![0-9A-Za-z])[0-9A-Za-z]{22,}(?![0-9A-Za-z])/g;
const safe = s => String(s).replace(SECRET_SHAPED, m => `[redacted ${m.length}-char run]`);
const say = (...xs) => console.log(safe(xs.join(" ")));
const wait = ms => new Promise(r => setTimeout(r, ms));
const load = () => { try { return execFileSync("uptime", { encoding: "utf8" }).trim().replace(/.*load averages?:\s*/, ""); } catch (e) { return "?"; } };

if (!fs.existsSync(TFIVE)) { say("tfive is not built at the expected path; run `swift build` in apple/TodaysFiveCore first"); process.exit(2); }

/** Run tfive; the output is returned to the caller and NEVER printed here. */
function tfive(...a) {
  try { return { ok: true, out: execFileSync(TFIVE, a, { env: { ...process.env, TFIVE_HOME: HOME }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) }; }
  catch (e) { return { ok: false, out: (e.stdout || "") + (e.stderr || "") }; }
}

let W = null, browser = null;
const results = { site: SITE, trials: [], createRefused: false };
say("live doorbell — the deployed site, one list, " + TRIALS + " trials; load " + load());

try {
  // ---------------------------------------------------------------- create 1
  const made = tfive("new", "Review live run");
  const m = /#\/l\/([0-9A-Za-z]{22})/.exec(made.out || "");
  if (!made.ok || !m) {
    results.createRefused = true;
    const busy = /429|busy|limit|too many/i.test(made.out || "") ? "the create limit answered busy" : "tfive new failed";
    say("UNVERIFIED — " + busy + " (exit " + (made.ok ? 0 : 1) + "); nothing was created, nothing to delete");
    say(safe((made.out || "").split("\n").filter(l => /HTTP|error|busy|limit/i.test(l)).join(" | ")));
    process.exit(2);
  }
  W = m[1];
  try { fs.appendFileSync(LEDGER, `${new Date().toISOString()} review-live ${W}\n`); } catch (e) { /* the delete below still runs */ }
  say("created 1 list on the real backend (id withheld; in the git-ignored ledger)");

  // ---------------------------------------------------------------- the witness
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  const errors = [], hosts = new Set();
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", r => { try { hosts.add(new URL(r.url()).hostname); } catch (e) { /* data: */ } });
  const state = () => page.evaluate(() => window.__tf());
  const rows = () => page.$$eval("#list .row", els => els.map(e => e.querySelector(".tx")?.dataset.text || ""));
  const until = async (fn, ms, label) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await wait(200); } throw new Error("timed out waiting for " + label); };

  await page.goto(SITE + "#/l/" + W);
  try { await page.waitForSelector("#whose[open]", { timeout: 8000 }); await page.click('#whose [data-whose="mine"]'); await wait(400); } catch (e) { /* not asked */ }
  await until(async () => (await state()).status === "synced", 40000, "the page to sync the new list");
  await until(async () => (await state()).live === true, 30000, "the page to join the list's channel (live=true)");
  const opened = await state();
  say(`page: status=${opened.status} live=${opened.live} rev=${opened.cur && opened.cur.rev} build=${await page.evaluate(() => document.documentElement.dataset.build)} tokensRev=${await page.evaluate(() => document.documentElement.dataset.tokensRev || "")}`);

  // ---------------------------------------------------------------- the trials
  for (let i = 1; i <= TRIALS; i++) {
    const line = "Review trial " + i;
    let st = await state();
    if (st.live !== true) { try { await until(async () => (await state()).live === true, 20000, "live before trial " + i); } catch (e) { results.trials.push({ i, unverified: "the page was not live before the write" }); say(`trial ${i}: UNVERIFIED — live=false before the write`); continue; } st = await state(); }
    const revBefore = st.cur && st.cur.rev;
    const t0 = Date.now();
    const added = tfive("add", W, line);
    const tPut = (Date.now() - t0) / 1000;
    const bell = /\[doorbell\] (\d+), (\d+) bytes/.exec(added.out || "");
    let seen = null;
    const deadline = t0 + 90000;
    while (Date.now() < deadline) { const r = await rows(); if (r.includes(line)) { seen = (Date.now() - t0) / 1000; break; } await wait(25); }
    const after = await state();
    const row = { i, putReturnedS: +tPut.toFixed(3), lineOnPageS: seen == null ? null : +seen.toFixed(3), doorbell: bell ? { status: +bell[1], bytes: +bell[2] } : null, revBefore, revAfter: after.cur && after.cur.rev, liveAfter: after.live, addOk: added.ok };
    results.trials.push(row);
    say(`trial ${i}: put returned ${row.putReturnedS}s · line on the page ${row.lineOnPageS == null ? "NOT within 90 s" : row.lineOnPageS + "s"} · doorbell ${bell ? bell[1] + " " + bell[2] + " bytes" : "(no [doorbell] line printed)"} · rev ${revBefore}→${row.revAfter} · live after=${row.liveAfter} · load ${load()}`);
    await wait(3000);
  }

  // ---------------------------------------------------------------- the unchanged poll, weighed
  const raw = tfive("raw", W);
  const full = /get_list_v3\(p_rev: null\)\s+HTTP (\d+)\s+(\d+) bytes/.exec(raw.out || "");
  const poll = /get_list_v3\(p_rev: \d+\)\s+HTTP (\d+)\s+(\d+) bytes\s+(\{[^}]*\})/.exec(raw.out || "");
  const env = /envelope\s+v(\d+) (\S+) z=(\S+)\s+(\d+) bytes stored/.exec(raw.out || "");
  results.poll = { full: full ? +full[2] : null, unchanged: poll ? +poll[2] : null, unchangedText: poll ? poll[3] : null, envelopeBytes: env ? +env[4] : null };
  say(`unchanged poll: ${results.poll.unchanged} bytes (${safe(results.poll.unchangedText || "?")}) against ${results.poll.full} for the document; envelope ${results.poll.envelopeBytes} bytes stored`);
  say(`page errors: ${errors.length}${errors.length ? " — " + safe(errors.join(" | ")) : ""}; hosts contacted: ${[...hosts].sort().join(", ")}`);
  results.pageErrors = errors.length; results.hosts = [...hosts].sort();
  await ctx.close();
} catch (e) {
  say("error: " + safe((e && e.message) || String(e)).split("\n")[0]);
  results.error = safe((e && e.message) || String(e)).split("\n")[0];
} finally {
  if (browser) { try { await browser.close(); } catch (e) { /* already closed */ } }
  if (W) {
    const del = tfive("delete", W);
    const gone = tfive("show", W);
    results.deleted = /Deleted .* on the server/.test(del.out || "");
    results.goneAfter = /gone/.test(gone.out || "");
    say(`cleanup: deleted on the server=${results.deleted}; a read afterwards says gone=${results.goneAfter}`);
  }
  try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) { /* tmp */ }
  say("load at end " + load());
  const seen = results.trials.map(t => t.lineOnPageS).filter(x => x != null).sort((a, b) => a - b);
  say(`distribution (line on page, s): ${seen.join(", ") || "none"}; put returned (s): ${results.trials.map(t => t.putReturnedS).filter(x => x != null).join(", ")}`);
  const out = flag("json", "");
  if (out) fs.writeFileSync(out, safe(JSON.stringify(results, null, 2)) + "\n");
  say("lists created this run: " + (W ? 1 : 0) + ", deleted: " + (results.deleted ? 1 : 0));
}
