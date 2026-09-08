// apple/tools/watchsim.mjs — the paired-simulator harness: find or make an iPhone + Apple Watch
// pair, build the scheme, install BOTH apps, launch them with the console attached, read that
// console, take screenshots, and — the command that matters when nothing works — say what is
// missing.
//
// Run:  node apple/tools/watchsim.mjs <command> [flags] [-- <app launch arguments>]
//
// Node is not on PATH on this machine; it lives at
//   ~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
// and this file has zero dependencies beyond Node's own modules, because there is no browser here
// to hand a driver to. Everything it knows it learned from `xcrun simctl` and `xcodebuild`.
//
// THE ONE FACT THIS FILE EXISTS FOR: `simctl install` of the iPhone app onto a paired phone
// simulator does NOT install the embedded watch app. The watch simulator is left untouched, so
// `isWatchAppInstalled` is false and every `updateApplicationContext` throws
// `WCErrorCodeWatchAppNotInstalled` (7006). That looks exactly like WatchConnectivity being broken
// in the simulator, which it is not. `install` therefore installs the watch app onto the watch
// explicitly, and `doctor` detects and names that exact state before anyone spends an afternoon on
// it.
//
// What this file will not do: tap the Watch. `simctl` lists and screenshots a watch simulator and
// nothing else — there is no `simctl ui tap`, no accessibility bridge, nothing. Driving the Watch's
// UI is a person in the Simulator app. `shot` is how a round gets its evidence out.
//
// Privacy, the same rule as everywhere else in this repo: a screenshot filename names the SCREEN,
// never the list, and nothing this script prints may carry a link, a fragment or a list id. Every
// line of foreign text — an app's console, the unified log, xcodebuild's tail — goes through
// `safe()` on its way to the terminal, which strikes out any run of 22 or more base62 characters.
// That is the shape of a `W`, an `R` and a `lookupId`, and it is cheap to be wrong in the safe
// direction.

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------- what we are pointed at

const REPO = fileURLToPath(new URL("../../", import.meta.url));
const PROJECT = path.join(REPO, "apple/TodaysFive/TodaysFive.xcodeproj");
const SCHEME = "TodaysFive";                       // the iOS scheme; building it builds and embeds the watch app
const CONFIGURATION = "Debug";
const SHOTS = path.join(REPO, "apple/shots/watch");

const PHONE_BUNDLE = "com.pricebrannen.todaysfive";
const WATCH_BUNDLE = "com.pricebrannen.todaysfive.watchkitapp";
const COMPLICATIONS_BUNDLE = "com.pricebrannen.todaysfive.watchkitapp.complications";
const APP_GROUP = "group.com.pricebrannen.todaysfive";

// A scratch derived-data path outside the repo, stable across runs so a second `build` is
// incremental. `os.tmpdir()` on macOS is the per-user folder that survives for days, which is
// exactly the lifetime a verification pass wants.
const DEFAULT_DERIVED = path.join(os.tmpdir(), "todaysfive-watchsim-derived");

// Where a launched app's stdout and stderr go. Measured: `simctl launch --stdout=<path>` resolves
// that path inside the DEVICE's data root, not on the host — pass /tmp/watchsim/x.out and the file
// appears at <dataPath>/tmp/watchsim/x.out. So the script names it once, in device terms, and maps
// it back to a host path whenever it wants to read it.
const CONSOLE_DIR_ON_DEVICE = "/tmp/watchsim";

// ---------------------------------------------------------------------------- saying things out loud

const RESET = "\u001b[0m", DIM = "\u001b[2m", BOLD = "\u001b[1m";
const tty = process.stdout.isTTY;
const dim = s => (tty ? DIM + s + RESET : s);
const bold = s => (tty ? BOLD + s + RESET : s);

/** Any run of 22+ base62 characters is the shape of a list secret, a read id or a lookup id, so it
    never reaches the terminal — not even one this script read back out of an app's own console. */
const SECRET_SHAPED = /(?<![0-9A-Za-z])[0-9A-Za-z]{22,}(?![0-9A-Za-z])/g;
function safe(text) {
  return String(text).replace(SECRET_SHAPED, m => `[redacted ${m.length}-char run]`);
}

/** Foreign text — an app's console, the unified log, a build log — indented and filtered.
    The filter lives here and in `bad()`, and nowhere else, because those are the two doors foreign
    text comes in through. It deliberately does NOT run over this script's own prose: an API name
    like `updateApplicationContext` is a 24-character base62 run, and a report that strikes out its
    own vocabulary is a report nobody can read. What must never be trusted is text this script did
    not write. */
function echo(text, indent = "      ") {
  const lines = safe(text).replace(/\s+$/, "").split("\n");
  for (const line of lines) console.log(indent + line);
}

let passed = 0, failed = 0, warned = 0;
const results = [];
function step(name, note = "") {
  passed++;
  results.push({ kind: "ok", name, note });
  console.log("ok  -", name, note ? "\n       " + note.replace(/\n/g, "\n       ") : "");
}
function warn(name, note = "") {
  warned++;
  results.push({ kind: "warn", name, note });
  console.log("warn-", name, note ? "\n       " + note.replace(/\n/g, "\n       ") : "");
}
function bad(name, e) {
  failed++;
  const note = (e && (e.message || e.toString())) || String(e);
  results.push({ kind: "fail", name, note });
  console.log("FAIL-", name, "\n      ", safe(note).split("\n").slice(0, 6).join("\n       "));
}
function say(text = "") { console.log(text); }

// ---------------------------------------------------------------------------- running things, with deadlines

