// Easing curves and least-squares fitting. No dependencies.

// Evaluates cubic-bezier(x1,y1,x2,y2) at x ∈ [0,1].
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dsx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return sy(t);
      const d = dsx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

const backOut = (t, c1 = 1.70158) => { const c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };

// GSAP name · CSS equivalent (when there is an exact one or the usual easings.net approximation).
export const CANDIDATES = [
  { name: 'linear', css: 'linear', f: (t) => t },
  { name: 'CSS ease', css: 'ease', f: cubicBezier(0.25, 0.1, 0.25, 1) },
  { name: 'CSS ease-in', css: 'ease-in', f: cubicBezier(0.42, 0, 1, 1) },
  { name: 'CSS ease-out', css: 'ease-out', f: cubicBezier(0, 0, 0.58, 1) },
  { name: 'CSS ease-in-out', css: 'ease-in-out', f: cubicBezier(0.42, 0, 0.58, 1) },
  { name: 'Material standard', css: 'cubic-bezier(0.4, 0, 0.2, 1)', f: cubicBezier(0.4, 0, 0.2, 1) },
  { name: 'sine.out', css: 'cubic-bezier(0.61, 1, 0.88, 1)', f: (t) => Math.sin((t * Math.PI) / 2) },
  { name: 'sine.inOut', css: 'cubic-bezier(0.37, 0, 0.63, 1)', f: (t) => -(Math.cos(Math.PI * t) - 1) / 2 },
  { name: 'power1.out (quad)', css: 'cubic-bezier(0.5, 1, 0.89, 1)', f: (t) => 1 - (1 - t) ** 2 },
  { name: 'power1.in (quad)', css: 'cubic-bezier(0.11, 0, 0.5, 0)', f: (t) => t ** 2 },
  { name: 'power1.inOut (quad)', css: 'cubic-bezier(0.45, 0, 0.55, 1)', f: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2) },
  { name: 'power2.out (cubic)', css: 'cubic-bezier(0.33, 1, 0.68, 1)', f: (t) => 1 - (1 - t) ** 3 },
  { name: 'power2.in (cubic)', css: 'cubic-bezier(0.32, 0, 0.67, 0)', f: (t) => t ** 3 },
  { name: 'power2.inOut (cubic)', css: 'cubic-bezier(0.65, 0, 0.35, 1)', f: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2) },
  { name: 'power3.out (quart)', css: 'cubic-bezier(0.25, 1, 0.5, 1)', f: (t) => 1 - (1 - t) ** 4 },
  { name: 'power3.inOut (quart)', css: 'cubic-bezier(0.76, 0, 0.24, 1)', f: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2) },
  { name: 'power4.out (quint)', css: 'cubic-bezier(0.22, 1, 0.36, 1)', f: (t) => 1 - (1 - t) ** 5 },
  { name: 'power4.inOut (quint)', css: 'cubic-bezier(0.83, 0, 0.17, 1)', f: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2) },
  { name: 'expo.out', css: 'cubic-bezier(0.16, 1, 0.3, 1)', f: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)) },
  { name: 'expo.inOut', css: 'cubic-bezier(0.87, 0, 0.13, 1)', f: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2) },
  { name: 'circ.out', css: 'cubic-bezier(0, 0.55, 0.45, 1)', f: (t) => Math.sqrt(1 - (t - 1) ** 2) },
  { name: 'back.out(1.7)', css: 'cubic-bezier(0.34, 1.56, 0.64, 1)', f: (t) => backOut(t) },
];

// Resamples a series [{t, v}] to n points of normalized progress (0→1 in time and in value).
export function normalize(samples, n = 50) {
  const t0 = samples[0].t, t1 = samples[samples.length - 1].t;
  const v0 = samples[0].v, v1 = samples[samples.length - 1].v;
  const span = t1 - t0, dv = v1 - v0;
  if (span <= 0 || Math.abs(dv) < 1e-9) return null;
  const pts = samples.map((s) => ({ x: (s.t - t0) / span, y: (s.v - v0) / dv }));
  const out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    while (j < pts.length - 2 && pts[j + 1].x < x) j++;
    const a = pts[j], b = pts[j + 1] || a;
    const k = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
    out.push(+(a.y + (b.y - a.y) * k).toFixed(4));
  }
  return out;
}

export function rmse(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / a.length);
}

// Returns the 3 candidates most similar to a normalized curve.
export function fitCurve(curve) {
  const n = curve.length;
  return CANDIDATES.map((c) => ({
    name: c.name,
    css: c.css,
    error: +rmse(curve, Array.from({ length: n }, (_, i) => c.f(i / (n - 1)))).toFixed(4),
  })).sort((a, b) => a.error - b.error).slice(0, 3);
}

// Pearson correlation, to know whether a value follows the scroll (scrub) instead of time.
export function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}
