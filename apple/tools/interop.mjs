// apple/tools/interop.mjs — the live interop run: the Swift core and the web app against the real
// Supabase project, on the deployed site.
//
// Run:  node apple/tools/interop.mjs        (from the repo root, after `swift build` in apple/TodaysFiveCore)
//
// THE CREATE BUDGET IS THREE. The server allows twelve new lists an hour per address (002_v3.sql,
// private.limits), and a day of suites can spend it. This run makes exactly three rows:
//   1. list A, created on the live site by the browser
//   2. list B, created by tfive
//   3. list A's replacement, created by "New keys" on the site (which deletes A's row)
// Everything else is reads, writes to rows that already exist, and deletes. Every row is deleted at
// the end, and the ids are printed as they are made so a crashed run can be cleaned up by hand.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as C from "../../crypto.js";
import config from "../../config.js";

const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
const { chromium } = require("playwright");

const SITE = process.env.SITE || "https://54kz2vzbdw-code.github.io/todays-five/";
const TFIVE = path.resolve(new URL("../TodaysFiveCore/.build/debug/tfive", import.meta.url).pathname);
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), "tfive-interop-"));
const wait = ms => new Promise(r => setTimeout(r, ms));

let passed = 0, failed = 0;
const results = [];
const made = [];                                   // { label, W } — deleted at the end

function step(name, note = "") {
  passed++;
  results.push({ name, note });
  console.log("ok  -", name, note ? "\n       " + note.replace(/\n/g, "\n       ") : "");
}
function bad(name, e) {
  failed++;
  results.push({ name, note: "FAILED: " + (e.message || e) });
  console.log("FAIL-", name, "\n      ", (e.message || String(e)).split("\n")[0]);
}

