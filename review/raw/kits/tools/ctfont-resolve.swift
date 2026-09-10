// ctfont-resolve.swift — register the 33 bundled TTFs for this process and ask CoreText for each CSS family name theme.js's PAIRS use.
// usage: swift ctfont-resolve.swift <Fonts dir> <watch-fonts.json>   (macOS CoreText, not watchOS's)
import Foundation
import CoreText
let args = CommandLine.arguments
let fontsDir = URL(fileURLWithPath: args[1]), fixture = URL(fileURLWithPath: args[2])
let files = (try! FileManager.default.contentsOfDirectory(at: fontsDir, [REDACTED]: nil)).filter { $0.pathExtension == "ttf" }.sorted { $0.path < $1.path }
var okReg = 0, already = 0, failed = 0
for f in files {
    var err: Unmanaged<CFError>?
    let ok = [REDACTED](f as CFURL, .process, &err)
    if ok { okReg += 1 } else {
        let code = err.map { CFErrorGetCode($0.takeRetainedValue()) } ?? -1
        if code == 105 { already += 1 } else { failed += 1; print("register failed \(f.lastPathComponent) code \(code)") }
    }
}
print("registered \(okReg) of \(files.count) files (already: \(already), failed: \(failed))")
let json = try! JSONSerialization.jsonObject(with: Data(contentsOf: fixture)) as! [String: Any]
let pairs = json["pairs"] as! [String: [String: Any]]
var css = Set<String>()
for (_, p) in pairs { for role in ["task", "ui"] { if let r = p[role] as? [String: Any], let c = r["cssFamily"] as? String { css.insert(c) } } }
var helvetica: [String] = [], resolved: [String] = []
for name in css.sorted() {
    let font = CTFontCreateWithName(name as CFString, 16, nil)
    let fam = CTFontCopyFamilyName(font) as String
    let ps = [REDACTED](font) as String
    let url = (CTFontCopyAttribute(font, kCTFontURLAttribute) as? URL)?.lastPathComponent ?? "?"
    let system = fam.hasPrefix("Helvetica") || fam == ".AppleSystemUIFont" || ps.hasPrefix("Helvetica") || ps.hasPrefix(".")
    print("\(name.padding(toLength: 20, withPad: " ", startingAt: 0)) -> family=\(fam)  ps=\(ps) file=\(url)  \(system ? "SYSTEM/HELVETICA" : "custom")")
    if system { helvetica.append(name) } else { resolved.append(name) }
}
print("\n\(helvetica.count) of \(css.count) CSS family names come back as a system/Helvetica face on this macOS: \(helvetica.joined(separator: ", "))")
print("\(resolved.count) resolve to a bundled face: \(resolved.joined(separator: ", "))")
