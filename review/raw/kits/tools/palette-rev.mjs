// palette-rev.mjs — PALETTE_REV from theme.js against data-tokens-rev in index.html and about.html, and the boot-script guard.
// usage: node palette-rev.mjs <repo root>
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
const root = process.argv[2];
const T = await import(pathToFileURL(path.join(root, "theme.js")).href);
console.log("PALETTE_REV =", T.PALETTE_REV);
for (const f of ["index.html", "about.html"]) {
  const html = fs.readFileSync(path.join(root, f), "utf8");
  const m = /<html[^>]*\sdata-tokens-rev="([^"]+)"/.exec(html);
  const guard = html.includes('localStorage.getItem("tf/v2/themerev") !== document.documentElement.getAttribute("data-tokens-rev")');
  console.log(`${f}: data-tokens-rev=${m ? m[1] : "(none)"} matches=${m && m[1] === T.PALETTE_REV} bootGuardPresent=${guard}`);
}
const src = fs.readFileSync(path.join(root, "theme.js"), "utf8");
const applyLine = src.split("\n").find(l => l.includes("localStorage.setItem(CSS_KEY, css)"));
console.log("applyTheme persist line:", applyLine && applyLine.trim());
console.log("CURATED length used by the stamp:", T.CURATED.length, "(includes secret ids:", T.CURATED.filter(t => t.secret).map(t => t.id).join(","), ")");
