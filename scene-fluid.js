// scene-fluid.js — 1.12 b411: Light's and Dark's scene, the second time round (scene-orbit.js's liquid drops were the
// first). Paint on water, worked out as water: the Navier–Stokes equations for an incompressible flow, solved on the
// graphics card thirty times a second (WebGL2, stable fluids — semi-Lagrangian advection traced back by the midpoint,
// vorticity confinement, a pressure projection by Jacobi iteration — with the paint carried by a MacCormack scheme, so
// it stays crisp however thin it is drawn). The list's words are solid: the stage says where they are, they go into the
// grid as rounded blocks (a line's box with its words), and the paint flows round them, curls off their ends, and never
// runs under them — so the words need no pad.
// Light is marbling, ebru, in ebru's own inks — crimson, indigo, a soft blue and sage on the paper — mixed the way inks
// mix (each takes its share of the light: Beer–Lambert), matte, as marbled paper is once it is lifted. Dark is the same
// water poured in metals — abalone's: teal, violet, blue and silver — under a studio's softboxes, seen from a little way
// off so a flat pool catches the light across it, its edges dark and bright where they turn. (1.12 b437: until then
// Light's inks were the kit's own burnt orange, slate, steel blue and rust, with a wet sheen, and Dark's were gold, copper
// and bronze; round drops of orange and gold ringed in white read as eggs.)
// The loop, fifteen seconds: drops land, each pushing the rings before it outward (a drop is a source in the flow, as on
// a marbler's tray); a comb is drawn through them; two vortices wind them into spirals; a last drop blooms in the middle
// of one; it settles. While the list is in use the paint drifts on three slow eddies, the pointer or a finger drags it
// as it goes, and a line crossed off with a tap puts a small drop by its end. The finale: every stone at once, in every
// colour, and the two biggest wound up together. Thin paint clears away as it fades, so the page never silts up; the
// picture carries on from one pass into the next as water does, and a moment asked for out of turn (the lab, the
// instruments) is worked out again from the start of the visit (one hours in, from the start of the pass before it).
// 1.12 b422: the long day's hour eggs. Left alone an hour, the water plays one of two pieces of its own, by turns: a
// stone crosses a pool and leaves von Kármán's vortex street behind it, or a galaxy winds itself up out of a line of
// drops. Each lays the water's motion down itself, as the egg's stir does, so it comes out crisp on any screen.
export default function fluid(K, id) {
  const night = id === "dark";
  const { clamp, lerp, E, env, deal, bag } = K, LOOP = K.LOOP, TAU = Math.PI * 2;
  const lin = h => K.rgb(h).map(v => (v /= 255) <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
  const GROUND = lin(night ? "#070A08" : "#FAF8F4");
  // Light's inks, each the colour it is at full strength on the paper (absorbance: −ln of that over the paper)
  const INKS = ["#B32A3C", "#212F55", "#7FA6CC", "#5E9278"].map(h => lin(h).map((v, i) => -Math.log(Math.max(v, 1e-4) / GROUND[i])));
  // Dark's metals (what they reflect) and the glow of each where it pools
  const METALS = [[.28, .86, .76], [.56, .38, .95], [.25, .5, 1], [.9, .92, .95]], GLOWS = ["#3CC8B0", "#7A4FD8", "#2E64E0", "#E6ECF4"].map(lin);
  const ONE = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], CLEAR = [0, 0, 0, 0], ink = k => k < 0 ? CLEAR : ONE[k & 3];
  const MAXR = 120, MAXF = 24, MAXD = 20, MAXS = 16, PAD = [14, 10], FADE = 10, PASSIVE = { passive: true, capture: true };

  /* ---------------- the solver, on the graphics card ---------------- */
  const VS = "#version 300 es\nin vec2 aP; out vec2 vUv; void main() { vUv = aP * .5 + .5; gl_Position = vec4(aP, 0., 1.); }";
  const HEAD = "#version 300 es\nprecision highp float; precision highp sampler2D; precision highp int;\nin vec2 vUv; out vec4 o;\n" +
    "uniform sampler2D uM;\nint fl(ivec2 c) { return int(texelFetch(uM, c, 0).x + .5); }\n" + // a cell's flags: 16 if it is solid, 1 2 4 8 for a solid neighbour left, right, below, above
    "vec2 back(sampler2D v, vec2 uv, float dt, vec2 inv) { return uv - dt * texture(v, uv - .5 * dt * texture(v, uv).xy * inv).xy * inv; }\n"; // where the water at uv was a step ago, found by the midpoint: second order, so an eddy keeps its radius (first order drifts outward, and the same way whichever way it turns)
  const FS = {
    // the words, as rounded blocks: the distance in px from each cell to the nearest (negative inside)
    obs: `uniform vec4 uR[${MAXR}]; uniform int uN; uniform vec2 uCell, uPad; uniform float uRo;
void main() { vec2 p = gl_FragCoord.xy * uCell; float d = 1e4;
  for (int i = 0; i < ${MAXR}; i++) { if (i >= uN) break; vec4 r = uR[i]; vec2 c = .5 * (r.xy + r.zw), h = .5 * (r.zw - r.xy) + uPad; float ro = min(uRo, min(h.x, h.y)); vec2 q = abs(p - c) - h + ro;
    d = min(d, length(max(q, 0.)) + min(max(q.x, q.y), 0.) - ro); }
  o = vec4(d, 0., 0., 1.); }`,
    flags: `uniform sampler2D uS;
bool so(ivec2 c) { ivec2 n = textureSize(uS, 0); return c.x < 0 || c.y < 0 || c.x >= n.x || c.y >= n.y || texelFetch(uS, c, 0).x < 0.; }
void main() { ivec2 c = ivec2(gl_FragCoord.xy);
  o = vec4((so(c) ? 16. : 0.) + (so(c - ivec2(1, 0)) ? 1. : 0.) + (so(c + ivec2(1, 0)) ? 2. : 0.) + (so(c - ivec2(0, 1)) ? 4. : 0.) + (so(c + ivec2(0, 1)) ? 8. : 0.), 0., 0., 1.); }`,
    // the water carries itself along, and slows
    adv: `uniform sampler2D uV; uniform vec2 uInv; uniform float uDt, uKeep;
void main() { if (fl(ivec2(gl_FragCoord.xy)) >= 16) { o = vec4(0.); return; }
  o = vec4(texture(uV, back(uV, vUv, uDt, uInv)).xy * uKeep, 0., 1.); }`,
    // vorticity confinement, and what the scene does to the water: pushes, drags (a stylus, a comb's tine, a finger),
    // swirls, a comb's whole row of tines, a shear
    force: `uniform sampler2D uV; uniform float uDt, uEps, uSet; uniform vec2 uCell; uniform vec4 uA[${MAXF}], uB[${MAXF}], uE[${MAXF}]; uniform int uN;
vec2 at(ivec2 c) { return texelFetch(uV, clamp(c, ivec2(0), textureSize(uV, 0) - 1), 0).xy; }
float curl(ivec2 c) { return .5 * (at(c + ivec2(1, 0)).y - at(c - ivec2(1, 0)).y - at(c + ivec2(0, 1)).x + at(c - ivec2(0, 1)).x); }
void main() { ivec2 c = ivec2(gl_FragCoord.xy);
  if (fl(c) >= 16) { o = vec4(0.); return; }
  vec2 v = vec2(0.);
  if (uSet < .5) { v = at(c);
    if (uEps > 0.) { float L = abs(curl(c - ivec2(1, 0))), R = abs(curl(c + ivec2(1, 0))), B = abs(curl(c - ivec2(0, 1))), T = abs(curl(c + ivec2(0, 1)));
      vec2 f = vec2(T - B, L - R); v += f * (uEps * curl(c) / (length(f) + 1e-4)) * uDt; } }
  vec2 p = gl_FragCoord.xy * uCell;
  for (int i = 0; i < ${MAXF}; i++) { if (i >= uN) break; vec4 a = uA[i], b = uB[i]; vec2 d = p - a.xy; int k = int(a.w + .5);
    if (k == 4) { vec2 u = normalize(b.xy); float a0 = dot(d, vec2(-u.y, u.x)), al = mod(a0 + .5 * b.w, b.w) - .5 * b.w, ac = dot(d, u), win = uE[i].x > 0. ? exp(-pow(abs(a0) / uE[i].x, 8.)) : 1.; v += (b.xy - v) * min(1., b.z * win * exp(-(al * al + ac * ac) / (a.z * a.z)) * uDt); continue; }
    float g = exp(-dot(d, d) / (a.z * a.z));
    if (k == 0) v += b.xy * g * uDt;
    else if (k == 1) v += (b.xy - v) * min(1., b.z * g * uDt);
    else if (k == 2) v += b.z * vec2(-d.y, d.x) / a.z * g * uDt;
    else if (k == 3) { float y = d.y / a.z, w = exp(-y * y * .15); v.x += (b.x * tanh(y) - v.x) * min(1., b.z * w * uDt); v.y += b.y * sin(p.x * b.w) * w * uDt; }
    else if (k == 5) v += b.z * vec2(-d.y, d.x) * g; } // a spin laid down whole (with uSet: the egg's stir, which has to run backward exactly)
  o = vec4(v, 0., 1.); }`,
    // how much the water spreads or gathers at each cell, less the paint being poured in (a drop is a source)
    div: `uniform sampler2D uV; uniform vec4 uS[${MAXS}]; uniform int uNS; uniform float uSink, uH; uniform vec2 uCell;
void main() { ivec2 c = ivec2(gl_FragCoord.xy); int f = fl(c);
  if (f >= 16) { o = vec4(0.); return; }
  float L = (f & 1) != 0 ? 0. : texelFetch(uV, c - ivec2(1, 0), 0).x, R = (f & 2) != 0 ? 0. : texelFetch(uV, c + ivec2(1, 0), 0).x, B = (f & 4) != 0 ? 0. : texelFetch(uV, c - ivec2(0, 1), 0).y, T = (f & 8) != 0 ? 0. : texelFetch(uV, c + ivec2(0, 1), 0).y;
  vec2 p = gl_FragCoord.xy * uCell; float s = 0.;
  for (int i = 0; i < ${MAXS}; i++) { if (i >= uNS) break; vec4 e = uS[i]; s += e.w * (1. - smoothstep(e.z - 1.5 * uH, e.z + .5 * uH, length(p - e.xy))); }
  o = vec4(.5 * (R - L + T - B) - uH * (s - uSink), 0., 0., 1.); }`,
    jac: `uniform sampler2D uP, uD; uniform float uK;
float P(ivec2 c) { return uK * texelFetch(uP, c, 0).x; }
float one(ivec2 x) { int f = fl(x); float C = P(x);
  return (((f & 1) != 0 ? C : P(x - ivec2(1, 0))) + ((f & 2) != 0 ? C : P(x + ivec2(1, 0))) + ((f & 4) != 0 ? C : P(x - ivec2(0, 1))) + ((f & 8) != 0 ? C : P(x + ivec2(0, 1))) - texelFetch(uD, x, 0).x) * .25; }
void main() { ivec2 c = ivec2(gl_FragCoord.xy); int f = fl(c); // two Jacobi iterations in one pass: the first worked out at this cell and its neighbours
  if (f >= 16) { o = vec4(0.); return; }
  float C = one(c);
  o = vec4((((f & 1) != 0 ? C : one(c - ivec2(1, 0))) + ((f & 2) != 0 ? C : one(c + ivec2(1, 0))) + ((f & 4) != 0 ? C : one(c - ivec2(0, 1))) + ((f & 8) != 0 ? C : one(c + ivec2(0, 1))) - texelFetch(uD, c, 0).x) * .25, 0., 0., 1.); }`,
    grad: `uniform sampler2D uP, uV;
void main() { ivec2 c = ivec2(gl_FragCoord.xy); int f = fl(c);
  if (f >= 16) { o = vec4(0.); return; }
  float C = texelFetch(uP, c, 0).x, L = (f & 1) != 0 ? C : texelFetch(uP, c - ivec2(1, 0), 0).x, R = (f & 2) != 0 ? C : texelFetch(uP, c + ivec2(1, 0), 0).x, B = (f & 4) != 0 ? C : texelFetch(uP, c - ivec2(0, 1), 0).x, T = (f & 8) != 0 ? C : texelFetch(uP, c + ivec2(0, 1), 0).x;
  vec2 v = texelFetch(uV, c, 0).xy - .5 * vec2(R - L, T - B);
  if ((f & 1) != 0) v.x = max(v.x, 0.); if ((f & 2) != 0) v.x = min(v.x, 0.); if ((f & 4) != 0) v.y = max(v.y, 0.); if ((f & 8) != 0) v.y = min(v.y, 0.);
  o = vec4(v, 0., 1.); }`,
    // the paint, carried a step forward (or, with the step negative, back again: MacCormack's check on itself)
    carry: `uniform sampler2D uV, uS; uniform vec2 uInv; uniform float uDt;
void main() { o = texture(uS, back(uV, vUv, uDt, uInv)); }`,
    // the paint's step: forward, corrected by what the step back missed, kept within what was there; then a little of
    // it fades, the drops and wisps are poured in, and none is left inside a word
    dye: `uniform sampler2D uV, uS, uF, uB, uO; uniform vec2 uInv, uView; uniform float uDt, uSub; uniform vec4 uKeep, uDA[${MAXD}], uDC[${MAXD}]; uniform vec2 uDK[${MAXD}]; uniform int uND;
void main() { vec2 q = back(uV, vUv, uDt, uInv);
  vec4 r = texture(uF, vUv) + .5 * (texture(uS, vUv) - texture(uB, vUv));
  vec2 n = vec2(textureSize(uS, 0)); ivec2 i = ivec2(floor(q * n - .5)), m = ivec2(n) - 1;
  vec4 a = texelFetch(uS, clamp(i, ivec2(0), m), 0), b = texelFetch(uS, clamp(i + ivec2(1, 0), ivec2(0), m), 0), c = texelFetch(uS, clamp(i + ivec2(0, 1), ivec2(0), m), 0), d = texelFetch(uS, clamp(i + ivec2(1), ivec2(0), m), 0);
  r = max(clamp(r, min(min(a, b), min(c, d)), max(max(a, b), max(c, d))) * uKeep - uSub, 0.);
  vec2 p = vUv * uView;
  for (int k = 0; k < ${MAXD}; k++) { if (k >= uND) break; vec4 A = uDA[k]; float e = length(p - A.xy);
    if (A.w < .5) r += uDC[k] * exp(-e * e / (A.z * A.z)) * uDK[k].x * uDt;
    else r = mix(r, uDC[k], (1. - smoothstep(A.z - 1.5, A.z + .5, e)) * min(1., uDK[k].x * uDt)); }
  if (texture(uO, vUv).x < 0.) r = vec4(0.);
  o = clamp(r, 0., 3.); }`,
    // where each drop of water started from (as an offset), carried with the water: the egg's check is drawn through it
    mapc: `uniform sampler2D uV, uS; uniform vec2 uInv; uniform float uDt;
void main() { vec2 q = back(uV, vUv, uDt, uInv); o = vec4(texture(uS, q).xy - (vUv - q), 0., 1.); }`,
    // a new size for the screen: the paint where it was, measured from the top
    move: `uniform sampler2D uS; uniform vec2 uA, uB;
void main() { vec2 q = vUv * uA + uB; o = q.x < 0. || q.y < 0. || q.x > 1. || q.y > 1. ? vec4(0.) : texture(uS, q); }`,
  };
  // the egg's check: two strokes, the second tapering, drawn as far as uRev along them, in the water's starting places
  const CHK = `uniform sampler2D uMap; uniform vec2 uCA, uCB, uCC, uView; uniform float uCW, uRev;
float chk(vec2 uv) { vec2 p = (uv + texture(uMap, uv).xy) * uView, ab = uCB - uCA, bc = uCC - uCB; float l1 = length(ab), l2 = length(bc);
  float h = clamp(dot(p - uCA, ab) / (l1 * l1), 0., clamp(uRev / l1, 0., 1.)), d = length(p - uCA - ab * h) - uCW * (.8 + .35 * h);
  if (uRev > l1) { h = clamp(dot(p - uCB, bc) / (l2 * l2), 0., clamp((uRev - l1) / l2, 0., 1.)); d = min(d, length(p - uCB - bc * h) - uCW * (1.15 - .55 * h)); }
  return smoothstep(.9, -.9, d) * smoothstep(0., uCW, uRev); }
`;
  FS.stamp = CHK + "uniform sampler2D uS; uniform vec4 uCI; void main() { o = mix(texture(uS, vUv), uCI, chk(vUv)); }";
  // what the paint looks like: Light's inks on the paper; Dark's metals under the lights
  const SHOW = CHK + `uniform sampler2D uS, uO; uniform vec2 uTx; uniform float uFade, uBump, uSeed, uChk; uniform vec3 uG; uniform vec4 uCI;
vec4 at(vec2 u) { vec4 c = max(texture(uS, u), 0.); if (uChk > .5) c = mix(c, uCI, chk(u)); return c * smoothstep(0., uFade, texture(uO, u).x); }
vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
`;
  FS.ink = SHOW + `uniform vec3 uK0, uK1, uK2, uK3; uniform float uSpec;
void main() { vec4 c = at(vUv); float s = c.x + c.y + c.z + c.w, cov = 1. - exp(-3. * s);
  vec3 col = uG * exp(-(c.x * uK0 + c.y * uK1 + c.z * uK2 + c.w * uK3));
  vec4 one = vec4(1.); float hx = dot(at(vUv + vec2(uTx.x, 0.)) - at(vUv - vec2(uTx.x, 0.)), one), hy = dot(at(vUv + vec2(0., uTx.y)) - at(vUv - vec2(0., uTx.y)), one);
  vec3 n = normalize(vec3(-uBump * vec2(hx, hy), 1.)), L = normalize(vec3(-.5, .62, .6));
  col *= 1. + .3 * cov * (dot(n, L) - L.z);
  col += uSpec * cov * pow(max(dot(n, normalize(L + vec3(0., 0., 1.))), 0.), 160.);
  o = vec4(srgb(max(col, 0.)) + step(.004, s) * (hash(gl_FragCoord.xy + uSeed) - .5) / 255., 1.); }`;
  FS.metal = SHOW + `uniform vec3 uM0, uM1, uM2, uM3, uE0, uE1, uE2, uE3; uniform float uGlow; uniform vec2 uAsp;
float ht(vec4 c) { return 1. - exp(-2. * dot(c, vec4(1., .72, .5, 1.3))); } // each metal stands at its own height, as mokume-gane's do once etched: a step where two meet
vec3 studio(vec3 R) { vec3 k = normalize(vec3(-.55, .6, .58)), r = normalize(vec3(.8, -.35, .48));
  return vec3(.012) + vec3(1., .9, .76) * .6 * smoothstep(.6, .985, dot(R, normalize(vec3(-.22, .3, 1.)))) + vec3(1., .96, .9) * 3.2 * smoothstep(.9, .985, dot(R, k)) + vec3(.75, .85, 1.) * 1.5 * smoothstep(.93, .99, dot(R, r)) + vec3(.55, .38, .2) * .5 * smoothstep(.38, .08, R.z); }
void main() { vec4 c = at(vUv); float s = c.x + c.y + c.z + c.w, cov = smoothstep(.015, .35, s), w = 1. / max(s, 1e-4);
  vec3 alb = (c.x * uM0 + c.y * uM1 + c.z * uM2 + c.w * uM3) * w, glo = (c.x * uE0 + c.y * uE1 + c.z * uE2 + c.w * uE3) * w;
  float hx = ht(at(vUv + vec2(uTx.x, 0.))) - ht(at(vUv - vec2(uTx.x, 0.))), hy = ht(at(vUv + vec2(0., uTx.y))) - ht(at(vUv - vec2(0., uTx.y)));
  vec3 n = normalize(vec3(-uBump * vec2(hx, hy), 1.)), R = reflect(normalize(vec3((vUv - .5) * uAsp, -1.)), n); // seen from a little way off, so a flat pool catches the light across it
  vec3 col = (alb + (1. - alb) * pow(1. - n.z, 5.)) * studio(R) + glo * uGlow * ht(c);
  o = vec4(srgb(max(mix(uG, col, cov), 0.)) + step(.004, s) * (hash(gl_FragCoord.xy + uSeed) - .5) / 255., 1.); }`;

  const el = document.createElement("canvas");
  let gl = null, ok = false, PR = null, FM = null, err = "";
  let W = 0, H = 0, ds = 1, sw = 0, sh = 0, cx = 1, cy = 1, dw = 0, dh = 0;
  let vel = null, prs = null, dye = null, dv = null, sdf = null, flg = null, ta = null, tb = null, mp = null;
  let rects = [], rectKey = "", obsDirty = true, spotKey = "", spotList = [];
  let started = false, lastA = null, mode = "live", gT = 0, gKey = "", steps = 0, clock = 0, amp = 1, beats = "";
  let kV = .7, kD = 0, kS = 0, hold = false, eps = 0, iters = 16, setV = false, chkOn = false, eggP = -1, eggCut = -1, wipeMap = false, stampNow = false;
  const geo = { A: [0, 0], B: [0, 0], C: [0, 0], w: 1, L: 1, rev: 0 }; // the egg's check: where its strokes run, how thick, how far drawn
  const hand = { x: 0, y: 0, vx: 0, vy: 0, t: -1e9, down: -1e9, dx: 0, dy: 0 }, puffs = [];

  function setup() {
    gl = el.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
    if (!gl) throw new Error("no WebGL2");
    gl.getExtension("EXT_color_buffer_float"); gl.getExtension("EXT_color_buffer_half_float");
    const can = (i, f, ty) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, i, 4, 4, 0, f, ty, null); const b = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, b); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); const y = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE; gl.deleteFramebuffer(b); gl.deleteTexture(t); return y; };
    const H16 = gl.HALF_FLOAT, rgba = can(gl.RGBA16F, gl.RGBA, H16) && [gl.RGBA16F, gl.RGBA, H16];
    if (!rgba) throw new Error("no float targets");
    const rg = can(gl.RG16F, gl.RG, H16) ? [gl.RG16F, gl.RG, H16] : rgba, r = can(gl.R16F, gl.RED, H16) ? [gl.R16F, gl.RED, H16] : rg;
    FM = { rgba, rg, r, r32: can(gl.R32F, gl.RED, gl.FLOAT) ? [gl.R32F, gl.RED, gl.FLOAT] : r }; // the pressure wants the precision when it can have it
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.disable(gl.BLEND);
    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, VS); gl.compileShader(vs);
    PR = {};
    for (const [name, src] of Object.entries(FS)) {
      if (name === (night ? "ink" : "metal")) continue;
      const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, HEAD + src); gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error(name + ": " + gl.getShaderInfoLog(fs));
      const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.bindAttribLocation(p, 0, "aP"); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(name + ": " + gl.getProgramInfoLog(p));
      const u = {}; for (let i = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i--;) { const a = gl.getActiveUniform(p, i); u[a.name.replace(/\[0\]$/, "")] = { l: gl.getUniformLocation(p, a.name), t: a.type, n: a.size }; }
      PR[name] = { p, u };
    }
    PR.show = PR[night ? "metal" : "ink"];
  }
  function target(w, h, f, lin) {
    const t = gl.createTexture(), m = lin ? gl.LINEAR : gl.NEAREST; gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, m); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, m);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, f[0], w, h, 0, f[1], f[2], null);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const o = { tex: t, fb, w, h }; wipe(o); return o;
  }
  const pair = (...a) => { const s = { r: target(...a), w: target(...a), swap() { const x = s.r; s.r = s.w; s.w = x; } }; return s; };
  const wipe = o => { gl.bindFramebuffer(gl.FRAMEBUFFER, o.fb); gl.viewport(0, 0, o.w, o.h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); };
  const kill = o => { if (!o) return; if (o.r) { kill(o.r); kill(o.w); return; } gl.deleteTexture(o.tex); gl.deleteFramebuffer(o.fb); };
  /** one pass: a program over a target (or the screen), its uniforms set by their types */
  function run(pr, out, U) {
    gl.useProgram(pr.p); let unit = 0;
    for (const k in U) {
      const e = pr.u[k]; if (!e) continue; const v = U[k];
      if (e.t === gl.SAMPLER_2D) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, v.tex); gl.uniform1i(e.l, unit++); }
      else if (e.t === gl.FLOAT) gl.uniform1f(e.l, v);
      else if (e.t === gl.FLOAT_VEC2) gl.uniform2fv(e.l, v);
      else if (e.t === gl.FLOAT_VEC3) gl.uniform3fv(e.l, v);
      else if (e.t === gl.FLOAT_VEC4) gl.uniform4fv(e.l, v);
      else if (e.t === gl.INT) gl.uniform1i(e.l, v);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fb : null); gl.viewport(0, 0, out ? out.w : el.width, out ? out.h : el.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------------- what is done to the water, one step's worth ---------------- */
  const fv = { a: new Float32Array(MAXF * 4), b: new Float32Array(MAXF * 4), e: new Float32Array(MAXF * 4), n: 0 };
  const fd = { a: new Float32Array(MAXD * 4), c: new Float32Array(MAXD * 4), k: new Float32Array(MAXD * 2), n: 0 };
  const fsrc = { a: new Float32Array(MAXS * 4), n: 0, area: 0 };
  function V(k, x, y, r, bx, by, bz, bw, e0 = 0) { if (fv.n >= MAXF) return; const i = fv.n++ * 4; fv.a.set([x, y, Math.max(1, r), k], i); fv.b.set([bx, by, bz, bw], i); fv.e[i] = e0; }
  const push = (x, y, r, ax, ay) => V(0, x, y, r, ax * amp, ay * amp, 0, 0);
  const drag = (x, y, r, vx, vy, k) => V(1, x, y, r, vx, vy, k * amp, 0);
  const swirl = (x, y, r, w) => V(2, x, y, r, 0, 0, w * amp, 0);
  const shear = (y, d, U, k, wob, kx) => V(3, 0, y, d, U, wob * amp, k * amp, kx);
  const comb = (x, y, r, vx, vy, k, gap, span = 0) => V(4, x, y, r, vx, vy, k * amp, gap, span);
  const spin = (x, y, r, w) => V(5, x, y, r, 0, 0, w * amp, 0);
  function D(k, x, y, r, col, rate) { if (fd.n >= MAXD || rate <= 0) return; const i = fd.n * 4; fd.a.set([x, y, Math.max(.5, r), k], i); fd.c.set(col, i); fd.k[fd.n * 2] = rate; fd.n++; }
  const wisp = (x, y, r, col, rate) => D(0, x, y, r, col, rate * amp);
  const disc = (x, y, r, col, rate = 60) => D(1, x, y, r, col, rate * amp);
  function src(x, y, r, q) { if (fsrc.n >= MAXS || q <= 0) return; q *= amp; fsrc.a.set([x, y, r, q], fsrc.n++ * 4); fsrc.area += q * Math.PI * r * r; }
  /** a drop of paint landing at (x, y) at t0 and spreading to radius R: a source in the flow, so everything round it is
   *  pushed outward the way a marbler's drop pushes the rings before it, with its own paint inside it (CLEAR: water) */
  function drop(t, t0, x, y, R, col, dur = .55) {
    const u = (t - t0) / dur; if (u <= 0 || u >= 1) return;
    const e = 1 - Math.pow(1 - u, 3), r = Math.max(3, R * Math.sqrt(e));
    src(x, y, r, Math.min(14, 3 * Math.pow(1 - u, 2) / dur / Math.max(e, .05)));
    disc(x, y, r * .97, col);
  }
  /** a stylus drawn through the paint along `path` (u in 0…1 → [x, y]) between t0 and t1, eased in and out */
  function stylus(t, t0, t1, path, r, k = 14) {
    if (t <= t0 || t >= t1) return;
    const u = E.sine((t - t0) / (t1 - t0)), du = .004, a = path(Math.max(0, u - du)), b = path(Math.min(1, u + du)), sp = Math.PI / 2 * Math.sin(Math.PI * (t - t0) / (t1 - t0)) / (t1 - t0) / (2 * du);
    const [x, y] = path(u); drag(x, y, r, (b[0] - a[0]) * sp, (b[1] - a[1]) * sp, k);
  }
  /** a comb drawn through the paint around spot s ([x, y, r]) along `dir` between t0 and t1: its tines reach a little
   *  past the paint either side, and it runs from before it to beyond it */
  function combOver(t, t0, t1, sp, dir, gap, k = 12, off = 0, wave = 0) {
    if (t <= t0 - .05 || t >= t1 + .05) return;
    const [x, y, r] = sp, [dx, dy] = dir, reach = r * 1.3 + gap, u = clamp((t - t0) / (t1 - t0)), pos = lerp(-reach, reach, E.sine(u)), v = 2 * reach * Math.PI / 2 * Math.sin(Math.PI * u) / (t1 - t0);
    const o = off + wave * Math.sin(u * TAU * 2), w = wave * TAU * 2 * Math.cos(u * TAU * 2) / (t1 - t0); // a wave in it: the tines swing side to side as they go
    comb(x + dx * pos - dy * o, y + dy * pos + dx * o, gap * .2, dx * v - dy * w, dy * v + dx * w, k * env(t, t0 - .05, t0 + .2, t1 - .2, t1 + .05), gap, r * 1.25);
  }
  /** a vortex spun up at (x, y) between t0 and t1, turning its middle about `turns` times */
  function vortex(t, t0, t1, x, y, R, turns, sgn = 1) {
    const e = env(t, t0, t0 + .7, t1 - .9, t1); if (e <= 0) return;
    swirl(x, y, R, sgn * e * turns * TAU / Math.max(.5, t1 - t0 - .8) * R * 1.76);
  }

  /* ---------------- where the open water is ---------------- */
  const portrait = () => H > W * 1.05;
  /** the words, as the solver has them: padded, in px from the bottom left */
  const solids = () => rects.map(([l, t, r, b]) => [l - PAD[0], H - b - PAD[1], r + PAD[0], H - t + PAD[1]]);
  /** the open water's biggest clear circles, biggest first ([x, y, r]): the drops land in them */
  function spots() {
    const key = rectKey + "|" + W + "x" + H; if (key === spotKey) return spotList;
    const g = 12, nx = Math.max(1, Math.floor(W / g)), ny = Math.max(1, Math.floor(H / g)), top = H - (portrait() ? 96 : 110), bot = portrait() ? 36 : 44, R = solids(), c = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = (i + .5) * W / nx, y = (j + .5) * H / ny; let d = Math.min(x - 10, W - 10 - x, top - y, y - bot);
      for (const r of R) { if (d < 22) break; d = Math.min(d, Math.hypot(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - y, 0, y - r[3])) - 8); }
      if (d >= 22) c.push([x, y, Math.min(d, Math.min(W, H) * .42)]);
    }
    c.sort((a, b) => b[2] - a[2]);
    const out = []; for (const s of c) { if (out.length >= 6) break; if (out.every(o => Math.hypot(o[0] - s[0], o[1] - s[1]) > (o[2] + s[2]) * .8)) out.push(s); }
    if (!out.length) out.push([W / 2, H * .22, Math.min(W, H) * .12]);
    spotKey = key; spotList = out; return out;
  }
  const spot = k => { const s = spots(); return s[k] || s[k % s.length]; };

  /* ---------------- the loop ---------------- */
  const has = n => spots().length > n;
  /** pass 0, the signature: stones, a comb, two spirals, a bloom, and rest */
  function signature(t) {
    const [ax, ay, ar] = spot(0), [bx, by, br] = spot(1), [qx, qy, qr] = spot(2);
    [[.2, .62, 0], [.65, .48, 1], [1.1, .36, 2], [1.5, .25, 3], [1.9, .13, -1]].forEach(([t0, f, c]) => drop(t, t0, ax, ay, ar * f, ink(c)));
    if (has(1)) [[.45, .56, 2], [.95, .38, 0], [1.4, .21, 1]].forEach(([t0, f, c]) => drop(t, t0, bx, by, br * f, ink(c)));
    if (has(2)) [[.8, .5, 3], [1.3, .28, 2]].forEach(([t0, f, c]) => drop(t, t0, qx, qy, qr * f, ink(c)));
    const cd = portrait() ? [0, -1] : [1, 0]; combOver(t, 2.8, 5.6, spot(0), cd, clamp(ar * .3, 26, 90));
    if (has(1)) combOver(t, 3, 5.6, spot(1), cd, clamp(br * .3, 22, 80));
    if (has(2)) combOver(t, 3.2, 5.6, spot(2), cd, clamp(qr * .3, 22, 80));
    vortex(t, 6, 9.6, ax, ay, ar * .8, 1.3, 1);
    if (has(1)) vortex(t, 6.5, 9.8, bx, by, br * .75, 1.2, -1);
    drop(t, 10.1, ax, ay, ar * .42, ink(0), .7); drop(t, 10.75, ax, ay, ar * .2, CLEAR, .5);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + .3; drop(t, 11.1 + k * .12, ax + Math.cos(a) * ar * .8, ay + Math.sin(a) * ar * .8, Math.max(6, ar * .07), ink(k % 2 ? 3 : 2), .35); }
    beats = "stones comb spirals bloom";
  }
  /* The forever cycle: each pass after the first opens by laying paint on the water, works it, and closes, each from a
     pool of its own (K.bag: every run of a pool's length deals all of it, never the same twice running), in colours,
     sides and turns of its own. Openings: stones; a rain of small drops; a target of fine rings; a ring of drops burst
     outward by water poured in its middle. Middles: a comb (and back, half a tine over); two jets of water fired at
     each other, their eddies trading partners where they meet; a shear the paint rolls up in (Kelvin–Helmholtz); a
     stylus round a figure of eight; a stylus pulled down through each stone, the way a marbler makes tulips; four
     eddies turning against each other. Closes: spirals; a bloom; one great whirl; a wave drawn through. One pass in
     eight is the rare one: rows of drops, raked down and back (gel-git), and a comb drawn across in waves (a bouquet). */
  const OPEN = [
    function stones(t, d) {
      const c = d.cols, [ax, ay, ar] = spot(0), [bx, by, br] = spot(1), [qx, qy, qr] = spot(2);
      [[.2, .6], [.62, .46], [1.02, .33], [1.4, .21], [1.76, .11]].forEach(([t0, f], i) => drop(t, t0, ax, ay, ar * f, i === 4 ? CLEAR : ink(c[i % 4])));
      if (has(1)) [[.4, .55], [.85, .36], [1.25, .18]].forEach(([t0, f], i) => drop(t, t0, bx, by, br * f, ink(c[(i + 1) % 4])));
      if (has(2)) [[.7, .5], [1.15, .27]].forEach(([t0, f], i) => drop(t, t0, qx, qy, qr * f, ink(c[(i + 3) % 4])));
    },
    function rain(t, d, n = 18) {
      const r = deal(d.P, 41), m = Math.min(4, spots().length);
      for (let i = 0; i < n; i++) { const s = spot(Math.floor(r() * m)), a = r() * TAU, q = Math.sqrt(r()) * s[2] * .72, R = clamp(s[2] * (.1 + r() * .13), 7, 38), t0 = .2 + i * 2.5 / n + r() * .05; drop(t, t0, s[0] + Math.cos(a) * q, s[1] + Math.sin(a) * q, R, i % 3 === 2 ? CLEAR : ink(d.cols[i % 2]), .4); }
    },
    function target(t, d) {
      const [ax, ay, ar] = spot(0), c = d.cols;
      for (let i = 0; i < 9; i++) drop(t, .2 + i * .27, ax, ay, ar * (.64 - i * .064), i % 3 === 2 ? CLEAR : ink(c[i % 3 ? 1 : 0]), .42);
      if (has(1)) { const [bx, by, br] = spot(1); for (let i = 0; i < 5; i++) drop(t, .5 + i * .3, bx, by, br * (.55 - i * .1), ink(c[2 + i % 2]), .4); }
    },
    function burst(t, d) {
      const [ax, ay, ar] = spot(0), c = d.cols;
      for (let k = 0; k < 8; k++) { const a = (k / 8 + d.x[0]) * TAU; drop(t, .2 + k * .09, ax + Math.cos(a) * ar * .42, ay + Math.sin(a) * ar * .42, ar * .13, ink(c[k % 4]), .35); }
      drop(t, 1.25, ax, ay, ar * .6, CLEAR, .75); drop(t, 2.1, ax, ay, ar * .16, ink(c[0]), .4);
      if (has(1)) { const [bx, by, br] = spot(1); drop(t, .6, bx, by, br * .5, ink(c[1]), .5); drop(t, 1, bx, by, br * .3, ink(c[2]), .45); }
    },
  ];
  const MID = [
    function comb(t, d) {
      const dir = [[0, -1], [0, 1], [1, 0], [-1, 0]][d.dir];
      for (let i = 0; i < Math.min(2, spots().length); i++) { const sp = spot(i), gap = clamp(sp[2] * (.22 + .16 * d.x[1]), 20, 90), o = i * .25;
        combOver(t, 3.3 + o, 6 + o, sp, dir, gap); if (d.back) combOver(t, 6.2 + o, 8.6 + o, sp, [-dir[0], -dir[1]], gap, 12, gap / 2); }
    },
    function jets(t, d) {
      const [ax, ay, ar] = spot(0), a = d.x[2] * Math.PI, ux = Math.cos(a), uy = Math.sin(a), D = ar * 1.1;
      for (const sg of [1, -1]) stylus(t, 3.4, 4.5, u => [ax - sg * ux * D * (1 - .88 * u), ay - sg * uy * D * (1 - .88 * u)], ar * .14, 16);
      return t > 3.4 && t < 8.8 ? .3 : 0; // and they coast
    },
    function shear(t, d) {
      const [, ay, ar] = spot(0), e = env(t, 3.4, 3.8, 4.6, 5);
      if (e > 0) V(3, 0, ay, ar * .07, ar * 1.2 * d.spin, ar * .25 * amp, 7 * e * amp, TAU / (ar * .62));
      if (t > 3.4 && t < 8.8) { eps = 10; return .3; } // and it rolls up on its own
      return 0;
    },
    function eight(t, d) {
      const [ax, ay, ar] = spot(0), s = ar * .62, ph = d.x[3] * TAU;
      stylus(t, 3.3, 8.5, u => { const th = ph + u * TAU * 1.6, q = 1 + Math.sin(th) ** 2; return [ax + s * Math.cos(th) / q, ay + s * Math.sin(th) * Math.cos(th) / q]; }, ar * .1, 14);
    },
    function tulips(t) {
      for (let i = 0; i < Math.min(3, spots().length); i++) { const [x, y, r] = spot(i), t0 = 3.4 + i * 1.5; stylus(t, t0, t0 + 1.3, u => [x + Math.sin(u * Math.PI) * r * .05, y + r * .95 - u * r * 1.9], r * .07, 16); }
    },
    function pinwheel(t, d) {
      const [ax, ay, ar] = spot(0);
      for (let k = 0; k < 4; k++) { const a = (k / 4 + d.x[0]) * TAU; vortex(t, 3.4 + k * .1, 8.4, ax + Math.cos(a) * ar * .38, ay + Math.sin(a) * ar * .38, ar * .3, .9, k % 2 ? 1 : -1); }
    },
  ];
  const CLOSE = [
    function spirals(t, d) {
      const [ax, ay, ar] = spot(0); vortex(t, 9, 12.6, ax, ay, ar * .8, 1, d.spin);
      if (has(1)) { const [bx, by, br] = spot(1); vortex(t, 9.3, 12.8, bx, by, br * .75, .95, -d.spin); }
    },
    function bloom(t, d) {
      const [ax, ay, ar] = spot(0), c = d.cols;
      drop(t, 9.2, ax, ay, ar * .42, ink(c[0]), .7); drop(t, 9.85, ax, ay, ar * .2, CLEAR, .5);
      for (let k = 0; k < 6; k++) { const a = (k / 6 + d.x[1]) * TAU; drop(t, 10.2 + k * .12, ax + Math.cos(a) * ar * .8, ay + Math.sin(a) * ar * .8, Math.max(6, ar * .07), ink(c[1 + k % 2]), .35); }
    },
    function whirl(t, d) {
      const [ax, ay, ar] = spot(0); vortex(t, 9, 12.4, ax, ay, ar, 2, d.spin); drop(t, 11.5, ax, ay, ar * .22, ink(d.cols[3]), .5);
    },
    function wave(t) {
      const [ax, ay, ar] = spot(0); stylus(t, 9.2, 11.8, u => [ax - ar * 1.1 + u * ar * 2.2, ay + ar * .3 * Math.sin(u * TAU * 1.5)], ar * .1, 14);
      if (has(1)) { const [bx, by, br] = spot(1); stylus(t, 10, 12.4, u => [bx + br * 1.1 - u * br * 2.2, by + br * .3 * Math.sin(u * TAU * 1.5)], br * .1, 14); }
    },
  ];
  /** the rare one: rows of drops, raked down and back (gel-git), then a comb drawn across in waves (a bouquet) */
  function peacock(t, d) {
    for (let i = 0; i < Math.min(2, spots().length); i++) {
      const [x, y, r] = spot(i), n = 5, g = r * 1.5 / n;
      [-1, 0, 1].forEach((q, j) => { for (let k = 0; k < n; k++) { const px = x + (k - (n - 1) / 2) * g, py = y + q * g * 1.05; if (Math.hypot(px - x, py - y) > r * .95) continue; drop(t, .2 + i * .25 + j * .55 + k * .08, px, py, g * .44, ink(d.cols[(j + i) % 4]), .38); } });
    }
    const v = portrait() ? [0, -1] : [1, 0], h = [v[1], -v[0]];
    for (let i = 0; i < Math.min(2, spots().length); i++) { const sp = spot(i), gap = clamp(sp[2] * .2, 18, 60), o = i * .3;
      combOver(t, 3.2 + o, 5.6 + o, sp, v, gap); combOver(t, 5.8 + o, 8.2 + o, sp, [-v[0], -v[1]], gap, 12, gap / 2); combOver(t, 8.6 + o, 12.2 + o, sp, h, gap * 1.3, 9, 0, gap * .45); }
  }
  let planP = -1, plan = null;
  function planFor(P) {
    if (P === planP) return plan;
    const r = deal(P, 23), cols = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]]; }
    plan = { P, cols, rare: r() < .125, o: bag(P, OPEN.length, 1), m: bag(P, MID.length, 2), c: bag(P, CLOSE.length, 3), dir: Math.floor(r() * 4), spin: r() < .5 ? 1 : -1, back: r() < .5, x: [r(), r(), r(), r()] };
    planP = P; return plan;
  }
  /** a dealt pass at loop time t; what it wants of the water's damping (0: the loop's own) */
  function dealt(t, P) {
    const d = planFor(P);
    if (d.rare) { peacock(t, d); beats = "rows gelgit bouquet"; return 0; }
    OPEN[d.o](t, d); const k = MID[d.m](t, d) || 0; CLOSE[d.c](t, d);
    beats = [OPEN[d.o].name, MID[d.m].name, CLOSE[d.c].name].join(" ");
    return k;
  }
  /* The egg, for whoever has left the list alone long enough (K.egg: every twelfth pass, three minutes of it): the water
     remembers. A drop of clear water opens a pool; a check is drawn in it; the water is stirred until the check is
     gone into the swirls around it — and then the stir runs backward, exactly, and every thread of it finds its way
     home, the check whole again (G. I. Taylor's un-mixing, done with a stirring the scene lays down itself rather than
     one it pushes, so it can be played in reverse to the step; the check is drawn through a map of where each drop of
     water started, so it comes back sharp). Then it is pressed into the paint and the water takes it. */
  function eggPass(t, P) {
    const [ax, ay, ar] = spot(0);
    drop(t, .15, ax, ay, ar * .8, CLEAR, .75);
    beats = "egg";
    if (eggCut === P || t < .95 || t >= 12.6) { if (chkOn) stampNow = true; return 0; }
    setV = true;
    if (!chkOn || eggP !== P) {
      const s = ar * 1.25, o = [ax, ay - s * .045]; chkOn = true; eggP = P; wipeMap = true;
      geo.A = [o[0] - s * .45, o[1] + s * .04]; geo.B = [o[0] - s * .14, o[1] - s * .27]; geo.C = [o[0] + s * .46, o[1] + s * .36]; geo.w = s * .075;
      geo.L = Math.hypot(geo.B[0] - geo.A[0], geo.B[1] - geo.A[1]) + Math.hypot(geo.C[0] - geo.B[0], geo.C[1] - geo.B[1]);
    }
    geo.rev = geo.L * E.io(clamp((t - 1) / 1.2));
    const tau = t >= 2.8 && t <= 6.6 ? t - 2.8 : t >= 7.6 && t <= 11.4 ? 11.4 - t : -1;
    if (tau >= 0) { const w = 4.2 * env(tau, 0, .8, 3, 3.8, E.sine) * (t < 7 ? 1 : -1); spin(ax, ay, ar * .9, w); for (const k of [1, -1]) spin(ax + k * ar * .42, ay - k * ar * .1, ar * .34, -1.6 * w); }
    return 0;
  }
  /* 1.12 b422: the long day's hour eggs (K.long: one an hour, from the first hour of loops left alone on, at a moment
     dealt for the visit), the first and second taking turns. */
  /** the wake: a pool of clear water opens, a stone drops in at one side of it and crosses it, and behind it the eddies
   *  it sheds by turns from either shoulder are left in a line, each winding up the ink that runs off that shoulder (by
   *  day crimson on one side and soft blue on the other; by night teal and silver) — von Kármán's vortex street,
   *  the picture fluid dynamics is known by, as a rod drawn through a soap film leaves it. At the far side the stone
   *  stops and sinks, and the eddies wind on, tighter the older they are, and come to rest. The motion is the scene's
   *  own, laid down step by step as the egg's stir is (the stone carries the water it covers; each eddy turns as a
   *  vortex does, fastest in its middle), so the street comes out crisp on any grid. */
  function hourWake(t, P) {
    const [ax, ay, ar] = spot(0), r = deal(P, 81), hd = (r() - .5) * .5 + (r() < .5 ? 0 : Math.PI), ux = Math.cos(hd), uy = Math.sin(hd), nx = -uy, ny = ux;
    const L = ar * 1.45, rho = clamp(ar * .05, 6, 15), sp = rho * 4.2, T0 = 1.3, T1 = 9.6, ra = .8, U = L / (T1 - T0 - ra);
    const s = t <= T0 ? 0 : t >= T1 ? L : t < T0 + ra ? U * (t - T0) ** 2 / (2 * ra) : t > T1 - ra ? L - U * (T1 - t) ** 2 / (2 * ra) : U * (t - T0 - ra / 2);
    const vs = t <= T0 || t >= T1 ? 0 : U * Math.min(1, (t - T0) / ra, (T1 - t) / ra), x = ax + ux * (s - L / 2), y = ay + uy * (s - L / 2);
    const c = night ? [2, 0, 3] : [1, 0, 2]; beats = "wake"; hold = true;
    drop(t, .15, ax, ay, ar * .82, CLEAR, .75); // the pool
    drop(t, .85, ax - ux * L / 2, ay - uy * L / 2, rho, ink(c[0]), .35); // the stone lands
    if (t < 1.2 || t >= 14.2 || amp <= .5) return 0; // a touch, and the water is its own again: the eddies coast and the stone is gone
    setV = true;
    // the eddies, one each `sp` of the run, by turns from either shoulder, each spun up as the stone leaves it behind
    const n = Math.floor((L - 3.5 * rho) / sp), fall = 1 - E.sine(clamp((t - 12.4) / 1.8));
    for (let k = 0; k < n; k++) { const sk = 2.2 * rho + k * sp, g = clamp((s - sk - 1.3 * rho) / (2.5 * rho)); if (g <= 0) continue;
      const sd = k % 2 ? -1 : 1; spin(ax + ux * (sk - L / 2) + sd * nx * rho * 1.05, ay + uy * (sk - L / 2) + sd * ny * rho * 1.05, rho * 2.2, sd * 2.6 * E.sine(g) * fall); }
    // the stone: the water it covers goes with it (asked for at twice its speed, as the water made to go round it takes
    // half back), and at the far side it sinks, smaller and smaller
    const sink = clamp((t - 9.9) / .6);
    if (sink < 1) { drag(x, y, rho, 2 * ux * vs, 2 * uy * vs, 90); disc(x, y, rho, CLEAR, 60); disc(x, y, rho * .8 * (1 - E.sine(sink)), ink(c[0]), 60); } // its ink kept to itself: none of it gets into the eddies
    if (vs > U * .05) for (const sd of [1, -1]) wisp(x - ux * rho * .7 + sd * nx * rho * 1.05, y - uy * rho * .7 + sd * ny * rho * 1.05, rho * .38, ink(c[sd > 0 ? 1 : 2]), 2 * vs / (1.77 * rho * .38));
    return 0;
  }
  /** the galaxy: a pool of clear water opens and turns to night (by day a wash of indigo, a window in the paper; by
   *  night the dark itself); a drop for its heart, and a line of drops through it out to either side (by day of clear
   *  water, so the galaxy is the light in the indigo, as a photograph's is; by night of metal); then the water turns,
   *  nearly as fast out at the edge as near the middle, the way a galaxy turns (Vera Rubin's flat curves), so the line
   *  winds into two trailing arms round a bright core, with knots along them. Then it turns all of a piece, slowly, and
   *  its stars come out. */
  function hourGalaxy(t, P) {
    const [ax, ay, ar] = spot(0), r = deal(P, 83), th = r() * Math.PI, sg = r() < .5 ? 1 : -1, R = ar * .74;
    const sky = night ? null : [0, 1, .6, 0], core = night ? ink(0) : [.32, 0, 0, 0], heart = night ? [1.3, 0, 0, .4] : [.12, 0, 0, 0], arm = night ? ink(3) : CLEAR, knot = night ? ink(1) : [.42, 0, 0, 0], star = night ? ink(3) : CLEAR;
    beats = "galaxy"; hold = true;
    drop(t, .15, ax, ay, ar * .82, CLEAR, .75); // the pool
    if (sky && t > .9 && t < 2.15) { const S = u => { u = clamp((u - .9) / 1.2); return u * u * (3 - 2 * u); }, s0 = S(t - 1 / 30), f = (S(t) - s0) / Math.max(1e-3, 1 - s0); disc(ax, ay, ar * .8, sky, f * 30); } // night falls in it, eased in and out over a second
    drop(t, 2.1, ax, ay, R * .2, core, .55); drop(t, 2.45, ax, ay, R * .09, heart, .4); // the heart
    for (let k = 0; k < 9; k++) for (const sd of [1, -1]) { const q = R * (.24 + k * .0875), t0 = 2.3 + k * .13 + (sd < 0 ? .06 : 0); drop(t, t0, ax + sd * Math.cos(th) * q, ay + sd * Math.sin(th) * q, R * (.11 - k * .0065), k % 3 === 2 ? knot : arm, .35); }
    const st = deal(P, 85); for (let i = 0; i < 36; i++) { const a = st() * TAU, q = R * (.28 + .8 * Math.sqrt(st())), t0 = 9 + i * .08 + st() * .08, b = st(); if (q < ar * .77) drop(t, t0, ax + Math.cos(a) * q, ay + Math.sin(a) * q, Math.max(1.6, R * .006) * (1 + b * b * 1.6), star, .25); } // a few bright, most faint
    if (t < 3.7 || t >= 14.2 || amp <= .5) return 0;
    setV = true;
    const k = .15 * sg * env(t, 3.7, 4.6, 8.1, 9.1, E.sine); // the winding (its speed over its size, a second)
    if (k) { spin(ax, ay, R * .18, 1.46 * k); spin(ax, ay, R * .65, 4.36 * k); }
    const w = .13 * sg * env(t, 8.3, 9.5, 12.6, 14.2, E.sine); if (w) spin(ax, ay, R * 1.6, w); // and the whole of it turning
    return 0;
  }
  /** the day is done: a flower in each of the biggest open spaces, made as a marbler makes one — a stone of rings, then a
   *  stylus drawn in from beyond it toward its middle at each petal, all at once — and the biggest turned a little */
  function finale(f) {
    const n = Math.min(3, spots().length);
    for (let i = 0; i < n; i++) {
      const [x, y, r] = spot(i), o = i * .1, pet = i ? 4 : 5;
      drop(f, o, x, y, r * .58, ink(i), .4); drop(f, o + .25, x, y, r * .4, ink(i + 1), .35); drop(f, o + .48, x, y, r * .22, ink(i + 2), .32);
      for (let k = 0; k < pet; k++) { const a = (k / pet + i * .1 + .25) * TAU, c = Math.cos(a), sn = Math.sin(a); stylus(f, o + .95 + k * .04, o + 2.2 + k * .04, u => [x + c * r * lerp(1.2, .12, u), y + sn * r * lerp(1.2, .12, u)], r * .075, 16); }
    }
    const [ax, ay, ar] = spot(0); vortex(f, 2.3, 3.4, ax, ay, ar * .85, .35, 1);
  }
  /** what is done to the water at loop time t of pass P, idle `I`; the finale at its own time `f` (or -1) */
  function forcing(t, I, f, P) {
    fv.n = fd.n = fsrc.n = 0; fsrc.area = 0; eps = 0; iters = 16; setV = false; hold = false;
    let kb = 0; amp = I;
    if (I > .002) { iters = 22; const lg = K.long ? K.long(P) : 0; kb = P === 0 ? (signature(t), 0) : lg === 1 ? hourWake(t, P) : lg === 2 ? hourGalaxy(t, P) : K.egg(P) ? eggPass(t, P) : dealt(t, P); }
    if (chkOn && (eggP !== P || I < .5 || !setV)) { stampNow = true; setV = false; eggCut = eggP; } // the egg over, or cut short: its check, as far as it got, stays in the paint
    kV = lerp(.7, kb || 1.1, I); kD = lerp(Math.LN2 / 300, Math.LN2 / 30, I); kS = lerp(.004, .02, I); // what fades, and what thin paint loses outright
    if (hold) { kD *= .2; kS *= .2; } // an hour egg's picture, fifteen seconds in the making, is still whole at its end
    amp = 1;
    if (!setV) { drift(); hands(); }
    if (f >= 0) finale(f);
    for (let i = puffs.length; i--;) { const [x, y, c0] = puffs[i], a = clock - c0; if (a > .9) { puffs.splice(i, 1); continue; } drop(a, 0, x, y, 15, ink(0), .4); drop(a, .32, x, y, 7, CLEAR, .35); }
  }
  /** the water never quite stops: three slow, wide eddies wander over the page */
  function drift() {
    const m = Math.min(W, H) * .3;
    for (let k = 0; k < 3; k++) { const ph = clock * (.031 + k * .013) + k * 2.4; swirl(W * (.5 + .4 * Math.sin(ph * 1.7 + k)), H * (.5 + .4 * Math.cos(ph * 1.1 + k * 2)), m, (k % 2 ? 1 : -1) * .2 * m * kV); }
  }
  /** the pointer, or a finger, drags the water it passes over */
  function hands() {
    if (mode !== "live" || performance.now() - hand.t > 90) return;
    const sp = Math.hypot(hand.vx, hand.vy); if (sp < 30) return;
    const k = Math.min(1, 1400 / sp); drag(hand.x, hand.y, 22, hand.vx * k, hand.vy * k, 7);
  }
  /** a line crossed off with a tap: a small drop by its end, and water poured into it */
  const onCheck = () => {
    if (performance.now() - hand.down > 1500) return;
    let best = null, bd = 80; for (const r of rects) { if (r[4] !== 1) continue; const d = Math.hypot(Math.max(r[0] - hand.dx, 0, hand.dx - r[2]), Math.max(r[1] - hand.dy, 0, hand.dy - r[3])); if (d < bd) { bd = d; best = r; } }
    if (!best) return; const x = best[2] + PAD[0] + 24; if (x < W - 16) puffs.push([x, H - (best[1] + best[3]) / 2, clock]);
  };
  const onMove = e => { const now = performance.now(), x = e.clientX, y = H - e.clientY, dt = Math.max(8, now - hand.t) / 1000; if (now - hand.t < 120) { hand.vx = lerp(hand.vx, (x - hand.x) / dt, .5); hand.vy = lerp(hand.vy, (y - hand.y) / dt, .5); } else hand.vx = hand.vy = 0; hand.x = x; hand.y = y; hand.t = now; };
  const onDown = e => { hand.dx = e.clientX; hand.dy = e.clientY; hand.down = performance.now(); };

  /** one step of the water: carried, pushed, made incompressible again (the pressure), and the paint carried with it */
  function step(h) {
    const inv = [1 / W, 1 / H], cell = [cx, cy], hc = (cx + cy) / 2;
    if (wipeMap) { wipe(mp.r); wipeMap = false; }
    if (stampNow) { if (chkOn) { run(PR.stamp, dye.w, { uS: dye.r, uCI: eggInk, ...chkU() }); dye.swap(); } chkOn = false; stampNow = false; }
    if (!setV) { run(PR.adv, vel.w, { uM: flg, uV: vel.r, uInv: inv, uDt: h, uKeep: Math.exp(-kV * h) }); vel.swap(); }
    else wipe(prs.r); // the egg's stir: laid down whole each step and made to go round the words, the same each way
    run(PR.force, vel.w, { uM: flg, uV: vel.r, uDt: h, uEps: eps, uSet: setV ? 1 : 0, uCell: cell, uA: fv.a, uB: fv.b, uE: fv.e, uN: fv.n }); vel.swap();
    run(PR.div, dv, { uM: flg, uV: vel.r, uS: fsrc.a, uNS: fsrc.n, uSink: fsrc.area / (W * H * .85), uH: hc, uCell: cell });
    for (let k = 0; k < iters; k += 2) { run(PR.jac, prs.w, { uM: flg, uP: prs.r, uD: dv, uK: k ? 1 : .98 }); prs.swap(); } // two iterations a pass
    run(PR.grad, vel.w, { uM: flg, uP: prs.r, uV: vel.r }); vel.swap();
    run(PR.carry, ta, { uV: vel.r, uS: dye.r, uInv: inv, uDt: h });
    run(PR.carry, tb, { uV: vel.r, uS: ta, uInv: inv, uDt: -h });
    const k = Math.exp(-kD * h);
    run(PR.dye, dye.w, { uV: vel.r, uS: dye.r, uF: ta, uB: tb, uO: sdf, uInv: inv, uView: [W, H], uDt: h, uSub: kS * h, uKeep: [k, k, k, k], uDA: fd.a, uDC: fd.c, uDK: fd.k, uND: fd.n }); dye.swap();
    if (chkOn) { run(PR.mapc, mp.w, { uV: vel.r, uS: mp.r, uInv: inv, uDt: h }); mp.swap(); }
    clock += h; steps++;
  }
  /** the words into the grid: their distance field, and each cell's flags */
  function rebuild() {
    obsDirty = false; let R = solids().map(r => [r[0] + PAD[0], r[1] + PAD[1], r[2] - PAD[0], r[3] - PAD[1]]);
    while (R.length > MAXR) { R.sort((a, b) => b[3] - a[3]); const m = []; for (let i = 0; i < R.length; i += 2) { const a = R[i], b = R[i + 1] || a; m.push([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]); } R = m; }
    const a = new Float32Array(MAXR * 4); R.forEach((r, i) => a.set(r, i * 4));
    run(PR.obs, sdf, { uR: a, uN: R.length, uCell: [cx, cy], uPad: PAD, uRo: 1e4 }); // rounded right through: the water parts round a line's ends
    run(PR.flags, flg, { uS: sdf });
  }
  /** back to the resting picture: still water, and a few stones laid on it and left a moment to settle */
  function reset() {
    for (const o of [vel.r, vel.w, prs.r, prs.w, dye.r, dye.w, mp.r, mp.w]) wipe(o);
    clock = 0; mode = "live"; chkOn = stampNow = wipeMap = false; eggP = eggCut = -1; puffs.length = 0;
    for (let k = 0; k < 50; k++) { forcing(0, 0, -1, 0); amp = 1; signature(k / 20 * .9 + .1); step(1 / 20); }
  }
  const eggInk = [1.15, 0, 0, 0]; // teal; the crimson
  const chkU = () => ({ uMap: mp.r, uCA: geo.A, uCB: geo.B, uCC: geo.C, uCW: geo.w, uRev: geo.rev, uView: [W, H] });
  /** a moment asked for out of turn (the lab, the instruments): worked out again from the start of the visit (a pass
   *  hours in, from the start of the pass before it), one thirtieth of a second at a time, as if left alone throughout
   *  — or on from where the last one got to, if that was less than three passes before (so one pass runs on into the
   *  next, as it does on the page) */
  function seekTo(T, F, P) {
    const fin = F >= 0, at = P * LOOP + T, G = at + (fin ? F * 3.4 : 0), key = fin ? "f" + at : "n";
    if (mode !== "seek" || key !== gKey || G < gT - 1e-6 || G - gT > 3 * LOOP) { reset(); mode = "seek"; gKey = key; gT = P > 4 ? (P - 1) * LOOP : 0; } // a late pass (the long day's, hours in) from the start of the pass before it; a moment soon after the last, on from it
    while (gT < G - 1e-6) { const h = Math.min(1 / 30, G - gT), gm = Math.min(gT + h / 2, at), p = Math.floor(gm / LOOP); forcing(gm - p * LOOP, 1, fin && gT + h / 2 > at ? gT + h / 2 - at : -1, p); step(h); gT += h; } // each step forced at its middle
  }
  function render() {
    const tx = [1.25 / dw, 1.25 / dh], base = { uS: dye.r, uO: sdf, uTx: tx, uFade: FADE, uSeed: steps % 97, uG: GROUND, uChk: chkOn ? 1 : 0, uCI: eggInk, ...chkU() };
    if (night) run(PR.show, null, { ...base, uBump: 6, uGlow: .14, uAsp: [.62 * W / Math.max(W, H), .62 * H / Math.max(W, H)], uM0: METALS[0], uM1: METALS[1], uM2: METALS[2], uM3: METALS[3], uE0: GLOWS[0], uE1: GLOWS[1], uE2: GLOWS[2], uE3: GLOWS[3] });
    else run(PR.show, null, { ...base, uBump: 1.6, uSpec: .12, uK0: INKS[0], uK1: INKS[1], uK2: INKS[2], uK3: INKS[3] });
  }

  /* The graphics card can take its memory back (a phone puts the page away, a driver resets): the canvas would show
     black. It is hidden until the context comes back, then everything is made again and the water starts from rest. */
  const lost = e => { e.preventDefault(); ok = false; el.style.visibility = "hidden"; };
  const restored = () => { try { setup(); vel = prs = dye = dv = sdf = flg = ta = tb = mp = null; ok = true; started = false; S.layout(W, H); el.style.visibility = ""; } catch (e) { err = String(e && e.message || e); ok = false; } };
  const S = {
    res: 1, el, clear: true, wash: night ? .7 : .6, veil: night ? .5 : 1,
    bind() {
      try { setup(); ok = true; } catch (e) { err = String(e && e.message || e); ok = false; el.style.visibility = "hidden"; } // no WebGL2, or no float targets: nothing at all (an opaque canvas never drawn shows black), the kit's own ground
      addEventListener("pointermove", onMove, PASSIVE); addEventListener("pointerdown", onDown, PASSIVE); addEventListener("tf:check", onCheck);
      el.addEventListener("webglcontextlost", lost); el.addEventListener("webglcontextrestored", restored);
    },
    layout(w, h) {
      const oW = W, oH = H, old = started ? dye : null; W = w; H = h; if (!ok || !gl) return; if (!old) kill(dye);
      ds = Math.min(devicePixelRatio || 1, Math.sqrt(1.6e6 / (W * H)));
      el.width = Math.max(1, Math.round(W * ds)); el.height = Math.max(1, Math.round(H * ds)); el.style.width = W + "px"; el.style.height = H + "px";
      const cell = Math.max(2, Math.sqrt(W * H / 48000));
      sw = Math.max(8, Math.round(W / cell)); sh = Math.max(8, Math.round(H / cell)); cx = W / sw; cy = H / sh; dw = Math.round(sw * 3); dh = Math.round(sh * 3);
      for (const o of [vel, prs, dv, sdf, flg, ta, tb]) kill(o);
      vel = pair(sw, sh, FM.rg, true); prs = pair(sw, sh, FM.r32, false); dv = target(sw, sh, FM.r32, false);
      sdf = target(sw, sh, FM.r, true); flg = target(sw, sh, FM.r, false); ta = target(dw, dh, FM.rgba, true); tb = target(dw, dh, FM.rgba, true);
      dye = pair(dw, dh, FM.rgba, true); kill(mp); mp = pair(dw, dh, FM.rg, true); chkOn = false;
      if (old) { run(PR.move, dye.r, { uS: old.r, uA: [W / oW, H / oH], uB: [0, (oH - H) / oH] }); kill(old); } // the paint stays where it was on the page
      obsDirty = true; spotKey = "";
    },
    words(rs) {
      const out = rs.filter(r => r[4] !== 2).map(r => r[4] === 1 ? [r[0] - Math.min(r[3] - r[1], 70), r[1], r[2], r[3], 1] : r); // not a line's tools, there only while it is hovered; a line's box, left of its words, as part of it
      const rail = out.reduce((m, r) => r[4] === 0 && r[1] < H * .15 ? Math.max(m, r[3]) : m, 0); if (rail) out.push([-40, -40, W + 40, rail, 0]); // the bar along the top is a shelf the water stays under, end to end
      const key = out.map(r => r.slice(0, 4).map(Math.round).join(",")).join(";"); if (key === rectKey) return; rectKey = key; rects = out; obsDirty = true;
    },
    draw(T, I, A, F, P = 0) {
      if (!ok || !vel) return;
      if (obsDirty) rebuild();
      if (!started) { reset(); started = true; lastA = A; }
      const dt = A - lastA; lastA = A;
      if (dt > 0 && dt <= .25) {
        mode = "live"; const n = Math.min(2, Math.max(1, Math.ceil(dt * 30 - .01))), h = Math.min(dt, 2 / 30) / n; // at most two steps a frame: on a card that falls behind, the water slows rather than the page
        for (let k = 1; k <= n; k++) { const back = (n - k + .5) * h; let t = T - back, p = P; if (t < 0) { t += LOOP; p = Math.max(0, P - 1); } forcing(t, I, F >= 0 ? Math.max(0, F * 3.4 - back) : -1, p); step(h); }
      } else if (dt !== 0 || mode === "seek") seekTo(T, F, P);
      render();
    },
    info() { return { gl: ok, err, sim: [sw, sh], dye: [dw, dh], px: +ds.toFixed(2), steps, mode, beats, spots: spots().map(s => s.map(Math.round)) }; },
    stop() {
      removeEventListener("pointermove", onMove, PASSIVE); removeEventListener("pointerdown", onDown, PASSIVE); removeEventListener("tf:check", onCheck);
      el.removeEventListener("webglcontextlost", lost); el.removeEventListener("webglcontextrestored", restored);
      if (gl) { const x = gl.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); } ok = false;
    },
  };
  return S;
}
