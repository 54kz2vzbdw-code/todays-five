// Service worker: offline shell + assets. Same-origin HTML/JS/CSS are network-first so a deploy
// lands on the next load; icons and font files are cache-first. Bump VERSION on deploy.
const VERSION = "tf-v2.0.0";
const SHELL = [
  "./", "./index.html", "./styles.css", "./app.js", "./model.js", "./sync.js", "./theme.js",
  "./sound.js", "./fx.js", "./qr.js", "./config.js", "./manifest.webmanifest",
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
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.gstatic.com";
  const isFontCss = url.hostname === "fonts.googleapis.com";
  const isCdn = url.hostname === "cdn.jsdelivr.net";

  if (sameOrigin) {
    // network first, cache fallback (and refresh the cache on success)
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok && (url.pathname.endsWith("/") || /\.(html|js|css|webmanifest|png)$/.test(url.pathname))) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined)))
    );
    return;
  }
  if (isFont || isCdn) {
    // immutable: cache first
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (isFontCss) {
    // stale-while-revalidate: the CSS can change per UA
    e.respondWith(caches.match(req).then(cached => {
      const net = fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }).catch(() => cached);
      return cached || net;
    }));
  }
});
