// ConfigGen — reads the repo's config.js at build time and hands its two values to tfconfiggen,
// which writes Config.generated.swift. Nothing about the Supabase project is ever typed into Swift.
// Both values are safe to publish (config.js says so): the key can only call the three RPCs, and
// every one of them needs the exact, unguessable list id.
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
        return [
            .buildCommand(
                displayName: "Reading config.js",
                executable: try context.tool(named: "tfconfiggen").url,
                arguments: [out.path(percentEncoded: false), url, key],
                inputFiles: [configJS],
                outputFiles: [out]
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
