// Style probe, READ-ONLY. It is evaluated inside the page with:
//   node ../jayka-reverse/scripts/capture-live.mjs <url> --out <folder> --steps 0 --hover 0 --no-reduced --eval style-probe.js
// Returns the most common occurrences of each property, :root variables, loaded fonts
// and the REAL contrast of the visible text/background pairs (using each element's effective background).
(() => {
  const count = (m, k, n = 1) => m.set(k, (m.get(k) || 0) + n);
  const top = (m, n = 12) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));
  const hex = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return c;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const h = '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
    return a < 1 ? `${h} / ${a}` : h;
  };
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r, g, b, a }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  // Effective background: the backgrounds of the ancestors are composited until an opaque one (or white) is reached.
  const effectiveBg = (el) => {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== 'none') return null; // image or gradient: it cannot be calculated
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (const l of layers.reverse()) bg = blend(l, bg);
    return bg;
  };

  const bgs = new Map(), colors = new Map(), borders = new Map(), fam = new Map(), sizes = new Map(), radius = new Map(),
    pad = new Map(), gap = new Map(), shadow = new Map(), pairs = new Map();
  let textEls = 0;
  for (const el of [document.documentElement, document.body, ...document.querySelectorAll('body *')]) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || el.closest('svg')) continue;
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') count(bgs, hex(s.backgroundColor));
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') count(borders, `${s.borderTopWidth} ${s.borderTopStyle} ${hex(s.borderTopColor)}`);
    if (s.borderTopLeftRadius !== '0px') count(radius, s.borderTopLeftRadius);
    if (s.paddingTop !== '0px') count(pad, s.paddingTop);
    if (s.gap && s.gap !== 'normal' && s.gap !== '0px') count(gap, s.gap);
    if (s.boxShadow !== 'none') count(shadow, s.boxShadow);
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!ownText) continue;
    textEls++;
    count(colors, hex(s.color));
    count(fam, s.fontFamily.split(',')[0].replace(/["']/g, '').trim());
    count(sizes, `${s.fontSize} / ${s.fontWeight} / ${s.lineHeight}`);
    const fg = parse(s.color), bg = effectiveBg(el);
    if (!fg || !bg) continue;
    const f = fg.a < 1 ? blend(fg, bg) : fg;
    const [l1, l2] = [lum(f), lum(bg)].sort((a, b) => b - a);
    const ratio = Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
    const px = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700;
    const large = px >= 24 || (bold && px >= 18.66);
    const key = `${hex(s.color)} on ${hex(`rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`)}${large ? ' (large)' : ''}`;
    const prev = pairs.get(key) || { pair: key, ratio, level: ratio >= (large ? 4.5 : 7) ? 'AAA' : ratio >= (large ? 3 : 4.5) ? 'AA' : 'fail', count: 0, example: '' };
    prev.count++;
    if (!prev.example) prev.example = (el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '')).slice(0, 50);
    pairs.set(key, prev);
  }

  const rootVars = [];
  for (const sheet of document.styleSheets) {
    try { for (const r of sheet.cssRules) if (r.selectorText === ':root' && r.style) for (const p of r.style) if (p.startsWith('--')) rootVars.push([p, r.style.getPropertyValue(p).trim()]); } catch { /* cross-origin stylesheet */ }
  }
  const allPairs = [...pairs.values()].sort((a, b) => b.count - a.count);
  return {
    url: location.href, windowWidth: innerWidth,
    backgrounds: top(bgs), textColors: top(colors), borders: top(borders, 8), families: top(fam, 6), sizeWeightLineHeight: top(sizes, 16),
    radii: top(radius, 8), padding: top(pad, 10), gaps: top(gap, 8), shadows: top(shadow, 6),
    contrast: { textElements: textEls, mostUsedPairs: allPairs.slice(0, 15), failing: allPairs.filter((p) => p.level === 'fail').slice(0, 15) },
    rootVariables: rootVars.slice(0, 120),
    loadedFonts: [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/"/g, '')} ${f.weight} ${f.style}`))],
    darkMode: matchMedia('(prefers-color-scheme: dark)').matches,
  };
})()
