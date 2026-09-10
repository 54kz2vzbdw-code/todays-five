// Complications.swift — the widget bundle and the four accessory families.
//
// There are exactly four `WidgetFamily` cases on watchOS — `.accessoryCircular`,
// `.accessoryRectangular`, `.accessoryCorner`, `.accessoryInline` — and every `system*` case is
// explicitly unavailable. All four are here, plus an Add complication that is a button rather than a
// reading.
//
// | family        | what it shows                                                        |
// | circular      | the count, with the accent ring                                       |
// | rectangular   | the next unfinished line — **opt-in**, off by default                 |
// | corner        | the **fraction**, with a curved **text** label along the bezel        |
// | inline        | `3/5` and nothing else                                                |
//
// ============================================================================================
// PHASE 5: WHAT A REAL WRIST SAID, AND WHAT THE CODE SAID BACK
// ============================================================================================
//
// The finding, off a real Apple Watch, bottom-left corner slot: the complication reads as **"a 1 and
// a dot on a line"**. That is not a mystery, it is a reading. The `.accessoryCorner` arm was
// `Text("\(snapshot.done)")` — the **done count alone, no denominator** — with a `Gauge` in
// `.widgetLabel`, which the host draws as an arc along the bezel. A bare digit beside a mark that is
// not a reading is what that code asks for, so this one was diagnosable by reading and only the
// replacement needs a face.
//
// **How thick and how long that arc is drawn, nothing here measured.** An earlier draft of this
// comment said "a three-point arc" and a review was right to call that invented: the arc is the
// widget host's compositing, and Phase 4 established that the host's compositing is invisible to
// every instrument this project has. The diagnosis does not need the number and no longer carries it.
//
// **What replaced it, and the numbers the choice rests on.**
//
//   * the content slot gets the **fraction**. `3/5` is three characters where `3` was one, and the
//     three carry the whole glance: a bare `1` on a corner says nothing at all, because the corner —
//     unlike the circular family — has no ring around it to be the denominator;
//   * the bezel label becomes **`Text`** rather than a `Gauge`. A curved word is a reading and a mark
//     is not, which is the same argument as above and is all it rests on;
//   * the finished-list **check** is kept, and is the one case where a glyph replaces the fraction
//     rather than sitting beside it. There is no room for both — see the widths below.
//
// Measured on this machine with `fontTools` over the thirteen **ui-bold** faces the snapshot can name
// (`kit.type?.uiBold`, which is what `WatchApp.swift` publishes as `face`): every one of the thirteen
// carries the ten digits, `U+002F` and `U+2014`, so neither the fraction nor the no-list em dash can
// tofu on any kit. Advance widths, in ems:
//
// | | narrowest | widest |
// | `3` | 0.527 (JosefinSans-Thin-700) | 0.625 (ArchivoSemiBold-Regular-800) |
// | `3/5` | 1.458 (SourceSerif4-Regular-600) | **1.800** (IBMPlexMono-SemiBold) |
// | `12/15` | 2.210 | **3.000** |
//
// So `3/5` costs about 2.7× the width of the bare digit it replaces, and at **17 pt** the widest face
// draws it in **30.6 pt** — which is why 17 is the number here rather than the 22 that was there.
// `minimumScaleFactor(0.5)` covers the two-digit list: `12/15` at 17 pt wants 51 pt and scales into a
// 32 pt square. Rendered after the repair, on the **system-fallback** path — the one that used to be
// the unmeasured one — in a 32 pt square: `3/5` inks **26.5 pt** wide, `12/15` inks **30.2 pt** with
// the scale floor doing the last of the work, and `—` inks **17.0 pt**. All three draw inside the
// slot, in this machine's SF Pro Rounded, which is not the face a watch substitutes.
//
// **Since the review, 17 is the number on both paths, and it was not before.** `FaceType.count` used
// to drop the `size:` it was handed whenever the face did not resolve and draw at the text style's
// own size instead — so the path the sweep described was the *custom face* path, and the **default**
// path (a host that refuses the face, or a snapshot from a build older than `face`, where `face` is
// `""` and `resolves("")` is false) drew the fraction at a size nothing had measured. It did not
// overflow — the 0.5 floor covers a lot — but a number presented as the one that makes the corner fit
// has to be the number the corner actually uses. Both paths now take `size`.
//
// **Every size in this file is a point value the wearer's Text Size scales.** `.custom(_:size:)` and
// `.system(size:)` are both *fixed*-size fonts, and `Font` has no `.system(size:relativeTo:)`, so the
// scaling is done once, in the view, with `@ScaledMetric` — the measured points at the default Text
// Size, growing the way the text style beside each one grows. The two exceptions are named rather
// than overlooked: the **SF Symbols** (the check, the plus) stay at fixed points, because an `Image`
// has no `minimumScaleFactor` to catch it if it grows past a slot a few points wide; and whether the
// **widget host hands a complication the wearer's Text Size at all** is not observable here — if it
// does not, every size in this file is the measured point value and nothing is worse than before.
// The round's earlier draft of the rectangular family had a fixed 13 pt and a fixed 12 pt with no
// relative style at all, which a review caught: a line and a list name that could not grow while the
// count beside them did, and the line is the part of that family a low-vision wearer most needs to be
// able to grow.
//
// **The instrument, and what it cannot see.** The renderings behind the sizes are `ImageRenderer` on
// macOS over a *transcription* of these view bodies, in a throwaway package under `/tmp`, outside the
// repository — the only way to look at pixels this round had, since `simctl` cannot tap a watch
// simulator, driving the Simulator app was requested and declined, and no real Watch is reachable
// from this machine. It shows what **the app's own layer** draws: how many ink bands a body produces,
// how tall each band is, where a line truncates, when `minimumScaleFactor` starts eating the type.
// Four blind spots, each of which changed something written here:
//
//   * it shows **nothing the widget host does** — not the bezel label, not `.accented` flattening,
//     not the real slot rectangle, and not whether the host permits a custom face at render time;
//   * an accessory `Gauge` style **draws nothing at all** outside a widget context (the note below
//     records the Watch app finding the same thing in Phase 3), so the circular family's ring is in
//     none of this round's pictures;
//   * **it cannot see Dynamic Type at all.** Measured: `Text("Hxy").font(.system(.body))` and a
//     `@ScaledMetric` 13 pt both draw an 11.75 pt glyph band at every `DynamicTypeSize` from `.large`
//     to `.accessibility5`, because macOS has no Dynamic Type to set. So the claim that this file's
//     sizes now grow with the wearer is an **API contract, not a measurement**, and it is on the
//     round's unverified list with a pass and a fail;
//   * `design: .rounded` is **SF Pro Rounded** on this machine and **SF Compact Rounded** on a watch,
//     which are different widths — measured off `/System/Library/Fonts/SFCompactRounded.ttf`: a
//     34-character line is 194.6 pt in the first and 185.6 pt in the second at 13 pt, so the watch
//     fits about 5% more. Every character count in this file is therefore a **model** of what the
//     wrist will show, in a face the wrist does not use, and is written as such.
//
// **And one number this round could not reconcile.** `apple/PLAN-apple-phase5.md` §3 gives
// `.accessoryRectangular` as "~72 × 32 pt, three short lines"; the sweep behind the note at
// `NextLineView` used 140×38, 160×44 and 176×50, which is this file's bracket and not Apple's figure.
// They cannot both be right and nothing here can settle which: the one measurement available is that
// the booted Series 11 46 mm's screen is **416×496 px, i.e. 208×248 pt** (a `simctl io screenshot`,
// which is the one thing `simctl` will do to a watch), so 72 pt would be 35% of the screen's width
// and 176 pt would be 85%. At 13 pt, 72 pt of width holds about **ten characters** of a line and 176
// pt holds about **26**; if the plan's figure is the real one then the opt-in line is two words and
// the character counts below are all wrong. It is on the unverified list, and it is the only item
// there that a screenshot of a face would settle in one look.
//
// **On the gauge style.** `.accessoryCircularCapacity` draws a *ring* around a value in the middle;
// `.accessoryCircular` draws a dial with a needle and tick marks, which is a speedometer and not a
// progress ring. Capacity is what this uses: three of five done is a proportion filled, not a
// position on a scale.
//
// Both were put side by side in the Watch app under a throwaway launch argument to be looked at
// rather than reasoned about, and **neither rendered anything at all**: an accessory gauge style is
// for a widget context and draws nothing inside an ordinary app view. So the choice above rests on
// the two styles' contracts, and the only thing that can settle the *look* is a face editor — which
// needs a tap, and `simctl` cannot tap a watch simulator. That is a verification item, written down
// rather than claimed.
//
// The extension reads `WatchSnapshot` from the App Group and **never a link**. It does not depend on
// `TodaysFiveCore`.
//
// ============================================================================================
// THE KIT'S ACCENT CANNOT REACH THE FACE. THIS IS THE PARAGRAPH THAT SAYS SO.
// ============================================================================================
//
// **What was asked.** Phase 4 gave the Watch eighteen kits, each with its own accent — Terminal's
// `#4AF07A`, Paper's `#C8321F`, Dark's `#A86014` — and asked that the complication follow the kit
// the way every other surface now does.
//
// **What the SDK does.** It cannot. `WidgetRenderingMode.accented` — the mode every watchOS
// complication is drawn in on the great majority of faces — says in its own words that the system
// "treats the widget's views as if they were template images. It replaces the view's color —
// rendering the new colors while preserving the view's alpha channel." The colour that replaces it
// is the one the wearer chose in the **face editor**, not the one the app chose. The escape hatch
// that exists on the phone, `WidgetAccentedRenderingMode.fullColor`, is documented in one sentence:
// "Only applies to iOS." There is no watchOS equivalent, no opt-out, and no entitlement.
//
// The alpha channel surviving is the whole of what an app gets to say. A view's *shape* crosses. Its
// *colour* does not. `.widgetAccentable()` does not add a colour either — it moves a subview from
// the face's neutral group into the face's accent group, both of which are the face's.
//
// **This was observed rather than taken on trust, and the observation is itself worth having.**
// `-TFFaceProbe` in the Watch app renders a filled rectangle in a kit's accent through
// `ImageRenderer` twice, once at `.fullColor` and once at `.accented`, and reads the pixels back.
// The two renderings come out **byte-identical**: SwiftUI does not flatten anything, which means the
// flattening is done by the widget host at composite time and is therefore not reachable, not
// overridable, and not visible to any test that does not involve a watch face and a finger. The
// probe's value is in ruling out the cheerful hypothesis — that `.accented` is a SwiftUI-side
// treatment an app could see coming and compensate for. It is not.
//
// **What was built instead.** Everything a kit *can* change on a face, which is more than nothing:
//
// | the **type**            | the count is set in the kit's own ui face, by PostScript name           |
// | **gauge or text**       | a monospaced pair gets the numbers; every other pair gets the ring      |
// | the **glyph**           | finished / unfinished, and the type it is set in                        |
// | **`.widgetAccentable`** | which subview joins the face's accent group — see the note at `CountView` |
//
// And the theme reaches all four through `WatchSnapshot`, additively, with `v` left at 1. See that
// file for why that is the compatibility rule rather than a shortcut past it.
//
// **A per-kit glyph was considered and rejected.** It would need an id-to-symbol table inside the
// appex — eighteen rows of design decision with nothing generating it, nothing checking it, and
// nothing to notice when a nineteenth kit is added. The extension does not link `TodaysFiveCore` and
// must not grow a hand-written copy of a table that lives somewhere else. `pair` is the one
// kit-shaped input it can act on without one, so `pair` is what drives the one structural choice.
import SwiftUI
import WidgetKit

