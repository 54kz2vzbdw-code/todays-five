// Audio.swift — the session the page's sound plays through.
//
// `.ambient` on purpose: the ring/silent switch still silences it, exactly as it does in Safari and
// in the Home Screen app. `.playback` would play over the switch, and the page already carries a
// one-time hint about it ("Hearing nothing? The ring/silent switch mutes the app's sounds too."), so
// overriding here would make that hint a lie. Do not fight the silent switch.
//
// `.mixWithOthers` so a check-off does not stop someone's music or a podcast: this is a to-do list,
// and its sounds are decoration.
import AVFoundation

enum Audio {
    static func begin() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            // nothing to do and nothing worth saying: the page falls back to a silent check-off
        }
    }
}
