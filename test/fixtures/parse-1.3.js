// FROZEN: the 1.3 client's link parser (model.js at build 62, commit e29a300), kept to show what a page still running 1.3
// does with a link that carries a 1.4 hint. Never edit; a new client is a new fixture.
const TEXT_MAX = 200;
export function parseHash(hash) {
  const m = String(hash || "").match(/^#\/(l|r)\/([0-9A-Za-z]{22,64})(\/add(?:\?(.*))?)?$/);
  if (!m) return null;
  const out = { id: m[2], mode: m[1] === "r" ? "view" : "edit", add: null };
  if (m[3]) {
    const q = new URLSearchParams(m[4] || "");
    const text = (q.get("text") || "").split(/\r?\n/).map(t => t.trim().replace(/\s+/g, " ")).filter(Boolean).map(t => t.slice(0, TEXT_MAX));
    out.add = { text, section: (q.get("section") || "").trim().slice(0, 60) };
  }
  return out;
}
