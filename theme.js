// theme.js — curated kits, OKLCH derivation with contrast guarantees, font loading, codes.
// Pure functions except applyTheme()/loadFonts(), which touch the DOM.

/* ---------------- colour math ---------------- */

export function hexToRgb(hex) {
  const c = hex.replace("#", "");
  const n = c.length === 3 ? c.split("").map(x => x + x).join("") : c;
  return [0, 2, 4].map(i => parseInt(n.substr(i, 2), 16) / 255);
}
export function rgbToHex([r, g, b]) {
  const h = v => { const x = Math.round(Math.min(1, Math.max(0, v)) * 255); return (x < 16 ? "0" : "") + x.toString(16); };
  return ("#" + h(r) + h(g) + h(b)).toUpperCase();
}
const toLin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const toSrgb = v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;

function linToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  ];
}
function oklabToLin([L, a, b]) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ];
}
export function hexToOklch(hex) {
  const [L, a, b] = linToOklab(hexToRgb(hex).map(toLin));
  const C = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * 180 / Math.PI; if (h < 0) h += 360;
  return { L, C: C < 1e-4 ? 0 : C, h: C < 1e-4 ? 0 : h };
}
function inGamut(lin) { return lin.every(v => v >= -0.0005 && v <= 1.0005); }
/** OKLCH → hex. Out-of-gamut colours keep their lightness and hue and lose chroma until they fit. */
export function oklch(L, C, h) {
  L = Math.min(1, Math.max(0, L));
  const rad = h * Math.PI / 180;
  const lab = c => [L, c * Math.cos(rad), c * Math.sin(rad)];
  let lin = oklabToLin(lab(C));
  if (!inGamut(lin)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (inGamut(oklabToLin(lab(mid)))) lo = mid; else hi = mid; }
    lin = oklabToLin(lab(lo));
  }
  return rgbToHex(lin.map(v => toSrgb(Math.min(1, Math.max(0, v)))));
}
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
export function rgba(hex, a) { const [r, g, b] = hexToRgb(hex).map(v => Math.round(v * 255)); return `rgba(${r},${g},${b},${a})`; }
function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * t));
}
/** Nudge L of an OKLCH colour, step by step in `dir`, until it reaches `target` contrast against `bg`. */
function ensure(L, C, h, bg, target, dir) {
  let hex = oklch(L, C, h);
  for (let i = 0; i < 60 && contrast(hex, bg) < target; i++) { L += dir * 0.01; hex = oklch(L, C, h); }
  return hex;
}

/* ---------------- font pairs ---------------- */

