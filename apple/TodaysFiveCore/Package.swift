// swift-tools-version: 6.0
// TodaysFiveCore — the Swift core of Today's Five: links, keys, the v3 envelope, the document,
// merge and rollover, the three RPCs, a local store and a sync loop. No third-party dependencies:
// Foundation, CryptoKit, Compression and the toolchain's own Testing. COMPATIBILITY.md is the contract.
import PackageDescription

let package = Package(
    name: "TodaysFiveCore",
    platforms: [.iOS(.v17), .watchOS(.v10), .macOS(.v14)],
    products: [
        .library(name: "TodaysFiveCore", targets: ["TodaysFiveCore"]),
        .executable(name: "tfive", targets: ["tfive"])
    ],
    targets: [
        .target(
            name: "TodaysFiveCore",
            plugins: [.plugin(name: "ConfigGen"), .plugin(name: "KitsGen")]
        ),
        .executableTarget(name: "tfive", dependencies: ["TodaysFiveCore"]),
        .testTarget(name: "TodaysFiveCoreTests", dependencies: ["TodaysFiveCore"]),

        // config.js is the single source of the project URL and the publishable key: the plugin reads
        // the repo's own file at build time and emits Config.generated.swift, so neither value is ever
        // copied by hand into Swift and neither can drift.
        .plugin(name: "ConfigGen", capability: .buildTool()),

        // The same arrangement for the kit table: test/fixtures/kits.json and
        // test/fixtures/watch-fonts.json in, Kits.generated.swift out, the two Secret kits dropped on
        // the way. Both plugins are prebuild commands, which is what lets two of them sit on one
        // target — a prebuild hands over a directory to glob rather than promising a file, so the
        // "Multiple commands produce…" collision that forced the first one cannot arise for the
        // second either. Verified against both an iOS and a watchOS build, not assumed.
        .plugin(name: "KitsGen", capability: .buildTool())
    ],
    swiftLanguageModes: [.v6]
)
