// apple/tools/mockserver.mjs — the three list RPCs and the doorbell, in memory, for a simulator that must not touch
// the real backend (twelve creates an hour per address, shared with every suite and every live check).
//
// The semantics are supabase/migrations/002_v3.sql's, rule for rule where a client can tell: a missing row reads
// null; an unchanged rev reads {unchanged, rev}; a put with base 0 inserts and keeps the token; a put with the wrong
// token is a 403; a stale base answers {ok:false, rev, doc} for the client to merge; delete needs the token. The
// doorbell answers 202. Envelopes are stored as they arrive — this server can no more read a list than the real one.
//
// Debug builds of the iPhone app and its widgets use it when the App Group holds `widgets/debug-server.json`
// ({ "url": "http://127.0.0.1:8899", "key": "mock" }), which `-TFWidgetSeed` writes. A Release build never reads it.
//
// Run: node apple/tools/mockserver.mjs [port=8899]. GET /__stats answers counts, never an id.
import http from "node:http";

const port = +(process.argv[2] || 8899);
const rows = new Map();
const stats = { gets: 0, unchanged: 0, puts: 0, created: 0, stale: 0, refused: 0, deletes: 0, bells: 0 };

http.createServer((req, res) => {
  let body = "";
  req.on("data", c => { body += c; });
  req.on("end", () => {
    const send = (code, value) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(value === null ? "null" : JSON.stringify(value)); };
    if (req.url === "/__stats") return send(200, { ...stats, rows: rows.size, revs: [...rows.values()].map(r => r.rev) });
    let a = {};
    try { a = JSON.parse(body || "{}"); } catch (e) { return send(400, { message: "bad json" }); }
    const ok = /^[0-9A-Za-z]{22,64}$/.test(a.p_id || "");
    if (req.url.endsWith("/rest/v1/rpc/get_list_v3")) {
      if (!ok) return send(400, { message: "bad id", code: "PT400" });
      stats.gets++;
      const r = rows.get(a.p_id);
      if (!r) return send(200, null);
      if (a.p_rev != null && a.p_rev === r.rev) { stats.unchanged++; return send(200, { unchanged: true, rev: r.rev }); }
      return send(200, { doc: r.doc, rev: r.rev });
    }
    if (req.url.endsWith("/rest/v1/rpc/put_list_v3")) {
      if (!ok) return send(400, { message: "bad id", code: "PT400" });
      if (!/^[0-9A-Za-z_-]{43}$/.test(a.p_token || "")) return send(400, { message: "bad token", code: "PT400" });
      const r = rows.get(a.p_id);
      if (!r) {
        if ((a.p_base_rev || 0) !== 0) return send(200, { ok: false, rev: 0, doc: null });
        rows.set(a.p_id, { doc: a.p_doc, rev: 1, token: a.p_token });
        stats.puts++; stats.created++;
        return send(200, { ok: true, rev: 1 });
      }
      if (r.token !== a.p_token) { stats.refused++; return send(403, { message: "This link can only view the list.", code: "PT403" }); }
      if (r.rev !== a.p_base_rev) { stats.stale++; return send(200, { ok: false, rev: r.rev, doc: r.doc }); }
      r.doc = a.p_doc; r.rev += 1; stats.puts++;
      return send(200, { ok: true, rev: r.rev });
    }
    if (req.url.endsWith("/rest/v1/rpc/delete_list_v3")) {
      const r = rows.get(a.p_id);
      if (!r) return send(200, false);
      if (r.token !== a.p_token) { stats.refused++; return send(403, { message: "This link can only view the list.", code: "PT403" }); }
      rows.delete(a.p_id); stats.deletes++;
      return send(200, true);
    }
    if (req.url.endsWith("/realtime/v1/api/broadcast")) { stats.bells++; return send(202, {}); }
    send(404, { message: "not here" });
  });
}).listen(port, "127.0.0.1", () => console.log(`mock server on ${port}`));