export const PAIRS = {
  lato:      { name: "Lato + PT Sans",              task: ["Lato", "wght@400;700;900", `"Lato","Helvetica Neue",Helvetica,Arial,sans-serif`], ui: ["PT Sans", "wght@400;700", `"PT Sans","Helvetica Neue",Helvetica,Arial,sans-serif`], w: 900, ls: "-.025em", lh: 1.14 },
  fraunces:  { name: "Fraunces + Quicksand",        task: ["Fraunces", "opsz,wght@9..144,500..700", `"Fraunces","Iowan Old Style",Georgia,serif`], ui: ["Quicksand", "wght@500;700", `"Quicksand","Helvetica Neue",Helvetica,Arial,sans-serif`], w: 600, ls: "-.010em", lh: 1.15 },
  grotesk:   { name: "Space Grotesk + Plex Sans",   task: ["Space Grotesk", "wght@500;700", `"Space Grotesk","Helvetica Neue",Helvetica,Arial,sans-serif`], ui: ["IBM Plex Sans", "wght@400;600", `"IBM Plex Sans","Helvetica Neue",Helvetica,Arial,sans-serif`], w: 700, ls: "-.02em", lh: 1.12 },
  playfair:  { name: "Playfair + Source Serif",     task: ["Playfair Display", "wght@700;800", `"Playfair Display","Iowan Old Style",Georgia,serif`], ui: ["Source Serif 4", "wght@400;600", `"Source Serif 4",Georgia,serif`], w: 800, ls: "-.012em", lh: 1.12 },
  manrope:   { name: "Manrope",                     task: ["Manrope", "wght@500;800", `"Manrope","Helvetica Neue",Helvetica,Arial,sans-serif`], ui: ["Manrope", "wght@500;800", `"Manrope","Helvetica Neue",Helvetica,Arial,sans-serif`], w: 800, ls: "-.03em", lh: 1.1 },
  dmserif:   { name: "DM Serif + DM Sans",          task: ["DM Serif Display", "", `"DM Serif Display","Iowan Old Style",Georgia,serif`], ui: ["DM Sans", "wght@400;700", `"DM Sans","Helvetica Neue",Helvetica,Arial,sans-serif`], w: 400, ls: "-.005em", lh: 1.1 },
  outfit:    { name: "Outfit + Nunito Sans",        task: ["Outfit", "wght@500;800", `"Outfit","Helvetica Neue",Helvetica,Arial,sans-serif`], ui: ["Nunito Sans", "wght@400;700", `"Nunito Sans","Helvetica Neue",Helvetica,Arial,sans-serif`], w: 800, ls: "-.02em", lh: 1.12 },
  mono:      { name: "JetBrains Mono + Plex Mono",  task: ["JetBrains Mono", "wght@500;800", `"JetBrains Mono","SF Mono",Menlo,Consolas,monospace`], ui: ["IBM Plex Mono", "wght@400;600", `"IBM Plex Mono","SF Mono",Menlo,Consolas,monospace`], w: 800, ls: "-.03em", lh: 1.2 },
  cormorant: { name: "Cormorant + Josefin",         task: ["Cormorant Garamond", "wght@600;700", `"Cormorant Garamond","Iowan Old Style",Georgia,serif`], ui: ["Josefin Sans", "wght@400;700", `"Josefin Sans","Helvetica Neue",Helvetica,Arial,sans-serif`], w: 700, ls: "0", lh: 1.06 },
  archivo:   { name: "Archivo",                     task: ["Archivo", "wght@500;800", `"Archivo","Helvetica Neue",Helvetica,Arial,sans-serif`], ui: ["Archivo", "wght@500;800", `"Archivo","Helvetica Neue",Helvetica,Arial,sans-serif`], w: 800, ls: "-.025em", lh: 1.08 },
  lora:      { name: "Lora + Karla",                task: ["Lora", "wght@500;700", `"Lora","Iowan Old Style",Georgia,serif`], ui: ["Karla", "wght@400;700", `"Karla","Helvetica Neue",Helvetica,Arial,sans-serif`], w: 700, ls: "-.01em", lh: 1.14 }
};
/** The six pairs offered for custom themes. */
export const CUSTOM_PAIRS = ["lato", "fraunces", "grotesk", "playfair", "manrope", "dmserif"];

export function pairOf(id) { return (typeof id === "string" && Object.prototype.hasOwnProperty.call(PAIRS, id)) ? PAIRS[id] : null; }
export function fontsUrl(pairId) {
  const p = pairOf(pairId) || PAIRS.lato;
  const fam = ([name, axes]) => "family=" + encodeURIComponent(name).replace(/%20/g, "+") + (axes ? ":" + axes : "");
  const parts = [fam(p.task)];
  if (p.ui[0] !== p.task[0]) parts.push(fam(p.ui));
  return "https://fonts.googleapis.com/css2?" + parts.join("&") + "&display=swap";
}

/* ---------------- curated kits ----------------
   Dark, Light and Pink carry v1's exact tokens, fonts, sounds and confetti,
   with one exception recorded in DECISIONS.md: the two secondary greys (dim,
   muted) in Dark and Light are nudged to the nearest values that pass 4.5:1.   */

const V1_GLOW = (c, a, y = 34, stop = 62) => `radial-gradient(125% 78% at 50% ${y}%, ${rgba(c, a)}, ${rgba(c, 0)} ${stop}%)`;

function kit(id, name, base, pair, colors, sound, confetti, extra = {}) {
  return { id, name, base, kind: "curated", pair, colors, sound, confetti, shapes: extra.shapes || 1, ...extra };
}

