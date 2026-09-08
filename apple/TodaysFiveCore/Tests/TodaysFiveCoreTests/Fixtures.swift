// The fixtures the web wrote. They live in the repo, not in a resource bundle, because they are the
// shared contract: test/fixtures/vectors.json is read by test/crypto.test.js as well, so neither
// suite can drift from the other. Regenerate with `node test/tools/gen-vectors.mjs`.
import Foundation
@testable import TodaysFiveCore

enum Fixtures {
    /// <repo>/ — five levels up from Tests/TodaysFiveCoreTests/Fixtures.swift.
    static let repoRoot: URL = {
        var u = URL(fileURLWithPath: #filePath)
        for _ in 0..<5 { u.deleteLastPathComponent() }
        return u
    }()

    static func load(_ relativePath: String) -> JSONObject {
        let url = repoRoot.appendingPathComponent(relativePath)
        guard let data = try? Data(contentsOf: url) else {
            fatalError("missing fixture \(relativePath) at \(url.path) — run its generator in test/tools/")
        }
        guard let o = (try? JSONReader.parse(data))?.objectValue else {
            fatalError("fixture \(relativePath) is not a JSON object")
        }
        return o
    }

    static let vectors: JSONObject = load("test/fixtures/vectors.json")

    /// The kit table and the Watch's font map — the two the KitsGen plugin reads at build time, read
    /// here again so a test can hold the generated Swift against them. Regenerate with
    /// `node test/tools/gen-kits.mjs` and `python3 apple/tools/gen-watch-fonts.py`.
    static let kits: JSONObject = load("test/fixtures/kits.json")
    static let watchFonts: JSONObject = load("test/fixtures/watch-fonts.json")

    /// Where the Swift suite leaves artefacts for a Node script to check (the other direction of the
    /// envelope round trip). Git-ignored; created on demand.
    static let artifacts: URL = {
        let u = repoRoot.appendingPathComponent("apple/TodaysFiveCore/.artifacts")
        try? FileManager.default.createDirectory(at: u, withIntermediateDirectories: true)
        return u
    }()

    static func writeArtifact(_ name: String, _ value: JSONValue) {
        let text = JSONWriter.pretty(value) + "\n"
        try? text.write(to: artifacts.appendingPathComponent(name), atomically: true, encoding: .utf8)
    }
}
