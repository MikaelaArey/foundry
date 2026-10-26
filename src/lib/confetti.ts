/** A short confetti burst from a point on screen. Skipped for reduced motion. */
export function burst(x: number, y: number, color: string) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let cv = document.getElementById("confetti") as HTMLCanvasElement | null;
  if (!cv) {
    cv = document.createElement("canvas");
    cv.id = "confetti";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
  }
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const colors = [color, css.getPropertyValue("--brand").trim(), css.getPropertyValue("--warm").trim(), css.getPropertyValue("--brand-2").trim()];
  const parts = Array.from({ length: 90 }, () => ({
    x,
    y,
    vx: (Math.random() - 0.5) * 11,
    vy: -Math.random() * 10 - 3,
    r: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.35,
    w: 5 + Math.random() * 5,
    h: 3 + Math.random() * 4,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  const step = (t: number) => {
    const el = t - t0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - el / 1500);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (el < 1500) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(step);
}
