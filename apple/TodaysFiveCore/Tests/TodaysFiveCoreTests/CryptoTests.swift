// Keys, links and the envelope against the shared fixture. The derivation vectors are the pinned ones
// from test/crypto.test.js (COMPATIBILITY.md §2): if this fails, the code moved, never the numbers.
import CryptoKit
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("Keys, links and the envelope")
struct CryptoTests {

    @Test("the pinned derivation vectors, byte for byte")
    func pinnedVectors() throws {
        let vectors = Fixtures.vectors.arr("derivation")
        #expect(vectors.count == 3)
        for v in vectors {
            let o = try #require(v.objectValue)
            let W = o.str("W").string
            let e = try Keys.fromWrite(W)
            #expect(e.R == o.str("R").string, "R for \(W)")
            #expect(e.lookupId == o.str("lookupId").string, "lookupId for \(W)")
            #expect(e.token == o.str("token").string, "token for \(W)")
            #expect(hexString(Keys.hkdfBits(e.R, "key", 32)) == o.str("keyHex").string, "key for \(W)")
            #expect(isSecret(e.R) && e.R.count == 22)
            #expect(isSecret(e.lookupId) && e.lookupId.count == 32)
            #expect(e.token?.count == 43)
        }
    }

    @Test("a view link derives the same lookup id and key, and no token")
    func viewLinkDerivation() throws {
        for v in Fixtures.vectors.arr("derivation") {
            let o = try #require(v.objectValue)
            let e = try Keys.fromWrite(o.str("W").string)
            let r = try Keys.fromRead(o.str("R").string)
            #expect(r.lookupId == e.lookupId)
            #expect(r.token == nil)
            #expect(r.mode == .view && e.mode == .edit)
            #expect(r.W == nil, "a view derivation never carries W")
            #expect(r.keyBytes == e.keyBytes)
        }
    }

    @Test("nothing derivable from R reproduces the token")
    func tokenNeedsW() throws {
        let e = try Keys.fromWrite(Fixtures.vectors.arr("derivation")[0].objectValue!.str("W").string)
        #expect(base64url(Keys.hkdfBits(e.R, "write", 32)) != e.token)
    }

    @Test("base62 mapping and isSecret match the web")
    func base62AndSecrets() throws {
        for c in Fixtures.vectors.arr("b62") {
            let o = try #require(c.objectValue)
            let bytes = o.arr("bytes").map { UInt8($0.finiteNumber ?? 0) }
            let want = o["out"]?.jsString?.string
            #expect(Base62.fromBytes(bytes, Int(o.num("len"))) == want)
        }
        for c in Fixtures.vectors.arr("secrets") {
            let o = try #require(c.objectValue)
            #expect(isSecret(o.str("s").string) == o.truthy("ok"), "\(o.str("s").string)")
        }
        // rejection sampling never leaves a symbol unreachable
        var seen = Set<Character>()
        for _ in 0..<400 { for ch in Base62.randomId() { seen.insert(ch) } }
        #expect(seen.count == 62)
        #expect(Set((0..<2000).map { _ in Base62.randomId() }).count == 2000)
    }

    @Test("every link case parses the way model.js parses it")
    func linkParsing() throws {
        let cases = Fixtures.vectors.arr("links")
        #expect(cases.count >= 20)
        for c in cases {
            let o = try #require(c.objectValue)
            let hash = o.str("hash").string
            let got = Links.parseHash(hash)
            guard let want = o["parsed"]?.objectValue else {
                #expect(got == nil, "expected no match for \(hash)")
                #expect(Links.hashHasExtras(hash) == o.truthy("hasExtras"), "hasExtras \(hash)")
                continue
            }
            let g = try #require(got, "expected a match for \(hash)")
            #expect(g.id == want.str("id").string, "id for \(hash)")
            #expect(g.mode.rawValue == want.str("mode").string, "mode for \(hash)")
            #expect(g.hint == want.stringOrNil("hint")?.string, "hint for \(hash)")
            if let wantAdd = want["add"]?.objectValue {
                let add = try #require(g.add, "add for \(hash)")
                #expect(add.text == wantAdd.arr("text").map { $0.jsString?.string ?? "" }, "add.text for \(hash)")
                #expect(add.section == wantAdd.str("section").string, "add.section for \(hash)")
            } else {
                #expect(g.add == nil, "no add for \(hash)")
            }
            #expect(Links.hashHasExtras(hash) == o.truthy("hasExtras"), "hasExtras \(hash)")
        }
        for c in Fixtures.vectors.arr("hintLinks") {
            let o = try #require(c.objectValue)
            #expect(Links.hintLink(o.str("link").string, o.stringOrNil("hint")?.string) == o.str("out").string)
        }
    }

