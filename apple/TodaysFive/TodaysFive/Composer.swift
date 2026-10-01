// Composer.swift — "Add a line", native: the sheet the Add a line control, the Action button and a widget's + open,
// with the keyboard already out.
//
// The page cannot raise the keyboard on its own — a web view only shows it for a focus that follows a tap — so a
// line asked for from outside the app is typed here, in the kit's own type and colours, and handed to the same add
// path Siri uses (AddService: the vault's key, the core, the server). The page learns of the line the way it learns
// of any other device's: the doorbell rings and it pulls, and the line arrives on Today as lines do.
import TodaysFiveCore
import UIKit

final class ComposerViewController: UIViewController, UITextViewDelegate {
    private let look: WidgetKitLook
    private let field = UITextView()
    private let placeholder = UILabel()
    private let add = UIButton(type: .system)
    private let note = UILabel()
    private var adding = false

    init(look: WidgetKitLook) {
        self.look = look
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    private func color(_ hex: String) -> UIColor {
        guard let c = Kits.rgb(hex) else { return .gray }
        return UIColor(red: c.r, green: c.g, blue: c.b, alpha: 1)
    }

    private func font(task: Bool, _ size: CGFloat, bold: Bool = false) -> UIFont {
        KitFonts.register(look.kit)
        let face = task ? look.kit.type?.task : (bold ? look.kit.type?.uiBold : look.kit.type?.uiRegular)
        let base = face.flatMap { UIFont(name: $0.postScriptName, size: size) } ?? .systemFont(ofSize: size, weight: bold || task ? .semibold : .regular)
        return UIFontMetrics(forTextStyle: task ? .title2 : .footnote).scaledFont(for: base)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        let c = look.kit.colors
        overrideUserInterfaceStyle = look.kit.base == .light ? .light : .dark
        view.backgroundColor = color(c.ink2)

        let title = UILabel()
        title.attributedText = NSAttributedString(string: "NEW LINE ON TODAY", attributes: [
            .kern: 1.6, .font: font(task: false, 11, bold: true), .foregroundColor: color(c.dim)])

        let cancel = UIButton(type: .system)
        cancel.setTitle("Cancel", for: .normal)
        cancel.titleLabel?.font = font(task: false, 15)
        cancel.tintColor = color(c.muted)
        cancel.addAction(UIAction { [weak self] _ in self?.dismiss(animated: true) }, for: .touchUpInside)

        var config = UIButton.Configuration.filled()
        config.cornerStyle = .capsule
        config.baseBackgroundColor = color(c.accent)
        config.baseForegroundColor = color(Self.readable(on: c.accent, c.ink, c.text))
        config.contentInsets = NSDirectionalEdgeInsets(top: 8, leading: 18, bottom: 8, trailing: 18)
        config.attributedTitle = AttributedString("Add", attributes: AttributeContainer([.font: font(task: false, 15, bold: true)]))
        add.configuration = config
        add.isEnabled = false
        add.addAction(UIAction { [weak self] _ in self?.submit() }, for: .touchUpInside)

        field.backgroundColor = .clear
        field.font = font(task: true, 24)
        field.textColor = color(c.text)
        field.tintColor = color(c.accent)
        field.textContainerInset = .zero
        field.textContainer.lineFragmentPadding = 0
        field.returnKeyType = .done
        field.enablesReturnKeyAutomatically = true
        field.autocapitalizationType = .sentences
        field.delegate = self
        field.accessibilityLabel = "New line"

        placeholder.text = "What's next?"
        placeholder.font = field.font
        placeholder.textColor = color(c.dim)
        placeholder.isAccessibilityElement = false

        note.font = font(task: false, 13)
        note.textColor = color(c.muted)
        note.numberOfLines = 0

        let top = UIStackView(arrangedSubviews: [cancel, UIView(), add])
        top.alignment = .center
        for v in [title, top, field, placeholder, note] { v.translatesAutoresizingMaskIntoConstraints = false; view.addSubview(v) }
        let g = view.layoutMarginsGuide
        NSLayoutConstraint.activate([
            top.topAnchor.constraint(equalTo: view.topAnchor, constant: 14),
            top.leadingAnchor.constraint(equalTo: g.leadingAnchor),
            top.trailingAnchor.constraint(equalTo: g.trailingAnchor),
            title.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            title.centerYAnchor.constraint(equalTo: top.centerYAnchor),
            field.topAnchor.constraint(equalTo: top.bottomAnchor, constant: 18),
            field.leadingAnchor.constraint(equalTo: g.leadingAnchor),
            field.trailingAnchor.constraint(equalTo: g.trailingAnchor),
            field.heightAnchor.constraint(greaterThanOrEqualToConstant: 64),
            placeholder.topAnchor.constraint(equalTo: field.topAnchor),
            placeholder.leadingAnchor.constraint(equalTo: field.leadingAnchor),
            note.topAnchor.constraint(equalTo: field.bottomAnchor, constant: 8),
            note.leadingAnchor.constraint(equalTo: g.leadingAnchor),
            note.trailingAnchor.constraint(equalTo: g.trailingAnchor),
            note.bottomAnchor.constraint(lessThanOrEqualTo: view.keyboardLayoutGuide.topAnchor, constant: -10)
        ])
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        field.becomeFirstResponder() // with the sheet, so the keyboard rises with it rather than after it
    }

    func textViewDidChange(_ textView: UITextView) {
        placeholder.isHidden = !textView.text.isEmpty
        add.isEnabled = !textView.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !adding
        note.text = nil
    }

    /// Return adds; a line is one line.
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        if text == "\n" { submit(); return false }
        return true
    }

    private func submit() {
        let text = field.text ?? ""
        guard !adding, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        adding = true
        add.isEnabled = false
        Task { @MainActor in
            let outcome = await AddService.live().add(text)
            adding = false
            if outcome.landed != nil {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                WidgetPublisher.shared.listChanged()
                dismiss(animated: true)
            } else {
                // the words stay where they were typed: nothing is lost to a refusal
                note.text = outcome.sentence
                add.isEnabled = true
                UINotificationFeedbackGenerator().notificationOccurred(.warning)
            }
        }
    }

    private static func readable(on ground: String, _ a: String, _ b: String) -> String {
        func lum(_ hex: String) -> Double {
            guard let c = Kits.rgb(hex) else { return 0 }
            func lin(_ v: Double) -> Double { v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
            return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
        }
        func ratio(_ x: String, _ y: String) -> Double { let l1 = lum(x), l2 = lum(y); return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05) }
        return ratio(ground, a) >= ratio(ground, b) ? a : b
    }

    /// The sheet, sized to sit on the keyboard.
    static func present(over host: UIViewController) {
        let look = WidgetLook.read() ?? WidgetLook()
        let dark = host.traitCollection.userInterfaceStyle == .dark
        let composer = ComposerViewController(look: look.look(look.slot(at: Date(), systemDark: dark)))
        composer.modalPresentationStyle = .pageSheet
        if let sheet = composer.sheetPresentationController {
            sheet.detents = [.custom(identifier: .init("line")) { _ in 190 }]
            sheet.prefersGrabberVisible = true
            sheet.preferredCornerRadius = 22
        }
        var top = host
        while let shown = top.presentedViewController { top = shown }
        if top is ComposerViewController { return }
        top.present(composer, animated: true)
    }
}
