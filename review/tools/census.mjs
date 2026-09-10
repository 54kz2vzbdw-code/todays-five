#!/usr/bin/env node
// census.mjs — INK review instrument. Imports TWO theme.js files (main's and the branch's) and counts,
// for a chosen population of accents, how many derive({accent, base}) outputs differ between them.
//
// "move" (primary): the derived `colors.accent` hex differs between the two theme.js files.
// Also recorded per accent: whether main's accent is under 3:1 on main's --ink-3 (the branch's own
// definition), so the two definitions can be compared; the accent's ratio on --ink, --ink-2, --ink-3 on
// main; the OKLCH L delta of the accent; whether `danger` moved; which colour tokens differ at all.
//
// usage:
//   node census.mjs --main <theme.js> --branch <theme.js> --mode <mode> --base dark|light [--n N] [--seed S] [--stride K] [--out file.json]
// modes:
//   sample   — seeded uniform random sample of the whole sRGB cube (mulberry32; N per base; binomial SE reported)
//   stride   — exhaustive census over r,g,b ∈ {0, K, 2K, …} (K=4 → 64³ = 262,144; K=2 → 128³ = 2,097,152)
//   seed     — the repo test's own generator (LCG seed 4242, Math.floor(next()*0xffffff), 3,000 per base) + variants,
//              to find which generator produced 1,139/1,690 and which produced 1,152/1,687
//   surprise — theme.js's surprise() generator with a seeded rand, 2,000 draws per base, plus a scan of its L floor
//   codes    — the real-shaped T2: codes found in the repo
import { pathToFileURL } from "node:url";
import fs from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith("--") ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true] : []).filter(Boolean));
const M = await import(pathToFileURL(args.main).href);
const B = await import(pathToFileURL(args.branch).href);
const base = args.base || "dark";
const mode = args.mode || "sample";
const out = args.out || null;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hex6 = n => "#" + n.toString(16).padStart(6, "0").toUpperCase();
const pct = (a, b) => (100 * a / b).toFixed(2) + "%";
const q = (arr, p) => { if (!arr.length) return NaN; const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
// loops, not Math.max(...arr): a spread of 100k+ numbers overflows the call stack (it did, on the stride-2 runs)
const mx = arr => { let m = -Infinity; for (const v of arr) if (v > m) m = v; return m; };
const mn = arr => { let m = Infinity; for (const v of arr) if (v < m) m = v; return m; };

/** One accent through both derive()s; returns the per-accent record. */
function one(hex, b = base) {
  const tm = M.derive({ accent: hex, base: b }), tb = B.derive({ accent: hex, base: b });
  const cm = tm.colors, cb = tb.colors;
  const a3 = M.contrast(cm.accent, cm.ink3), a2 = M.contrast(cm.accent, cm.ink2), a1 = M.contrast(cm.accent, cm.ink);
  const b3 = M.contrast(cb.accent, cb.ink3), b2 = M.contrast(cb.accent, cb.ink2);
  const d3 = M.contrast(cm.danger, cm.ink3), d3b = M.contrast(cb.danger, cb.ink3);
  const moved = cm.accent !== cb.accent;
  const under3 = a3 < 3 - 1e-9;
  const diff = [];
  for (const k of Object.keys(cm)) if (cm[k] !== cb[k]) diff.push(k);
  const confettiDiff = JSON.stringify(tm.confetti) !== JSON.stringify(tb.confetti);
  const soundDiff = JSON.stringify(tm.sound) !== JSON.stringify(tb.sound);
  const cssDiff = M.cssText(tm) !== B.cssText(tb);
  const dL = M.hexToOklch(cb.accent).L - M.hexToOklch(cm.accent).L;
  const dLd = M.hexToOklch(cb.danger).L - M.hexToOklch(cm.danger).L;
  return { hex, moved, under3, a1, a2, a3, b2, b3, d3, d3b, dangerMoved: cm.danger !== cb.danger, dL, dLd, diff, confettiDiff, soundDiff, cssDiff, mAccent: cm.accent, bAccent: cb.accent, ink2: cm.ink2, ink3: cm.ink3, mDanger: cm.danger, bDanger: cb.danger };
}

/** Aggregate a stream of records. */
function tally() {
  const t = { n: 0, moved: 0, under3: 0, movedNotUnder3: 0, under3NotMoved: 0, dangerMoved: 0, cssDiff: 0, confettiDiff: 0, soundDiff: 0,
    worstA3: Infinity, worstA3Hex: "", worstA2: Infinity, worstA2Hex: "", worstA1: Infinity, worstA1Hex: "", worstB3: Infinity, worstB3Hex: "", worstB2: Infinity, worstB2Hex: "",
    worstD3: Infinity, worstD3Hex: "", worstD3b: Infinity, a2under3: 0, a1under3: 0,
    tokens: {}, dL: [], dLd: [], movedByA3Bucket: {} };
  t.add = r => {
    t.n++;
    if (r.moved) { t.moved++; t.dL.push(r.dL); for (const k of r.diff) t.tokens[k] = (t.tokens[k] || 0) + 1; }
    if (r.under3) t.under3++;
    if (r.moved && !r.under3) t.movedNotUnder3++;
    if (r.under3 && !r.moved) t.under3NotMoved++;
    if (r.dangerMoved) { t.dangerMoved++; t.dLd.push(r.dLd); }
    if (r.cssDiff) t.cssDiff++;
    if (r.confettiDiff) t.confettiDiff++;
    if (r.soundDiff) t.soundDiff++;
    if (r.a2 < 3 - 1e-9) t.a2under3++;
    if (r.a1 < 3 - 1e-9) t.a1under3++;
    if (r.a3 < t.worstA3) { t.worstA3 = r.a3; t.worstA3Hex = r.hex; t.worstA3Detail = r; }
    if (r.a2 < t.worstA2) { t.worstA2 = r.a2; t.worstA2Hex = r.hex; }
    if (r.a1 < t.worstA1) { t.worstA1 = r.a1; t.worstA1Hex = r.hex; }
    if (r.b3 < t.worstB3) { t.worstB3 = r.b3; t.worstB3Hex = r.hex; }
    if (r.b2 < t.worstB2) { t.worstB2 = r.b2; t.worstB2Hex = r.hex; }
    if (r.d3 < t.worstD3) { t.worstD3 = r.d3; t.worstD3Hex = r.hex; }
    if (r.d3b < t.worstD3b) t.worstD3b = r.d3b;
    const bucket = r.a3 < 2 ? "<2.0" : r.a3 < 2.5 ? "2.0–2.5" : r.a3 < 3 ? "2.5–3.0" : "≥3";
    t.movedByA3Bucket[bucket] = (t.movedByA3Bucket[bucket] || 0) + 1;
  };
  t.summary = () => {
    const p = t.moved / t.n, se = Math.sqrt(p * (1 - p) / t.n);
    return {
      base, n: t.n, moved: t.moved, movedPct: +(100 * p).toFixed(3), binomialSE_pct: +(100 * se).toFixed(3),
      under3OnMain: t.under3, under3Pct: +(100 * t.under3 / t.n).toFixed(3), movedNotUnder3: t.movedNotUnder3, under3NotMoved: t.under3NotMoved,
      dangerMoved: t.dangerMoved, dangerMovedPct: +(100 * t.dangerMoved / t.n).toFixed(3), cssDiff: t.cssDiff, cssDiffPct: +(100 * t.cssDiff / t.n).toFixed(3), confettiDiff: t.confettiDiff, soundDiff: t.soundDiff,
      main: { worstAccentOnInk3: +t.worstA3.toFixed(4), worstAccentOnInk3Hex: t.worstA3Hex, worstAccentOnInk2: +t.worstA2.toFixed(4), worstAccentOnInk2Hex: t.worstA2Hex, worstAccentOnInk: +t.worstA1.toFixed(4), worstAccentOnInkHex: t.worstA1Hex, accentUnder3OnInk2: t.a2under3, accentUnder3OnInk: t.a1under3, worstDangerOnInk3: +t.worstD3.toFixed(4), worstDangerOnInk3Hex: t.worstD3Hex },
      branch: { worstAccentOnInk3: +t.worstB3.toFixed(4), worstAccentOnInk3Hex: t.worstB3Hex, worstAccentOnInk2: +t.worstB2.toFixed(4), worstDangerOnInk3: +t.worstD3b.toFixed(4) },
      dL: t.dL.length ? { mean: +(t.dL.reduce((a, b) => a + b, 0) / t.dL.length).toFixed(4), median: +q(t.dL, 0.5).toFixed(4), p90: +q(t.dL, 0.9).toFixed(4), max: +mx(t.dL).toFixed(4), min: +mn(t.dL).toFixed(4) } : null,
      dLdanger: t.dLd.length ? { mean: +(t.dLd.reduce((a, b) => a + b, 0) / t.dLd.length).toFixed(4), max: +mx(t.dLd).toFixed(4), min: +mn(t.dLd).toFixed(4) } : null,
      tokensThatMovedWhenAccentMoved: t.tokens, movedByMainA3Bucket: t.movedByA3Bucket, worstA3Detail: t.worstA3Detail
    };
  };
  return t;
}

const t0 = Date.now();
let result;
if (mode === "sample") {
  const n = +(args.n || 200000), seed = +(args.seed || 20260910);
  const r = mulberry32(seed + (base === "dark" ? 0 : 1));
  const t = tally();
  for (let i = 0; i < n; i++) t.add(one(hex6(Math.floor(r() * 0x1000000))));
  result = { mode, seed, generator: "mulberry32(seed + (dark?0:1)); Math.floor(r()*0x1000000) — every one of the 16,777,216 colours reachable", ...t.summary() };
} else if (mode === "stride") {
  const k = +(args.stride || 4);
  const t = tally();
  for (let r = 0; r < 256; r += k) for (let g = 0; g < 256; g += k) for (let b = 0; b < 256; b += k) t.add(one(hex6((r << 16) | (g << 8) | b)));
  result = { mode, stride: k, generator: `r,g,b ∈ {0,${k},…,${256 - k}} → ${(256 / k) ** 3} colours`, ...t.summary() };
} else if (mode === "seed") {
  // The committed test (test/theme.test.js on the branch, and df28946's original): fresh LCG per base.
  const lcg = s0 => { let s = s0; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };
  const run = (label, next, mult, floor = Math.floor) => {
    const t = tally(); const hexes = [];
    for (let i = 0; i < 3000; i++) { const h = "#" + floor(next() * mult).toString(16).padStart(6, "0"); hexes.push(h); t.add(one(h)); }
    const s = t.summary();
    return { label, under3OnMain: s.under3OnMain, moved: s.moved, worstA3: s.main.worstAccentOnInk3, worstHex: s.main.worstAccentOnInk3Hex, worstMainAccent: s.worstA3Detail.mAccent, worstBranchAccent: s.worstA3Detail.bAccent, worstA2: s.main.worstAccentOnInk2, worstA3branch: s.branch.worstAccentOnInk3, first3: hexes.slice(0, 3) };
  };
  const variants = [];
  variants.push(run("committed test: fresh LCG(4242) per base, floor(x*0xffffff)", lcg(4242), 0xffffff));
  variants.push(run("fresh LCG(4242), floor(x*0x1000000)", lcg(4242), 0x1000000));
  variants.push(run("fresh LCG(4242), round(x*0xffffff)", lcg(4242), 0xffffff, Math.round));
  { // one continuous sequence, dark first then light (the other base's 3,000 consumed first)
    const next = lcg(4242); const order = base === "dark" ? [] : ["dark"];
    for (const _ of order) for (let i = 0; i < 3000; i++) next();
    variants.push(run(`one LCG(4242) sequence, ${base === "dark" ? "dark first" : "light after dark's 3,000"}, floor(x*0xffffff)`, next, 0xffffff));
  }
  { const next = lcg(4242); const order = base === "light" ? [] : ["light"]; for (const _ of order) for (let i = 0; i < 3000; i++) next();
    variants.push(run(`one LCG(4242) sequence, ${base === "light" ? "light first" : "dark after light's 3,000"}, floor(x*0xffffff)`, next, 0xffffff)); }
  { // the suite's shared rnd() after the 2000-accent test has consumed 2,000 draws (the file's order at df28946)
    const next = lcg(4242); for (let i = 0; i < 2000; i++) next();
    variants.push(run("shared rnd() after the 2000-accent test's 2,000 draws, floor(x*0xffffff)", next, 0xffffff)); }
  { const next = lcg(4242); for (let i = 0; i < 2000; i++) next(); if (base === "light") for (let i = 0; i < 3000; i++) next();
    variants.push(run("shared rnd() after 2,000 draws, then dark's 3,000 before light's", next, 0xffffff)); }
  { // the 2000-accent test alternates bases: i%2 ? light : dark — the 1,000 of this base out of its 2,000, then more from the same stream to reach 3,000
    const next = lcg(4242); const t = tally(); let count = 0, i = 0;
    while (count < 3000) { const h = "#" + Math.floor(next() * 0xffffff).toString(16).padStart(6, "0"); const b = i % 2 ? "light" : "dark"; i++; if (b === base) { t.add(one(h)); count++; } }
    const s = t.summary(); variants.push({ label: "the 2000-accent test's alternating stream (i%2), this base's draws until 3,000", under3OnMain: s.under3OnMain, moved: s.moved, worstA3: s.main.worstAccentOnInk3, worstHex: s.main.worstAccentOnInk3Hex }); }
  for (const sd of [1, 42, 4241, 4243, 12345, 2024, 2026]) variants.push(run(`fresh LCG(${sd}), floor(x*0xffffff)`, lcg(sd), 0xffffff));
  result = { mode, base, variants };
} else if (mode === "surprise") {
  const seed = +(args.seed || 20260910);
  const r = mulberry32(seed);
  const want = +(args.n || 2000);
  const t = tally(); let drawn = 0, tries = 0; let minA3 = Infinity, minHex = ""; let minC = Infinity, minL = Infinity, maxL = -Infinity;
  while (drawn < want && tries < want * 10) {
    tries++;
    const th = M.surprise(r);
    if (th.base !== base) continue;
    drawn++;
    const rec = one(th.accent);
    t.add(rec);
    if (rec.a3 < minA3) { minA3 = rec.a3; minHex = th.accent; }
    const o = M.hexToOklch(th.accent); if (o.C < minC) minC = o.C; if (o.L < minL) minL = o.L; if (o.L > maxL) maxL = o.L;
  }
  // the generator's floor: BOTH ends of its L range (0.68–0.80 dark, 0.45–0.58 light — the harder end is the one nearer
  // the ground's lightness), every chroma it can draw, every hue — the minimum accent-on-ink3 ratio its range can reach at all
  const ends = base === "dark" ? [0.68, 0.80] : [0.45, 0.58]; let floorMin = Infinity, floorHex = "", floorL = 0, floorMoved = 0, floorN = 0;
  for (const L0 of ends) for (let C = 0.12; C <= 0.2001; C += 0.005) for (let h = 0; h < 360; h += 0.5) {
    const hex = M.oklch(L0, C, h); if (M.hexToOklch(hex).C < 0.1) continue; // surprise() skips these
    floorN++; const rec = one(hex); if (rec.moved) floorMoved++; if (rec.a3 < floorMin) { floorMin = rec.a3; floorHex = hex; floorL = L0; }
  }
  result = { mode, base, seed, draws: drawn, surpriseCallsMade: tries, moved: t.moved, minAccentOnInk3OnMain: +minA3.toFixed(4), minHex, minDangerOnInk3OnMain: +t.summary().main.worstDangerOnInk3.toFixed(4), dangerMoved: t.dangerMoved, observedL: [+minL.toFixed(4), +maxL.toFixed(4)], observedMinC: +minC.toFixed(4),
    rangeFloorScan: { L: ends, C: "0.12…0.20 step 0.005", h: "0…359.5 step 0.5", pointsInGamut: floorN, moved: floorMoved, minAccentOnInk3OnMain: +floorMin.toFixed(4), atHex: floorHex, atL: floorL } };
} else if (mode === "codes") {
  const codes = (args.codes || "").split(",").filter(Boolean);
  result = { mode, codes: codes.map(code => {
    const tm = M.parseCode(code), tb = B.parseCode(code);
    if (!tm) return { code, parsed: false };
    const rec = one(tm.accent, tm.base);
    return { code, base: tm.base, accent: tm.accent, moved: rec.moved, mainAccent: rec.mAccent, branchAccent: rec.bAccent, dL: +rec.dL.toFixed(4), mainAccentOnInk3: +rec.a3.toFixed(4), mainAccentOnInk2: +rec.a2.toFixed(4), branchAccentOnInk3: +rec.b3.toFixed(4), tokensChanged: rec.diff, confettiChanged: rec.confettiDiff, soundChanged: rec.soundDiff, dangerMoved: rec.dangerMoved, mainDanger: rec.mDanger, branchDanger: rec.bDanger, codeRoundTrips: M.themeCode(tm) === code && B.themeCode(tb) === code };
  }) };
} else if (mode === "list") {
  // an explicit list of hexes (e.g. every 6-digit hex literal in the repo's own theme.js/styles.css/panels.css)
  const hexes = Array.from(new Set(String(args.hexes).toUpperCase().split(",").map(h => h.replace(/^#?/, "#")).filter(h => /^#[0-9A-F]{6}$/.test(h))));
  const t = tally(); const movedList = [];
  for (const h of hexes) { const r = one(h); t.add(r); if (r.moved) movedList.push({ hex: h, main: r.mAccent, branch: r.bAccent, a3: +r.a3.toFixed(3), dL: +r.dL.toFixed(4) }); }
  result = { mode, generator: `${hexes.length} distinct hexes given on the command line`, ...t.summary(), movedList };
} else { console.error("unknown mode"); process.exit(2); }
result.elapsedMs = Date.now() - t0;
result.mainThemeJs = args.main; result.branchThemeJs = args.branch;
const text = JSON.stringify(result, null, 2);
if (out) fs.writeFileSync(out, text + "\n");
console.log(text);