// There is no `timeout` on this machine — it is GNU coreutils and coreutils is not installed — so
// every deadline in this file is a Node timer, and every long-running child gets one. A build that
// hangs must end as a reported failure with a log to read, never as a session that stopped.
function run(cmd, args, { deadline = 120_000, cwd = REPO, env } = {}) {
  return new Promise(resolve => {
    let child;
    try {
      child = spawn(cmd, args, { cwd, env: env ? { ...process.env, ...env } : process.env,
                                 stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      return resolve({ code: -1, out: "", err: String(e), timedOut: false });
    }
    let out = "", err = "", timedOut = false;
    child.stdout.on("data", d => { out += d; });
    child.stderr.on("data", d => { err += d; });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => { try { child.kill("SIGKILL"); } catch (e) { /* already gone */ } }, 3000).unref();
    }, deadline);
    child.on("error", e => { clearTimeout(timer); resolve({ code: -1, out, err: err + String(e), timedOut }); });
    child.on("close", code => { clearTimeout(timer); resolve({ code, out, err, timedOut }); });
  });
}

const simctl = (args, opts) => run("xcrun", ["simctl", ...args], opts);

async function simctlJSON(args, opts) {
  const r = await simctl([...args, "-j"], opts);
  if (r.code !== 0) throw new Error(`simctl ${args.join(" ")} failed: ${(r.err || r.out).trim()}`);
  try { return JSON.parse(r.out); }
  catch (e) { throw new Error(`simctl ${args.join(" ")} did not answer JSON: ${r.out.slice(0, 200)}`); }
}

const wait = ms => new Promise(r => setTimeout(r, ms));

/** Poll until a condition holds or the deadline passes. Answers true or false; never throws, so a
    caller decides for itself whether a missed deadline is a failure or a note. */
async function until(fn, { deadline = 120_000, every = 1500 } = {}) {
  const t0 = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - t0 >= deadline) return false;
    await wait(every);
  }
}

// ---------------------------------------------------------------------------- flags

function parseArgv(argv) {
  const flags = {};
  const rest = [];
  const appArgs = [];
  let sawDashDash = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (sawDashDash) { appArgs.push(a); continue; }
    if (a === "--") { sawDashDash = true; continue; }
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq > 0) { flags[a.slice(2, eq)] = a.slice(eq + 1); continue; }
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) { flags[key] = next; i++; }
      else flags[key] = true;
      continue;
    }
    rest.push(a);
  }
  return { command: rest[0], rest: rest.slice(1), flags, appArgs };
}

const { command, flags, appArgs } = parseArgv(process.argv.slice(2));
const DERIVED = path.resolve(typeof flags.derived === "string" ? flags.derived : DEFAULT_DERIVED);
const PRODUCTS = path.join(DERIVED, "Build/Products");
const PHONE_APP = path.join(PRODUCTS, `${CONFIGURATION}-iphonesimulator/TodaysFive.app`);
const WATCH_APP = path.join(PRODUCTS, `${CONFIGURATION}-watchsimulator/TodaysFiveWatch.app`);
const BUILD_LOG = path.join(DERIVED, "watchsim-build.log");

/** Which of the two devices a device-shaped command acts on. The Watch is the default because the
    Watch is what this round is about. */
const onPhone = flags.phone === true || flags.on === "phone" || flags.device === "phone";
const TARGET = onPhone ? "phone" : "watch";

const USAGE = `
watchsim.mjs — the paired-simulator harness for Today's Five on the Watch

  pair       find or make a paired iPhone + Apple Watch on the chosen runtimes, and boot both
  build      build the ${SCHEME} scheme for the phone simulator (which builds and embeds the watch app)
  install    install the phone app AND — separately, which is the whole point — the watch app
  launch     launch an app with launch arguments, its console redirected to a file we can read
  logs       read a running app's console (and, with --oslog, the unified log)
  shot       screenshot a device into apple/shots/watch/<name>.png
  doctor     print what is booted, paired, built, installed and connected, and say what is missing
  all        pair -> build -> install -> launch, and report

Flags
  --watch-runtime <v>   watchOS runtime: 26.5, "watchOS 26.5", or the full identifier (default: newest)
  --phone-runtime <v>   iOS runtime, same spellings (default: newest)
  --derived <path>      derived data path (default: ${DEFAULT_DERIVED})
  --name <name>         shot: the name of the SCREEN, never of a list. [a-z0-9-], 2..48 characters
  --phone               launch / logs / shot act on the phone instead of the watch
  --lines <n>           logs: how many trailing lines to print (default 200)
  --wait <ms>           logs: wait this long for new console output before giving up (default 0)
  --oslog               logs: also print the device's unified log for the app
  --minutes <n>         logs --oslog: how far back to read (default 5)
  --clean               build: remove the derived data path first
  --no-launch           all: stop after install
  -- <args...>          launch: everything after -- is passed to the app as launch arguments

Examples
  node apple/tools/watchsim.mjs doctor
  node apple/tools/watchsim.mjs all
  node apple/tools/watchsim.mjs launch --phone -- -TFDumpWatchSend
  node apple/tools/watchsim.mjs logs --wait 20000
  node apple/tools/watchsim.mjs shot --name today-five-lines
`;

// ---------------------------------------------------------------------------- the simulator, read out

function versionKey(v) {
  return String(v).split(".").map(n => parseInt(n, 10) || 0);
}
function newerFirst(a, b) {
  const x = versionKey(a.version), y = versionKey(b.version);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (y[i] || 0) - (x[i] || 0);
    if (d) return d;
  }
  return 0;
}

async function runtimes() {
  const j = await simctlJSON(["list", "runtimes"]);
  return (j.runtimes || []).filter(r => r.isAvailable);
}

/** A runtime by whatever the person typed: "26.5", "watchOS 26.5", or the identifier. No flag means
    the newest available for that platform, which is what a round wants by default and what the
    checkpoint report measured. */