// ------------------------------------------------------- what the families read off the snapshot

/// **A fraction needs a denominator that says something, and `0/0` does not.** Three of the four
/// families draw `WatchSnapshot.fraction`, and a review found the one state where that string is not
/// a reading: a list that exists and has nothing on it — `hasList` true, `total` 0 — put **`0/0`** on
/// the corner under a bezel reading *Nothing today*. The whole premise of replacing the corner's bare
/// digit was that a number with no denominator carries nothing; a denominator of zero carries nothing
/// either, and it is the state a brand-new list sits in before its first line.
///
/// So the em dash covers both of the states that have no fraction to show, and the **bezel** is what
/// tells them apart: *Today's Five* when no phone has named a list, *Nothing today* when one has and
/// the day is empty.
///
/// The circular family keeps `0` in an empty ring for the same state, on purpose and not by omission:
/// there the ring **is** the denominator, so an unfilled ring around a `0` is already the whole
/// sentence. It is the families that spell the denominator out that need this.
///
/// It lives here rather than in `WatchSnapshot.swift` because it is a reading, not a wire format —
/// that file's job is what two builds have to agree about, and this is what one extension chose to
/// draw. `fileprivate` keeps it to this file, where both views are.
fileprivate extension WatchSnapshot {
    var glance: String { hasList && total > 0 ? fraction : "—" }
}

