// TodayView.swift — Today, the checkbox, the count, the finale, and the dimmed version of all three.
//
// The lines are large, the checkbox is the whole row's hit area, and the count is done-over-total the
// way the rail's `d/n` is. Nothing here decides anything about the document: a tap calls
// `WatchStore.setDone`, which calls the core's `Model.setDone`, which writes exactly three fields.
//
// **Every colour and every face here comes from the kit** (`\.watchTheme`). The list lines take the
// kit's *task* face with its tracking and its leading — they are the seven call sites `styles.css`
// gives `var(--task-w)` — and everything else takes a ui face. There is no `.primary`, no
// `.secondary` and no system colour on this screen: watchOS has no light appearance, so those read
// correctly only for as long as nobody chooses a light kit.
//
// **The row platter is the kit's `ink2`.** `.listStyle(.carousel)` draws its own translucent grey
// otherwise, which on Paper's cream is a grey card on paper.
import SwiftUI
import TodaysFiveCore

struct TodayView: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme
    @Binding var showAdd: Bool

    var body: some View {
        List {
            countRow
            if store.finaleShowing { finaleCard }
            ForEach(store.rows) { row in
                TodayRow(row: row)
            }
            addRow
        }
        .listStyle(.carousel)
        .scrollContentBackground(.hidden)
        .background(theme.ink)
        // The document changes at once; only the re-order waits, and this is the wait made visible.
        .animation(.easeOut(duration: 0.22), value: store.rows)
        .animation(.easeOut(duration: 0.25), value: store.finaleShowing)
    }

    // ---------------------------------------------------------------- the count

    /// Done over total, the sync mark, and — on a **long press** — Start again.
    ///
    /// Worth saying plainly: *the web has no long press on the count*. There a plain tap toggles
    /// one-thing mode and Start again is a button under the finale card reading "Bring them all
    /// back". The long press is a Watch idiom for a Watch that has no room for a second button; the
    /// *action* is the web's `startAgain()` exactly.
    private var countRow: some View {
        HStack(spacing: 3) {
            Text("\(store.doneCount)")
                .font(theme.ui(16, .headline, bold: true))
                .foregroundStyle(store.finaleShowing ? theme.accent : theme.text)
            Text("/\(store.totalCount)")
                .font(theme.ui(16, .headline))
                .foregroundStyle(theme.muted)
            if store.isViewOnly { Pill(text: "view only") }
            if store.isShared { Pill(text: "Shared") }
            Spacer(minLength: 0)
            Image(systemName: store.mark.symbol)
                .font(.system(size: 11))
                .foregroundStyle(theme.dim)
                .accessibilityLabel(Text(store.mark.rawValue))
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
        // Gated the way the + is: a view-only list must not offer a gesture that its own guard
        // will refuse, and an accessibility hint promising one is worse than no hint at all.
        .onLongPressGesture(minimumDuration: 0.5) { if store.canEdit { store.startAgain() } }
        .accessibilityHint(store.canEdit ? Text("Hold to start again") : Text(""))
        .listRowBackground(Color.clear)
    }

    /// The carousel's platter, in the kit's own first surface above the page.
    private var rowPlatter: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2)
    }

    /// The web's own default string, and its own 300 ms hold — the wait is in `WatchStore`, because
    /// it is about the moment rather than about the drawing.
    private var finaleCard: some View {
        HStack {
            Spacer(minLength: 0)
            Text("That's the list.")
                .font(theme.ui(16, .headline, bold: true))
                .italic(theme.kit.finaleItalic)
                .foregroundStyle(theme.accent)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 6)
        .listRowBackground(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(theme.accent.opacity(0.18))
        )
        .transition(.opacity)
    }

    // ---------------------------------------------------------------- the +

    /// The `+`. Track C's `AddFlowView` is what opens; this view never adds anything itself.
    /// `.handGestureShortcut(.primaryAction)` makes a Double Tap start it while the app is open.
    private var addRow: some View {
        Button {
            showAdd = true
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "plus.circle.fill").foregroundStyle(theme.accent)
                Text("Add")
                    .font(theme.ui(15, .body))
                    .foregroundStyle(theme.text)
                Spacer(minLength: 0)
            }
        }
        .buttonStyle(.plain)
        .disabled(!store.canEdit)
        .handGestureShortcut(.primaryAction, isEnabled: store.canEdit)
        .listRowBackground(rowPlatter)
    }
}

