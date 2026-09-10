// clock-contrast.mjs — WatchTheme.contrastWithWhite(ink) for all 18 kits, from the fixture (0.04045 threshold, as WatchTheme.swift), and with theme.js's own contrast() for comparison.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
const root = process.argv[2];
const fx = JSON.parse(fs.readFileSync(path.join(root, "test/fixtures/kits.json"), "utf8"));
const T = await import(pathToFileURL(path.join(root, "theme.js")).href);
const lin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const cww = hex => { const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255; return 1.05 / (0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) + 0.05); };
const rows = fx.kits.map(k => ({ id: k.id, base: k.base, ink: k.colors.ink, cww: cww(k.colors.ink), themejs: T.contrast(k.colors.ink, "#FFFFFF") }));
rows.sort((a, b) => a.cww - b.cww);
for (const r of rows) console.log(`${r.id.padEnd(10)} ${r.base.padEnd(5)} ${r.ink}  contrastWithWhite=${r.cww.toFixed(4)}  theme.js contrast(ink,#FFFFFF)=${r.themejs.toFixed(4)}  scrim=${r.cww < 3}`);
const light = rows.filter(r => r.base === "light"), dark = rows.filter(r => r.base === "dark");
console.log(`\nlight-base kits: ${light.length}, range ${Math.min(...light.map(r => r.cww)).toFixed(2)}–${Math.max(...light.map(r => r.cww)).toFixed(2)}; dark-base: ${dark.length}, range ${Math.min(...dark.map(r => r.cww)).toFixed(2)}–${Math.max(...dark.map(r => r.cww)).toFixed(2)}`);
console.log(`kits needing the scrim (< 3): ${rows.filter(r => r.cww < 3).map(r => r.id).join(", ")}`);
