// Service worker: offline shell + assets, no third-party hosts. Same-origin HTML/JS/CSS are network-first so a
// deploy lands on the next load; icons, fonts and the vendored realtime client are cache-first. Bump VERSION on deploy.
const VERSION = "tf-v4.0.0"; // = "tf-v" + version.js; bumped with every deploy
const SHELL = [
  "./", "./index.html", "./about.html", "./styles.css", "./panels.css", "./app.js", "./model.js", "./sync.js", "./crypto.js", "./theme.js",
  "./sound.js", "./packs.js", "./fx.js", "./qr.js", "./config.js", "./version.js", "./panels.js", "./exporter.js", "./whatsnew.json",
  "./manifest.webmanifest", "./vendor/realtime.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-512-maskable.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  // only reap this app's own older generations: the github.io origin is shared with other apps' caches
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("tf-") && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase calls go straight to the network
  const path = url.pathname;
  if (/\/(fonts|vendor|icons)\//.test(path)) {
    // immutable-ish assets: cache first, fill the cache on first use (a font is fetched only when a theme needs it)
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  // shell: network first, cache fallback (and refresh the cache on success)
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok && (path.endsWith("/") || /\.(html|js|css|webmanifest|png|json)$/.test(path))) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});
