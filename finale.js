// finale.js — the day's last strike, finished in each kit's own hand. Fetched at idle beside motion.js, never at first
// paint, pinned to the page's build (COMPATIBILITY.md §6). Until now the sixteen curated kits ended the same way: the
// card faded in and the volley went up. Here each kit's material writes its line its own way and throws its own
// confetti — on the volley's own rhythm (seven bursts along the bottom 65 ms apart, one through the middle at 210 ms),
// so the iPhone's finale pattern, which is that rhythm, still lands with what you see. The Secret and Extra kits keep
// the finales they were designed with (secretfx.js, extrafx.js); a theme you make ends Clean. Everything here ends by
// itself: a line is restored to plain text when its letters land, and every particle falls off the screen.

/** What each material throws: an fx.js shape list, or one of motion.js's own particles (handed over as `emit`). */
const THROW = {
  clean: null, ink: null, candy: null,                 // the kit's own confetti, as it always was
  glass: "shard", tide: "bubble", phosphor: "pixel", pixel: "pixel", glow: [3, 5], ember: "spark", pencil: [4, 0]
};

/** The line, a letter at a time: each letter its own box for the length of the move, plain text again once it lands. */
function letters(span, text) {
  span.textContent = "";
  span.setAttribute("aria-label", text);
  return [...text].map(ch => { const s = document.createElement("span"); s.textContent = ch; s.setAttribute("aria-hidden", "true"); s.style.cssText = "display:inline-block;white-space:pre;font:inherit;color:inherit"; span.appendChild(s); return s; });
}
/** Once every letter has landed, the letters become one plain text node again; anything else in the line (the swash) stays.
    Only for the finale that still owns the line: an older one's letters are already gone. */
const settle = (span, ls, text, anims, mine) => Promise.all(anims.map(a => a.finished.catch(() => {}))).then(() => {
  if (!mine()) return;
  const first = ls[0] && ls[0].parentNode === span ? ls[0] : null;
  span.insertBefore(document.createTextNode(text), first); ls.forEach(l => l.remove()); span.removeAttribute("aria-label");
});

/** Type a line out, a character at a time, a block caret riding it; the caret blinks three times and goes. The line
    keeps its full width from the first frame (what is not typed yet is there, invisible), so the card never reflows
    under it: its chip does not jump, and a card that wraps has its final shape before the first letter lands. */
function typeOut(span, text, ms, mine) {
  const part = css => { const e = document.createElement("span"); e.setAttribute("aria-hidden", "true"); e.style.cssText = css; return e; };
  const shown = part("font:inherit;color:inherit"), rest = part("font:inherit;visibility:hidden");
  const caret = part("display:inline-block;width:.55em;height:1em;margin-right:-.55em;vertical-align:-.12em;background:currentColor");
  span.textContent = ""; span.setAttribute("aria-label", text); rest.textContent = text; span.append(shown, caret, rest);
  let i = 0;
  const finish = () => { if (mine()) { span.textContent = text; span.removeAttribute("aria-label"); } };
  return new Promise(done => {
    const step = () => {
      if (!mine()) return done();
      i++; shown.textContent = text.slice(0, i); rest.textContent = text.slice(i);
      if (i < text.length) { setTimeout(step, ms); return; }
      caret.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, iterations: 6, direction: "alternate", easing: "steps(1,end)" }).finished
        .then(() => { finish(); done(); }, () => { finish(); done(); });
    };
    setTimeout(step, 160);
  });
}

