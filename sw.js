// Service worker: offline shell + assets, no third-party hosts. Same-origin HTML/JS/CSS are network-first so a
// deploy lands on the next load; icons, fonts and the vendored realtime client are cache-first.
// 1.4: the cache is per build, and a module a page loads later (the panels and their stylesheet, the sound packs, the
// QR maker, the exporter, the realtime client) asks for its own build with `?v=<build>`, answered from that build's
// cache — so a page open across a deploy keeps loading its own code. The previous build's cache stays for exactly
// that; older ones are reaped. Bump VERSION and BUILD with version.js on deploy (test/features.test.js checks).
// 1.9: a module asked for with this page's own build is answered from this build's cache first (its content is immutable
// by construction: a new build gets a new number and a new cache), the network only when the cache has nothing; and the
// cache holds one copy of each file — the navigation is keyed as index.html whatever the address, a module by its plain
// name — instead of the same bytes under "./" and "./index.html", under a plain and a `?v=` name (COMPATIBILITY.md §6).
const VERSION = "tf-v1.12"; // = "tf-v" + version.js's marketing version
const BUILD = 258;          // = version.js's BUILD
const CACHE = VERSION + "-b" + BUILD;
const SHELL = [
  "./index.html", "./about.html", "./styles.css", "./panels.css", "./app.js", "./model.js", "./sync.js", "./crypto.js", "./theme.js",
  "./sound.js", "./packs.js", "./packs-secret.js", "./secretfx.js", "./secretfx.css", "./fx.js", "./qr.js", "./config.js", "./version.js", "./panels.js", "./exporter.js", "./whatsnew.json",
  "./manifest.webmanifest", "./vendor/realtime.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-512-maskable.png", "./icons/apple-touch-icon.png"
];
const INDEX = new URL("./index.html", self.location.href).href;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // only reap this app's own older generations: the github.io origin is shared with other apps' caches
  // keep the previous generation for pages still open on it; reap the rest of this app's own caches
  e.waitUntil(caches.keys().then(keys => {
    const others = keys.filter(k => k.startsWith("tf-") && k !== CACHE).sort((a, b) => buildOf(b) - buildOf(a));
    return Promise.all(others.slice(1).map(k => caches.delete(k)));
  }).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase calls go straight to the network
  const path = url.pathname;
  const v = url.searchParams.get("v");
  // 1.7: a navigation's URL carries the list's link in the fragment, and Cache Storage kept it as the key — a copy of the Private
  // link on disk that Remove and Delete never reached. 1.9: one key per file — a navigation is the shell's index.html whatever its
  // address (the query never reaches the key either), a module asked for by build is its plain name; matching ignores the search.
  const key = req.mode === "navigate" ? (path.endsWith("/") ? new URL("./index.html", url).href : url.origin + path) : url.origin + path;
  const store = (name, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(name).then(c => c.put(key, copy)); } return res; };
  if (v && /^\d+$/.test(v)) {
    if (+v === BUILD) {
      // 1.9: this page's own module — immutable, so this build's cache first and the network only as the fallback (the precache holds it after the first open)
      e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })).then(r => r || fetch(req, { cache: "no-cache" }).then(res => store(CACHE, res))));
      return;
    }
    // a page from another build asking for its own module: that build's cache first; the network as the fallback, where
    // the module's own guard turns a mismatch into the page reloading itself
    e.respondWith(caches.keys().then(keys => { const k = keys.find(n => n.startsWith("tf-") && buildOf(n) === +v); return k ? caches.open(k).then(c => c.match(req, { ignoreSearch: true })) : null; }).then(r => r || fetch(req, { cache: "no-cache" })));
    return;
  }
  if (/\/(fonts|vendor|icons)\//.test(path)) {
    // immutable-ish assets: cache first, fill the cache on first use (a font is fetched only when a theme needs it)
    e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })).then(r => r || fetch(req).then(res => store(CACHE, res))));
    return;
  }
  // shell: network first — revalidated, never a stale HTTP-cache hit, so a page is never a mix of builds — with this
  // build's cache as the fallback (and the cache refreshed on success)
  e.respondWith(
    fetch(req, { cache: "no-cache" }).then(res => {
      if (res && res.ok && (path.endsWith("/") || /\.(html|js|css|webmanifest|png|json)$/.test(path))) store(CACHE, res);
      return res;
    }).catch(() => caches.open(CACHE).then(c => c.match(req.mode === "navigate" ? key : req, { ignoreSearch: true }).then(r => r || (req.mode === "navigate" ? c.match(INDEX) : undefined))))
  );
});

function buildOf(name) { const m = /-b(\d+)$/.exec(name); return m ? +m[1] : 0; }
