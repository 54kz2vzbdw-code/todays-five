// packs-extra.js — the engines the Extra category carries (1.12 b262): Chalk for Chalkboard, Marker for Whiteboard.
// Loaded by sound.js only when the kit that is on asks for one of them, so a device that never unlocked never
// fetches it. Built from packs.js's own two builders (HELPERS), passed in rather than imported, so this module
// never pulls a second copy of packs.js in under a different URL (COMPATIBILITY.md §6). The same shape as
// packs-secret.js, one pair per round: the next pairs' engines join this file.
//
// Levels are matched to the fourteen by ear and by `tools/sounds.js` (peak and RMS per sound, the envelope drawn).

export const NAMES = { chalk: "Chalk", marker: "Marker", carve: "Carve", burn: "Burn" }; // 1.12 b268: the wood pair's two
export const ORDER = ["chalk", "marker", "carve", "burn"];

export function create({ tone, noiseBurst }) {
  /* Chalk — a stick tapped to the board and drawn across it: a short dry tap, then a squeak that rises as the
     stroke ends. Each consecutive check-off is a step higher, as the knock is a quarter tone. */
  const chalk = {
    check(env, step) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1) * Math.pow(2, (step || 0) / 12), dec = P("decay", 1);
      noiseBurst(env, t, 700, 5, "bandpass", 1900 * p, 0.42 * P("bright", 1));                                   // the tap
      tone(env, { f0: 560 * p, f1: 310 * p, t, attack: 0.002, peak: 0.16, len: 0.06, bend: 0.03 });
      tone(env, { f0: 2500 * p, f1: 3150 * p, t: t + 0.05, attack: 0.012, peak: 0.08, len: 0.17 * dec, bend: 0.13 }); // the squeak of the stroke
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
      noiseBurst(env, t, 11000, 1.6, "bandpass", 1450 * p, 0.18);                                                  // the eraser's swipe
      noiseBurst(env, t + 0.08, 9000, 2.0, "lowpass", 900 * p, 0.075);
    },
    finish(env) {
      const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
      [[1650, 0], [2150, 0.14], [2750, 0.28]].forEach(([f, d]) => {                                                // a small flourish, three strokes rising
        tone(env, { f0: f * p, f1: f * 1.28 * p, t: t0 + d, attack: 0.01, peak: 0.14, len: 0.19 * dec, bend: 0.12 });
        noiseBurst(env, t0 + d, 2600, 3, "highpass", 3800, 0.05 * P("bright", 1));
      });
      tone(env, { f0: 1400 * p, f1: 650 * p, t: t0 + 0.6, attack: 0.002, peak: 0.3, len: 0.06, bend: 0.02 });    // the cap clicking back on
      noiseBurst(env, t0 + 0.6, 500, 6, "highpass", 2800, 0.22 * P("bright", 1));
      tone(env, { f0: 300 * p, f1: 180 * p, t: t0 + 0.605, attack: 0.003, peak: 0.14, len: 0.09, bend: 0.03 });
      tone(env, { type: "triangle", f0: 880 * p, t: t0 + 0.62, attack: 0.02, peak: 0.11, len: 0.55 * dec });                    // the board ringing under the cap
    }
  };

  /* Carve — a gouge driven through pine: a short scrape of filtered noise over a low body that rings, a step higher
     on each consecutive check-off. Two engines rather than one parameterised "Wood", because Settings offers a pack
     per slot and a person who picks Wood on Char should not be handed the blade (DECISIONS.md). */
  const carve = {
    check(env, step) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1) * Math.pow(2, (step || 0) / 12), dec = P("decay", 1);
      noiseBurst(env, t, 3400, 3.4, "bandpass", 1150 * p, 0.30 * P("bright", 1));                                  // the blade through the fibre
      noiseBurst(env, t + 0.008, 2600, 4.6, "highpass", 3600, 0.075 * P("bright", 1));                              // the dry top of the scrape
      tone(env, { type: "triangle", f0: 196 * p, f1: 132 * p, t, attack: 0.004, peak: 0.26, len: 0.19 * dec, bend: 0.1 }); // the plank's own body
      tone(env, { f0: 392 * p, f1: 300 * p, t: t + 0.012, attack: 0.006, peak: 0.075, len: 0.13 * dec, bend: 0.09 });
    },
    uncheck(env) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1);
      noiseBurst(env, t, 9500, 1.7, "lowpass", 1400 * p, 0.19);                                                     // the shavings brushed back in
      noiseBurst(env, t + 0.07, 7500, 2.2, "bandpass", 820 * p, 0.095);
    },
    finish(env) {
      const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
      [[0, 1.0], [0.13, 0.86], [0.25, 0.94]].forEach(([d, g]) => {                                                  // three chips off the last cut
        noiseBurst(env, t0 + d, 2400, 3.6, "bandpass", 1300 * p, 0.25 * g * P("bright", 1));
        tone(env, { type: "triangle", f0: 220 * p * g, f1: 150 * p * g, t: t0 + d, attack: 0.004, peak: 0.2 * g, len: 0.16 * dec, bend: 0.09 });
      });
      tone(env, { type: "triangle", f0: 150 * p, f1: 62 * p, t: t0 + 0.47, attack: 0.004, peak: 0.34, len: 0.3 * dec, bend: 0.16 });  // the blade set down
      noiseBurst(env, t0 + 0.47, 1500, 5, "lowpass", 900, 0.2);
      tone(env, { f0: 330 * p, t: t0 + 0.49, attack: 0.02, peak: 0.08, len: 0.5 * dec });                            // and the bench under it
    }
  };

  /* Burn — a hot tip laid on the same plank: a hiss with a few short crackles in it, brighter as the line goes on. */
  const burn = {
    check(env, step) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1) * Math.pow(2, (step || 0) / 12), dec = P("decay", 1), br = P("bright", 1);
      noiseBurst(env, t, 9000, 2.2, "bandpass", 2600 * p, 0.21 * br);                                               // the sizzle
      noiseBurst(env, t + 0.02, 7000, 3.2, "highpass", 5200, 0.06 * br);
      for (let i = 0; i < 3; i++) noiseBurst(env, t + 0.03 + i * 0.045 + Math.random() * 0.03, 220, 8, "bandpass", (1700 + Math.random() * 2600) * p, 0.1 * br); // the crackles
      tone(env, { type: "triangle", f0: 128 * p, f1: 86 * p, t, attack: 0.006, peak: 0.13, len: 0.2 * dec, bend: 0.12 });  // the wood taking it
    },
    uncheck(env) {
      const { c, P } = env; const t = c.currentTime, p = P("pitch", 1);
      noiseBurst(env, t, 12000, 1.5, "bandpass", 2100 * p, 0.17);                                                   // sandpaper, back to bare wood
      noiseBurst(env, t + 0.09, 10000, 1.9, "highpass", 3200, 0.075);
    },
    finish(env) {
      const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1), br = P("bright", 1);
      noiseBurst(env, t0, 26000, 1.5, "bandpass", 2300 * p, 0.2 * br);                                              // the whole line smouldering
      noiseBurst(env, t0 + 0.05, 20000, 2.2, "lowpass", 900, 0.16);
      for (let i = 0; i < 7; i++) noiseBurst(env, t0 + 0.06 + i * 0.075, 260, 8, "bandpass", (1500 + i * 420) * p, 0.085 * br);
      tone(env, { type: "triangle", f0: 110 * p, f1: 72 * p, t: t0 + 0.02, attack: 0.01, peak: 0.24, len: 0.5 * dec, bend: 0.3 });
      tone(env, { f0: 220 * p, t: t0 + 0.1, attack: 0.04, peak: 0.075, len: 0.6 * dec });
      noiseBurst(env, t0 + 0.66, 700, 6, "bandpass", 1900 * p, 0.3 * br);                                           // the last pop, and it is out
      tone(env, { type: "triangle", f0: 174 * p, f1: 98 * p, t: t0 + 0.66, attack: 0.003, peak: 0.24, len: 0.13, bend: 0.06 });
      noiseBurst(env, t0 + 0.74, 9000, 2.4, "lowpass", 700, 0.075);                                                 // the smoke off it
    }
  };

  return { chalk, marker, carve, burn };
}
