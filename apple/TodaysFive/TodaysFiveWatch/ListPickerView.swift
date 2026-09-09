// ListPickerView.swift — the list picker, and since Phase 5 it has three doors rather than one.
//
// Phase 3 gave it one: the title itself was the `Button`, through the watchOS-exclusive
// `navigationTitle { }` overload, because watchOS has no SwiftUI `Menu`. That reasoning is sound about
// `Menu` and says nothing about whether the navigation bar's title area is hit-testable on a real
// watch — and on a real watch, running 1.12 (216), **the caret was there and the tap did nothing**.
//
// So this view is now reached three ways, and two of them are hit-testable by construction:
//
//   * **`.today`** — a `List` row at the top of Today, which is the most reliably tappable thing
//     watchOS has and what every other control in this app already is. A **push**, not a presentation;
//   * **`.actions`** — the Lists row in the sheet behind the long press on the count. That gesture is
//     proven on Price's wrist: he reaches the theme picker through it. Also a push, inside the sheet
//     the hold already opened, so it shares nothing with the path under suspicion;
//   * **`.title`** — the old door, kept with its caret removed and its trace intact, because it is the
//     measurement. See `titleButton` in `WatchApp.swift`.
//
// **Which door opened it is recorded.** `picker.shown` carries how many lists were offered in `a` and
// the door in `b`, so one line of the trace on a wrist separates "the title's tap arrived and the sheet
// failed to present" from "the title never heard the finger" — and says which of the two new controls
// a person actually found. Nothing else about the door reaches the trace: a `Door` is a small integer
// written in this file, which is the same privacy rule as every other entry (`WatchDiagnostics`).
//
// The pills are the web's words — **"Shared"** and **"view only"** — and they are independent: a list
// can be both. The order is the rail's (index.html:142-143): view only first, then Shared. A shared
// list goes by its `nickname` when the phone gave it one, else by the document's name, which is
// `app.js`'s own rule.
//
// **1.12's Remove on the phone removes the list from here.** There is nothing in this file about
// that: it falls out of the rule that the Watch's vault is whatever the phone last named, and a link
// the phone stops naming is gone from `store.links` before this view is next drawn.
import SwiftUI
import TodaysFiveCore

struct ListPickerView: View {
    /// How this screen was reached. It is one number in the trace and nothing else — never a branch in
    /// the behaviour below, because three doors onto one screen that behaved differently would be
    /// three screens.
    enum Door: Int {
        case title = 1
        case actions = 2
        case today = 3
    }

    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme
    @Environment(\.dismiss) private var dismiss

    let door: Door
    /// The Lists row behind the hold pushes this *inside a sheet*, so the view's own `dismiss` only
    /// pops back to the actions screen — leaving somebody in a menu after they asked to go and look at
    /// another list. The sheet's own dismiss is handed down so the whole stack closes onto the list
    /// they chose. nil for the two doors that are already on Today.
    var dismissAll: DismissAction? = nil

