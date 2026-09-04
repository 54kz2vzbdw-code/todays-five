// crypto.js — links, keys and the encrypted envelope. Pure Web Crypto; runs in the browser and in Node.
//
//   W (edit link, 22 base62 from getRandomValues)
//     ├─ R          = b62(HKDF(W, "read"), 22)        view link; W → R only, never back
//     │    ├─ lookupId = b62(HKDF(R, "lookup"), 32)   the row id the server sees
//     │    └─ key      = HKDF(R, "key")               AES-256-GCM, non-extractable
//     └─ writeToken = b64url(HKDF(W, "write"))        sent on every write; the server stores its sha256
//
// A view link derives lookupId and key but not the token, so the server can enforce view-only.
// The derivation is pinned by vectors in test/crypto.test.js: changing a byte here orphans every list.

const enc = new TextEncoder(), dec = new TextDecoder();
const SALT = enc.encode("todays-five/v3");
const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const subtle = () => globalThis.crypto.subtle;

export const ENVELOPE_VERSION = 3;
export const ALG = "A256GCM";

/* ---------------- encodings ---------------- */

export function b64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function unb64(s) {
  const bin = atob(String(s).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function b64url(bytes) { return b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
export function hex(bytes) { return Array.from(bytes, b => (b < 16 ? "0" : "") + b.toString(16)).join(""); }

/** Base62 from bytes by rejection sampling (byte < 248 → one symbol); null when the bytes run out. Deterministic and unbiased. */
export function b62FromBytes(bytes, len) {
  let out = "";
  for (let i = 0; i < bytes.length && out.length < len; i++) if (bytes[i] < 248) out += B62[bytes[i] % 62];
  return out.length === len ? out : null;
}

/* ---------------- HKDF ---------------- */

async function hkdfBase(ikmString) {
  return subtle().importKey("raw", enc.encode(ikmString), "HKDF", false, ["deriveBits", "deriveKey"]);
}
async function hkdfParams(info) { return { name: "HKDF", hash: "SHA-256", salt: SALT, info: enc.encode(info) }; }

/** HKDF-SHA256(ikm = utf8(ikmString), salt = "todays-five/v3", info) → `bytes` bytes. */
export async function hkdfBits(ikmString, info, bytes) {
  const k = await hkdfBase(ikmString);
  return new Uint8Array(await subtle().deriveBits(await hkdfParams(info), k, bytes * 8));
}

/** A base62 string of `len` chars derived from ikm + info. Asks for more bytes than it can need; if a block
    ever falls short it continues deterministically with info + "/2", "/3", … */
export async function deriveB62(ikmString, info, len) {
  const want = len <= 22 ? 64 : 96;
  for (let i = 1; i < 32; i++) {
    const bytes = await hkdfBits(ikmString, i === 1 ? info : info + "/" + i, want);
    const s = b62FromBytes(bytes, len);
    if (s) return s;
  }
  throw new Error("derivation failed");
}

/* ---------------- links ---------------- */

export function isSecret(s) { return typeof s === "string" && /^[0-9A-Za-z]{22,64}$/.test(s); }

/** Everything an edit link (W) gives: R, lookupId, key, token. */
export async function fromWrite(W) {
  if (!isSecret(W)) throw new Error("bad link");
  const R = await deriveB62(W, "read", 22);
  const view = await fromRead(R);
  const token = b64url(await hkdfBits(W, "write", 32));
  return { mode: "edit", id: W, W, R, lookupId: view.lookupId, key: view.key, token };
}

/** Everything a view link (R) gives: lookupId and key. No token exists on this path. */
export async function fromRead(R) {
  if (!isSecret(R)) throw new Error("bad link");
  const lookupId = await deriveB62(R, "lookup", 32);
  const base = await hkdfBase(R);
  const key = await subtle().deriveKey(await hkdfParams("key"), base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  return { mode: "view", id: R, R, lookupId, key, token: null };
}

/** Derive for either link kind. */
export function fromLink(mode, id) { return mode === "view" ? fromRead(id) : fromWrite(id); }

/* ---------------- envelope ---------------- */

export function isEnvelope(x) {
  return !!x && typeof x === "object" && x.v === ENVELOPE_VERSION && x.alg === ALG && typeof x.iv === "string" && typeof x.ct === "string";
}
function aad(z) { return enc.encode("v3:" + ALG + ":" + (z || "json")); }

async function pipeThrough(data, stream) {
  const s = new Blob([data]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(s).arrayBuffer());
}
export const canCompress = typeof globalThis.CompressionStream === "function" && typeof globalThis.DecompressionStream === "function";

/** Encrypt a document: deflate (when the platform can) then AES-256-GCM with a fresh iv. */
export async function seal(key, doc, { compress = canCompress } = {}) {
  let data = enc.encode(JSON.stringify(doc));
  let z = null;
  if (compress) { data = await pipeThrough(data, new CompressionStream("deflate-raw")); z = "deflate-raw"; }
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv, additionalData: aad(z) }, key, data));
  const env = { v: ENVELOPE_VERSION, alg: ALG };
  if (z) env.z = z;
  env.iv = b64(iv); env.ct = b64(ct);
  return env;
}

/** Decrypt an envelope back into the document. Throws on anything that is not ours or has been tampered with. */
export async function open(key, env) {
  if (!isEnvelope(env)) throw new Error("not an envelope");
  const z = env.z || null;
  if (z && z !== "deflate-raw") throw new Error("unknown compression " + z);
  if (z && !canCompress) throw new Error("this browser cannot open compressed lists");
  let data = new Uint8Array(await subtle().decrypt({ name: "AES-GCM", iv: unb64(env.iv), additionalData: aad(z) }, key, unb64(env.ct)));
  if (z) data = await pipeThrough(data, new DecompressionStream("deflate-raw"));
  return JSON.parse(dec.decode(data));
}

/** Approximate stored size of an envelope (what the server measures). */
export function envelopeBytes(env) { return enc.encode(JSON.stringify(env)).length; }
