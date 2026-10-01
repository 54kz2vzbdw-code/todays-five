// WidgetStyle.swift — the kit on a widget: its palette for wherever the widget is drawn, its type, and the pieces
// every family is made of (the box, the struck line, the stamp, the ring).
//
// **Where a widget is drawn decides what colour can mean.** On the Home Screen in full colour the kit is the kit:
// its ground, its ink, its accent. In StandBy the ground is taken away and the phone is a nightstand, so the widget
// wears the device's *Night* theme on black. Tinted and clear Home Screens and the Lock Screen draw in the system's
// own monochrome (`.accented`, `.vibrant`): there the kit keeps its type and its shapes, and hierarchy is carried by
// opacity, with the box and the progress marked `widgetAccentable` so the system's tint lands on them.
import SwiftUI
import TodaysFiveCore
import WidgetKit

// ---------------------------------------------------------------- the palette

struct Palette {
    /// The ground. Clear wherever the system paints its own.
    let ink: Color, ink2: Color
    let text: Color, muted: Color, dim: Color, done: Color
    let accent: Color, accentHi: Color, accentDeep: Color, accentText: Color
    let hair: Color, hairSolid: Color
    /// What reads on a filled accent: the check inside a ticked box.
    let onAccent: Color
    /// True when the system draws in its own monochrome and colour must not carry meaning.
    let mono: Bool
    let kit: Kit

    init(kit: Kit, mode: WidgetRenderingMode = .fullColor, onBlack: Bool = false) {
        self.kit = kit
        let c = kit.colors
        if mode != .fullColor {
            // the system's tint: white at four strengths, the accent marked accentable at the call site
            mono = true
            ink = .clear; ink2 = Color.white.opacity(0.14)
            text = .white; muted = .white.opacity(0.78); dim = .white.opacity(0.58); done = .white.opacity(0.5)
            accent = .white; accentHi = .white; accentDeep = .white; accentText = .white
            hair = .white.opacity(0.22); hairSolid = .white.opacity(0.55); onAccent = .black
            return
        }
        mono = false
        let lightKit = kit.base == .light
        if onBlack && lightKit {
            // StandBy with a light theme for night: the kit's accent on black, the words in white
            ink = .clear; ink2 = Color.white.opacity(0.12)
            text = .white; muted = .white.opacity(0.78); dim = .white.opacity(0.6); done = .white.opacity(0.52)
            hair = .white.opacity(0.18); hairSolid = .white.opacity(0.5)
        } else {
            ink = onBlack ? .clear : Color(kitHex: c.ink); ink2 = Color(kitHex: c.ink2)
            text = Color(kitHex: c.text); muted = Color(kitHex: c.muted); dim = Color(kitHex: c.dim); done = Color(kitHex: c.done)
            hair = Color(kitHex: c.text).opacity(c.hairAlpha); hairSolid = Color(kitHex: c.hairSolid)
        }
        accent = Color(kitHex: c.accent); accentHi = Color(kitHex: c.accentHi); accentDeep = Color(kitHex: c.accentDeep)
        accentText = onBlack && lightKit ? Color(kitHex: c.accentHi) : Color(kitHex: c.accentText)
        onAccent = Color(kitHex: Palette.readable(on: c.accent, c.ink, c.text))
    }

    /// The bar's and the ring's paint: the kit's three accents, as its `--bar-bg` runs them.
    var sweep: LinearGradient { LinearGradient(colors: [accentDeep, accent, accentHi], startPoint: .leading, endPoint: .trailing) }

    /// WCAG contrast, to choose which of the kit's own extremes goes on a filled accent.
    static func readable(on ground: String, _ a: String, _ b: String) -> String {
        func lum(_ hex: String) -> Double {
            guard let c = Kits.rgb(hex) else { return 0 }
            func lin(_ v: Double) -> Double { v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
            return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
        }
        func ratio(_ x: String, _ y: String) -> Double { let l1 = lum(x), l2 = lum(y); return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05) }
        return ratio(ground, a) >= ratio(ground, b) ? a : b
    }
}

extension Color {
    /// `#RRGGBB`, the only way a colour is written down in this project. Anything else is grey, never a crash.
    init(kitHex hex: String) {
        guard let c = Kits.rgb(hex) else { self = Color(white: 0.5); return }
        self = Color(red: c.r, green: c.g, blue: c.b)
    }
}

// ---------------------------------------------------------------- the type

