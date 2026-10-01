// kitchen.js — 1.12 b403: the kitchen display, the list as a screen on the wall: Today in type that fills the screen,
// the time beside the date, the screen kept awake and what others cross off celebrated, nothing to edit but a tap, a
// slow drift so nothing burns in, the way out, and the one-time ask for sound. Kept per device (dev.kitchen), so a
// tablet on the wall comes back to it after a reload; ?kitchen asks for it without keeping it, and ?kitchen=screen is
// a screen nobody can touch (the iPhone's external display).
//
// app.js keeps only what has to run inside the press (setKitchen: the class, full screen, the wake lock) and the
// gates that hold editing back while it is on (kitchenOn); everything else is here, loaded with the display and never
// at first paint — the first cut kept it in app.js and cost 40–50 ms of mobile first paint for everyone (PLAN.md).
// kitchen.css is its stylesheet, asked for with the page's own build (COMPATIBILITY.md §6).

let A = null, on = false, screen = false, full = false;
let ro = null, mo = null, fitRaf = 0, clockT = 0, driftT = 0, soundT = 0, leaveT = 0, drift = 0, lastMove = null;
let clock = null, leaveBtn = null, soundBtn = null, cssP = null;
const $ = id => document.getElementById(id);

/** The drift: a step every four minutes through eight offsets within two pixels, eased over eight seconds (kitchen.css),
    so the rail and the lines never sit on the same pixels for long. Nobody watching sees it move. */
const DRIFT = [[0, 0], [2, 1], [-1, 2], [-2, -1], [1, -2], [2, -2], [-2, 2], [-1, -1]];
const DRIFT_MS = 4 * 60 * 1000;
const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';

function css(build) {
  if (!cssP) cssP = new Promise(res => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "kitchen.css" + (build ? "?v=" + build : ""); l.dataset.kitchen = "1";
    l.onload = () => res(true); l.onerror = () => { cssP = null; l.remove(); res(false); };
    document.head.appendChild(l);
  });
  return cssP;
}

/* ---------------- the type that fills the screen ---------------- */
/** The largest size at which every line on Today fits the room between the rail and the foot, found by halving. A
    single short line is held to a headline (a sixth of the height, under a twelfth of the width), so it reads as one. */
function fit() {
  fitRaf = 0;
  if (!on) return;
  const list = $("list"), main = $("main");
  if (!list || !main) return;
  const cs = getComputedStyle(main);
  const room = main.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (room > 0 && list.children.length) {
    let hi = Math.max(24, Math.min(innerHeight * 0.16, innerWidth * 0.13, 240)), lo = Math.min(24, hi);
    const fits = px => { list.style.setProperty("--k-size", px.toFixed(1) + "px"); return list.scrollHeight <= room + 0.5; };
    if (!fits(hi)) {
      for (let i = 0; i < 11 && hi - lo > 0.5; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
      fits(lo);
    }
  }
  document.documentElement.classList.add("k-ready");
}
function refit() { if (on && !fitRaf) fitRaf = requestAnimationFrame(fit); }

/* ---------------- the time ---------------- */
const TIME = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
function tick() {
  clearTimeout(clockT);
  if (!on || !clock) return;
  clock.textContent = TIME.format(new Date());
  clockT = setTimeout(tick, 60000 - (Date.now() % 60000) + 40); // on the minute, not a minute from whenever
}

/* ---------------- the drift ---------------- */
function step() {
  drift = (drift + 1) % DRIFT.length;
  const [x, y] = DRIFT[drift], r = document.documentElement.style;
  r.setProperty("--k-dx", x + "px"); r.setProperty("--k-dy", y + "px");
}

/* ---------------- the way out, and sound ---------------- */
function showLeave(ms = 3500) {
  if (!on || screen || !leaveBtn) return;
  leaveBtn.classList.add("on");
  clearTimeout(leaveT); leaveT = setTimeout(() => { if (document.activeElement !== leaveBtn) leaveBtn.classList.remove("on"); }, ms);
}
/** A browser makes no sound until it has been touched, and a screen on the wall may not be touched for days after a
    reload: until the page can play, a chip asks for the one tap that lets it. Never on a muted device, never on a
    screen nobody can touch. */
function checkSound() {
  if (!on || !soundBtn) return;
  const st = A.sound.state().state;
  soundBtn.classList.toggle("on", !screen && !A.dev.muted && st !== "running");
}
function onDown(e) {
  if (!on) return;
  A.sound.prime(); setTimeout(checkSound, 350); // inside the gesture, which is the only place a browser lets it start
  if (!e.target.closest || !e.target.closest("#list .row, #k-leave, #k-sound")) showLeave(); // a line is for crossing off
}
function onMove(e) {
  if (!on || e.pointerType !== "mouse") return;
  if (lastMove && Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y) < 6) return;
  lastMove = { x: e.clientX, y: e.clientY }; showLeave();
}
function onVisible() { if (document.visibilityState !== "visible") return; tick(); checkSound(); refit(); }

