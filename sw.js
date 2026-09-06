// Service worker: offline shell + assets, no third-party hosts. Same-origin HTML/JS/CSS are network-first so a
// deploy lands on the next load; icons, fonts and the vendored realtime client are cache-first.
// 1.4: the cache is per build, and a module a page loads later (the panels and their stylesheet, the sound packs, the
// QR maker, the exporter, the realtime client) asks for its own build with `?v=<build>`, answered from that build's
// cache — so a page open across a deploy keeps loading its own code. The previous build's cache stays for exactly
// that; older ones are reaped. Bump VERSION and BUILD with version.js on deploy (test/features.test.js checks).
const VERSION = "tf-v1.6"; // = "tf-v" + version.js's marketing version
const BUILD = 82;          // = version.js's BUILD
const CACHE = VERSION + "-b" + BUILD;
const SHELL = [
  "./", "./index.html", "./about.html", "./styles.css", "./panels.css", "./app.js", "./model.js", "./sync.js", "./crypto.js", "./theme.js",
  "./sound.js", "./packs.js", "./packs-secret.js", "./secretfx.js", "./fx.js", "./qr.js", "./config.js", "./version.js", "./panels.js", "./exporter.js", "./whatsnew.json",
  "./manifest.webmanifest", "./vendor/realtime.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-512-maskable.png", "./icons/apple-touch-icon.png"
];

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
  if (v && /^\d+$/.test(v) && +v !== BUILD) {
    // a page from another build asking for its own module: that build's cache first; the network as the fallback, where
    // the module's own guard turns a mismatch into the page reloading itself
    e.respondWith(caches.keys().then(keys => { const k = keys.find(n => n.startsWith("tf-") && buildOf(n) === +v); return k ? caches.open(k).then(c => c.match(req, { ignoreSearch: true })) : null; }).then(r => r || fetch(req, { cache: "no-cache" })));
    return;
  }
  if (/\/(fonts|vendor|icons)\//.test(path)) {
    // immutable-ish assets: cache first, fill the cache on first use (a font is fetched only when a theme needs it)
    e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })).then(r => r || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  // shell: network first — revalidated, never a stale HTTP-cache hit, so a page is never a mix of builds — with this
  // build's cache as the fallback (and the cache refreshed on success)
  e.respondWith(
    fetch(req, { cache: "no-cache" }).then(res => {
      if (res && res.ok && (path.endsWith("/") || /\.(html|js|css|webmanifest|png|json)$/.test(path))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(r => r || (req.mode === "navigate" ? c.match("./index.html") : undefined))))
  );
});

function buildOf(name) { const m = /-b(\d+)$/.exec(name); return m ? +m[1] : 0; }