// ---------------------------------------------------------------- the kit's type, in the appex

/// The face the count is set in. See `WatchFaceType` in `WatchSnapshot.swift` for the mechanism —
/// short version: the appex is *inside* the Watch app's bundle, so the app's 33 `.ttf` are two
/// directories up, and registering them for the process costs no copy and no build entry.
///
/// **It falls back to the system face without complaining**, which is deliberate: the last link —
/// the widget host actually permitting this at render time — could not be observed on a simulator
/// that cannot be tapped, so the failure mode had to be a complication that looks the way it did in
/// Phase 3 rather than one that does not draw.
///
/// **Phase 5 did not settle it either, and here is how a wrist can, by looking.** Put the count
/// complication on a face with the Watch on the **Terminal** kit. Terminal's ui-bold face is
/// `IBMPlexMono-SemiBold`: squared-off, monospaced, `3` and `5` the same width, a straight-cut
/// terminal on every stroke.
///
///   * **pass** — the fraction is set in that face: the two digits are the same width and the shapes
///     are mechanical;
///   * **fail** — the fraction is set in the system's rounded face: the `3` is visibly narrower than
///     the `5` and the strokes end round.
///
/// The two are told apart at a glance and neither is a crash, which is the point of the fallback: if
/// the host refuses the face, the complication still draws, in the face Phase 3 shipped.
///
/// Nothing in this extension traces. `WatchDiagnostics` lives in the Watch app's target and a widget
/// rendering is a different process with a different lifetime, so a failure here leaves no line
/// anywhere — a face is the only instrument, and it is the wearer's eyes.
enum FaceType {
    /// Once per process. A widget rendering is short; a `static let` is exactly its lifetime.
    private static let registered = WatchFaceType.register()

