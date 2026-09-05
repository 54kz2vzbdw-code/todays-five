// tools/csp-hash.js — the sha256 hashes the Content-Security-Policy metas need for the inline boot scripts and the
// inline token stylesheet. Run: node tools/csp-hash.js index.html about.html   (add --write to update the metas)
import fs from "node:fs";
import crypto from "node:crypto";
const write = process.argv.includes("--write");
for (const file of process.argv.slice(2).filter(a => !a.startsWith("--"))) {
  let html = fs.readFileSync(file, "utf8");
  const h = s => "sha256-" + crypto.createHash("sha256").update(s, "utf8").digest("base64");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => h(m[1]));
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => h(m[1]));
  console.log(file, "\n  script-src:", scripts.join(" "), "\n  style-src: ", styles.join(" "));
  if (write) {
    html = html.replace(/(script-src [^;]*?)'sha256-[^']+'/, (m, p) => `${p}'${scripts[0]}'`).replace(/(style-src [^;]*?)'sha256-[^']+'/, (m, p) => `${p}'${styles[0]}'`);
    fs.writeFileSync(file, html); console.log("  written");
  }
}
