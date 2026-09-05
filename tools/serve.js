// tools/serve.js — a static server for the suites and Lighthouse: gzip like GitHub Pages, no caching surprises.
// Usage: node tools/serve.js [port] [root]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
const port = +(process.argv[2] || 8790), root = path.resolve(process.argv[3] || ".");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".woff2": "font/woff2", ".md": "text/markdown; charset=utf-8", ".sql": "text/plain; charset=utf-8" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("not found"); return; }
  const ext = path.extname(f); const type = types[ext] || "application/octet-stream";
  const data = fs.readFileSync(f);
  const gz = /gzip/.test(req.headers["accept-encoding"] || "") && /^(text|application)\//.test(type);
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache", ...(gz ? { "Content-Encoding": "gzip" } : {}) });
  res.end(gz ? zlib.gzipSync(data) : data);
}).listen(port, "127.0.0.1", () => console.log("serving " + root + " on http://127.0.0.1:" + port));
