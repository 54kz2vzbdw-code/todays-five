// packs-secret.js — the two engines the Secret pair carries (1.6): Sparkle for Superpink, Party for Birthday.
// Loaded by sound.js only when the kit that is on asks for one of them, so a device that never unlocked never
// fetches it. Built from packs.js's own two builders (HELPERS), passed in rather than imported, so this module
// never pulls a second copy of packs.js in under a different URL (COMPATIBILITY.md §6: every module a page loads
// later is asked for with that page's build).
//
// Levels are matched to the twelve by ear and by `tools/sounds.js` (peak and RMS per sound, the envelope drawn).

export const NAMES = { sparkle: "Sparkle", party: "Party" };
export const ORDER = ["sparkle", "party"];

export function create({ tone, noiseBurst }) {
  /* Sparkle — a glitter chime: a short sine glissando up a fifth with three partials scattered above it and a
     breath of high noise. Each consecutive check-off starts a quarter tone higher, as the knock does. */
  const glint = (env, t, f, gain, len) => {
    tone(env, { f0: f, t, attack: 0.003, peak: 0.085 * gain, len });
    tone(env, { f0: f * 2.02, t: t + 0.006, attack: 0.003, peak: 0.036 * gain, len: len * 0.7 });
  };
  const sparkle = {
    check(env, step) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
      const f = 1174.66 * Math.pow(2, (step || 0) / 24) * p;                                   // D6, a quarter tone per step
      tone(env, { f0: f * 0.667, f1: f, t, attack: 0.004, peak: 0.155, len: 0.30 * dec, bend: 0.085 }); // the glissando up a fifth
      [1.5, 2.51, 3.99].forEach((m, i) => tone(env, { f0: f * m, t: t + 0.014 + i * 0.019, attack: 0.002, peak: 0.052 - i * 0.013, len: (0.44 - i * 0.09) * dec }));
      noiseBurst(env, t, 1800, 4, "highpass", 6800, 0.075 * P("bright", 1));
    },
    uncheck(env) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1);
      tone(env, { f0: 1046.5 * p, f1: 523.25 * p, t, attack: 0.003, peak: 0.10, len: 0.20, bend: 0.13 }); // the same slide, downward and softer
      tone(env, { f0: 1568 * p, t: t + 0.01, attack: 0.002, peak: 0.028, len: 0.16 });
    },
    finish(env) {
      const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
      // a rising cascade: a pentatonic ladder climbing two octaves, each rung a little quieter and shorter
      const ladder = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
      ladder.forEach((s, i) => glint(env, t0 + i * 0.062, 587.33 * p * Math.pow(2, s / 12), 1 - i * 0.045, (0.62 - i * 0.03) * dec));
      noiseBurst(env, t0 + 0.70, 5200, 3, "highpass", 7200, 0.09 * P("bright", 1));
      [880, 1108.73, 1318.51].forEach(f => tone(env, { f0: f * p, t: t0 + 0.10, attack: 0.30, peak: 0.055, len: 1.9 * dec })); // the shimmer it settles onto
    }
  };

  /* Party — a bright pop with a two-note ta-da; the finale plays the birthday phrase (the melody is public domain)
     over a cascade of little sprinkle pops. */
  const blow = (env, t, f, gain, len) => {                                                     // one round pop
    tone(env, { f0: f, f1: f * 2.7, t, attack: 0.003, peak: 0.26 * gain, len, bend: len * 0.45 });
    noiseBurst(env, t, 320, 6, "bandpass", f * 3, 0.075 * gain);
  };
  const horn = (env, t, f, gain, len) => {                                                     // one note of the phrase
    tone(env, { type: "triangle", f0: f, t, attack: 0.012, peak: 0.185 * gain, len });
    tone(env, { type: "square", f0: f * 2, t, attack: 0.014, peak: 0.030 * gain, len: len * 0.6 });
    tone(env, { type: "sine", f0: f * 3.01, t, attack: 0.02, peak: 0.018 * gain, len: len * 0.5 });
  };
  const party = {
    check(env, step) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1) * Math.pow(2, (step || 0) / 24), dec = P("decay", 1);
      blow(env, t, 360 * p, 1, 0.085 * dec);
      horn(env, t + 0.085, 587.33 * p, 0.55, 0.09 * dec);                                      // ta —
      horn(env, t + 0.155, 783.99 * p, 0.7, 0.20 * dec);                                       // — da
    },
    uncheck(env) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1);
      tone(env, { f0: 520 * p, f1: 190 * p, t, attack: 0.004, peak: 0.135, len: 0.20, bend: 0.15 }); // the air going out
      noiseBurst(env, t + 0.02, 2600, 3, "bandpass", 900 * p, 0.055);
    },
    finish(env) {
      const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
      // "Happy birthday to you": 5 5 6 5 8 7, dotted-eighth · sixteenth · quarter · quarter · quarter, and a last
      // note held. A quarter is 0.235 s and the last note is shortened to a dotted half, so the whole thing runs
      // about 1.27 s — a flourish, and no longer than the bell's shimmer (1.35 s, tools/sounds.js).
      const Q = 0.235, G = 783.99, A = 880, B = 987.77, C6 = 1046.5;
      const phrase = [[G, 0.75], [G, 0.25], [A, 1], [G, 1], [C6, 1], [B, 1.5]];
      let t = t0;
      for (const [f, beats] of phrase) { const len = beats * Q; horn(env, t, f * p, 1, Math.min(len * 0.92, len - 0.015) * dec); t += len; }
      // the sprinkles falling through it, done before the last note is
      for (let i = 0; i < 10; i++) blow(env, t0 + 0.08 + i * 0.105 + (i % 3) * 0.011, (300 + ((i * 97) % 420)) * p, 0.36, 0.07);
    }
  };

  return { sparkle, party };
}