const RAW = [
  kit("dark", "Dark", "dark", "lato", {
    ink: "#1A1D21", ink2: "#23272C", ink3: "#2E343A",
    text: "#F5F1EA", muted: "#9AA0A8", dim: "#7F858C", done: "#7F858C",
    accent: "#D26128", accentHi: "#E8814A", accentDeep: "#A34A1C", accentText: "#E8814A", danger: "#E0745A",
    hair: "rgba(245,241,234,.10)", hairHi: "rgba(245,241,234,.30)",
    glow: V1_GLOW("#D26128", .10), strikeShadow: "0 0 10px rgba(210,97,40,.38)"
  }, { engine: "knock" }, ["#D26128", "#E8814A", "#F5F1EA", "#A34A1C", "#7D8288"]),

  kit("light", "Light", "light", "lato", {
    ink: "#FAF8F4", ink2: "#F1ECE3", ink3: "#E4DED2",
    text: "#494F55", muted: "#707174", dim: "#6F7378", done: "#6E7278",
    accent: "#CB6015", accentHi: "#E07B33", accentDeep: "#9E4A10", accentText: "#9E4A10", danger: "#B8402A",
    hair: "rgba(73,79,85,.16)", hairHi: "rgba(73,79,85,.42)",
    glow: V1_GLOW("#D26128", .07, 30, 60), strikeShadow: "none"
  }, { engine: "knock" }, ["#D26128", "#E8814A", "#A34A1C", "#4B4F54", "#A4BCC4"]),

  kit("pink", "Pink", "dark", "fraunces", {
    ink: "#2E0A1C", ink2: "#421029", ink3: "#58163A",
    text: "#FFF0F6", muted: "#F2A8C8", dim: "#C97A9E", done: "#C97A9E",
    accent: "#FF3D9A", accentHi: "#FFD36E", accentDeep: "#C2185B", accentText: "#FF3D9A", danger: "#FF6B8A",
    hair: "rgba(255,240,246,.16)", hairHi: "rgba(255,240,246,.42)",
    glow: "radial-gradient(120% 92% at 50% 42%, rgba(255,61,154,.26), rgba(255,143,190,.12) 46%, rgba(255,61,154,0) 74%)",
    strikeShadow: "0 0 12px rgba(255,61,154,.60)",
    boxDoneBg: "linear-gradient(135deg,#FF3D9A,#FFD36E)",
    strikeBg: "linear-gradient(90deg,#FF3D9A,#FFD36E,#FF8FBE,#FF3D9A)", strikeSize: "300% 100%", strikeAnim: "shimmer 3.4s linear infinite",
    finaleStyle: "italic"
  }, { engine: "bell" }, ["#FF3D9A", "#FF8FBE", "#FFD36E", "#FFFFFF", "#FF6FAF", "#FFB8D9"], { shapes: 3 }),

  kit("midnight", "Midnight", "dark", "grotesk", {
    ink: "#0E1424", ink2: "#151C30", ink3: "#1E2740",
    text: "#E8EEF8", muted: "#A6B4CC", dim: "#8B98B0", done: "#8B98B0",
    accent: "#7FB3FF", accentHi: "#B5D4FF", accentDeep: "#3B7BD8", accentText: "#8FBCFF", danger: "#FF7B8A",
    glow: V1_GLOW("#7FB3FF", .12), strikeShadow: "0 0 12px rgba(127,179,255,.45)"
  }, { engine: "bell", pitch: 0.75, decay: 1.4, bright: 0.5 }, ["#7FB3FF", "#B5D4FF", "#FFFFFF", "#3B7BD8", "#9AA7C4"]),

  kit("forest", "Forest", "dark", "outfit", {
    ink: "#10201A", ink2: "#172A22", ink3: "#20362C",
    text: "#EAF2E6", muted: "#A9C4A2", dim: "#8AA884", done: "#8AA884",
    accent: "#8BD17A", accentHi: "#B8E6A6", accentDeep: "#4E9A45", accentText: "#9EDB8E", danger: "#F08A6A",
    glow: V1_GLOW("#8BD17A", .10), strikeShadow: "0 0 10px rgba(139,209,122,.40)"
  }, { engine: "knock", pitch: 0.78, decay: 1.5, noise: 1.2, filter: 1800 }, ["#8BD17A", "#B8E6A6", "#F2E9B8", "#4E9A45", "#EAF2E6"]),

  kit("paper", "Paper", "light", "playfair", {
    ink: "#F7F2E8", ink2: "#EFE8DA", ink3: "#E3DAC8",
    text: "#1F1B16", muted: "#5E5749", dim: "#6C6559", done: "#6C6559",
    accent: "#C8321F", accentHi: "#E0563F", accentDeep: "#8E2214", accentText: "#9E2717", danger: "#B02A1A",
    glow: V1_GLOW("#C8321F", .06, 30, 60), strikeShadow: "none"
  }, { engine: "knock", pitch: 1.35, decay: 0.55, noise: 2.2, filter: 6000, tone: "sine" }, ["#C8321F", "#1F1B16", "#E0563F", "#D9C9A8", "#F7F2E8"]),

  kit("terminal", "Terminal", "dark", "mono", {
    ink: "#070A08", ink2: "#0E140F", ink3: "#152017",
    text: "#D8FFD8", muted: "#7FCB86", dim: "#67A96E", done: "#67A96E",
    accent: "#4AF07A", accentHi: "#9CFFB5", accentDeep: "#21A64F", accentText: "#5DF58A", danger: "#FF6B57",
    glow: V1_GLOW("#4AF07A", .08), strikeShadow: "0 0 14px rgba(74,240,122,.55)"
  }, { engine: "blip" }, ["#4AF07A", "#9CFFB5", "#FFFFFF", "#21A64F", "#D8FFD8"]),

  kit("sunset", "Sunset", "dark", "dmserif", {
    ink: "#2A1622", ink2: "#3A1F2E", ink3: "#4C2A3C",
    text: "#FFF1E6", muted: "#F0B9A6", dim: "#D9998A", done: "#D9998A",
    accent: "#FF7A59", accentHi: "#FFC26B", accentDeep: "#C2452B", accentText: "#FF8E70", danger: "#FF6B8A",
    glow: "radial-gradient(120% 90% at 50% 40%, rgba(255,122,89,.22), rgba(255,194,107,.10) 46%, rgba(255,122,89,0) 74%)",
    strikeShadow: "0 0 12px rgba(255,122,89,.55)",
    boxDoneBg: "linear-gradient(135deg,#FF7A59,#FFC26B)",
    strikeBg: "linear-gradient(90deg,#FF7A59,#FFC26B,#FF9EB5,#FF7A59)", strikeSize: "300% 100%", strikeAnim: "shimmer 4s linear infinite",
    finaleStyle: "italic"
  }, { engine: "bell", pitch: 0.84, decay: 1.2, bright: 0.6 }, ["#FF7A59", "#FFC26B", "#FF9EB5", "#FFF1E6", "#C2452B"], { shapes: 2 }),

  kit("dusk", "Dusk", "dark", "cormorant", {
    ink: "#171226", ink2: "#211A35", ink3: "#2C2446",
    text: "#EFEAFF", muted: "#C2B5E8", dim: "#A697D6", done: "#A697D6",
    accent: "#B49CFF", accentHi: "#D8CBFF", accentDeep: "#7C5CE6", accentText: "#C0ABFF", danger: "#FF7B9C",
    glow: V1_GLOW("#B49CFF", .14, 38, 66), strikeShadow: "0 0 12px rgba(180,156,255,.50)",
    finaleStyle: "italic"
  }, { engine: "bell", pitch: 1.12, decay: 1.6, bright: 0.35 }, ["#B49CFF", "#D8CBFF", "#FFFFFF", "#FFD27A", "#7C5CE6"], { shapes: 3 }),

  kit("harbor", "Harbor", "light", "manrope", {
    ink: "#EEF5F4", ink2: "#E2EDEB", ink3: "#D2E2DF",
    text: "#123A3E", muted: "#3F6A6E", dim: "#4C777A", done: "#4C777A",
    accent: "#0F8C8C", accentHi: "#38B3AF", accentDeep: "#0A6666", accentText: "#0C7070", danger: "#C24A3A",
    glow: V1_GLOW("#0F8C8C", .08, 30, 60), strikeShadow: "none"
  }, { engine: "knock", pitch: 0.9, decay: 1.1, noise: 0.6, filter: 900, tone: "sine" }, ["#0F8C8C", "#38B3AF", "#E8D8B0", "#FFFFFF", "#7ED0C8"]),

  kit("ember", "Ember", "dark", "archivo", {
    ink: "#1B0F0D", ink2: "#271512", ink3: "#351C18",
    text: "#FFEDE4", muted: "#E0AA97", dim: "#C48B78", done: "#C48B78",
    accent: "#FF4D2E", accentHi: "#FFB02E", accentDeep: "#B4291A", accentText: "#FF6A4F", danger: "#FF6B8A",
    glow: V1_GLOW("#FF4D2E", .14, 36, 64), strikeShadow: "0 0 14px rgba(255,77,46,.55)"
  }, { engine: "knock", pitch: 0.7, decay: 1.3, noise: 1.8, filter: 3200, tone: "sawtooth" }, ["#FF4D2E", "#FFB02E", "#FF8A3D", "#FFEDE4", "#B4291A"]),

  kit("cocoa", "Cocoa", "dark", "lora", {
    ink: "#2A1F1A", ink2: "#362923", ink3: "#45352D",
    text: "#F6EBDD", muted: "#CFB8A2", dim: "#B39C86", done: "#B39C86",
    accent: "#D9A066", accentHi: "#F0C48A", accentDeep: "#A66A34", accentText: "#E4AE76", danger: "#E8846A",
    glow: V1_GLOW("#D9A066", .10), strikeShadow: "0 0 10px rgba(217,160,102,.35)"
  }, { engine: "knock", pitch: 0.85, decay: 1.25, noise: 0.5, filter: 1400 }, ["#D9A066", "#F0C48A", "#F6EBDD", "#8C5A3C", "#A66A34"])
];