function pickRuntime(all, platform, want) {
  const pool = all.filter(r => r.platform === platform).sort(newerFirst);
  if (!pool.length) throw new Error(`no available ${platform} simulator runtime`);
  if (want === undefined || want === true) return pool[0];
  const w = String(want).trim().toLowerCase();
  const found = pool.find(r =>
    r.identifier.toLowerCase() === w ||
    r.name.toLowerCase() === w ||
    r.version.toLowerCase() === w ||
    r.name.toLowerCase() === `${platform.toLowerCase()} ${w}`);
  if (!found) {
    throw new Error(`no ${platform} runtime matching "${want}". Available: ` +
                    pool.map(r => r.name).join(", "));
  }
  return found;
}

/** Every device, flattened, each carrying the runtime identifier it was created under — which the
    JSON only says by the key it is filed under. */
async function devices() {
  const j = await simctlJSON(["list", "devices"]);
  const out = [];
  for (const [runtime, list] of Object.entries(j.devices || {})) {
    for (const d of list) out.push({ ...d, runtime });
  }
  return out;
}

async function pairs() {
  const j = await simctlJSON(["list", "pairs"]);
  return Object.entries(j.pairs || {}).map(([id, p]) => ({ id, ...p }));
}

/** The pair on the two chosen runtimes, if there is one. A machine can hold several pairs and only
    the runtimes tell them apart, so the match is on the runtime of each half, never on the name. */
async function findPair(watchRt, phoneRt) {
  const byUdid = new Map((await devices()).map(d => [d.udid, d]));
  for (const p of await pairs()) {
    const w = byUdid.get(p.watch?.udid), f = byUdid.get(p.phone?.udid);
    if (w && f && w.runtime === watchRt.identifier && f.runtime === phoneRt.identifier) {
      return { id: p.id, state: p.state, watch: w, phone: f };
    }
  }
  return null;
}

function pickDeviceType(runtime, wanted) {
  const types = runtime.supportedDeviceTypes || [];
  for (const re of wanted) {
    const hit = types.find(t => re.test(t.name));
    if (hit) return hit;
  }
  return types[0];
}

async function makePair(watchRt, phoneRt) {
  const watchType = pickDeviceType(watchRt, [/^Apple Watch Series \d+ \(46mm\)$/, /^Apple Watch Series/, /Apple Watch/]);
  const phoneType = pickDeviceType(phoneRt, [/^iPhone \d+$/, /^iPhone \d+ Pro$/, /^iPhone/]);
  if (!watchType || !phoneType) throw new Error("the runtimes support no watch or no iPhone device type");

  const watchName = `TF Watch ${watchRt.version}`;
  const phoneName = `TF Phone ${phoneRt.version}`;
  const existing = await devices();
  const reuse = (name, runtime) => existing.find(d => d.name === name && d.runtime === runtime)?.udid;

  let watchUdid = reuse(watchName, watchRt.identifier);
  if (!watchUdid) {
    const r = await simctl(["create", watchName, watchType.identifier, watchRt.identifier], { deadline: 180_000 });
    if (r.code !== 0) throw new Error(`could not create ${watchName}: ${(r.err || r.out).trim()}`);
    watchUdid = r.out.trim();
  }
  let phoneUdid = reuse(phoneName, phoneRt.identifier);
  if (!phoneUdid) {
    const r = await simctl(["create", phoneName, phoneType.identifier, phoneRt.identifier], { deadline: 180_000 });
    if (r.code !== 0) throw new Error(`could not create ${phoneName}: ${(r.err || r.out).trim()}`);
    phoneUdid = r.out.trim();
  }
  const r = await simctl(["pair", watchUdid, phoneUdid], { deadline: 180_000 });
  if (r.code !== 0) throw new Error(`simctl pair failed: ${(r.err || r.out).trim()}`);
  return { watchType: watchType.name, phoneType: phoneType.name, watchUdid, phoneUdid, pairId: r.out.trim() };
}

/** Boot, and treat "already booted" as the success it is. */
async function boot(udid, label) {
  const r = await simctl(["boot", udid], { deadline: 240_000 });
  if (r.code !== 0 && !/Unable to boot device in current state: Booted/.test(r.err + r.out)) {
    throw new Error(`could not boot ${label}: ${(r.err || r.out).trim()}`);
  }
  // `bootstatus` blocks until the device finishes coming up, which is a stronger claim than the
  // "Booted" state, and it is the difference between installing successfully and installing into a
  // device that is still starting its services.
  await simctl(["bootstatus", udid], { deadline: 300_000 });
  return until(async () => (await devices()).find(d => d.udid === udid)?.state === "Booted",
               { deadline: 120_000, every: 2000 });
}

const isConnected = state => /connected/.test(String(state)) && !/disconnected/.test(String(state));

async function device(udid) {
  return (await devices()).find(d => d.udid === udid) || null;
}

/** Installed or not, answered by the container the system would give the app. `listapps` prints an
    old-style plist that is not worth parsing; `get_app_container` simply fails when the app is not
    there, which is the question being asked. */
async function installedPath(udid, bundle) {
  const r = await simctl(["get_app_container", udid, bundle, "app"], { deadline: 60_000 });
  return r.code === 0 ? r.out.trim() : null;
}
async function groupContainer(udid, bundle) {
  const r = await simctl(["get_app_container", udid, bundle, APP_GROUP], { deadline: 60_000 });
  return r.code === 0 ? r.out.trim() : null;
}
async function isRunning(udid, bundle) {
  const r = await simctl(["spawn", udid, "launchctl", "list"], { deadline: 60_000 });
  if (r.code !== 0) return null;                                  // the device is not up; say so rather than guess
  return new RegExp(`UIKitApplication:${bundle.replace(/\./g, "\\.")}\\[`).test(r.out);
}

