// ListPickerView.swift — the picker behind the title.
//
// watchOS has no SwiftUI `Menu`, so the picker is not a dropdown: the title is a `Button` (the
// watchOS-exclusive `navigationTitle { }` overload, in `WatchApp.swift`) and it presents this.
//
// The pills are the web's words — **"Shared"** and **"view only"** — and they are independent: a list
// can be both. A shared list goes by its `nickname` when the phone gave it one, else by the
// document's name, which is `app.js`'s own rule.
//
// **1.12's Remove on the phone removes the list from here.** There is nothing in this file about
// that: it falls out of the rule that the Watch's vault is whatever the phone last named, and a link
// the phone stops naming is gone from `store.links` before this view is next drawn.
import SwiftUI
import TodaysFiveCore

struct ListPickerView: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List {
            if store.links.isEmpty {
                Text("No lists yet")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            ForEach(store.links, id: \.id) { link in
                Button {
                    store.select(link.id)
                    dismiss()
                } label: {
                    row(link)
                }
                .buttonStyle(.plain)
            }
        }
        .navigationTitle("Lists")
    }

    private func row(_ link: VaultedLink) -> some View {
        HStack(alignment: .top, spacing: 6) {
            VStack(alignment: .leading, spacing: 3) {
                Text(name(of: link))
                    .font(.system(.body, design: .rounded, weight: .medium))
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
                    .foregroundStyle(WatchTheme.accent)
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
