// The kit table, held against three different things: live theme.js, the fixture, and arithmetic.
//
// There is no `package.json`, no CI and no build step that can run `node`, so the generators
// (`test/tools/gen-kits.mjs`, `apple/tools/gen-watch-fonts.py`) are run by hand. That leaves exactly
// one hole worth worrying about: somebody edits a colour in theme.js, does not regenerate, and the
// Swift table goes on rendering last week's palette while every suite stays green. A fixture cannot
// catch that — it *is* the stale thing.
//
// So the first test evaluates **live theme.js** in a `JSContext` and asserts it reproduces the
// fixture. `JavaScriptCore` is in the macOS and iOS SDKs and **absent from watchOS**, which is
// exactly the shape we want: the check runs where the suite runs and can never be linked into
// something on a wrist. theme.js has no imports and touches `localStorage` only inside
// `applyTheme`, so stripping the `export ` keywords is the whole of the adaptation.
//
// The mapping the drift test runs is not written here. It is `expr` in the fixture — the source of
// the function `gen-kits.mjs` used — so there is one definition of "what the fixture is" rather than
// a copy in a Swift string that would have to be edited in step.
import CoreText
import Foundation
import Testing
@testable import TodaysFiveCore

#if canImport(JavaScriptCore)
import JavaScriptCore
#endif

@Suite("The kit table")
struct KitFixtureTests {

    static let fixture = Fixtures.kits
    static let fonts = Fixtures.watchFonts

    static var fixtureKits: [JSONObject] { fixture.arr("kits").compactMap(\.objectValue) }
    static var openFixtureKits: [JSONObject] { fixtureKits.filter { !$0.truthy("secret") } }

    // ---------------------------------------------------------------- 1. drift

    #if canImport(JavaScriptCore)
    @Test("live theme.js still produces the fixture, token for token")
    func noDriftFromTheSource() throws {
        let themeJS = Fixtures.repoRoot.appendingPathComponent("theme.js")
        let source = try String(contentsOf: themeJS, encoding: .utf8)
        // theme.js is a module and a JSContext runs scripts. The keywords are the only difference:
        // there are no imports, and the only DOM it touches is inside applyTheme, which nothing here
        // calls. Both halves go in one script so nothing depends on a global lexical environment
        // surviving between evaluations.
        let stripped = source.replacingOccurrences(of: "\nexport ", with: "\n")
            .replacingOccurrences(of: "^export ", with: "", options: .regularExpression)
        let expr = Self.fixture.str("expr").string
        #expect(!expr.isEmpty, "the fixture carries the mapping that produced it")

        let context = try #require(JSContext(), "a JSContext")
        var thrown: String?
        context.exceptionHandler = { _, value in thrown = value?.toString() }
        let result = context.evaluateScript(stripped + "\n;JSON.stringify(" + expr + ")")
        #expect(thrown == nil, "theme.js threw in a JSContext: \(thrown ?? "")")

        let json = try #require(result?.toString(), "JSON.stringify returned a string")
        let live = try #require((try? JSONReader.parse(Data(json.utf8)))?.objectValue,
                                "the live table parses")

        var want = JSONObject()
        want["kits"] = Self.fixture["kits"]
        want["pairs"] = Self.fixture["pairs"]

