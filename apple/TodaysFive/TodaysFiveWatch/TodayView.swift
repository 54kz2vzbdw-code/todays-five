// TodayView.swift — Today, the checkbox, the count, the finale, and the dimmed version of all three.
//
// The lines are large, the checkbox is the whole row's hit area, and the count is done-over-total the
// way the rail's `d/n` is. Nothing here decides anything about the document: a tap calls
// `WatchStore.setDone`, which calls the core's `Model.setDone`, which writes exactly three fields.
import SwiftUI
import TodaysFiveCore

struct TodayView: View {
    @Environment(WatchStore.self) private var store
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
                .font(.system(.headline, design: .rounded, weight: .semibold))
                .foregroundStyle(store.finaleShowing ? WatchTheme.accent : Color.primary)
            Text("/\(store.totalCount)")
                .font(.system(.headline, design: .rounded))
                .foregroundStyle(.secondary)
            if store.isViewOnly { Pill(text: "view only") }
            if store.isShared { Pill(text: "Shared") }
            Spacer(minLength: 0)
            Image(systemName: store.mark.symbol)
                .font(.system(size: 11))
                .foregroundStyle(.secondary)
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

    /// The web's own default string, and its own 300 ms hold — the wait is in `WatchStore`, because
    /// it is about the moment rather than about the drawing.
    private var finaleCard: some View {
        HStack {
            Spacer(minLength: 0)
            Text("That's the list.")
                .font(.system(.headline, design: .rounded, weight: .semibold))
                .foregroundStyle(WatchTheme.accent)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 6)
        .listRowBackground(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WatchTheme.accent.opacity(0.18))
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
                Image(systemName: "plus.circle.fill").foregroundStyle(WatchTheme.accent)
                Text("Add").font(.system(.body, design: .rounded))
                Spacer(minLength: 0)
            }
        }
        .buttonStyle(.plain)
        .disabled(!store.canEdit)
        .handGestureShortcut(.primaryAction, isEnabled: store.canEdit)
    }
}

// ---------------------------------------------------------------- one line

struct TodayRow: View {
    @Environment(WatchStore.self) private var store
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
                    .foregroundStyle(row.done ? WatchTheme.accent : Color.secondary)
                Text(row.text)
                    .font(.system(.title3, design: .rounded, weight: .medium))
                    .strikethrough(row.done, color: WatchTheme.struck)
                    .foregroundStyle(row.done ? WatchTheme.struck : Color.primary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(4)
                    .minimumScaleFactor(0.7)
                Spacer(minLength: 0)
            }
            .padding(.vertical, 2)
        }
        .buttonStyle(.plain)
        // A view-only list cannot be changed, and the refusal happens here as well as in the store:
        // nobody is shown a line crossing itself off that will not stay crossed off.
        .disabled(!store.canEdit)
    }
}

// ---------------------------------------------------------------- the pills

/// The web's words, exactly: **"Shared"** and **"view only"**. Two independent pills, and both can be
/// on at once.
struct Pill: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .semibold, design: .rounded))
            .padding(.horizontal, 5)
            .padding(.vertical, 1)
            .background(
                Capsule().fill(Color.primary.opacity(0.16))
            )
            .foregroundStyle(.secondary)
    }
}

// ---------------------------------------------------------------- Always-On

/// `isLuminanceReduced` is the Always-On display: the wrist is down and the screen is dimmed, and a
/// five-line list is going to sit here all day. So this is Today with everything that asks for
/// attention taken out — no accent fill, no buttons, no animation, no finale card — leaving the one
/// thing a glance wants, which is how much is left.
struct AlwaysOnTodayView: View {
    @Environment(WatchStore.self) private var store

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Text(store.title)
                    .font(.system(size: 12, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer(minLength: 0)
                Text("\(store.doneCount)/\(store.totalCount)")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(WatchTheme.accentDim)
            }
            ForEach(store.rows.prefix(5)) { row in
                Text(row.text)
                    .font(.system(size: 15, design: .rounded))
                    .strikethrough(row.done, color: WatchTheme.accentDim)
                    .foregroundStyle(row.done ? WatchTheme.accentDim : Color.primary.opacity(0.75))
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