const ORIGINAL = new Set(["dark", "light", "pink"]);

/** Fill in derivable tokens and enforce contrast on every curated theme except the three originals. */
function finalize(t) {
  const c = t.colors;
  if (!c.hair) c.hair = rgba(c.text, t.base === "dark" ? .10 : .16);
  if (!c.hairHi) c.hairHi = rgba(c.text, t.base === "dark" ? .30 : .42);
  if (!c.hairSolid) c.hairSolid = hairSolidFor(c.ink, c.text);
  if (!ORIGINAL.has(t.id)) {
    const dir = t.base === "dark" ? 1 : -1;
    const fix = (hex, target) => { const o = hexToOklch(hex); return ensure(o.L, o.C, o.h, c.ink, target, dir); };
    c.text = fix(c.text, 7); c.muted = fix(c.muted, 4.5); c.dim = fix(c.dim, 4.5); c.done = fix(c.done, 4.5);
    c.accentText = fix(c.accentText, 4.5); c.accent = fix(c.accent, 3); c.danger = fix(c.danger, 4.5);
  }
  if (!c.boxDoneBg) c.boxDoneBg = c.accent;
  if (!c.strikeBg) c.strikeBg = c.accent;
  if (!c.strikeSize) c.strikeSize = "auto";
  if (!c.strikeAnim) c.strikeAnim = "none";
  if (!c.finaleStyle) c.finaleStyle = "normal";
  return t;
}
function hairSolidFor(ink, text) {
  // a solid line colour that clears 3:1 against the background (checkbox borders, focus rings' neighbours)
  const i = hexToOklch(ink), tx = hexToOklch(text);
  const dir = i.L < 0.5 ? 1 : -1;
  return ensure(i.L + dir * 0.25, Math.min(i.C, 0.03), i.h || tx.h, ink, 3, dir);
}

