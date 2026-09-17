// packs-extra.js — the engines the Extra category carries (1.12 b262): Chalk for Chalkboard, Marker for Whiteboard.
// Loaded by sound.js only when the kit that is on asks for one of them, so a device that never unlocked never
// fetches it. Built from packs.js's own two builders (HELPERS), passed in rather than imported, so this module
// never pulls a second copy of packs.js in under a different URL (COMPATIBILITY.md §6). The same shape as
// packs-secret.js, one pair per round: the next pairs' engines join this file.
//
// Levels are matched to the fourteen by ear and by `tools/sounds.js` (peak and RMS per sound, the envelope drawn).

export const NAMES = { chalk: "Chalk", marker: "Marker" };
export const ORDER = ["chalk", "marker"];

export function create({ tone, noiseBurst }) {
  /* Chalk — a stick tapped to the board and drawn across it: a short dry tap, then a squeak that rises as the
     stroke ends. Each consecutive check-off is a step higher, as the knock is a quarter tone. */
  const chalk = {
    check(env, step) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1) * Math.pow(2, (step || 0) / 12), dec = P("decay", 1);
      noiseBurst(env, t, 700, 5, "bandpass", 1900 * p, 0.34 * P("bright", 1));                                   // the tap
      tone(env, { f0: 560 * p, f1: 310 * p, t, attack: 0.002, peak: 0.13, len: 0.055, bend: 0.03 });
      tone(env, { f0: 2500 * p, f1: 3150 * p, t: t + 0.05, attack: 0.012, peak: 0.062, len: 0.15 * dec, bend: 0.13 }); // the squeak of the stroke
      tone(env, { type: "triangle", f0: 5000 * p, f1: 6300 * p, t: t + 0.056, attack: 0.012, peak: 0.014, len: 0.11 * dec, bend: 0.1 });
      noiseBurst(env, t + 0.05, 5000, 2.4, "highpass", 5200, 0.045 * P("bright", 1));                            // the dust it leaves
    },
    uncheck(env) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1);
      noiseBurst(env, t, 9000, 1.8, "lowpass", 1500 * p, 0.14);                                                    // a soft brush across the board
      noiseBurst(env, t + 0.06, 7000, 2.4, "bandpass", 850 * p, 0.07);
    },
    finish(env) {
      const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
      tone(env, { f0: 150 * p, f1: 68 * p, t: t0, attack: 0.004, peak: 0.34, len: 0.34 * dec, bend: 0.2 });         // the eraser's thump on the board
      noiseBurst(env, t0, 2600, 4, "lowpass", 620, 0.24);
      noiseBurst(env, t0 + 0.17, 12000, 2.1, "highpass", 2300, 0.13 * P("bright", 1));                              // a clap of dust
      noiseBurst(env, t0 + 0.24, 16000, 1.7, "bandpass", 3400, 0.075 * P("bright", 1));
      noiseBurst(env, t0 + 0.36, 20000, 1.4, "lowpass", 2200, 0.05);                                                // settling
    }
  };

  /* Marker — a dry-erase cap popped off and a stroke squeaking across the board; the eraser swipes it away;
     the finale flourishes and clicks the cap back on. */
  const marker = {
    check(env, step) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1) * Math.pow(2, (step || 0) / 12), dec = P("decay", 1);
      tone(env, { f0: 920 * p, f1: 400 * p, t, attack: 0.002, peak: 0.2, len: 0.06, bend: 0.03 });                 // the cap's pop
      noiseBurst(env, t, 450, 6, "bandpass", 2300 * p, 0.17 * P("bright", 1));
      tone(env, { f0: 1850 * p, f1: 2450 * p, t: t + 0.065, attack: 0.01, peak: 0.07, len: 0.17 * dec, bend: 0.15 }); // the squeak-stroke
      tone(env, { type: "triangle", f0: 3700 * p, f1: 4900 * p, t: t + 0.07, attack: 0.01, peak: 0.018, len: 0.12 * dec, bend: 0.12 });
    },
    uncheck(env) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1);
      noiseBurst(env, t, 11000, 1.6, "bandpass", 1450 * p, 0.14);                                                  // the eraser's swipe
      noiseBurst(env, t + 0.08, 9000, 2.0, "lowpass", 900 * p, 0.075);
    },
    finish(env) {
      const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
      [[1650, 0], [2150, 0.14], [2750, 0.28]].forEach(([f, d]) => {                                                // a small flourish, three strokes rising
        tone(env, { f0: f * p, f1: f * 1.28 * p, t: t0 + d, attack: 0.01, peak: 0.08, len: 0.15 * dec, bend: 0.12 });
        noiseBurst(env, t0 + d, 1800, 3, "highpass", 3800, 0.03 * P("bright", 1));
      });
      tone(env, { f0: 1400 * p, f1: 650 * p, t: t0 + 0.52, attack: 0.002, peak: 0.24, len: 0.05, bend: 0.02 });    // the cap clicking back on
      noiseBurst(env, t0 + 0.52, 400, 6, "highpass", 2800, 0.18 * P("bright", 1));
      tone(env, { f0: 300 * p, f1: 180 * p, t: t0 + 0.525, attack: 0.003, peak: 0.1, len: 0.07, bend: 0.03 });
    }
  };

  return { chalk, marker };
}