function tfive(...args) {
  try {
    return execFileSync(TFIVE, args, { env: { ...process.env, TFIVE_HOME: HOME }, encoding: "utf8" });
  } catch (e) {
    const out = (e.stdout || "") + (e.stderr || "");
    throw new Error("tfive " + args.join(" ") + " failed: " + out.trim());
  }
}
function tfiveMayFail(...args) {
  try {
    return { ok: true, out: execFileSync(TFIVE, args, { env: { ...process.env, TFIVE_HOME: HOME }, encoding: "utf8" }) };
  } catch (e) {
    return { ok: false, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const base = config.url.replace(/\/+$/, "");
async function rpc(fn, args) {
  const r = await fetch(`${base}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: config.key, "Content-Type": "application/json" },
    body: JSON.stringify(args)
  });
  const text = await r.text();
  return { status: r.status, text, bytes: new TextEncoder().encode(text).length };
}

/** The site, in a fresh profile: no list, no service worker cache, no localStorage. */
async function device(browser, url = SITE) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(url);
  const state = () => page.evaluate(() => window.__tf());
  const wake = () => page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const until = async (fn, ms = 20000, label = "condition") => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await fn()) return true;
      await wait(300);
    }
    throw new Error("timed out waiting for " + label);
  };
  const rows = () => page.$$eval("#list .row", els => els.map(e => ({
    text: e.querySelector(".tx")?.dataset.text || "", done: e.classList.contains("done")
  })));
  const addLine = async text => {
    await page.click("#addtoday");
    await page.waitForSelector("#list .row.editing");
    await page.keyboard.type(text);
    await page.keyboard.press("Enter");
    await wait(200);
    await page.keyboard.press("Escape");
    await wait(300);
  };
  return { ctx, page, errors, state, wake, until, rows, addLine, close: () => ctx.close() };
}

/** Through the welcome and the save sheet: a brand-new list on the live backend. */
async function createOnTheWeb(d) {
  await d.page.waitForSelector("#welcome:not([hidden])");
  await d.page.click("#w-skip");
  await d.page.waitForSelector("#p-save[open]");
  await d.page.click("#save-done");
  await d.page.waitForSelector("#list .row");
  await d.until(async () => (await d.state()).status === "synced", 30000, "the new list to sync");
  return (await d.state()).listId;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
let W_A = null, W_B = null, W_A2 = null;

try {
  console.log("Live interop against", SITE);
  console.log("Store:", HOME, "\n");

  // ---------------------------------------------------------------- 1. the web makes a list (create 1)

  const web = await device(browser);
  W_A = await createOnTheWeb(web);
  made.push({ label: "A (web)", W: W_A });
  const refA = await C.fromWrite(W_A);
  console.log("   created list A on the web:", W_A, "→ row", refA.lookupId);
  const stA = await web.state();
  step("the web created a list on the real backend",
       `status ${stA.status}, rev ${stA.cur.rev}, row ${refA.lookupId}`);

  // the row on the wire is an envelope and holds no plaintext
  try {
    const raw = await rpc("get_list_v3", { p_id: refA.lookupId, p_rev: null });
    assert.equal(raw.status, 200);
    const row = JSON.parse(raw.text);
    assert.ok(C.isEnvelope(row.doc), "the row is a v3 envelope");
    assert.ok(!raw.text.includes(W_A) && !raw.text.includes("Tap or click"), "no secret, no plaintext");
    step("the row on the wire is an envelope and carries no secret or plaintext",
         `${raw.bytes} bytes, z=${row.doc.z}`);
  } catch (e) { bad("the row on the wire is an envelope", e); }

  // ---------------------------------------------------------------- 2. tfive reads it

  try {
    const out = tfive("show", W_A);
    for (const line of ["Tap or click to cross this off", "Add a line of your own", "Cross off all three and see"]) {
      assert.ok(out.includes(line), "tfive show is missing: " + line);
    }
    assert.ok(/synced/.test(out), "tfive show says synced");
    step("tfive read the web's list", out.split("\n").slice(0, 7).join("\n"));
  } catch (e) { bad("tfive read the web's list", e); }

  // ---------------------------------------------------------------- 3. tfive checks a line, the web sees it

  try {
    const out = tfive("check", W_A, "1");
    assert.ok(out.includes("Crossed off: Tap or click to cross this off"), out);
    await web.wake();
    await web.until(async () => (await web.rows()).some(r => r.done && r.text === "Tap or click to cross this off"),
                    30000, "the web to show the check");
    const st = await web.state();
    step("tfive crossed a line off and the web shows it",
         `the web is at rev ${st.cur.rev}, status ${st.status}`);
  } catch (e) { bad("tfive crossed a line off and the web shows it", e); }

  // ---------------------------------------------------------------- 4. both sides edit offline, then converge

  try {
    const before = (await web.state()).cur.rev;
    await web.ctx.setOffline(true);
    await web.addLine("Written on the web while offline");
    await wait(600);
    const offlineState = await web.state();
    assert.ok(offlineState.cur.dirty, "the web is holding an unsent edit");
    assert.ok((await web.rows()).some(r => r.text === "Written on the web while offline"));

    // meanwhile the Swift side, online, adds its own line and pushes
    const swiftOut = tfive("add", W_A, "Written on the Mac while the web was offline");
    assert.ok(swiftOut.includes("Added: Written on the Mac"), swiftOut);

    await web.ctx.setOffline(false);
    await web.wake();
    await web.until(async () => {
      const r = await web.rows();
      return r.some(x => x.text === "Written on the Mac while the web was offline")
          && r.some(x => x.text === "Written on the web while offline");
    }, 40000, "the two offline edits to converge on the web");
    await web.until(async () => (await web.state()).status === "synced", 20000, "the web to settle");

    const swiftBack = tfive("show", W_A);
    assert.ok(swiftBack.includes("Written on the web while offline"), "the Mac has the web's offline line");
    assert.ok(swiftBack.includes("Written on the Mac while the web was offline"), "the Mac kept its own line");
    const after = (await web.state()).cur.rev;
    step("both sides edited while apart and converged with no loss",
         `rev ${before} → ${after}; both lines on both sides`);
  } catch (e) { bad("both sides edited while apart and converged", e); }

  // ---------------------------------------------------------------- 5. tfive makes a list, the web opens it (create 2)

  try {
    const out = tfive("new", "From the Mac");
    const m = out.match(/Private\s+\S*#\/l\/([0-9A-Za-z]{22})/);
    assert.ok(m, "tfive new printed a private link:\n" + out);
    W_B = m[1];
    made.push({ label: "B (tfive)", W: W_B });
    console.log("   created list B from tfive:", W_B);
    const refB = await C.fromWrite(W_B);

    const raw = await rpc("get_list_v3", { p_id: refB.lookupId, p_rev: null });
    assert.equal(raw.status, 200);
    const row = JSON.parse(raw.text);
    assert.ok(C.isEnvelope(row.doc), "the Swift row is a v3 envelope");
    assert.equal(row.doc.z, "deflate-raw", "sealed with deflate-raw");
    const opened = await C.open(refB.key, row.doc);
    assert.equal(Object.keys(opened.items).length, 3, "three seed lines");
    assert.ok(!("id" in opened), "the secret was stripped before sealing");

    const second = await device(browser, SITE + "#/l/" + W_B);
    await second.page.waitForSelector("#list .row", { timeout: 30000 });
    await second.until(async () => (await second.state()).status === "synced", 30000, "the web to open the Mac's list");
    const texts = (await second.rows()).map(r => r.text);
    assert.ok(texts.includes("Tap or click to cross this off"), "the web shows the Mac's lines: " + texts.join(" | "));
    const st = await second.state();
    assert.equal(st.listId, W_B);
    step("tfive made a list and the web opened it",
         `crypto.js opened the Swift envelope (${raw.bytes} bytes, z=${row.doc.z}); the web is at rev ${st.cur.rev}`);
    await second.close();
  } catch (e) { bad("tfive made a list and the web opened it", e); }

  // ---------------------------------------------------------------- 6. a view link reads and cannot write

  try {
    const refB = await C.fromWrite(W_B);
    const viewOut = tfive("show", refB.R);
    assert.ok(viewOut.includes("view only"), "tfive says the link is view only:\n" + viewOut);
    assert.ok(viewOut.includes("Tap or click to cross this off"), "and it can read the list");

    const refused = tfiveMayFail("add", refB.R, "a view link must not write this");
    assert.ok(!refused.ok, "tfive refused to add through a view link");
    assert.ok(/View link only shows the list/.test(refused.out), refused.out);

    // and the server refuses a forged write even if a client tried
    const env = await C.seal(refB.key, { v: 3, items: {} });
    const cur = JSON.parse((await rpc("get_list_v3", { p_id: refB.lookupId, p_rev: null })).text);
    const forged = await rpc("put_list_v3", { p_id: refB.lookupId, p_doc: env, p_base_rev: cur.rev, p_token: "x".repeat(43) });
    assert.equal(forged.status, 403, "the server refused a forged token: " + forged.text);
    step("a view link can read and cannot write",
         `tfive refused it locally; put_list_v3 with a forged token answered ${forged.status}`);
  } catch (e) { bad("a view link can read and cannot write", e); }

  // ---------------------------------------------------------------- 7. the unchanged poll is a few dozen bytes

  try {
    const refB = await C.fromWrite(W_B);
    const full = await rpc("get_list_v3", { p_id: refB.lookupId, p_rev: null });
    const rev = JSON.parse(full.text).rev;
    const poll = await rpc("get_list_v3", { p_id: refB.lookupId, p_rev: rev });
    assert.ok(JSON.parse(poll.text).unchanged, "the short-circuit answered");
    assert.ok(poll.bytes < 60, "the unchanged poll is small: " + poll.bytes);
    step("the unchanged short-circuit still costs bytes, not the document",
         `full ${full.bytes} bytes, unchanged ${poll.bytes} bytes`);
  } catch (e) { bad("the unchanged short-circuit", e); }

  // ---------------------------------------------------------------- 8. New keys on the web; the Swift side sees gone (create 3)

  try {
    await web.page.click("#share");
    await web.page.waitForSelector("#p-share[open]");
    await web.page.click("#share-rotate");
    await web.page.waitForSelector("#ask[open]");
    await web.page.click("#ask-ok");
    await web.until(async () => {
      const st = await web.state();
      return st.listId && st.listId !== W_A && st.status === "synced";
    }, 40000, "the web to rotate to new keys");
    W_A2 = (await web.state()).listId;
    made.push({ label: "A2 (rotated)", W: W_A2 });
    console.log("   rotated list A to new keys:", W_A2);

    const out = tfive("show", W_A);
    assert.ok(/gone/.test(out), "the Swift side reports gone:\n" + out);
    const refA = await C.fromWrite(W_A);
    const old = await rpc("get_list_v3", { p_id: refA.lookupId, p_rev: null });
    assert.equal(old.text.trim(), "null", "the old row is gone from the server: " + old.text);
    step("New keys on the web, and the Swift side reports gone",
         `${W_A} → ${W_A2}; the old row answers null and tfive says gone`);
  } catch (e) { bad("New keys on the web, and the Swift side reports gone", e); }

  // ---------------------------------------------------------------- 9. and the new link works from Swift

  try {
    const out = tfive("show", W_A2);
    assert.ok(out.includes("Written on the Mac while the web was offline"), "the rotated list kept its lines:\n" + out);
    assert.ok(/synced/.test(out));
    step("the rotated link opens on the Swift side with the list intact");
  } catch (e) { bad("the rotated link opens on the Swift side", e); }

  assert.equal(web.errors.length, 0, "page errors: " + web.errors.join(" | "));
  await web.close();

} catch (e) {
  bad("the run", e);
} finally {
  // ---------------------------------------------------------------- clean up every row this run made
  console.log("\nCleaning up", made.length, "list(s):");
  for (const m of made) {
    try {
      const ref = await C.fromWrite(m.W);
      const r = await rpc("delete_list_v3", { p_id: ref.lookupId, p_token: ref.token });
      console.log(`   ${m.label} ${m.W} → delete_list_v3 ${r.status} ${r.text.trim()}`);
    } catch (e) {
      console.log(`   ${m.label} ${m.W} → COULD NOT DELETE: ${e.message}`);
    }
  }
  fs.rmSync(HOME, { recursive: true, force: true });
  await browser.close();
}

console.log(`\n${passed} interop checks passed, ${failed} failed`);
console.log(`create budget: ${made.length} of 3 used`);
if (failed) process.exit(1);
