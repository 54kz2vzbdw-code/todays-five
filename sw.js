// Service worker: offline shell + assets. Same-origin HTML/JS/CSS are network-first so a deploy
// lands on the next load; icons and font files are cache-first. Bump VERSION on deploy.
const VERSION = "tf-v2.0.0";
const SHELL = [
  "./", "./index.html", "./styles.css", "./app.js", "./model.js", "./sync.js", "./theme.js",
  "./sound.js", "./fx.js", "./qr.js", "./config.js", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-512-maskable.png", "./icons/apple-touch-icon.png"
];

// The pinned Supabase client and its imports: cached best-effort so a first launch offline still syncs later.
const CDN = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.114.0/+esm",
  "https://cdn.jsdelivr.net/npm/@supabase/functions-js@2.114.0/+esm",
  "https://cdn.jsdelivr.net/npm/@supabase/postgrest-js@2.114.0/+esm",
  "https://cdn.jsdelivr.net/npm/@supabase/realtime-js@2.114.0/+esm",
  "https://cdn.jsdelivr.net/npm/@supabase/storage-js@2.114.0/+esm",
  "https://cdn.jsdelivr.net/npm/@supabase/auth-js@2.114.0/+esm",
  "https://cdn.jsdelivr.net/npm/tslib@2.8.1/+esm",
  "https://cdn.jsdelivr.net/npm/@supabase/phoenix@0.4.5/+esm",
  "https://cdn.jsdelivr.net/npm/iceberg-js@0.8.1/+esm"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(SHELL);
    await Promise.allSettled(CDN.map(u => c.add(new Request(u, { mode: "cors" }))));
  }).then(() => self.skipWaiting()));
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