// PlistBuddy, synchronously: everything else here is async by design, but a version string read out
// of a bundle is a fact on disk, and awaiting it would only make the doctor's report harder to read.
function plistValue(bundlePath, key) {
  const plist = path.join(bundlePath, "Info.plist");
  if (!fs.existsSync(plist)) return null;
  try {
    return execFileSync("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, plist], { encoding: "utf8" }).trim();
  } catch (e) { return null; }
}

function versionOf(bundlePath) {
  const short = plistValue(bundlePath, "CFBundleShortVersionString");
  const build = plistValue(bundlePath, "CFBundleVersion");
  return short || build ? `${short || "?"} (build ${build || "?"})` : null;
}

// ---------------------------------------------------------------------------- resolving the pair

/** The pair every command works against. `create` makes one when none matches; the other commands
    ask for the pair that is already there and say plainly when it is not. */
async function resolvePair({ create = false, bootBoth = false, quiet = false } = {}) {
  const all = await runtimes();
  const watchRt = pickRuntime(all, "watchOS", flags["watch-runtime"]);
  const phoneRt = pickRuntime(all, "iOS", flags["phone-runtime"]);
  if (!quiet) say(dim(`runtimes: ${phoneRt.name} + ${watchRt.name}`));

  let pair = await findPair(watchRt, phoneRt);
  if (!pair && create) {
    const made = await makePair(watchRt, phoneRt);
    say(`   made a pair: ${made.watchType} + ${made.phoneType}`);
    pair = await findPair(watchRt, phoneRt);
    if (!pair) throw new Error("simctl reported a pair and then did not list it");
  }
  if (!pair) return { watchRt, phoneRt, pair: null };

  if (bootBoth) {
    await boot(pair.phone.udid, pair.phone.name);
    await boot(pair.watch.udid, pair.watch.name);
    pair = await findPair(watchRt, phoneRt);
  }
  return { watchRt, phoneRt, pair };
}

/** The pair, or a failure that names the command to run. Every device-shaped command starts here. */
async function needPair({ bootBoth = false, quiet = false } = {}) {
  const { watchRt, phoneRt, pair } = await resolvePair({ create: false, bootBoth, quiet });
  if (!pair) {
    throw new Error(`no paired ${phoneRt.name} + ${watchRt.name} simulator. Run: watchsim.mjs pair`);
  }
  return { watchRt, phoneRt, pair };
}

// ---------------------------------------------------------------------------- console files

function consoleHostDir(dev) {
  return path.join(dev.dataPath, CONSOLE_DIR_ON_DEVICE.replace(/^\//, ""));
}
function consolePaths(dev, bundle) {
  const onDevice = `${CONSOLE_DIR_ON_DEVICE}/${bundle}`;
  const host = path.join(consoleHostDir(dev), bundle);
  return { outOnDevice: `${onDevice}.out`, errOnDevice: `${onDevice}.err`,
           outHost: `${host}.out`, errHost: `${host}.err` };
}
function readIfThere(p) {
  try { return fs.readFileSync(p, "utf8"); } catch (e) { return ""; }
}
function tailLines(text, n) {
  const lines = text.replace(/\s+$/, "").split("\n");
  return lines.slice(Math.max(0, lines.length - n)).join("\n");
}

// ---------------------------------------------------------------------------- the commands

async function cmdPair() {
  const t0 = Date.now();
  const { watchRt, phoneRt, pair } = await resolvePair({ create: true, bootBoth: true });
  step("a pair exists and both halves are booted",
       `${pair.phone.name} (${phoneRt.name}) + ${pair.watch.name} (${watchRt.name})\n` +
       `phone ${pair.phone.udid}\nwatch ${pair.watch.udid}\npair  ${pair.id}`);

  // A pair reports "active, connected" only once both devices are up and have found each other, and
  // that is what WatchConnectivity means by a reachable counterpart. It can take another minute
  // after boot, so it is waited for rather than sampled once.
  const connected = await until(async () => {
    const p = (await pairs()).find(x => x.id === pair.id);
    return p && isConnected(p.state);
  }, { deadline: 180_000, every: 3000 });

  const state = ((await pairs()).find(x => x.id === pair.id) || {}).state;
  if (connected) step("the pair reports connected", `${state} after ${Math.round((Date.now() - t0) / 1000)}s`);
  else bad("the pair reports connected", new Error(
    `the pair is still ${state} after three minutes. Both devices are booted; WatchConnectivity ` +
    `needs "active, connected". Open Simulator.app and let the watch finish its first-boot setup, ` +
    `then run doctor again.`));
  return pair;
}

async function cmdBuild() {
  if (flags.clean === true) {
    // `--derived` is operator-supplied and `rmSync(force: true, recursive: true)` asks no questions,
    // so a wrapper that interpolates an empty variable into it would delete a home directory without
    // a prompt. Only ever remove a directory this script would itself have made.
    const base = path.basename(DERIVED);
    if (!base.startsWith("todaysfive-watchsim") || path.dirname(DERIVED) === DERIVED) {
      throw new Error(
        `refusing to --clean ${DERIVED}: it is not a directory this script made.\n` +
        `  --clean only removes a path whose last component starts with "todaysfive-watchsim".`);
    }
    fs.rmSync(DERIVED, { recursive: true, force: true });
    say(dim(`removed ${DERIVED}`));
  }
  // Build against the pair's phone when there is one, so the destination is the device the round
  // will actually install onto; otherwise a generic simulator destination, which still builds and
  // embeds the watch app.
  let destination = "generic/platform=iOS Simulator";
  try {
    const { pair } = await resolvePair({ create: false, quiet: true });
    if (pair) destination = `platform=iOS Simulator,id=${pair.phone.udid}`;
  } catch (e) { /* no pair yet is not a reason not to build */ }

  fs.mkdirSync(DERIVED, { recursive: true });
  const args = ["-project", PROJECT, "-scheme", SCHEME, "-configuration", CONFIGURATION,
                "-destination", destination, "-derivedDataPath", DERIVED, "build"];
  say(dim(`xcodebuild -scheme ${SCHEME} -destination '${destination}'`));
  const t0 = Date.now();
  const r = await run("xcodebuild", args, { deadline: 1_800_000 });
  const log = r.out + "\n" + r.err;
  try { fs.writeFileSync(BUILD_LOG, log); } catch (e) { /* the tail below still has it */ }

  if (r.timedOut) throw new Error(`xcodebuild passed its thirty-minute deadline. Log: ${BUILD_LOG}`);
  if (r.code !== 0 || !/\*\* BUILD SUCCEEDED \*\*/.test(log)) {
    const errors = log.split("\n").filter(l => /(error:|BUILD FAILED|The following build commands failed)/.test(l));
    say(bold("   xcodebuild failed. The lines that said so:"));
    echo(errors.slice(0, 20).join("\n") || tailLines(log, 25));
    throw new Error(`xcodebuild exited ${r.code}. Full log: ${BUILD_LOG}`);
  }
  const secs = Math.round((Date.now() - t0) / 1000);
  const phoneV = versionOf(PHONE_APP), watchV = versionOf(WATCH_APP);
  const appex = path.join(WATCH_APP, "PlugIns/TodaysFiveComplications.appex");
  step("the scheme built, and the watch app came with it",
       `${secs}s\nphone  ${PHONE_APP.replace(REPO, "")} — ${phoneV || "no version"}\n` +
       `watch  ${WATCH_APP.replace(REPO, "")} — ${watchV || "no version"}\n` +
       `${fs.existsSync(appex) ? "complications embedded in the watch app" : "NO complications appex in the watch app"}\n` +
       `log    ${BUILD_LOG}`);
}

async function cmdInstall() {
  const { pair } = await needPair({ bootBoth: true });
  if (!fs.existsSync(PHONE_APP) || !fs.existsSync(WATCH_APP)) {
    throw new Error(`no built products under ${PRODUCTS}. Run: watchsim.mjs build`);
  }

  const a = await simctl(["install", pair.phone.udid, PHONE_APP], { deadline: 300_000 });
  if (a.code !== 0) throw new Error(`installing the phone app failed: ${(a.err || a.out).trim()}`);
  step("the phone app is installed on the phone simulator", `${pair.phone.name} — ${versionOf(PHONE_APP)}`);

  // THE WHOLE POINT. The phone app carries the watch app inside it at Watch/TodaysFiveWatch.app and
  // the simulator does not care: installing the phone app leaves the watch simulator empty, so
  // isWatchAppInstalled is false and every updateApplicationContext throws 7006. The watch app is
  // installed onto the watch explicitly, from the watchsimulator products directory.
  const b = await simctl(["install", pair.watch.udid, WATCH_APP], { deadline: 300_000 });
  if (b.code !== 0) throw new Error(`installing the watch app failed: ${(b.err || b.out).trim()}`);
  step("the watch app is installed on the WATCH simulator, separately",
       `${pair.watch.name} — ${versionOf(WATCH_APP)}\n` +
       `installing the phone app does not do this, and until it is done every ` +
       `updateApplicationContext throws WCErrorCodeWatchAppNotInstalled (7006)`);

  // The phone learns the watch app exists through the pairing machinery rather than instantly, so a
  // short settle here saves a first run that reports 7006 and then works on the second.
  await wait(3000);
  const complications = await installedPath(pair.watch.udid, COMPLICATIONS_BUNDLE);
  const group = await groupContainer(pair.watch.udid, WATCH_BUNDLE);
  step("the watch app's containers are there",
       `complications ${complications ? "registered" : "not registered as a separate app (it is an appex; this is normal)"}\n` +
       `app group     ${group ? "present" : "MISSING — the complication reads the document from it"}`);
  return pair;
}

async function cmdLaunch(target = TARGET, args = appArgs) {
  const { pair } = await needPair({ bootBoth: true, quiet: true });
  const dev = target === "phone" ? await device(pair.phone.udid) : await device(pair.watch.udid);
  const bundle = target === "phone" ? PHONE_BUNDLE : WATCH_BUNDLE;

  if (!await installedPath(dev.udid, bundle)) {
    throw new Error(`${bundle} is not installed on ${dev.name}. Run: watchsim.mjs install`);
  }
  fs.mkdirSync(consoleHostDir(dev), { recursive: true });
  const c = consolePaths(dev, bundle);

  const r = await simctl(["launch", "--terminate-running-process",
                          `--stdout=${c.outOnDevice}`, `--stderr=${c.errOnDevice}`,
                          dev.udid, bundle, ...args], { deadline: 120_000 });
  if (r.code !== 0) throw new Error(`launch failed: ${(r.err || r.out).trim()}`);
  const pid = (r.out.match(/:\s*(\d+)/) || [])[1] || "?";

  // Give the app long enough to say something before we claim it said nothing.
  await wait(2500);
  const first = readIfThere(c.outHost) + readIfThere(c.errHost);
  step(`the ${target} app launched`,
       `${bundle} pid ${pid} on ${dev.name}` +
       (args.length ? `\nlaunch arguments: ${safe(args.join(" "))}` : "") +
       `\nconsole: ${c.outHost}`);
  if (first.trim()) {
    say(dim("   its first words:"));
    echo(tailLines(first, 20));
  }
  return { dev, bundle, c };
}

async function cmdLogs() {
  const { pair } = await needPair({ quiet: true });
  const dev = TARGET === "phone" ? await device(pair.phone.udid) : await device(pair.watch.udid);
  const bundle = TARGET === "phone" ? PHONE_BUNDLE : WATCH_BUNDLE;
  const c = consolePaths(dev, bundle);
  const lines = parseInt(flags.lines, 10) || 200;
  const waitMs = parseInt(flags.wait, 10) || 0;

  const size = p => { try { return fs.statSync(p).size; } catch (e) { return -1; } };
  if (waitMs > 0) {
    const before = size(c.outHost) + size(c.errHost);
    const grew = await until(async () => size(c.outHost) + size(c.errHost) > before,
                             { deadline: waitMs, every: 500 });
    if (!grew) say(dim(`   nothing new in ${waitMs}ms`));
  }

  const out = readIfThere(c.outHost), err = readIfThere(c.errHost);
  if (!out && !err) {
    // Two different silences, and they want different answers. A missing file means nothing has been
    // launched through this harness — simctl only redirects stdout for a launch it started, so an app
    // tapped in Simulator.app has no console here. An empty file means the app ran and said nothing,
    // which is the normal state for a build whose prints are all behind `#if DEBUG`.
    const launched = fs.existsSync(c.outHost) || fs.existsSync(c.errHost);
    warn(`no console output for the ${TARGET} app`,
         launched
           ? `${c.outHost} exists and is empty: the app ran and printed nothing.\n` +
             `This harness builds and installs Debug products, so #if DEBUG prints ARE compiled in: ` +
             `an empty console here means the app printed nothing, and for a run with a -TF… argument ` +
             `that is itself the failure. (A Release build would be silent by design, but this is not one.) ` +
             `For what the frameworks said about it, add --oslog.`
           : `${c.outHost} does not exist: nothing has been launched through this harness.\n` +
             `simctl only redirects stdout for a launch it started, so an app tapped in Simulator.app ` +
             `has no console here. Run: watchsim.mjs launch` + (TARGET === "phone" ? " --phone" : ""));
  } else {
    if (out.trim()) { say(bold(`stdout — ${bundle} on ${dev.name}`)); echo(tailLines(out, lines)); }
    if (err.trim()) { say(bold(`stderr — ${bundle} on ${dev.name}`)); echo(tailLines(err, lines)); }
    step(`read the ${TARGET} app's console`, `${out.length + err.length} bytes, last ${lines} lines shown`);
  }

  // The app's own debug prints go to stdout, which is the file above. The unified log carries what
  // the frameworks say about the app — a crash, an entitlement refusal, a WatchConnectivity error —
  // and that is usually what a person is actually looking for.
  if (flags.oslog) {
    const minutes = parseInt(flags.minutes, 10) || 5;
    const r = await simctl(["spawn", dev.udid, "log", "show", "--last", `${minutes}m`, "--style", "compact",
                            "--predicate", 'processImagePath CONTAINS "TodaysFive"'], { deadline: 180_000 });
    if (r.code !== 0) warn("the unified log could not be read", safe((r.err || r.out).trim().split("\n")[0]));
    else {
      say(bold(`unified log — last ${minutes}m on ${dev.name}`));
      echo(tailLines(r.out, lines));
      step("read the unified log", `${r.out.split("\n").length} lines over ${minutes} minutes`);
    }
  }
}

async function cmdShot() {
  const name = typeof flags.name === "string" ? flags.name.trim() : "";
  // A screenshot filename names the SCREEN. It may not name a list, and the surest way to keep that
  // true is to refuse anything that even looks like an id.
  if (!/^[a-z0-9][a-z0-9-]{1,47}$/.test(name)) {
    throw new Error(`--name must be 2..48 characters of [a-z0-9-] and start with a letter or digit. ` +
                    `It names the SCREEN — "today-five-lines", "finale", "one-thing" — never a list.`);
  }
  // Tested as written, hyphens and all: a hyphen breaks the run exactly the way the filter's word
  // boundaries do, and a list id has no hyphens in it — so "one-thing-after-the-finale" passes and a
  // bare twenty-two-character id does not.
  if (/(?<![0-9A-Za-z])[0-9A-Za-z]{22,}(?![0-9A-Za-z])/.test(name)) {
    throw new Error("--name carries a run of 22 or more base62 characters, which is the shape of a list id. " +
                    "Name the screen instead.");
  }

  const { pair } = await needPair({ quiet: true });
  const dev = TARGET === "phone" ? await device(pair.phone.udid) : await device(pair.watch.udid);
  if (dev.state !== "Booted") throw new Error(`${dev.name} is not booted. Run: watchsim.mjs pair`);

  fs.mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SHOTS, `${name}.png`);
  const r = await simctl(["io", dev.udid, "screenshot", "--type", "png", file], { deadline: 120_000 });
  if (r.code !== 0) throw new Error(`screenshot failed: ${(r.err || r.out).trim()}`);
  const bytes = fs.statSync(file).size;
  if (bytes === 0) throw new Error(`${file} is zero bytes`);
  step("a screenshot was taken", `${dev.name} → apple/shots/watch/${name}.png (${bytes} bytes)`);
  return file;
}

// ---------------------------------------------------------------------------- doctor

/** The command a person runs when nothing works. It asserts nothing and fixes nothing; it reads the
    machine out loud, in the order the failures actually happen, and ends with the one or two
    sentences that name what is wrong. */
async function cmdDoctor() {
  const missing = [];      // things that are wrong, in the order they should be fixed
  const notes = [];        // things worth knowing that are not wrong

  say(bold("Today's Five — the paired-simulator doctor"));
  say("");

  // --- the toolchain
  const xcode = await run("xcodebuild", ["-version"], { deadline: 60_000 });
  const xcrun = await run("xcrun", ["simctl", "help"], { deadline: 60_000 });
  say(bold("toolchain"));
  if (xcode.code === 0) say("   " + xcode.out.trim().split("\n").join(" — "));
  else { say("   xcodebuild is not usable: " + safe((xcode.err || xcode.out).trim().split("\n")[0]));
         missing.push("xcodebuild does not run. Check `xcode-select -p` and the licence."); }
  say(`   simctl ${xcrun.code === 0 ? "ok" : "NOT USABLE"}`);
  say(`   node   ${process.version}`);
  say("");

  // --- the runtimes and the pair
  const all = await runtimes();
  let watchRt, phoneRt;
  try {
    watchRt = pickRuntime(all, "watchOS", flags["watch-runtime"]);
    phoneRt = pickRuntime(all, "iOS", flags["phone-runtime"]);
  } catch (e) {
    say(bold("runtimes"));
    say("   " + e.message);
    missing.push(e.message);
    return finishDoctor(missing, notes);
  }
  say(bold("runtimes"));
  for (const platform of ["iOS", "watchOS"]) {
    const pool = all.filter(r => r.platform === platform).sort(newerFirst);
    const chosen = platform === "iOS" ? phoneRt : watchRt;
    say(`   ${platform.padEnd(8)} ${pool.map(r => (r.identifier === chosen.identifier ? bold(r.version + " ←chosen") : r.version)).join(", ")}`);
  }
  say("");

  say(bold("pair"));
  const pair = await findPair(watchRt, phoneRt);
  const allPairs = await pairs();
  if (!pair) {
    say(`   there is no ${phoneRt.name} + ${watchRt.name} pair.`);
    for (const p of allPairs) say(dim(`   other pair: ${p.phone.name} + ${p.watch.name} — ${p.state}`));
    missing.push(`No pair on the chosen runtimes. Run: watchsim.mjs pair`);
    return finishDoctor(missing, notes);
  }
  say(`   ${pair.phone.name} (${phoneRt.name})  ${pair.phone.state}`);
  say(`   ${pair.watch.name} (${watchRt.name})  ${pair.watch.state}`);
  say(`   pair ${pair.id} — ${pair.state}`);
  const bothBooted = pair.phone.state === "Booted" && pair.watch.state === "Booted";
  if (!bothBooted) missing.push("One or both halves are shut down. Run: watchsim.mjs pair (it boots both).");
  else if (!isConnected(pair.state)) {
    missing.push(`Both devices are booted and the pair still reads "${pair.state}". WatchConnectivity ` +
                 `needs "active, connected": open Simulator.app and let the watch finish first boot.`);
  }
  say("");

  // --- what was built
  say(bold("build products"));
  say(dim(`   ${DERIVED}`));
  const havePhoneApp = fs.existsSync(PHONE_APP), haveWatchApp = fs.existsSync(WATCH_APP);
  say(`   phone app  ${havePhoneApp ? versionOf(PHONE_APP) : "NOT BUILT"}`);
  say(`   watch app  ${haveWatchApp ? versionOf(WATCH_APP) : "NOT BUILT"}`);
  if (haveWatchApp) {
    const appex = path.join(WATCH_APP, "PlugIns/TodaysFiveComplications.appex");
    say(`   complications  ${fs.existsSync(appex) ? "embedded in the watch app" : "NOT embedded — the widget extension did not build into the watch app"}`);
    if (!fs.existsSync(appex)) missing.push("The complications appex is not inside the built watch app.");
  }
  if (!havePhoneApp || !haveWatchApp) missing.push("Nothing (or not everything) is built. Run: watchsim.mjs build");
  say("");

  // --- what is installed. This is the section the file exists for.
  say(bold("installed"));
  const phoneInstalled = pair.phone.state === "Booted" ? await installedPath(pair.phone.udid, PHONE_BUNDLE) : null;
  const watchInstalled = pair.watch.state === "Booted" ? await installedPath(pair.watch.udid, WATCH_BUNDLE) : null;
  // Three states, not two. A device that is shut down was never asked, and printing "NOT INSTALLED"
  // about it is a claim rather than a reading — and it is the claim that makes the 7006 paragraph
  // below fire at a machine whose watch is simply off.
  const installedLabel = (dev, found) =>
    dev.state !== "Booted" ? `device is ${dev.state} — not asked`
                           : (found ? versionOf(found) || "installed" : "NOT INSTALLED");
  say(`   phone app on ${pair.phone.name.padEnd(30)} ${installedLabel(pair.phone, phoneInstalled)}`);
  say(`   watch app on ${pair.watch.name.padEnd(30)} ${installedLabel(pair.watch, watchInstalled)}`);

  const bothAsked = pair.phone.state === "Booted" && pair.watch.state === "Booted";
  if (bothAsked && phoneInstalled && !watchInstalled) {
    // The named failure. It is worth the paragraph, because it costs an afternoon otherwise.
    missing.push(
      "THE WATCH APP IS NOT INSTALLED ON THE WATCH, and the phone app is installed on the phone.\n" +
      "  This is the state that looks exactly like WatchConnectivity being broken in the simulator and is not.\n" +
      "  `simctl install` of the phone app does NOT install the watch app embedded inside it, so\n" +
      "  isWatchAppInstalled is false and every updateApplicationContext throws\n" +
      "  WCErrorCodeWatchAppNotInstalled (7006), synchronously, with no delivery and no callback.\n" +
      `  Fix: watchsim.mjs install  (it installs ${path.basename(WATCH_APP)} onto the watch explicitly)`);
  } else if (bothAsked && (!phoneInstalled || !watchInstalled)) {
    missing.push("One or both apps are not installed. Run: watchsim.mjs install");
  }

  // Version skew: an installed app older than the one on disk is a verification pass proving
  // yesterday's code, which is worse than proving nothing.
  for (const [label, built, installed] of [["phone", havePhoneApp && PHONE_APP, phoneInstalled],
                                           ["watch", haveWatchApp && WATCH_APP, watchInstalled]]) {
    if (built && installed) {
      const a = versionOf(built), b = versionOf(installed);
      if (a && b && a !== b) missing.push(`The installed ${label} app is ${b}; the built one is ${a}. Run: watchsim.mjs install`);
      else {
        const bin = fs.existsSync(path.join(built, path.basename(built, ".app")))
          ? path.join(built, path.basename(built, ".app")) : null;
        const ibin = bin ? path.join(installed, path.basename(bin)) : null;
        try {
          if (bin && ibin && fs.statSync(bin).mtimeMs > fs.statSync(ibin).mtimeMs + 1000) {
            // `missing`, not a note. Both bundles carry the web's frozen 1.12 (158) all round, so the
            // version comparison above cannot fire — the mtime is the only thing left that can, and a
            // pass run against yesterday's binary proves yesterday's code, which is worse than
            // proving nothing because it looks like proof.
            missing.push(`The built ${label} app is newer than the installed one. Run: watchsim.mjs install`);
          }
        } catch (e) { /* one of them is not there; the lines above already said so */ }
      }
    }
  }
  say("");

  // --- running, containers, console
  say(bold("running"));
  for (const [label, dev, bundle] of [["phone", pair.phone, PHONE_BUNDLE], ["watch", pair.watch, WATCH_BUNDLE]]) {
    if (dev.state !== "Booted") { say(`   ${label.padEnd(6)} device is ${dev.state}`); continue; }
    const r = await isRunning(dev.udid, bundle);
    say(`   ${label.padEnd(6)} ${r === null ? "could not ask launchd" : r ? "running" : "not running"}`);
  }
  say("");

  say(bold("containers and console"));
  if (pair.watch.state === "Booted" && watchInstalled) {
    const group = await groupContainer(pair.watch.udid, WATCH_BUNDLE);
    say(`   app group on the watch  ${group ? "present" : "MISSING"}`);
    if (!group) missing.push(`The watch app has no ${APP_GROUP} container. The complication reads the decrypted document from it.`);
    else {
      const files = (() => { try { return fs.readdirSync(group).length; } catch (e) { return -1; } })();
      notes.push(`The app group container holds ${files < 0 ? "an unreadable number of" : files} entries. It holds the decrypted document and never a link.`);
    }
  }
  for (const [label, devSummary, bundle] of [["phone", pair.phone, PHONE_BUNDLE], ["watch", pair.watch, WATCH_BUNDLE]]) {
    const dev = await device(devSummary.udid);
    if (!dev?.dataPath) continue;
    const c = consolePaths(dev, bundle);
    const size = (() => { try { return fs.statSync(c.outHost).size + fs.statSync(c.errHost).size; } catch (e) { return null; } })();
    say(`   ${label} console  ${size === null ? "none yet (nothing launched through this harness)" : `${size} bytes`}`);
  }
  say("");

  say(bold("screenshots"));
  const shots = (() => { try { return fs.readdirSync(SHOTS).filter(f => f.endsWith(".png")); } catch (e) { return []; } })();
  say(`   apple/shots/watch — ${shots.length} png${shots.length === 1 ? "" : "s"}${shots.length ? ": " + shots.join(", ") : ""}`);
  say("");

  return finishDoctor(missing, notes);
}

function finishDoctor(missing, notes) {
  if (notes.length) {
    say(bold("worth knowing"));
    for (const n of notes) say("   · " + n);
    say("");
  }
  if (!missing.length) {
    say(bold("nothing is missing."));
    say("   A pair on the chosen runtimes, both halves booted and connected, both apps built and");
    say("   installed — the watch app onto the watch, explicitly. WatchConnectivity has what it needs.");
    step("doctor found nothing missing");
    return true;
  }
  say(bold(`what is missing (${missing.length}), in the order to fix it`));
  for (let i = 0; i < missing.length; i++) say(`   ${i + 1}. ` + missing[i]);
  say("");
  // `bad`, not `warn`. Anyone scripting `doctor && install && shot` is entitled to have the door
  // shut when the machine is not ready — a warning that exits 0 lets the next command run against a
  // broken pair and produce a screenshot of nothing, which is worse than stopping.
  bad(`doctor found ${missing.length} thing${missing.length === 1 ? "" : "s"} missing`,
      new Error(missing[0].split("\n")[0]));
  return false;
}

// ---------------------------------------------------------------------------- all

async function cmdAll() {
  const t0 = Date.now();
  say(bold("pair"));
  await cmdPair();
  say("");
  say(bold("build"));
  await cmdBuild();
  say("");
  say(bold("install"));
  await cmdInstall();
  if (flags["no-launch"] === true) { say(""); say(dim("--no-launch: stopping before launch")); return; }
  say("");
  say(bold("launch"));
  // The phone first: it is the side that sends, and its console is where -TFDumpWatchSend speaks.
  await cmdLaunch("phone", appArgs);
  await cmdLaunch("watch", []);
  say("");
  say(bold(`all: ${Math.round((Date.now() - t0) / 1000)}s`));
  say("");
  await cmdDoctor();
}

// ---------------------------------------------------------------------------- the door

const COMMANDS = {
  pair: cmdPair,
  build: cmdBuild,
  install: cmdInstall,
  launch: () => cmdLaunch(TARGET, appArgs),
  logs: cmdLogs,
  shot: cmdShot,
  doctor: cmdDoctor,
  all: cmdAll,
};

if (!command || flags.help === true || command === "help") {
  say(USAGE.trim());
  process.exit(command ? 0 : 2);
}
if (!COMMANDS[command]) {
  say(`unknown command "${command}"`);
  say(USAGE.trim());
  process.exit(2);
}

try {
  await COMMANDS[command]();
} catch (e) {
  bad(command, e);
}

say("");
say(`${passed} step${passed === 1 ? "" : "s"} ok, ${warned} warning${warned === 1 ? "" : "s"}, ${failed} failed`);
// The last two lines of a long run are the ones anyone actually reads, so anything that went wrong
// says its name there rather than only where it happened, hundreds of lines up.
for (const r of results) {
  if (r.kind !== "ok") say(`   ${r.kind === "fail" ? "failed" : "warned"}: ${r.name}`);
}
process.exit(failed ? 1 : 0);