// ---------------------------------------------------------------- one line

struct TodayRow: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme
    let row: WatchStore.Row

    var body: some View {
        Button {
            // Set, never toggle. `Model.setDone` no-ops when the line is already in the state asked
            // for, so a second tap that lost a race cannot stamp a fresh `updatedAt` and win a merge
            // tie-break for no user action.
            store.setDone(row.id, !row.done)
        } label: {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: row.done ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 17))
                    // `hairSolid` is the kit's own line that clears 3:1 on its ground — which is
                    // what an unchecked box is. `.secondary` was a grey that happened to work on a
                    // device that is always dark.
                    .foregroundStyle(row.done ? theme.accent : theme.hairSolid)
                Text(row.text)
                    .taskType(theme, 17, .title3)
                    .strikethrough(row.done, color: theme.struck)
                    .foregroundStyle(row.done ? theme.struck : theme.text)
                    .multilineTextAlignment(.leading)
                    .lineLimit(4)
                    .minimumScaleFactor(0.7)
                Spacer(minLength: 0)
            }
            .padding(.vertical, 2)
        }
        .buttonStyle(.plain)
        .listRowBackground(
            RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2)
        )
        // A view-only list cannot be changed, and the refusal happens here as well as in the store:
        // nobody is shown a line crossing itself off that will not stay crossed off.
        .disabled(!store.canEdit)
    }
}

// ---------------------------------------------------------------- the pills

/// The web's words, exactly: **"Shared"** and **"view only"**. Two independent pills, and both can be
/// on at once.
struct Pill: View {
    @Environment(\.watchTheme) private var theme
    let text: String

    var body: some View {
        Text(text)
            .font(theme.ui(10, .caption2, bold: true))
            .padding(.horizontal, 5)
            .padding(.vertical, 1)
            // The kit's own emphasised hairline — `text` at `hairHiAlpha` — which is exactly what
            // the web fills a chip with. The old `Color.primary.opacity(0.16)` was Pink's alpha
            // applied to every kit and to a colour no kit names.
            .background(Capsule().fill(theme.hairHi))
            .foregroundStyle(theme.muted)
    }
}

// ---------------------------------------------------------------- Always-On

/// `isLuminanceReduced` is the Always-On display: the wrist is down and the screen is dimmed, and a
/// five-line list is going to sit here all day. So this is Today with everything that asks for
/// attention taken out — no accent fill, no buttons, no animation, no finale card — leaving the one
/// thing a glance wants, which is how much is left.
struct AlwaysOnTodayView: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Text(store.title)
                    .font(theme.ui(12, .caption))
                    .foregroundStyle(theme.dim)
                    .lineLimit(1)
                Spacer(minLength: 0)
                Text("\(store.doneCount)/\(store.totalCount)")
                    .font(theme.ui(12, .caption, bold: true))
                    .foregroundStyle(theme.accent(dimmed: true))
            }
            ForEach(store.rows.prefix(5)) { row in
                Text(row.text)
                    .taskType(theme, 15, .body)
                    .strikethrough(row.done, color: theme.accent(dimmed: true))
                    .foregroundStyle(row.done ? theme.accent(dimmed: true) : theme.text.opacity(0.75))
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        // The dimmed frame gets the ground too. It is the one screen that is on for hours, and it is
        // where the 17x emissive-drive ratio between a dark kit and Paper's cream is actually spent.
        .background(theme.ink)
    }
}