export const CURATED = RAW.map(finalize);
export function curated(id) { return CURATED.find(t => t.id === id); }

/* ---------------- custom derivation ---------------- */

function warmth(h) {
  if (h >= 300 || h < 20) return "pink";
  if (h < 110) return "warm";
  if (h < 200) return "green";
  return "cool";
}
export function pickPair(base, accentHex) {
  const w = warmth(hexToOklch(accentHex).h);
  if (base === "dark") return { pink: "fraunces", warm: "dmserif", green: "manrope", cool: "grotesk" }[w];
  return { pink: "fraunces", warm: "playfair", green: "lato", cool: "manrope" }[w];
}

/** Every token from an accent + base. Backgrounds are tinted toward the accent hue at low chroma. */
export function derive({ accent, base = "dark", pair, name = "", id }) {
  accent = normalizeHex(accent) || "#D26128";
  const a = hexToOklch(accent);
  const h = a.h, dark = base === "dark";
  const dir = dark ? 1 : -1;
  const c = {};
  if (dark) {
    const inkC = Math.min(0.055, Math.max(0.012, a.C * 0.35));
    c.ink = oklch(0.215, inkC, h); c.ink2 = oklch(0.26, inkC * 1.05, h); c.ink3 = oklch(0.315, inkC * 1.1, h);
    c.text = ensure(0.955, Math.min(0.012, a.C * 0.1), h, c.ink3, 7, 1);
    c.muted = ensure(0.75, Math.min(0.05, a.C * 0.35), h, c.ink3, 4.5, 1);
    c.dim = ensure(0.64, Math.min(0.04, a.C * 0.3), h, c.ink3, 4.5, 1);
    c.accent = ensure(a.L, a.C, h, c.ink, 3, 1);
    c.accentText = ensure(hexToOklch(c.accent).L, Math.min(a.C, 0.2), h, c.ink3, 4.5, 1);
    const aL = hexToOklch(c.accent).L;
    c.accentHi = oklch(Math.min(0.92, aL + 0.12), a.C * 0.8, h + 8);
    c.accentDeep = oklch(Math.max(0.3, aL - 0.15), a.C, h - 4);
    c.danger = ensure(0.7, 0.16, 25, c.ink, 4.5, 1);
    c.glow = V1_GLOW(c.accent, .11);
    c.strikeShadow = `0 0 10px ${rgba(c.accent, .38)}`;
  } else {
    const inkC = Math.min(0.022, Math.max(0.009, a.C * 0.14));
    c.ink = oklch(0.975, inkC, h); c.ink2 = oklch(0.95, inkC * 1.2, h); c.ink3 = oklch(0.91, inkC * 1.4, h);
    c.text = ensure(0.32, Math.min(0.03, a.C * 0.2), h, c.ink3, 7, -1);
    c.muted = ensure(0.5, Math.min(0.05, a.C * 0.3), h, c.ink3, 4.5, -1);
    c.dim = ensure(0.56, Math.min(0.04, a.C * 0.25), h, c.ink3, 4.5, -1);
    c.accent = ensure(a.L, a.C, h, c.ink, 3, -1);
    c.accentText = ensure(hexToOklch(c.accent).L, a.C, h, c.ink3, 4.5, -1);
    const aL = hexToOklch(c.accent).L;
    c.accentHi = oklch(Math.min(0.85, aL + 0.1), a.C * 0.9, h + 6);
    c.accentDeep = oklch(Math.max(0.25, aL - 0.15), a.C, h - 4);
    c.danger = ensure(0.5, 0.17, 28, c.ink, 4.5, -1);
    c.glow = V1_GLOW(c.accent, .07, 30, 60);
    c.strikeShadow = "none";
  }
  c.done = c.dim;
  c.hair = rgba(c.text, dark ? .10 : .16);
  c.hairHi = rgba(c.text, dark ? .30 : .42);
  c.hairSolid = hairSolidFor(c.ink, c.text);
  c.boxDoneBg = c.accent; c.strikeBg = c.accent; c.strikeSize = "auto"; c.strikeAnim = "none"; c.finaleStyle = "normal";
  const p = pair && pairOf(pair) ? pair : pickPair(base, accent);
  const w = warmth(h);
  const sound = (w === "pink" || w === "cool") ? { engine: "bell", pitch: 0.85 + a.L * 0.4, decay: 1.1, bright: 0.6 } : { engine: "knock", pitch: 0.8 + a.L * 0.4, decay: 1.1, noise: 1 };
  const confetti = [c.accent, c.accentHi, c.accentDeep, dark ? c.text : c.text, oklch(dark ? 0.8 : 0.72, 0.07, h + 180)];
  return {
    id: id || ("custom-" + accent.slice(1).toLowerCase() + "-" + base[0] + "-" + p),
    name: name || "Custom", base, kind: "custom", pair: p, accent, colors: c, sound, confetti, shapes: 1
  };
}

