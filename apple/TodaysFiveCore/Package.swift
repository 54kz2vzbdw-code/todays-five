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
            plugins: [.plugin(name: "ConfigGen")]
        ),
        .executableTarget(name: "tfive", dependencies: ["TodaysFiveCore"]),
        .testTarget(name: "TodaysFiveCoreTests", dependencies: ["TodaysFiveCore"]),

        // config.js is the single source of the project URL and the publishable key: the plugin reads
        // the repo's own file at build time and emits Config.generated.swift, so neither value is ever
        // copied by hand into Swift and neither can drift.
        .plugin(name: "ConfigGen", capability: .buildTool(), dependencies: ["tfconfiggen"]),
        .executableTarget(name: "tfconfiggen")
    ],
    swiftLanguageModes: [.v6]
)