extension Kit {
    /// A task line, in the kit's task face at `size`, scaling with the text-size setting.
    func task(_ size: CGFloat, _ style: Font.TextStyle = .body) -> Font {
        guard let face = type?.task else { return .system(size: size, weight: .semibold) }
        return .custom(face.postScriptName, size: size, relativeTo: style)
    }
    /// Everything else, in the kit's ui face; `bold` takes the heavier file (weight is a file here, never a request).
    func ui(_ size: CGFloat, bold: Bool = false, _ style: Font.TextStyle = .caption) -> Font {
        guard let type else { return .system(size: size, weight: bold ? .bold : .regular) }
        return .custom((bold ? type.uiBold : type.uiRegular).postScriptName, size: size, relativeTo: style)
    }
    /// The task line's tracking in points at `size` (theme.js `ls`, in em).
    func tracking(_ size: CGFloat) -> CGFloat { CGFloat(type?.tracking ?? 0) * size }
}

// ---------------------------------------------------------------- the box

/// The kit's checkbox: a rounded square in the solid hairline, filled with the accent and ticked when done. Square in
/// the two digital materials, as on the page. Marked accentable, so a tinted Home Screen tints the boxes.
struct KitBox: View {
    let on: Bool
    let size: CGFloat
    let pal: Palette
    let mat: String

    var body: some View {
        let radius = (mat == "phosphor" || mat == "pixel") ? 0 : size * 0.26
        ZStack {
            RoundedRectangle(cornerRadius: radius, style: .continuous)
                .fill(on ? pal.accent : Color.clear)
            RoundedRectangle(cornerRadius: radius, style: .continuous)
                .strokeBorder(on ? pal.accent : pal.hairSolid, lineWidth: max(1.25, size * 0.075))
            if on {
                Tick().stroke(pal.mono ? Color.black : pal.onAccent,
                              style: StrokeStyle(lineWidth: max(1.6, size * 0.13), lineCap: .round, lineJoin: .round))
                    .padding(size * 0.24)
                    .blendMode(pal.mono ? .destinationOut : .normal)
            }
        }
        .compositingGroup()
        .frame(width: size, height: size)
        .widgetAccentable()
        .accessibilityHidden(true)
    }
}

/// The page's tick, as a path: down to the left, up to the right.
struct Tick: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.midY + r.height * 0.02))
        p.addLine(to: CGPoint(x: r.minX + r.width * 0.36, y: r.maxY - r.height * 0.06))
        p.addLine(to: CGPoint(x: r.maxX, y: r.minY + r.height * 0.08))
        return p
    }
}

/// A row that is a check-off: the box, then the label, the whole of it the target. `configuration.isOn` is the state
/// the system has already drawn for the tap, so the box ticks under the finger before the intent has run.
struct KitCheckStyle: ToggleStyle {
    let size: CGFloat
    let pal: Palette
    let mat: String

    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .center, spacing: size * 0.62) {
            KitBox(on: configuration.isOn, size: size, pal: pal, mat: mat)
            configuration.label
        }
        .contentShape(Rectangle())
    }
}

// ---------------------------------------------------------------- the struck line

/// A line's words, struck through in the accent when done — the page's ink line rather than the system's hairline
/// strikethrough, which is too thin to read at a glance. One line only: the stroke crosses the text it can see.
struct StruckText: View {
    let text: String
    let done: Bool
    let size: CGFloat
    let pal: Palette
    let kit: Kit
    var lines = 1

    var body: some View {
        Text(text)
            .font(kit.task(size))
            .tracking(kit.tracking(size))
            .foregroundStyle(done ? pal.done : pal.text)
            .lineLimit(lines)
            .truncationMode(.tail)
            .overlay(alignment: .leading) {
                if done && lines == 1 {
                    GeometryReader { g in
                        Capsule()
                            .fill(pal.mono ? Color.white.opacity(0.7) : pal.accent)
                            .frame(width: g.size.width, height: max(1.5, size * 0.075))
                            .position(x: g.size.width / 2, y: g.size.height * 0.54)
                            .widgetAccentable()
                    }
                }
            }
            .strikethrough(done && lines > 1, color: pal.accent)
            .accessibilityLabel(done ? Text("\(text), done") : Text(text))
    }
}

// ---------------------------------------------------------------- the stamp

/// The sealed stamp, as the page presses it (styles.css b401): the line's own ink, a seal's double frame, a little
/// askew, the ink a little worn — and crisp, square and unworn in the two digital materials. The words are the
/// material's: "Sealed · Wed, Sep 30", "[ sealed 2026-09-30 ]", "Sealed · stage 9-30".
struct SealStamp: View {
    let date: Date
    let size: CGFloat
    let pal: Palette
    let kit: Kit
    let mat: String
    var short = false

