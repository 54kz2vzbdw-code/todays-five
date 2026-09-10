// swift-tools-version: 6.0
// w1probe — VERIFIER W1's own instrument: drives TodaysFiveCore at 7341981 (the verify-b worktree).
import PackageDescription
let package = Package(
    name: "w1probe",
    platforms: [.macOS(.v14)],
    dependencies: [.package(path: "/Users/pricebrannen/Today's Five/todays-five-review-verify-b/apple/TodaysFiveCore")],
    targets: [.executableTarget(name: "w1probe", dependencies: [.product(name: "TodaysFiveCore", package: "TodaysFiveCore")])],
    swiftLanguageModes: [.v6]
)
