// fx.js — v1's canvas confetti: ribbons, and hearts/stars for kits that ask for them.

export function createFx(canvas, opts) {
  const get = k => (typeof opts[k] === "function" ? opts[k]() : opts[k]);
  const g2 = canvas.getContext("2d");
  let parts = [], raf = 0;

  function sizeCanvas() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * d); canvas.height = Math.floor(innerHeight * d);
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    g2.setTransform(d, 0, 0, d, 0, 0);
  }
  sizeCanvas();
  addEventListener("resize", sizeCanvas);

  function heart(c, s) {
    const t = s * 0.5;
    c.beginPath();
    c.moveTo(0, t * 0.62);
    c.bezierCurveTo(t * 1.25, -t * 0.60, t * 0.62, -t * 1.52, 0, -t * 0.55);
    c.bezierCurveTo(-t * 0.62, -t * 1.52, -t * 1.25, -t * 0.60, 0, t * 0.62);
    c.closePath(); c.fill();
  }
  function star(c, s) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = (i % 2) ? s * 0.42 : s * 0.95;
      const a = Math.PI / 5 * i - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.closePath(); c.fill();
  }

  function burst(x, y, n, power, spread) {
    if (get("reduced")) return;
    const pal = get("palette") || ["#D26128"], sh = get("shapes") || 1;
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * (spread || 2.0);
      const sp = power * (0.55 + Math.random() * 0.8);
      parts.push({
        x, y,
        vx: Math.cos(a) * sp + (Math.random() - 0.5) * 1.3,
        vy: Math.sin(a) * sp,
        w: 3 + Math.random() * 5, h: 6 + Math.random() * 11,
        s: 5 + Math.random() * 6,
        r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.34,
        c: pal[(Math.random() * pal.length) | 0],
        life: 1, dec: 0.0075 + Math.random() * 0.008,
        rib: Math.random() < 0.45,
        sh: sh === 2 ? (Math.random() < 0.5 ? 0 : 1) : (Math.random() * sh) | 0
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    g2.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += 0.30; p.vx *= 0.992; p.vy *= 0.992;
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= p.dec;
      if (p.life <= 0 || p.y > innerHeight + 70) { parts.splice(i, 1); continue; }
      g2.save(); g2.translate(p.x, p.y); g2.rotate(p.r);
      g2.globalAlpha = Math.max(0, Math.min(1, p.life * 1.7));
      g2.fillStyle = p.c;
      if (p.sh === 1) heart(g2, p.s);
      else if (p.sh === 2) star(g2, p.s);
      else {
        const hh = p.rib ? p.h * Math.abs(Math.cos(p.r * 1.7)) : p.h;
        g2.fillRect(-p.w / 2, -hh / 2, p.w, hh);
      }
      g2.restore();
    }
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = 0; g2.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function volley() {
    if (get("reduced")) return;
    const w = innerWidth, h = innerHeight;
    for (let i = 0; i < 7; i++) setTimeout(() => burst(w * (0.08 + 0.14 * i), h * 0.97, 26, 19, 1.15), i * 65);
    setTimeout(() => burst(w * 0.5, h * 0.6, 40, 14, 2.6), 210);
  }
  return { burst, volley };
}
