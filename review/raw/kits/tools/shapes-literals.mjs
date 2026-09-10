// shapes-literals.mjs — the `shapes` literal each kit() block in theme.js carries (per block, not first-following), and what [t.shapes] would have made of it.
import fs from "node:fs";
const src = fs.readFileSync(process.argv[2] + "/theme.js", "utf8");
const blocks = src.split(/(?=\bkit\(")/).slice(1);
let heartsOnly = [], otherMisread = [], lists = [];
for (const b of blocks) {
  const id = /^kit\("([a-z]+)"/.exec(b)[1];
  const end = b.indexOf("\nkit(");                       // stay inside this block
  const body = end < 0 ? b : b.slice(0, end);
  const m = /shapes:\s*(\[[^\]]*\]|\d+)/.exec(body.split(/\n\s*\n/)[0] || body);
  const lit = m ? m[1] : "(absent → 1)";
  const n = m && !m[1].startsWith("[") ? +m[1] : (m ? null : 1);
  if (n === 1) heartsOnly.push(id); else if (n !== null) otherMisread.push(id + "=" + n + "→[" + n + "]"); else lists.push(id + "=" + lit);
  console.log(id.padEnd(10) + " shapes literal: " + lit);
}
console.log("\nbare count 1 or absent (wrapped as [1] = hearts-only by the old fixture): " + heartsOnly.length + " — " + heartsOnly.join(", "));
console.log("other bare counts (wrapped as a one-element list of the wrong shape): " + otherMisread.length + " — " + otherMisread.join(", "));
console.log("lists (unaffected): " + lists.length + " — " + lists.join(", "));
console.log("kits misread by the old [t.shapes] in total: " + (heartsOnly.length + otherMisread.length) + " of 18");