    /// `size` is points, and it is **already scaled** — the caller holds a `@ScaledMetric` so that
    /// the kit's face and the system fallback grow by the same ratio. Before the Phase 5 review this
    /// took a `relativeTo:` style as well and the fallback used the style *instead of* the size,
    /// which meant the default path — a host that refuses the face, or `face == ""` from a build
    /// older than Phase 4 — drew at a size nothing had measured. One number, both paths, now.
    static func count(_ snapshot: WatchSnapshot, size: CGFloat) -> Font {
        _ = registered
        guard WatchFaceType.resolves(snapshot.face) else {
            return .system(size: size, weight: .semibold, design: .rounded)
        }
        return .custom(snapshot.face, size: size)
    }

    /// `theme.js`'s two monospaced kits — Terminal and Teletype — share one pair, and on a face a
    /// monospaced pair's whole identity is that it sets numbers in a grid. So those two get the
    /// **numbers** where every other kit gets the ring.
    ///
    /// Worth naming as a choice rather than a derivation: nothing in the SDK says a mono kit should
    /// prefer text, and a ring is the better glance for most people most of the time. This is the
    /// one structural thing a kit can change on a face at all, and spending it on the pair that
    /// most wants it is more interesting than spending it on nothing.
    static func prefersNumbers(_ snapshot: WatchSnapshot) -> Bool { snapshot.pair == "mono" }
}

@main
struct TodaysFiveComplications: WidgetBundle {
    var body: some Widget {
        CountComplication()
        NextLineComplication()
        AddComplication()
    }
}

// ---------------------------------------------------------------- the count

struct CountComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TodaysFiveCount", provider: CountProvider()) { entry in
            CountView(entry: entry)
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        }
        .configurationDisplayName("Today's Five")
        .description("How much of Today is done.")
        .supportedFamilies([.accessoryCircular, .accessoryCorner, .accessoryInline])
    }
}

