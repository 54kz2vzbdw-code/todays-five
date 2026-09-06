// tfconfiggen — writes Config.generated.swift from the two values ConfigGen read out of config.js.
// Arguments: <output path> <url> <key>.
import Foundation

let args = CommandLine.arguments
guard args.count >= 2 else {
    FileHandle.standardError.write(Data("tfconfiggen: <out> <url> <key>\n".utf8))
    exit(2)
}
let out = args[1]
let url = args.count > 2 ? args[2] : ""
let key = args.count > 3 ? args[3] : ""

func quoted(_ s: String) -> String {
    "\"" + s.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"") + "\""
}

let source = """
// Generated from the repo's config.js at build time by the ConfigGen plugin. Do not edit.
public enum GeneratedConfig {
    public static let url = \(quoted(url))
    public static let key = \(quoted(key))
}

"""

try? FileManager.default.createDirectory(
    at: URL(fileURLWithPath: out).deletingLastPathComponent(), withIntermediateDirectories: true)
try source.write(toFile: out, atomically: true, encoding: .utf8)
