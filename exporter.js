// exporter.js — hands an export to the user and reads an import back. Loaded on first use (Settings → Advanced).
// iOS: the share sheet takes a File (Files, AirDrop, Mail…); elsewhere a download; the clipboard is the fallback.

export async function handOff({ text, filename, mime, ios }) {
  const blob = new Blob([text], { type: mime });
  let file = null;
  try { file = new File([blob], filename, { type: mime }); } catch (e) { file = null; }
  if (ios && file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return "shared"; }
    catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
  }
  if ("download" in HTMLAnchorElement.prototype) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return "downloaded";
  }
  try { await navigator.clipboard.writeText(text); return "copied"; } catch (e) { return "failed"; }
}

export function readFile(file) {
  if (file && typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsText(file); });
}

export function filenameFor(name, ext) {
  const base = (name || "todays-five").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "todays-five";
  const d = new Date(), pad = n => (n < 10 ? "0" : "") + n;
  return `${base}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.${ext}`;
}