export function normalizeHex(s) {
  if (typeof s !== "string") return null;
  const m = s.trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(m)) return "#" + m.toUpperCase();
  if (/^[0-9a-f]{3}$/i.test(m)) return "#" + m.split("").map(x => x + x).join("").toUpperCase();
  return null;
}

/** Random custom theme inside ranges that never come out muddy or neon. */
export function surprise(rand = Math.random) {
  const base = rand() < 0.5 ? "dark" : "light";
  let accent = null;
  for (let i = 0; i < 24; i++) {
    const h = rand() * 360;
    const C = 0.12 + rand() * 0.08;
    const L = base === "dark" ? 0.68 + rand() * 0.12 : 0.45 + rand() * 0.13;
    accent = oklch(L, C, h);
    // some hues cannot hold that much chroma inside sRGB at that lightness; skip the clamped ones
    if (hexToOklch(accent).C >= 0.1) break;
  }
  const pairs = CUSTOM_PAIRS;
  const pair = rand() < 0.6 ? pickPair(base, accent) : pairs[Math.floor(rand() * pairs.length)];
  return derive({ accent, base, pair, name: "Surprise" });
}

/* ---------------- codes (share / save) ---------------- */

export function themeCode(t) {
  if (t.kind === "curated") return "T1:curated:" + t.id;
  return ["T1", t.base[0], t.accent.slice(1), t.pair, (t.name || "Custom").replace(/[:\n]/g, " ")].join(":");
}
export function parseCode(code) {
  if (typeof code !== "string") return null;
  const parts = code.trim().split(":");
  if (parts[0] !== "T1") return null;
  if (parts[1] === "curated") return curated(parts[2]) || null;
  const base = parts[1] === "l" ? "light" : parts[1] === "d" ? "dark" : null;
  const accent = normalizeHex(parts[2]);
  if (!base || !accent) return null;
  const pair = pairOf(parts[3]) ? parts[3] : undefined;
  const name = parts.slice(4).join(":").trim().slice(0, 40) || "Custom";
  return derive({ accent, base, pair, name });
}