struct CountView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SnapshotEntry

    /// The measured points, at the default Text Size, growing with the style each one sits beside.
    /// See the note on sizes at the top of the file — including the part about what cannot see them.
    @ScaledMetric(relativeTo: .title3) private var fractionSize: CGFloat = 17
    @ScaledMetric(relativeTo: .title2) private var monoDoneSize: CGFloat = 20
    @ScaledMetric(relativeTo: .caption) private var monoTotalSize: CGFloat = 13

    private var snapshot: WatchSnapshot { entry.snapshot }

    /// **Which subview carries `.widgetAccentable()` is the only colour lever an app has on a
    /// watch face, and it is not a colour.** It moves a view from the face's neutral group into the
    /// face's *accent* group — two groups, both of them the wearer's. The rule here is the same on
    /// every family and is about meaning rather than about looks: **the count is accented, and
    /// anybody's words are not.** A number the wearer chose to put on their face should read as the
    /// thing they put there; a line lifted off their list should sit quietly in the neutral group,
    /// the same way it is opt-in in the first place.
    var body: some View {
        switch family {
        case .accessoryInline:
            // `3/5` and nothing else. Inline is one line of text beside the time; anything more is
            // truncated by the face, not by us. Inline ignores fonts as well as colours — it is the
            // one family the kit cannot reach at all, and that is the SDK's doing, not ours. No font
            // is asked for here on purpose: asking and being ignored is worse than not asking,
            // because it reads like a bug in this file rather than a limit of the platform.
            Text(snapshot.glance)

        case .accessoryCorner:
            corner

        default:
            circular
        }
    }

    // ---------------------------------------------------------------- the corner

    /// A tiny content area plus a curved bezel label, and the two carry different things: the
    /// **numbers** go in the content slot, where they are read up close, and **words** go on the
    /// curve, where they are read at a glance.
    @ViewBuilder
    private var corner: some View {
        Group {
            if finished {
                // The one case where a glyph replaces the fraction instead of joining it. `5/5` and
                // a check say the same thing twice and the corner has room for one of them; the
                // check is the one that reads without being read.
                Image(systemName: "checkmark")
                    .font(.system(size: 15, weight: .semibold))
            } else {
                Text(snapshot.glance)
                    .font(FaceType.count(snapshot, size: fractionSize))
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
            }
        }
        .widgetAccentable()
        .widgetLabel { Text(verbatim: cornerLabel) }
    }

    /// **What the bezel says, and why it is never the list's name.**
    ///
    /// The corner label is drawn along the outside of the watch face. It is on screen whenever the
    /// face is, with **no opt-in in front of it**, and it is read by whoever is standing next to the
    /// wearer. (An earlier draft of this paragraph also called it "the largest type of anything this
    /// extension draws". Nothing here measured the bezel label — the comment below says plainly that
    /// I have never seen one drawn — so the sentence is gone and the size question is on the round's
    /// unverified list. The privacy argument never needed it.) The rectangular family puts a line of
    /// somebody's list on a face
    /// only behind an explicit opt-in, for exactly that reason (`ComplicationsIntent.swift`) — and a
    /// label with **no** opt-in at all should therefore hold strictly less, not more.
    ///
    /// So: counts, in this file's own words, and nothing that came off anybody's list. Not the
    /// nickname, not the document's name, not a line. The phrases are short because the label is a
    /// curve — `NextLineView` keeps the longer form of the same sentence, where there is room for it.
    private var cornerLabel: String {
        guard snapshot.hasList else { return "Today's Five" }
        guard snapshot.total > 0 else { return "Nothing today" }
        guard snapshot.done < snapshot.total else { return "All done" }
        return "\(snapshot.total - snapshot.done) to go"
    }

    // ---------------------------------------------------------------- the circular one

    /// A round slot: a ring, and about two characters inside it. Unchanged in shape from Phase 4 —
    /// the ring **is** the denominator here, which is why a bare `done` is right in the middle of it
    /// and wrong in a corner. The one thing that moved is the no-list reading: see below.
    @ViewBuilder
    private var circular: some View {
        if FaceType.prefersNumbers(snapshot) {
            // The mono kits: the numbers, in their own face, and no ring. See
            // `FaceType.prefersNumbers`.
            VStack(spacing: -2) {
                Text(count)
                    .font(FaceType.count(snapshot, size: monoDoneSize))
                    .widgetAccentable()
                if snapshot.hasList {
                    Text("\(snapshot.total)")
                        .font(FaceType.count(snapshot, size: monoTotalSize))
                        .opacity(0.7)
                }
            }
            .minimumScaleFactor(0.6)
            .lineLimit(1)
        } else {
            Gauge(value: fraction) {
                Text("Today")
            } currentValueLabel: {
                // The glyph, and the one place it changes: a finished list puts a check in the
                // middle of a full ring rather than the number the ring is already saying. Not
                // per-kit — see the note about the rejected id-to-symbol table at the top — but
                // the count beside it is, because it is set in the kit's face.
                Group {
                    if finished {
                        Image(systemName: "checkmark")
                            .font(.system(size: 15, weight: .semibold))
                    } else {
                        Text(count)
                            .font(FaceType.count(snapshot, size: fractionSize))
                    }
                }
                .widgetAccentable()
            }
            .gaugeStyle(.accessoryCircularCapacity)
        }
    }

    /// **`0` and `—` are different sentences and the face used to say the first when it meant the
    /// second.** With no list the snapshot's `done` is 0, so an empty ring around a `0` read as
    /// "you have finished none of today" when what it actually meant was "no phone has named a list
    /// yet". `WatchSnapshot` keeps `hasList` separate from an empty list precisely so the two can be
    /// told apart, and until now only the inline family used it. The em dash is in all thirteen
    /// ui-bold faces — measured, not assumed.
    ///
    /// **Found by reading, not by a picture**, and the round's first write-up said otherwise. It is a
    /// one-line `hasList` omission, and the view it lives in is the one view no instrument here ever
    /// drew: an accessory `Gauge` style renders nothing outside a widget context. Only the
    /// rectangular defect came off pixels.
    private var count: String { snapshot.hasList ? "\(snapshot.done)" : "—" }

    /// Finished, and not merely empty. `total == 0` is a day with nothing on it, which is not the
    /// same thing and does not get the check.
    private var finished: Bool { snapshot.hasList && snapshot.total > 0 && snapshot.done >= snapshot.total }

    /// Nothing on Today is an empty ring rather than a full one: a list with no lines is not a list
    /// that is finished, and the difference is the whole point of the glance.
    private var fraction: Double {
        guard snapshot.hasList, snapshot.total > 0 else { return 0 }
        return min(1, Double(snapshot.done) / Double(snapshot.total))
    }
}