    @Test("a link made here opens on the web, and one from the web opens here")
    func linksRoundTrip() throws {
        let W = Base62.randomId()
        let e = try Keys.fromWrite(W)
        let edit = Links.fragment(id: W, mode: .edit)
        let view = Links.fragment(id: e.R, mode: .view)
        #expect(edit == "#/l/" + W)
        #expect(view == "#/r/" + e.R)
        #expect(Links.parseHash(edit)?.id == W)
        #expect(Links.parseHash(view)?.mode == .view)
        #expect(Links.parseLink("https://54kz2vzbdw-code.github.io/todays-five/" + edit)?.id == W)
        #expect(Links.parseLink("  " + W + "  ")?.id == W, "a bare id pasted into the box")
        #expect(Links.parseLink("nonsense") == nil)
    }

    @Test("envelopes the web sealed open here, and what we seal the web can open")
    func envelopeInterop() throws {
        var forNode: [JSONValue] = []
        for c in Fixtures.vectors.arr("envelopes") {
            let o = try #require(c.objectValue)
            let name = o.str("name").string
            let ref = try Keys.fromWrite(o.str("W").string)
            let doc = try #require(o["doc"]?.objectValue)
            let plaintext = o.str("plaintext").string

            // 1. the web's uncompressed envelope opens here
            let rawJSON = try #require(o["raw"]?.objectValue)
            let raw = try #require(Envelope(json: rawJSON))
            #expect(raw.z == nil)
            let openedRaw = try Crypto.open(key: ref.key, envelope: raw)
            #expect(String(decoding: openedRaw, as: UTF8.self) == plaintext, "\(name) raw plaintext")

            // 2. the web's deflate-raw envelope opens here — the compression variant, checked
            let zippedJSON = try #require(o["zipped"]?.objectValue)
            let zipped = try #require(Envelope(json: zippedJSON))
            #expect(zipped.z == "deflate-raw")
            let openedZip = try Crypto.open(key: ref.key, envelope: zipped)
            #expect(String(decoding: openedZip, as: UTF8.self) == plaintext, "\(name) zipped plaintext")
            #expect(JSONWriter.canon(try JSONReader.parse(openedZip)) == JSONWriter.canon(.object(doc)))

            // 3. sealing the same bytes under the same iv reproduces the web's ciphertext exactly
            //    (only for the uncompressed variant: two correct DEFLATE encoders need not agree)
            let iv = try #require(base64Decode(raw.iv))
            let ours = try Crypto.seal(key: ref.key, plaintext: Data(plaintext.utf8), compress: false, iv: iv)
            #expect(ours.ct == raw.ct, "\(name): our ciphertext is the web's")
            #expect(JSONWriter.stringify(.object(ours.json)) == JSONWriter.stringify(.object(raw.json)))

            // 4. what we compress, handed back for Node to open (checked by test/tools/check-swift-envelopes.mjs)
            let sealed = try Crypto.seal(key: ref.key, plaintext: Data(plaintext.utf8), compress: true)
            #expect(sealed.z == "deflate-raw")
            #expect(String(decoding: try Crypto.open(key: ref.key, envelope: sealed), as: UTF8.self) == plaintext)
            var entry = JSONObject()
            entry.set("name", name)
            entry.set("W", o.str("W"))
            entry.set("plaintext", JSString(plaintext))
            entry["env"] = .object(sealed.json)
            entry["envRaw"] = .object(try Crypto.seal(key: ref.key, plaintext: Data(plaintext.utf8), compress: false).json)
            forNode.append(.object(entry))
        }
        #expect(forNode.count >= 3)
        Fixtures.writeArtifact("swift-envelopes.json", .array(forNode))
    }

