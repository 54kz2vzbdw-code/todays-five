// swift-tools-version: 6.0
// tfprobe — a read-only instrument for the Watch review: runs the real TodaysFiveCore against four
// questions (SyncEngine.current() after an empty open; rollover vs WatchSnapshot.afterRollover; the
// clock-skew stamp; the complication timeline's reload). Prints counts only, never an id.
import PackageDescription
let package = Package(
    name: "tfprobe",
    platforms: [.macOS(.v14)],
    dependencies: [.package(path: "/Users/pricebrannen/Today's Five/todays-five-review-watch/apple/TodaysFiveCore")],
    targets: [.executableTarget(name: "tfprobe", dependencies: [.product(name: "TodaysFiveCore", package: "TodaysFiveCore")])],
    swiftLanguageModes: [.v6]
)