        if live != want {
            // Say which kit moved rather than dumping 21 KB of JSON at somebody.
            let liveKits = live.arr("kits").compactMap(\.objectValue)
            let wantKits = want.arr("kits").compactMap(\.objectValue)
            var moved: [String] = []
            for (i, k) in liveKits.enumerated() where i >= wantKits.count || k != wantKits[i] {
                moved.append(k.str("id").string)
            }
            if liveKits.count != wantKits.count { moved.append("count \(liveKits.count) ≠ \(wantKits.count)") }
            if live["pairs"] != want["pairs"] { moved.append("the font pairs") }
            let what = moved.joined(separator: ", ")
            Issue.record("theme.js and test/fixtures/kits.json have parted company (\(what)) — run `node test/tools/gen-kits.mjs`")
        }
        print("drift: live theme.js reproduced the fixture — \(json.utf8.count) bytes, "
            + "\(live.arr("kits").count) kits, \(live.obj("pairs").count) pairs")
    }
    #endif

    // ---------------------------------------------------------------- 2. the table

    @Test("the generated table is the fixture's 16 open kits, token for token")
    func tableMatchesFixture() throws {
        let want = Self.openFixtureKits
        #expect(want.count == 16, "16 open kits in the fixture")
        #expect(Kits.open.count == want.count, "the generated table has \(Kits.open.count)")

        for (kit, expected) in zip(Kits.open, want) {
            #expect(kit.id == expected.str("id").string, "same order as theme.js")
            let colors = expected.obj("colors")
            let got = kit.colors
            let pairs: [(String, String, String)] = [
                ("ink", got.ink, colors.str("ink").string), ("ink2", got.ink2, colors.str("ink2").string),
                ("ink3", got.ink3, colors.str("ink3").string), ("text", got.text, colors.str("text").string),
                ("muted", got.muted, colors.str("muted").string), ("dim", got.dim, colors.str("dim").string),
                ("done", got.done, colors.str("done").string), ("muted2", got.muted2, colors.str("muted2").string),
                ("dim2", got.dim2, colors.str("dim2").string), ("done2", got.done2, colors.str("done2").string),
                ("accent", got.accent, colors.str("accent").string),
                ("accentHi", got.accentHi, colors.str("accentHi").string),
                ("accentDeep", got.accentDeep, colors.str("accentDeep").string),
                ("accentText", got.accentText, colors.str("accentText").string),
                ("danger", got.danger, colors.str("danger").string),
                ("hairSolid", got.hairSolid, colors.str("hairSolid").string)
            ]
            for (token, mine, theirs) in pairs {
                #expect(mine == theirs, "\(kit.id).\(token): \(mine) ≠ \(theirs)")
            }
            #expect(kit.name == expected.str("name").string)
            #expect(kit.base.rawValue == expected.str("base").string)
            #expect(kit.lean.rawValue == expected.str("lean").string)
            #expect(kit.partner == expected.str("partner").string)
            #expect(kit.pair == expected.str("pair").string)
            #expect(kit.secret == false, "the generated table is the open kits")
            #expect(kit.confetti == expected.arr("confetti").compactMap { $0.jsString?.string })
            #expect(kit.shapes == expected.arr("shapes").compactMap { $0.finiteNumber.map(Int.init) })
            #expect(kit.finaleItalic == (colors.str("finaleStyle").string == "italic"))
            // The hairline is an alpha over --text, and only the alpha crossed. theme.js writes the
            // rgba with a bare leading dot in two kits, hence the zero.
            let rgba = colors.str("hair").string
            let tail = String(rgba.dropLast().split(separator: ",").last ?? "")
            let alpha = try #require(Double(tail.hasPrefix(".") ? "0" + tail : tail), "\(kit.id): \(rgba)")
            #expect(abs(got.hairAlpha - alpha) < 1e-9,
                    "\(kit.id).hairAlpha \(got.hairAlpha) against \(rgba)")
        }

        // The accessors, and the two invariants the picker leans on.
        #expect(Kits.day.map(\.id) == Self.fixture.arr("day").compactMap { $0.jsString?.string })
        #expect(Kits.night.map(\.id) == Self.fixture.arr("night").compactMap { $0.jsString?.string })
        #expect(Kits.day.count == 8 && Kits.night.count == 8)
        for (day, night) in zip(Kits.day, Kits.night) {
            #expect(day.partner == night.id, "\(day.id) names \(night.id)")
            #expect(night.partner == day.id, "and back")
            #expect(day.lean == .day && night.lean == .night)
        }
        #expect(Kits.defaultDay?.id == Self.fixture.obj("slotDefault").str("day").string)
        #expect(Kits.defaultNight?.id == Self.fixture.obj("slotDefault").str("night").string)
        #expect(Kits.byId("terminal")?.name == "Terminal")
        #expect(Kits.byId("nope") == nil)
        let paper = try #require(Kits.byId("paper"))
        #expect(Kits.partnerOf(paper)?.id == "midnight")
    }

    // ---------------------------------------------------------------- 3. the secret pair

    @Test("neither Secret kit is in the table, and neither is anywhere in this binary")
    func secretKitsAreAbsent() throws {
        let secretIds = Self.fixture.arr("secretIds").compactMap { $0.jsString?.string }
        #expect(secretIds.sorted() == ["birthday", "superpink"], "the fixture still names the pair")

        for id in secretIds {
            #expect(Kits.byId(id) == nil, "\(id) is not in the table")
            #expect(!Kits.open.contains { $0.id == id })
            // A kit whose partner is Secret would carry its id as a string even without the palette.
            #expect(!Kits.open.contains { $0.partner == id }, "no open kit names \(id) as its partner")
        }

        // The palettes themselves: every hex the two Secret kits carry, against every hex in the
        // table. Superpink's #FF2E9A and Birthday's #D62E86 have no business in a compiled binary,
        // and this is the assertion that says so at the level of the values rather than the ids.
        var tableHexes = Set<String>()
        for kit in Kits.open {
            tableHexes.formUnion([kit.colors.ink, kit.colors.ink2, kit.colors.ink3, kit.colors.text,
                                  kit.colors.accent, kit.colors.accentHi, kit.colors.accentDeep,
                                  kit.colors.accentText, kit.colors.hairSolid])
            tableHexes.formUnion(kit.confetti)
        }
        for kit in Self.fixtureKits where kit.truthy("secret") {
            let colors = kit.obj("colors")
            for token in ["ink", "ink2", "ink3", "accent", "accentDeep", "accentText"] {
                let hex = colors.str(token).string
                #expect(!tableHexes.contains(hex),
                        "\(kit.str("id").string).\(token) \(hex) turned up in the open table")
            }
        }

        // And the two font pairs the Secret kits use are still here, because a pair is not a secret
        // and a kit that arrives at runtime has to find its faces.
        #expect(Kits.type("fredoka") != nil && Kits.type("baloo") != nil)
        #expect(Kits.types.count == 13)
    }

    // ---------------------------------------------------------------- 4. the floors, computed here

    /// A second implementation of WCAG relative luminance and contrast, on purpose: it parses the
    /// hex itself and calls nothing in the module under test, so agreeing with theme.js means two
    /// independent programs agree rather than one program restating itself.
    static func luminance(_ hex: String) -> Double? {
        let s = Array(hex.utf8)
        guard s.count == 7, s[0] == UInt8(ascii: "#") else { return nil }
        func nibble(_ c: UInt8) -> Double? {
            switch c {
            case 0x30...0x39: return Double(c - 0x30)
            case 0x61...0x66: return Double(c - 0x61) + 10
            case 0x41...0x46: return Double(c - 0x41) + 10
            default: return nil
            }
        }
        var linear = [Double](repeating: 0, count: 3)
        for i in 0..<3 {
            guard let hi = nibble(s[1 + i * 2]), let lo = nibble(s[2 + i * 2]) else { return nil }
            let v = (hi * 16 + lo) / 255
            linear[i] = v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
    }

    static func contrast(_ a: String, _ b: String) -> Double? {
        guard let la = luminance(a), let lb = luminance(b) else { return nil }
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    @Test("every kit clears its own grounds — all 18, the Secret pair included")
    func floorsHoldOnEachKitsOwnGrounds() throws {
        // 3:1 is WCAG's floor for a colour that is not text (the strike, the filled box, the mark);
        // 4.5:1 is the floor for text. `--ink` is the page and `--ink-3` the elevated surface a
        // panel or a hovered star sits on, and a colour that only clears one of them disappears on
        // the other. Until 1.12 b216 the accent was one brand hex against four fixed grounds; now each
        // kit answers for itself, which is what this test is.
        let kits = Self.fixtureKits
        #expect(kits.count == 18, "all 18, secret included")
        var worst = (ratio: Double.infinity, label: "")
        print("kit            acc/ink   acc/ink3   aTxt/ink  aTxt/ink3   (floors 3, 3, 4.5, 4.5)")
        for kit in kits {
            let c = kit.obj("colors")
            let id = kit.str("id").string
            let checks: [(String, String, String, Double)] = [
                ("accent", "ink", c.str("accent").string, 3),
                ("accent", "ink3", c.str("accent").string, 3),
                ("accentText", "ink", c.str("accentText").string, 4.5),
                ("accentText", "ink3", c.str("accentText").string, 4.5)
            ]
            var row: [String] = []
            for (token, ground, hex, floor) in checks {
                let got = try #require(Self.contrast(hex, c.str(ground).string),
                                       "\(id).\(token) or .\(ground) is not a hex")
                #expect(got >= floor - 1e-9, "\(id): \(token) on \(ground) is \(got) — floor \(floor)")
                row.append(String(format: "%11.3f", got))
                if got / floor < worst.ratio {
                    worst = (got / floor, "\(id) \(token) on \(ground) \(String(format: "%.4f", got))"
                                        + " against a floor of \(floor)")
                }
            }
            print(id.padding(toLength: 11, withPad: " ", startingAt: 0) + row.joined())
        }
        print("tightest against its floor: \(worst.label)")
    }

    // ---------------------------------------------------------------- 5. the round trip

    @Test("every kit survives the representation it crosses in")
    func kitsRoundTripThroughJSON() throws {
        // The 16 in the table, and the 2 that are not — the Secret pair reaches a Watch through
        // exactly this codec, read out of a phone's own page in theme.js's shape and written back in
        // the narrow one.
        var checked = 0
        for kit in Kits.open {
            let back = try #require(Kit(json: kit.json), "\(kit.id) decodes")
            #expect(back == kit, "\(kit.id) round-trips")
            #expect(back.json == kit.json, "and the encoding is stable, key order included")
            checked += 1
        }
        for raw in Self.fixtureKits {
            // theme.js's own shape: `hair` as an rgba() string, `shapes` sometimes a bare number.
            let kit = try #require(Kit(json: .object(raw)), "\(raw.str("id").string) reads from theme.js's shape")
            #expect(kit.secret == raw.truthy("secret"))
            let back = try #require(Kit(json: kit.json))
            #expect(back == kit, "\(kit.id) survives theme.js → Kit → wire → Kit")
            checked += 1
        }
        #expect(checked == 34)

        // Codable, which is the other representation: `Kit` is what a picker's selection is stored as.
        let encoded = try JSONEncoder().encode(Kits.open)
        let decoded = try JSONDecoder().decode([Kit].self, from: encoded)
        #expect(decoded == Kits.open)

        // And the shapes a bad payload can take. None of them is a kit.
        #expect(Kit(json: .string("paper")) == nil)
        #expect(Kit(json: .object(JSONObject())) == nil)
        var missingAccent = Self.fixtureKits[0]
        var colors = missingAccent.obj("colors")
        colors.remove("accent")
        missingAccent.set("colors", .object(colors))
        #expect(Kit(json: .object(missingAccent)) == nil, "a kit with no accent is not a kit")
    }

    // ---------------------------------------------------------------- the type, and the files

    @Test("every pair resolves to faces that are actually in the repo")
    func fontMapPointsAtRealFiles() throws {
        let dir = Fixtures.repoRoot.appendingPathComponent("apple/TodaysFive/Fonts")
        var postScriptNames = Set<String>()
        var files = Set<String>()

        for id in Kits.types.keys.sorted() {
            let type = try #require(Kits.type(id))
            #expect(type.id == id)
            for face in [type.task] + type.ui {
                #expect(!face.postScriptName.isEmpty, "\(id): a PostScript name")
                #expect(!face.family.isEmpty, "\(id): a family")
                #expect(face.weight >= 100 && face.weight <= 900, "\(id): \(face.weight)")
                let url = dir.appendingPathComponent(face.file)
                #expect(FileManager.default.fileExists(atPath: url.path),
                        "\(face.file) is not in apple/TodaysFive/Fonts — run apple/tools/gen-watch-fonts.py")
                postScriptNames.insert(face.postScriptName)
                files.insert(face.file)
            }
            #expect(type.task.weight == Int(Self.fonts.obj("pairs").obj(id).num("w")),
                    "\(id): the task face is the weight --task-w asks for")
            #expect(type.uiRegular.weight <= type.uiBold.weight)
        }

        // Every face the app registers has to have a distinct PostScript name: CoreText refuses a
        // duplicate registration outright, and a family name is not enough to tell two instances of
        // one variable file apart.
        let faces = Self.fonts.arr("faces").compactMap(\.objectValue)
        #expect(Set(faces.map { $0.str("postScriptName").string }).count == faces.count,
                "\(faces.count) faces, \(Set(faces.map { $0.str("postScriptName").string }).count) distinct names")
        #expect(Kits.fontFiles.count == files.count)
        #expect(Kits.fontFiles == files.sorted())
        print("type: \(Kits.types.count) pairs over \(files.count) files, \(postScriptNames.count) PostScript names")

        // And the one that is easy to get wrong: theme.js's family names are not these names.
        let outfit = try #require(Kits.type("outfit"))
        #expect(outfit.task.family != "Outfit",
                "the CSS name is a fiction — if this ever passes, the map stopped being read from the files")
        #expect(Kits.byId("forest")?.type?.task.postScriptName == outfit.task.postScriptName,
                "Forest is set in the Outfit pair")
    }

    // ---------------------------------------------------------------- the glyphs a face has to have

    /// **A watch face has no tofu, it has a blank.** The corner complication sets the fraction —
    /// `3/5` — in the kit's ui-bold face, and shows `—` when no phone has named a list. Those are
    /// three kinds of character the app never asked a Watch face for before Phase 5: the solidus and
    /// the em dash are not letters, and the repo's faces are **latin subsets** cut for the web by
    /// `gen-watch-fonts.py` out of `fonts/*.woff2`. A subset that dropped `U+002F` would put a
    /// missing-glyph box on somebody's watch face, silently, on one kit only, and the first person to
    /// find out would be wearing it.
    ///
    /// So the coverage is asserted rather than assumed, and it is read **out of the files** with
    /// `CTFontManagerCreateFontDescriptorsFromURL` — the same call `WatchFaceType.facesOnDisk` uses,
    /// and deliberately not `CTFontCreateWithName`, which would answer from whatever the host machine
    /// has registered rather than from the bytes that ship.
    ///
    /// All 33 faces, not only the 13 the corner can name today: which face a kit hands the
    /// complication is a decision that has already moved once (Phase 4 chose `uiBold`), and a test
    /// that pins the answer to today's choice would go quiet exactly when the choice changes.
    @Test("every face in the repo can draw a fraction and an em dash")
    func everyFaceHasTheComplicationsGlyphs() throws {
        let dir = Fixtures.repoRoot.appendingPathComponent("apple/TodaysFive/Fonts")
        let files = try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
            .filter { $0.pathExtension.lowercased() == "ttf" }
            .sorted { $0.lastPathComponent < $1.lastPathComponent }
        #expect(files.count == Kits.fontFiles.count, "\(files.count) .ttf on disk")

        // `3/5`, `12/15`, `—`: the ten digits, the solidus, the em dash. Written out rather than
        // derived, because this list is the contract and a derivation would hide what is being
        // promised.
        let required = Array("0123456789/—")

        for url in files {
            let descriptors = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor]
            let list = try #require(descriptors, "\(url.lastPathComponent) has no descriptors")
            #expect(!list.isEmpty, "\(url.lastPathComponent) has no faces in it")
            for descriptor in list {
                let set = CTFontDescriptorCopyAttribute(descriptor, kCTFontCharacterSetAttribute)
                let characters = try #require(set as? NSCharacterSet,
                                              "\(url.lastPathComponent) declares no character set")
                let missing = required.filter { c in
                    guard let unit = c.utf16.first, c.utf16.count == 1 else { return true }
                    return !characters.characterIsMember(unit)
                }
                #expect(missing.isEmpty,
                        "\(url.lastPathComponent) is missing \(String(missing)) — the corner complication would draw a blank box on that kit")
            }
        }
        print("type: \(files.count) faces, all of them carry 0-9, U+002F and U+2014")
    }
}
