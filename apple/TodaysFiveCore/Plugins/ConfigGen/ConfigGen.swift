// ConfigGen — reads the repo's config.js at build time and writes Config.generated.swift.
// Nothing about the Supabase project is ever typed into Swift. Both values are safe to publish
// (config.js says so): the key can only call the three RPCs, and every one of them needs the exact,
// unguessable list id.
//
// It is a **prebuild** command over `/bin/sh`, and both halves of that are forced (Phase 3):
//
//   * A *build* command declares the file it produces, and the plugin work directory is keyed by
//     package, target and plugin — not by platform. The moment two targets in one project depend on
//     this package (the iPhone app and the Watch app both do), one build plans the same producer
//     twice and the build system refuses outright:
//     "Multiple commands produce …/ConfigGen/Config.generated.swift".
//     A prebuild command hands over a *directory* the build system globs, so the collision cannot
//     arise. Measured, not read: PLAN-apple-phase3.md records the failing build.
//   * A prebuild command "cannot use executables built from source", which is the build system's own
//     words about `tfconfiggen`. So the writer is `/bin/sh`, and `tfconfiggen` is gone.
import Foundation
import PackagePlugin

@main
struct ConfigGen: BuildToolPlugin {
    func createBuildCommands(context: PluginContext, target: Target) throws -> [Command] {
        // apple/TodaysFiveCore → apple → the repo root, where config.js lives beside app.js
        let repo = context.package.directoryURL
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let configJS = repo.appending(path: "config.js")

        let source = (try? String(contentsOf: configJS, encoding: .utf8)) ?? ""
        let url = Self.field("url", in: source)
        let key = Self.field("key", in: source)

        let out = context.pluginWorkDirectoryURL.appending(path: "Config.generated.swift")
        // $1 the file, $2 the url, $3 the key — passed as arguments rather than interpolated into
        // the script, so a value can never become shell.
        let script = """
        mkdir -p "$(dirname "$1")"
        cat > "$1" <<EOF
        // Generated from the repo's config.js at build time by the ConfigGen plugin. Do not edit.
        public enum GeneratedConfig {
            public static let url = "$2"
            public static let key = "$3"
        }
        EOF
        """
        return [
            .prebuildCommand(
                displayName: "Reading config.js",
                executable: URL(fileURLWithPath: "/bin/sh"),
                arguments: ["-c", script, "config-gen", out.path(percentEncoded: false), url, key],
                outputFilesDirectory: context.pluginWorkDirectoryURL
            )
        ]
    }

    /// `name: "value"` or `name: 'value'` out of the config.js object literal. Empty when absent,
    /// which is config.js's own "local-only mode" and stays a valid state here.
    static func field(_ name: String, in source: String) -> String {
        guard let r = try? Regex("\(name)\\s*:\\s*[\"']([^\"']*)[\"']"),
              let m = try? r.firstMatch(in: source),
              let v = m.output[1].substring
        else { return "" }
        return String(v)
    }
}
