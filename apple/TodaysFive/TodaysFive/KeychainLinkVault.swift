// KeychainLinkVault.swift — the links, where the browser's storage cannot lose them.
//
// One generic-password item per link, keyed by the secret. kSecAttrAccessibleAfterFirstUnlock so a
// widget or a background refresh can read it in a later phase, and **not synchronizable**: iCloud
// Keychain would put list secrets on Apple's servers and change what about.html promises. That is a
// separate decision, and its default is off.
//
// The rules about what to write and what to drop are not here — they are pure, so they live in
// TodaysFiveCore's VaultReconciler where the Swift suite covers them. This file is the I/O.
import Foundation
import Security
import TodaysFiveCore

struct KeychainLinkVault: LinkVault {
    /// The service the items sit under. An access group is deliberately absent: sharing with the
    /// Watch and widgets in Phase 3 needs the paid team, and adding one later is a loop over all()
    /// and a re-put(), not a redesign.
    let service: String

    init(service: String = "com.pricebrannen.todaysfive.links") {
        self.service = service
    }

    enum VaultError: Error, CustomStringConvertible {
        case status(OSStatus, String)
        var description: String {
            // deliberately says the operation and the code, never the account — the account is the secret
            if case let .status(code, op) = self { return "keychain \(op) failed: \(code)" }
            return "keychain error"
        }
    }

    private func baseQuery() -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: service,
         kSecAttrSynchronizable as String: false]
    }

    func all() throws -> [VaultedLink] {
        var query = baseQuery()
        query[kSecMatchLimit as String] = kSecMatchLimitAll
        query[kSecReturnAttributes as String] = true
        query[kSecReturnData as String] = true

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return [] }
        guard status == errSecSuccess else { throw VaultError.status(status, "read") }
        guard let items = result as? [[String: Any]] else { return [] }

        return items.compactMap { item in
            guard let id = item[kSecAttrAccount as String] as? String,
                  let data = item[kSecValueData as String] as? Data,
                  let json = (try? JSONReader.parse(data))?.objectValue else { return nil }
            return VaultedLink(id: id, json: json)
        }
        .sorted { a, b in
            if a.lastSeenAt != b.lastSeenAt { return a.lastSeenAt > b.lastSeenAt }
            return a.id < b.id
        }
    }

    func put(_ link: VaultedLink) throws {
        let payload = Data(JSONWriter.stringify(.object(link.json)).utf8)
        var query = baseQuery()
        query[kSecAttrAccount as String] = link.id

        let update: [String: Any] = [kSecValueData as String: payload]
        let status = SecItemUpdate(query as CFDictionary, update as CFDictionary)
        if status == errSecSuccess { return }
        guard status == errSecItemNotFound else { throw VaultError.status(status, "update") }

        var insert = query
        insert[kSecValueData as String] = payload
        insert[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        let added = SecItemAdd(insert as CFDictionary, nil)
        guard added == errSecSuccess else { throw VaultError.status(added, "add") }
    }

    func remove(id: String) throws {
        var query = baseQuery()
        query[kSecAttrAccount as String] = id
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw VaultError.status(status, "delete")
        }
    }

    /// Debug builds only, for the wipe-and-restore check in the round's verification.
    func removeAll() throws {
        let status = SecItemDelete(baseQuery() as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw VaultError.status(status, "delete all")
        }
    }
}