/** Play kit `kit`'s finale: the line in `span`, the confetti through `fx`. False when there is nothing of this module's to play. */
export function finale(kit, fx, { span, w, h, reduced, spring, shell, mat = "clean", emit = null, line = "" } = {}) {
  if (!kit || kit.finale || reduced) return false;
  const pal = kit.confetti || [];
  // 1.12 b307: a finale can start again before the last one has landed (check, uncheck, check a one-line list inside a
  // second). The newer one owns the line: it cancels the older one's letters and starts from the plain line, and the
  // older one's cleanup stands down (mine) instead of appending the line a second time.
  const tok = span ? (span._fin = (span._fin || 0) + 1) : 0, mine = () => !!span && span._fin === tok && span.isConnected;
  if (span) { span.getAnimations({ subtree: true }).forEach(a => a.cancel()); span.textContent = line || span.getAttribute("aria-label") || span.textContent; span.removeAttribute("aria-label"); span.style.position = ""; }
  const throwIt = (what, x, y, n, power, spread) => { if (emit) emit(fx, what, x, y, n, power, spread, pal); else fx.burst(x, y, n, power, spread, Array.isArray(what) ? { palette: pal, shapes: what } : null); };
  const text = span ? span.textContent : "";
  const pop = spring ? spring(420, 17) : { duration: 520, easing: "cubic-bezier(.3,1.5,.5,1)" };
  const soft = spring ? spring(170, 22) : { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" };
  // the volley's rhythm, in the material's own particles
  const what = THROW[mat];
  for (let i = 0; i < 7; i++) setTimeout(() => throwIt(what, w * (0.08 + 0.14 * i), h * 0.97, 22, 17, 1.15), i * 65);
  setTimeout(() => throwIt(what, w * 0.5, h * 0.6, 36, 13, 2.6), 210);
  if (!span || !text) return true;
  if (mat === "phosphor" || mat === "pixel") {
    if (mat === "phosphor" && kit.id === "terminal" && shell) shell.animate([{ filter: "brightness(1)" }, { filter: "brightness(1.35)", offset: 0.3 }, { filter: "brightness(1)" }], { duration: 240, delay: 40 });
    typeOut(span, text, mat === "pixel" ? 55 : 38, mine);
    return true;
  }
  if (mat === "pencil") {
    span.animate([{ clipPath: "inset(-20% 100% -20% 0)" }, { clipPath: "inset(-20% 0% -20% 0)" }], { duration: 1000, delay: 180, easing: "steps(26,end)", fill: "backwards" });
    return true;
  }
  const ls = letters(span, text), n = ls.length, run = [];
  const each = (from, sp, gap, extra = {}) => ls.forEach((l, i) => run.push(l.animate([typeof from === "function" ? from(i) : from, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: sp.duration, easing: sp.easing, delay: 140 + i * gap, fill: "backwards", ...extra })));
  if (mat === "ink") each({ opacity: 0, transform: "translateY(.35em) rotate(-6deg)" }, pop, 30);
  else if (mat === "candy") each({ opacity: 0, transform: "scale(0)" }, pop, 34);
  else if (mat === "tide") each(i => ({ opacity: 0, transform: `translateY(${0.7 + 0.25 * Math.sin(i * 0.9)}em)`, filter: "blur(3px)" }), soft, 45);
  else if (mat === "glass") each({ opacity: 0, transform: "scale(1.15)", filter: "blur(8px)" }, soft, 22);
  else if (mat === "glow" || mat === "ember") {
    each({ opacity: 0, transform: "translateY(.5em)", filter: "blur(6px)" }, { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)" }, 38);
    if (mat === "ember") { const cool = getComputedStyle(span).color; ls.forEach((l, i) => run.push(l.animate([{ color: "#FFB02E", textShadow: "0 0 14px rgba(255,140,40,.95)" }, { color: "#FFB02E", textShadow: "0 0 10px rgba(255,140,40,.7)", offset: 0.35 }, { color: cool, textShadow: "0 0 0 rgba(255,140,40,0)" }], { duration: 1400, delay: 140 + i * 38 }))); } // it kindles, then cools to the kit's own colour
  } else each({ opacity: 0, transform: "translateY(-.7em)" }, pop, 26); // clean
  if (mat === "ink") { // a pen's swash under the line, drawn once the last letter is down
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"), path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.setAttribute("viewBox", "0 0 200 12"); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;left:0;right:0;bottom:-.32em;width:100%;height:.4em;overflow:visible;pointer-events:none";
    path.setAttribute("d", "M4 8C52 1 118 13 196 4"); path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor"); path.setAttribute("stroke-width", "2.2"); path.setAttribute("stroke-linecap", "round"); path.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(path); span.style.position = "relative"; span.appendChild(svg);
    const L = 200, a = path.animate([{ strokeDasharray: L, strokeDashoffset: L }, { strokeDasharray: L, strokeDashoffset: 0 }], { duration: 440, delay: 140 + n * 30 + 160, easing: "cubic-bezier(.6,0,.2,1)", fill: "both" });
    const off = () => { svg.remove(); if (mine()) span.style.position = ""; };
    a.finished.then(() => new Promise(r => setTimeout(r, 1600))).then(() => svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" }).finished).then(off, off);
  }
  settle(span, ls, text, run, mine);
  return true;
}