    /// `short` drops what a narrow widget cannot fit (the weekday, the year), never the date itself.
    static func words(_ date: Date, mat: String, short: Bool = false) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
        switch mat {
        case "phosphor":
            return short ? String(format: "[ sealed %02d-%02d ]", c.month ?? 0, c.day ?? 0)
                         : String(format: "[ sealed %04d-%02d-%02d ]", c.year ?? 0, c.month ?? 0, c.day ?? 0)
        case "pixel": return short ? "Sealed · \(c.month ?? 0)-\(c.day ?? 0)" : "Sealed · stage \(c.month ?? 0)-\(c.day ?? 0)"
        default:
            return "Sealed · " + (short ? date.formatted(.dateTime.month(.abbreviated).day())
                                        : date.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day()))
        }
    }

    var body: some View {
        let crisp = mat == "phosphor" || mat == "pixel"
        let ink = pal.accentText
        Text(Self.words(date, mat: mat, short: short).uppercased())
            .font(kit.ui(size, bold: true))
            .tracking(size * 0.2)
            .lineLimit(1)
            .fixedSize()
            .foregroundStyle(ink)
            .padding(.horizontal, size * 1.0)
            .padding(.vertical, size * 0.78)
            .overlay(RoundedRectangle(cornerRadius: crisp ? 0 : 5).strokeBorder(ink, lineWidth: max(1.5, size * 0.17)))
            .overlay(RoundedRectangle(cornerRadius: crisp ? 0 : 2.5)
                .strokeBorder(ink, style: StrokeStyle(lineWidth: 1, dash: mat == "pixel" ? [2, 2] : []))
                .padding(size * 0.38))
            .mask { if crisp { Rectangle() } else { Wear() } }
            .rotationEffect(.degrees(-4))
            .widgetAccentable()
            .accessibilityLabel(Text("Sealed"))
    }
}

/// The worn ink: a still speckle of small gaps, the same every time it is drawn (a seeded walk, not a random draw).
struct Wear: View {
    var body: some View {
        Canvas { ctx, size in
            ctx.fill(Path(CGRect(origin: .zero, size: size)), with: .color(.black))
            ctx.blendMode = .destinationOut
            var s: UInt64 = 0x9E37_79B9_7F4A_7C15
            func next() -> CGFloat { s = s &* 6_364_136_223_846_793_005 &+ 1_442_695_040_888_963_407; return CGFloat((s >> 33) % 10_000) / 10_000 }
            let n = Int(size.width * size.height / 26)
            for _ in 0..<n {
                let r = 0.35 + next() * 0.75
                let rect = CGRect(x: next() * size.width, y: next() * size.height, width: r * 2, height: r * 2)
                ctx.fill(Path(ellipseIn: rect), with: .color(.black.opacity(0.55 + next() * 0.45)))
            }
        }
    }
}

// ---------------------------------------------------------------- the ring

/// How much of today is done: a track in the hairline and the kit's sweep over it, from twelve o'clock.
struct ProgressRing: View {
    let done: Int
    let total: Int
    let width: CGFloat
    let pal: Palette

    var body: some View {
        let f = total > 0 ? CGFloat(done) / CGFloat(total) : 0
        ZStack {
            Circle().stroke(pal.hair, lineWidth: width)
            Circle()
                .trim(from: 0, to: max(f, 0.0001))
                .stroke(pal.mono ? AnyShapeStyle(Color.white)
                                 : AnyShapeStyle(AngularGradient(colors: [pal.accentDeep, pal.accent, pal.accentHi, pal.accentHi],
                                                                 center: .center, startAngle: .degrees(0), endAngle: .degrees(360 * f + 1))),
                        style: StrokeStyle(lineWidth: width, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .opacity(done == 0 ? 0 : 1)
                .widgetAccentable()
        }
    }
}

/// The kit's glow behind the words on its own ground (styles.css `--glow`): the accent, faint, from the top corner.
struct KitGround: View {
    let pal: Palette
    var body: some View {
        ZStack {
            pal.ink
            RadialGradient(colors: [pal.accent.opacity(pal.kit.base == .light ? 0.10 : 0.16), .clear],
                           center: UnitPoint(x: 0.85, y: 0), startRadius: 0, endRadius: 260)
        }
    }
}