/* ---------------- CSS ---------------- */

export function cssText(t) {
  const c = t.colors, p = pairOf(t.pair) || PAIRS.lato;
  return `:root{--ink:${c.ink};--ink-2:${c.ink2};--ink-3:${c.ink3};--text:${c.text};--muted:${c.muted};--dim:${c.dim};--done:${c.done};` +
    `--accent:${c.accent};--accent-hi:${c.accentHi};--accent-deep:${c.accentDeep};--accent-text:${c.accentText};--danger:${c.danger};` +
    `--hair:${c.hair};--hair-hi:${c.hairHi};--hair-solid:${c.hairSolid};--glow:${c.glow};--strike-shadow:${c.strikeShadow};` +
    `--box-done-bg:${c.boxDoneBg};--strike-bg:${c.strikeBg};--strike-size:${c.strikeSize};--strike-anim:${c.strikeAnim};--finale-style:${c.finaleStyle};` +
    `--font-task:${p.task[2]};--font-ui:${p.ui[2]};--task-w:${p.w};--task-ls:${p.ls};--task-lh:${p.lh};color-scheme:${t.base}}`;
}

/** Contrast report used by tests and the picker's preview. */
export function report(t) {
  const c = t.colors;
  return {
    text: contrast(c.text, c.ink), muted: contrast(c.muted, c.ink), dim: contrast(c.dim, c.ink),
    accentText: contrast(c.accentText, c.ink), accent: contrast(c.accent, c.ink), hairSolid: contrast(c.hairSolid, c.ink), danger: contrast(c.danger, c.ink)
  };
}

/* ---------------- DOM ---------------- */

const CSS_KEY = "tf/v2/themecss", FONT_KEY = "tf/v2/fontsurl";

export function applyTheme(t, doc = document, { persist = true } = {}) {
  const css = cssText(t);
  let style = doc.getElementById("theme-vars");
  if (!style) { style = doc.createElement("style"); style.id = "theme-vars"; doc.head.appendChild(style); }
  if (style.textContent !== css) style.textContent = css;
  doc.documentElement.dataset.base = t.base;
  doc.documentElement.dataset.theme = t.id;
  const meta = doc.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t.colors.ink);
  loadFonts(fontsUrl(t.pair), doc);
  if (persist) { try { localStorage.setItem(CSS_KEY, css); localStorage.setItem(FONT_KEY, fontsUrl(t.pair)); } catch (e) { /* private mode */ } }
}

/** Load only the fonts in use: one stylesheet for the active pair, previous ones removed once the new one has loaded. */
let wantedFonts = null;
export function loadFonts(url, doc = document) {
  wantedFonts = url;
  const current = doc.querySelector('link[data-fonts="active"]');
  if (current && current.href === url) { doc.querySelectorAll('link[data-fonts="pending"]').forEach(l => l.remove()); return; }
  const pending = Array.from(doc.querySelectorAll('link[data-fonts="pending"]'));
  if (pending.some(l => l.href === url)) return;
  pending.forEach(l => l.remove());
  const link = doc.createElement("link");
  link.rel = "stylesheet"; link.href = url; link.crossOrigin = "anonymous"; link.setAttribute("data-fonts", "pending");
  link.onload = link.onerror = () => {
    // a later call may have chosen another pair while this one was loading
    if (link.href !== wantedFonts) { link.remove(); return; }
    doc.querySelectorAll('link[data-fonts]').forEach(l => { if (l !== link) l.remove(); });
    link.setAttribute("data-fonts", "active");
  };
  doc.head.appendChild(link);
}