// ---------------------------------------------------------------- the next line

struct NextLineComplication: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "TodaysFiveNextLine",
                               intent: NextLineConfiguration.self,
                               provider: NextLineProvider()) { entry in
            NextLineView(entry: entry)
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        }
        .configurationDisplayName("Next on Today")
        .description("The count, and — if you turn it on — the next unfinished line.")
        .supportedFamilies([.accessoryRectangular])
    }
}

struct NextLineView: View {
    let entry: SnapshotEntry

    /// Points at the default Text Size, scaled with the wearer's. 16 and 12 are Phase 3's sizes; 13
    /// is this round's, and the note below is what it is measured against.
    @ScaledMetric(relativeTo: .headline) private var countSize: CGFloat = 16
    @ScaledMetric(relativeTo: .caption2) private var nameSize: CGFloat = 12
    @ScaledMetric(relativeTo: .caption2) private var lineSize: CGFloat = 13

    private var snapshot: WatchSnapshot { entry.snapshot }

    /// **What the probe actually measured, after a review went through it line by line.**
    ///
    /// The instrument is `ImageRenderer` on macOS over a transcription of this body; it counts ink
    /// bands and their heights. One band is the count row; two means one line of the text; three
    /// means the text wrapped. Four rects: 140×38, 160×44, 176×50 — this file's bracket — plus
    /// **72×32**, the plan's own figure, added because the review pointed out the two disagree.
    ///
    ///   * **`lineLimit(2)` is one line of room in this layout, not two.** Measured with the floor
    ///     removed: an 86-character line produces **two bands at every one of the four rects, at 13 pt
    ///     and at 16 pt alike** — the count row plus one line of text. The limit is a ceiling for a
    ///     slot taller than anything swept, which is all it ever was;
    ///   * **the second line the first draft of this round produced was bought by shrinking the
    ///     type.** With `minimumScaleFactor(0.75)` the same line came back as three bands whose text
    ///     glyphs were **8.75 pt** tall against **12.00 pt** with the floor gone. That is the 0.75
    ///     floor spending ~3 pt of glyph height to fit a second line, on a wrist, and a review was
    ///     right that it is the wrong trade: watchOS's own smallest text style is about 13 pt, and
    ///     this was drawing a list line at 9.75. **The floor is gone.** The line truncates at full
    ///     size now, which is the failure a person can read;
    ///   * **`fixedSize` is gone** and stays gone. With it, two lines plus the count row overflowed
    ///     the frame at the smallest rect — drawn outside the rectangle, which on a face is drawn
    ///     nowhere.
    ///
    /// **Two numbers from the first write-up are withdrawn.** It reported a 34-character line
    /// truncating at "17, 19 and 21 characters" before and reaching "27, 34, 34" after. The before
    /// column was not what the probe drew: `.body` resolves to about 13 pt on macOS, and 17/19/21 is
    /// exactly what 16 pt — watchOS's `.body`, which this machine cannot render — gives in today's
    /// advance-width table. The after column came off the renders that had the 0.75 floor in them, so
    /// it counted characters at 9.75 pt. What the table can honestly say, measured with `NSFont`
    /// advance widths and an ellipsis, is how much of one line fits:
    ///
    /// | width | 16 pt | 13 pt | 13 pt, SF Compact Rounded |
    /// | 72 pt | 9 | 10 | 11 |
    /// | 140 pt | 17 | 20 | 21 |
    /// | 160 pt | 19 | 24 | 26 |
    /// | 176 pt | 21 | 26 | 29 |
    ///
    /// The last column is the one a wrist would show, because watchOS substitutes SF Compact Rounded
    /// for `design: .rounded`; the first two are this machine's face. So 13 pt buys **about five
    /// characters** over `.body` on one readable line — *if* the slot is ~176 pt wide, which is the
    /// open question in the header note.
    ///
    /// The sizes are `@ScaledMetric`: the measured points at the default Text Size, growing with the
    /// wearer's setting. The first draft of this round used a bare `.system(size: 13)` and a bare
    /// `.system(size: 12)`, which are fixed-size fonts — a line and a name that could not grow at all
    /// while the count beside them did. That was the review's serious finding and it was correct.
    ///
    /// **This body, as it now ships, rendered at all four rects**, with a 34-character line and an
    /// 86-character one: **two ink bands every time** — the count row at a 14.50 pt band and one line
    /// of text at a **12.00 pt** band, which is full-size 13 pt type and not a shrunken one — with the
    /// ink 64.0, 132.8, 152.0 and 167.0 pt wide inside rects of 72, 140, 160 and 176, and **no ink on
    /// the last row** at any of them, which is the check that nothing is drawing outside the slot.
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 4) {
                Text(snapshot.glance)
                    .font(FaceType.count(snapshot, size: countSize))
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .widgetAccentable()
                Text(title)
                    .font(.system(size: nameSize))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            // Off, this is the list's name and a count — useful, and nobody's words. On, it is the
            // line, which is the whole reason the switch exists. It is **not** `.widgetAccentable()`
            // — see the note at `CountView.body`.
            Text(second)
                .font(.system(size: lineSize, design: .rounded))
                .lineLimit(2)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var title: String {
        guard snapshot.hasList else { return "" }
        return snapshot.name
    }

    private var second: String {
        guard snapshot.hasList else { return "Open a list on your iPhone" }
        guard entry.showLine else {
            return snapshot.total == 0 ? "Nothing on Today"
                 : (snapshot.done == snapshot.total ? "That's the list." : "\(snapshot.total - snapshot.done) to go")
        }
        if snapshot.next.isEmpty {
            return snapshot.total == 0 ? "Nothing on Today" : "That's the list."
        }
        return snapshot.next
    }
}

// ---------------------------------------------------------------- Add

/// Tap it and the app opens straight into the add flow. `WKApplicationDelegate` has no url-opening
/// callback, so the app receives this with SwiftUI's `onOpenURL` — see `WatchApp.swift`.
///
/// The scheme needs `CFBundleURLTypes` in `Config/WatchInfo.plist`, which is not this track's file.
/// The exact snippet is in the round's report.
struct AddComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TodaysFiveAdd", provider: AddProvider()) { _ in
            AddView()
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        }
        .configurationDisplayName("Add to Today's Five")
        .description("Open Today's Five ready to add a line.")
        .supportedFamilies([.accessoryCircular, .accessoryCorner])
    }
}

struct AddView: View {
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if family == .accessoryCorner {
                Image(systemName: "plus")
                    .font(.system(size: 18, weight: .semibold))
                    .widgetAccentable()
                    .widgetLabel("Add")
            } else {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .semibold))
                    .widgetAccentable()
            }
        }
        .widgetURL(URL(string: "todaysfive://add"))
    }
}