/* ---------------- on and off ---------------- */
/** app.js setKitchen hands over here once the module has loaded: on, with what was asked (`o.screen`, `o.full`,
    `o.persist` — false when restored rather than chosen), or off. */
export function set(api, want, o = {}) {
  A = api;
  if (want) {
    if (A.editing) A.commitEdit();
    if (A.view !== "today") A.setView("today");
    full = !!o.full;
    enter(api, { screen: !!o.screen, fresh: o.persist !== false });
  } else {
    if (full && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    full = false;
    leave();
  }
}

/** `screen`: a screen nobody can touch (the iPhone's external display): no way out to show, no ask for sound.
    `fresh`: chosen just now rather than restored on a reload, so the way out stays up a little longer. */
export async function enter(api, { screen: s = false, fresh = false } = {}) {
  A = api; screen = !!s;
  if (on) return;
  on = true;
  const ready = await Promise.race([css(A.BUILD), new Promise(r => setTimeout(() => r(false), 2500))]);
  if (!on) return;
  if (!ready) document.documentElement.classList.add("k-ready"); // never a blank screen for want of a stylesheet

  clock = document.createElement("span"); clock.id = "k-clock"; clock.setAttribute("aria-hidden", "true");
  const railR = document.querySelector(".rail-r"); if (railR) railR.appendChild(clock);
  leaveBtn = document.createElement("button"); leaveBtn.type = "button"; leaveBtn.id = "k-leave";
  leaveBtn.innerHTML = X + "<span>Leave kitchen display</span>";
  leaveBtn.addEventListener("click", () => A.setKitchen(false));
  leaveBtn.addEventListener("focus", () => showLeave(1e9));
  leaveBtn.addEventListener("blur", () => showLeave());
  soundBtn = document.createElement("button"); soundBtn.type = "button"; soundBtn.id = "k-sound";
  soundBtn.innerHTML = SPEAKER + "<span>Tap for sound</span>";
  soundBtn.addEventListener("click", () => { A.sound.prime(); setTimeout(checkSound, 350); });
  document.body.append(leaveBtn, soundBtn);

  ro = new ResizeObserver(refit); ro.observe($("main"));
  mo = new MutationObserver(refit); mo.observe($("list"), { childList: true, subtree: true, characterData: true });
  if (document.fonts) { document.fonts.addEventListener("loadingdone", refit); document.fonts.ready.then(refit); }
  document.addEventListener("pointerdown", onDown, true);
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("visibilitychange", onVisible);
  drift = 0; driftT = setInterval(step, DRIFT_MS);
  soundT = setInterval(checkSound, 1500);
  // A context asked for now, outside any gesture, says whether this browser lets the page play without a touch (the
  // iPhone's shell does; most browsers do not). If not, the chip asks; the next tap makes a fresh one (sound.js).
  if (!A.dev.muted) A.sound.prime();
  tick(); fit(); setTimeout(checkSound, 400);
  showLeave(fresh ? 6000 : 4000);
}

export function leave() {
  if (!on) return;
  on = false;
  cancelAnimationFrame(fitRaf); fitRaf = 0;
  clearTimeout(clockT); clearInterval(driftT); clearInterval(soundT); clearTimeout(leaveT);
  if (ro) ro.disconnect(); if (mo) mo.disconnect(); ro = mo = null;
  if (document.fonts) document.fonts.removeEventListener("loadingdone", refit);
  document.removeEventListener("pointerdown", onDown, true);
  document.removeEventListener("pointermove", onMove);
  document.removeEventListener("visibilitychange", onVisible);
  for (const el of [clock, leaveBtn, soundBtn]) if (el) el.remove();
  clock = leaveBtn = soundBtn = null; lastMove = null;
  const list = $("list"); if (list) list.style.removeProperty("--k-size");
  const r = document.documentElement.style; r.removeProperty("--k-dx"); r.removeProperty("--k-dy");
}

/** For the instruments: what the display is doing, never what the list says. */
export function state() {
  const list = $("list"), main = $("main");
  const room = main ? main.clientHeight - parseFloat(getComputedStyle(main).paddingTop) - parseFloat(getComputedStyle(main).paddingBottom) : 0;
  return {
    on, screen, ready: document.documentElement.classList.contains("k-ready"),
    size: list ? parseFloat(list.style.getPropertyValue("--k-size")) || 0 : 0,
    fits: list ? list.scrollHeight <= room + 0.5 : false,
    clock: clock ? clock.textContent : "", drift,
    leave: !!leaveBtn && leaveBtn.classList.contains("on"), sound: !!soundBtn && soundBtn.classList.contains("on")
  };
}
/** Test hook: the next drift step now, rather than in four minutes. */
export function driftNow() { step(); return drift; }