    var body: some View {
        List {
            if store.links.isEmpty {
                Text("No lists yet")
                    .font(theme.ui(13, .footnote))
                    .foregroundStyle(theme.muted)
                    .listRowBackground(Color.clear)
            }
            ForEach(store.links, id: \.id) { link in
                Button {
                    // `select` is where every door meets, and it is what records `picker.selected` —
                    // including whether the switch actually took, which only the store can know.
                    store.select(link.id)
                    if let dismissAll { dismissAll() } else { dismiss() }
                } label: {
                    row(link)
                }
                .buttonStyle(.plain)
                .listRowBackground(
                    RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2)
                )
            }
        }
        .scrollContentBackground(.hidden)
        .background(theme.ink)
        // The view-taking overload, the same one the title button uses in `WatchApp.swift`. The
        // string overload is drawn by the system in the system's colour, which on a light kit is
        // white on cream — the same failure as the clock, but this one has a door out of it.
        .navigationTitle { Text("Lists").foregroundStyle(theme.accent) }
        // **The picker actually presented.** Not "something asked it to": this fires when the view is
        // on screen, which is the half of the title's bug that reading could never settle.
        .onAppear {
            WatchDiagnostics.shared.record(WatchDiagnostics.Code.pickerShown,
                                           store.links.count, door.rawValue)
        }
    }

    private func row(_ link: VaultedLink) -> some View {
        HStack(alignment: .top, spacing: 6) {
            VStack(alignment: .leading, spacing: 3) {
                Text(name(of: link))
                    .font(theme.ui(15, .body, bold: true))
                    .foregroundStyle(theme.text)
                    .lineLimit(2)
                HStack(spacing: 4) {
                    // The rail's order (index.html:142-143) and Today's: view only first, then
                    // Shared. Both can be on at once, and reading them in a different order here
                    // than two screens away is the kind of small wrongness nobody can name.
                    if link.mode == .view { Pill(text: "view only") }
                    if link.origin == "shared" { Pill(text: "Shared") }
                }
            }
            Spacer(minLength: 0)
            if link.id == store.selected {
                Image(systemName: "checkmark")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(theme.accent)
            }
        }
        .padding(.vertical, 2)
    }

    /// The nickname when there is one, else the list's own name, else something rather than nothing —
    /// a list with no name at all is still a list somebody has to be able to pick.
    private func name(of link: VaultedLink) -> String {
        if !link.nickname.isEmpty { return link.nickname }
        if !link.name.isEmpty { return link.name }
        return "Untitled list"
    }
}

// ---------------------------------------------------------------- the row at the top of Today

/// **The list row**, drawn only when this Watch holds more than one list.
///
/// It exists because the title's caret promised a menu it could not open, and because a `List` row is
/// the most reliably tappable thing watchOS has — it is what the check-off, the `+`, Start again, the
/// theme and Diagnostics all already are. A `NavigationLink` rather than a `Button` raising a sheet:
/// a push shares nothing with the presentation that is under suspicion, so this control is right
/// whichever way the title's diagnosis goes.
///
/// **What it costs, and why that was accepted.** The carousel shows about three rows at a time, so a
/// person who holds more than one list turns the crown once more to reach the fifth line. Three things
/// pay for it: it is **absent** for everybody who holds one list, which is most people; the two pills
/// move off the count row onto it, so nothing is drawn twice and the count row does not grow; and it
/// is **one line whenever the list carries no pill**, which is every list a person owns outright.
/// Putting it under the `+` instead was rejected: a list's identity belongs above the lines it
/// contains, and the bottom of this screen is where a Double Tap aims.
///
/// **The pills go under the name, not beside it, and that is arithmetic rather than taste.** A 42 mm
/// watch is 187 points wide; the glyph, the chevron and the insets take something like 40 of them, and
/// *view only* and *Shared* at 10 points with their capsule padding take most of what is left — so a
/// list that is both, which is exactly what a read-only list somebody shared with you is, would leave
/// the name about four characters. Under the name they cost a second line **only on a list that has a
/// pill to draw**, and an empty `HStack` has no height, so the common case is still one line. It is
/// also the shape `ListPickerView`'s own rows use, two screens away, for the same three fields.
/// (That is arithmetic on the font sizes in this file, not a rendering: what a screenshot settles is
/// whether the name truncates anyway, and nothing on this machine can take one of a watch it cannot
/// tap into this state.)
struct TodayListRow: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme

    var body: some View {
        NavigationLink {
            ListPickerView(door: .today).watchGround(theme)
        } label: {
            HStack(spacing: 5) {
                Image(systemName: "list.bullet")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(theme.accent)
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.title)
                        .font(theme.ui(14, .footnote, bold: true))
                        .foregroundStyle(theme.text)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    // The same two fields `ListPickerView` reads, in the rail's order
                    // (index.html:142-143), not a second opinion about them.
                    HStack(spacing: 4) {
                        if store.isViewOnly { Pill(text: "view only") }
                        if store.isShared { Pill(text: "Shared") }
                    }
                }
                Spacer(minLength: 2)
                Image(systemName: "chevron.right")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(theme.accent)
            }
            .padding(.vertical, 1)
        }
        .accessibilityHint(Text("Switch lists"))
    }
}
