// Config.swift — the Supabase connection, taken from the repo's config.js at build time by the
// ConfigGen plugin (Config.generated.swift). Both values are safe to publish: the key can only call
// the three RPCs in supabase/schema.sql, and every one of them needs the exact, unguessable list id.
// Empty values are config.js's own "local-only mode" and stay a valid state here.

public struct SupabaseConfig: Sendable, Equatable {
    public let url: String
    public let key: String

    public init(url: String, key: String) {
        self.url = url
        self.key = key
    }

    /// What `config.js` says right now.
    public static let fromRepo = SupabaseConfig(url: GeneratedConfig.url, key: GeneratedConfig.key)

    public var isConfigured: Bool { !url.isEmpty && !key.isEmpty }
}