    @Test("tampering fails: the ciphertext, the iv, the compression flag, the wrong key")
    func tamperingFails() throws {
        let e = try Keys.fromWrite(Base62.randomId())
        let other = try Keys.fromWrite(Base62.randomId())
        var doc = JSONObject()
        doc.set("v", 3)
        doc.set("name", "Test")
        let env = try Crypto.seal(key: e.key, document: doc)
        #expect(env.z == "deflate-raw")
        #expect(base64Decode(env.iv)?.count == 12)

        func flip(_ s: String) -> String {
            var b = [UInt8](base64Decode(s)!)
            b[0] ^= 1
            return Data(b).base64EncodedString()
        }
        #expect(throws: (any Error).self) { try Crypto.open(key: e.key, envelope: Envelope(z: env.z, iv: env.iv, ct: flip(env.ct))) }
        #expect(throws: (any Error).self) { try Crypto.open(key: e.key, envelope: Envelope(z: env.z, iv: flip(env.iv), ct: env.ct)) }
        #expect(throws: (any Error).self) { try Crypto.open(key: e.key, envelope: Envelope(z: nil, iv: env.iv, ct: env.ct)) }
        #expect(throws: (any Error).self) { try Crypto.open(key: e.key, envelope: Envelope(z: "gzip", iv: env.iv, ct: env.ct)) }
        #expect(throws: (any Error).self) { try Crypto.open(key: other.key, envelope: env) }

        var plain = JSONObject()
        plain.set("v", 2)
        #expect(Envelope(json: plain) == nil)
        var badIv = JSONObject()
        badIv.set("v", 3); badIv.set("alg", "A256GCM"); badIv.set("iv", 1); badIv.set("ct", "x")
        #expect(Envelope(json: badIv) == nil)
        #expect(Envelope.isEnvelope(.object(env.json)))
    }

    @Test("a fresh iv per write, and the envelope's key order is the web's")
    func freshIvAndKeyOrder() throws {
        let e = try Keys.fromWrite(Base62.randomId())
        var doc = JSONObject()
        doc.set("v", 3)
        let a = try Crypto.seal(key: e.key, document: doc)
        let b = try Crypto.seal(key: e.key, document: doc)
        #expect(a.iv != b.iv)
        #expect(a.ct != b.ct)
        #expect(a.json.keys.map(\.string) == ["v", "alg", "z", "iv", "ct"])
        let raw = try Crypto.seal(key: e.key, document: doc, compress: false)
        #expect(raw.json.keys.map(\.string) == ["v", "alg", "iv", "ct"])
    }

    @Test("a year of history compresses far below the 96 KB server cap")
    func compressionKeepsListsSmall() throws {
        let e = try Keys.fromWrite(Base62.randomId())
        var doc = JSONObject()
        doc.set("v", 3)
        var history = JSONObject()
        for i in 0..<365 {
            var entries: [JSONValue] = []
            for j in 0..<5 {
                var h = JSONObject()
                h.set("id", "h\(i)\(j)")
                h.set("text", "Follow up with the structural engineer on the RFI about the slab")
                h.set("doneAt", Double(1_725_000_000_000 + i * 86_400_000 + j))
                h.set("section", "Work")
                entries.append(.object(h))
            }
            history["2025-\(String(format: "%02d", 1 + i % 12))-\(String(format: "%02d", 1 + i % 28))x\(i)"] = .array(entries)
        }
        doc["history"] = .object(history)
        let env = try Crypto.seal(key: e.key, document: doc)
        let plain = JSONWriter.stringify(.object(doc)).utf8.count
        #expect(plain > 200_000, "plain \(plain)")
        #expect(env.byteCount < 40_000, "envelope \(env.byteCount)")
        #expect(JSONWriter.canon(try JSONReader.parse(try Crypto.open(key: e.key, envelope: env)))
                == JSONWriter.canon(.object(doc)))
    }
}
