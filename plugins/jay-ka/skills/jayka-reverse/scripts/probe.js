// READ-ONLY probe evaluated inside the page. It does not click, submit forms or read cookies or storage.
// It is a function expression: capture-live.mjs evaluates it as `(<this file>)(signatures)`.
// To paste it by hand into another browser tool: `node capture-live.mjs --print-probe`.
(function probe(SIG) {
  const signatures = (SIG && SIG.signatures) || [];
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), window);
  const describe = (el) => {
    if (typeof el === 'function') return 'function'; // never dump someone else's code
    if (el === window) return 'window';
    if (el === document) return 'document';
    if (!el || !el.tagName) return el && typeof el === 'object' ? 'object' : String(el);
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3) : [];
    if (cls.length) s += '.' + cls.join('.');
    return s.slice(0, 90);
  };
  const safe = (fn, fallback = null) => { try { return fn(); } catch (e) { return fallback === null ? { error: String(e).slice(0, 120) } : fallback; } };
  const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
  const top = (o, n = 12) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));

  // 1. Loaded resources
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean);
  const styles = [...document.querySelectorAll('link[rel~="stylesheet"]')].map((l) => l.href);
  const resources = safe(() => performance.getEntriesByType('resource').map((r) => r.name), []);
  const allUrls = [...new Set([...scripts, ...styles, ...resources])];

  // 2. Detection by signatures
  const detections = [];
  for (const s of signatures) {
    const ev = [];
    for (const g of s.globals || []) if (safe(() => get(g) !== undefined, false)) ev.push('window.' + g);
    for (const sel of s.dom || []) {
      const n = safe(() => document.querySelectorAll(sel).length, 0);
      if (n) ev.push(`${sel} ×${n}`);
    }
    for (const p of s.scriptUrl || []) {
      const re = new RegExp(p, 'i');
      const hit = allUrls.find((u) => re.test(u));
      if (hit) { ev.push('url: ' + hit.slice(0, 140)); break; }
    }
    if (ev.length) {
      const v = s.version ? safe(() => get(s.version), undefined) : undefined;
      const obj = (s.globals || []).map((g) => safe(() => get(g), undefined)).find((o) => o && typeof o === 'object' || typeof o === 'function');
      const version = v ?? safe(() => obj && (obj.version || obj.VERSION || obj.REVISION), undefined);
      detections.push({ id: s.id, name: s.name, category: s.category, version: version ? String(version) : null, evidence: ev.slice(0, 5) });
    }
  }

  // 3. Animations alive right now (CSS animations, CSS transitions and Web Animations, including Motion's)
  const animations = safe(() => document.getAnimations().slice(0, 80).map((a) => {
    const eff = a.effect;
    const t = eff && eff.getTiming ? eff.getTiming() : {};
    const kf = eff && eff.getKeyframes ? safe(() => eff.getKeyframes(), []) : [];
    const props = [...new Set(kf.flatMap((k) => Object.keys(k).filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p))))];
    const timeline = a.timeline ? a.timeline.constructor.name : 'none';
    return {
      type: a.constructor.name,
      name: a.animationName || a.transitionProperty || a.id || null,
      target: describe(eff && eff.target),
      pseudo: (eff && eff.pseudoElement) || null,
      durationMs: typeof t.duration === 'number' ? Math.round(t.duration) : t.duration,
      delayMs: Math.round(t.delay || 0),
      // In @keyframes the curve lives in each frame; the overall timing stays linear.
      easing: t.easing && t.easing !== 'linear' ? t.easing : (kf[0] && kf[0].easing) || t.easing,
      iterations: t.iterations,
      fill: t.fill,
      direction: t.direction,
      state: a.playState,
      timeline,
      properties: props,
      keyframes: kf.slice(0, 4).map((k) => { const o = { ...k }; delete o.computedOffset; return o; }),
    };
  }), []);

  // 4. Motion declared in CSS (readable sheets only: cross-origin ones are counted as blocked)
  const css = { keyframes: [], transitions: {}, animations: {}, easings: {}, reducedMotion: 0, viewTransitions: 0, scrollDriven: 0, scrollSnap: 0, blockedSheets: 0 };
  const walkRules = (rules, inReduced) => {
    for (const r of rules) {
      if (r.type === 7 || r.constructor.name === 'CSSKeyframesRule') { css.keyframes.push(r.name); continue; }
      if (r.media && /prefers-reduced-motion/.test(r.media.mediaText)) { css.reducedMotion++; walkRules(r.cssRules, true); continue; }
      if (r.cssRules && r.cssRules.length) { walkRules(r.cssRules, inReduced); }
      const st = r.style;
      if (!st) continue;
      const tr = st.getPropertyValue('transition');
      if (tr && !/^(none|all 0s ease 0s)$/.test(tr)) bump(css.transitions, tr.slice(0, 120));
      const an = st.getPropertyValue('animation');
      if (an && an !== 'none') bump(css.animations, an.slice(0, 120));
      for (const p of ['transition-timing-function', 'animation-timing-function']) {
        const v = st.getPropertyValue(p);
        if (v) for (const e of v.split(/,(?![^(]*\))/)) bump(css.easings, e.trim());
      }
      if (st.getPropertyValue('view-transition-name')) css.viewTransitions++;
      if (st.getPropertyValue('animation-timeline')) css.scrollDriven++;
      if (st.getPropertyValue('scroll-snap-type')) css.scrollSnap++;
    }
  };
  for (const sheet of document.styleSheets) {
    try { walkRules(sheet.cssRules, false); } catch { css.blockedSheets++; }
  }

  // 5. GSAP and ScrollTrigger in real time (if exposed on window)
  const gsapInfo = safe(() => {
    const g = window.gsap;
    if (!g) return null;
    const INTERNAL = ['ease', 'duration', 'delay', 'stagger', 'scrollTrigger', 'immediateRender', 'lazy', 'overwrite', 'callbackScope', 'data', 'id', 'paused', 'reversed', 'runBackwards', 'startAt', 'parent', 'repeatRefresh', 'inherit'];
    const all = g.globalTimeline.getChildren(true, true, false);
    // delayedCall creates tweens whose target is a function: they are not visible animations
    const isCall = (tw) => tw.targets && tw.targets().some((t) => typeof t === 'function');
    const tweens = all.filter((tw) => !isCall(tw)).slice(0, 60).map((tw) => ({
      type: typeof tw.getChildren === 'function' ? 'timeline' : tw.duration() === 0 ? 'set (no duration)' : 'tween',
      targets: (tw.targets ? tw.targets() : []).slice(0, 3).map(describe),
      totalTargets: tw.targets ? tw.targets().length : 0,
      durationS: tw.duration(),
      delayS: tw.delay(),
      repeats: tw.repeat ? tw.repeat() : 0,
      easing: tw.vars && (typeof tw.vars.ease === 'string' ? tw.vars.ease : tw.vars.ease ? 'custom' : 'default'),
      stagger: tw.vars && tw.vars.stagger !== undefined ? JSON.stringify(tw.vars.stagger).slice(0, 60) : null,
      properties: tw.vars ? Object.keys(tw.vars).filter((k) => !INTERNAL.includes(k) && !/^on[A-Z]/.test(k)).slice(0, 10) : [],
      hasScrollTrigger: !!(tw.scrollTrigger || (tw.vars && tw.vars.scrollTrigger)),
    }));
    const st = window.ScrollTrigger ? window.ScrollTrigger.getAll().slice(0, 60).map((t) => ({
      trigger: describe(t.trigger),
      startPx: Math.round(t.start),
      endPx: Math.round(t.end),
      start: t.vars && t.vars.start,
      end: t.vars && t.vars.end,
      scrub: t.vars ? t.vars.scrub ?? null : null,
      pin: !!(t.pin),
      toggleActions: t.vars && t.vars.toggleActions,
      snap: t.vars && t.vars.snap ? JSON.stringify(t.vars.snap).slice(0, 60) : null,
    })) : null;
    return { version: g.version, defaults: safe(() => g.defaults(), null), deferredCalls: all.filter(isCall).length, tweens, scrollTriggers: st };
  });

  // 6. Smooth scroll and other hints
  const htmlClass = document.documentElement.className || '';
  const scroll = {
    htmlClasses: String(htmlClass).slice(0, 200),
    lenisInstance: safe(() => (window.lenis && window.lenis.options) ? JSON.parse(JSON.stringify(window.lenis.options, (k, v) => (typeof v === 'object' && v instanceof Element ? describe(v) : typeof v === 'function' ? 'function' : v))) : null, null),
    scrollBehaviorHtml: getComputedStyle(document.documentElement).scrollBehavior,
    documentHeight: document.documentElement.scrollHeight,
    windowHeight: innerHeight,
  };

  // 7. Motion CSS variables on :root and loaded fonts
  const rootStyle = getComputedStyle(document.documentElement);
  const motionVariables = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const r of sheet.cssRules) {
        if (r.selectorText === ':root' && r.style) for (const p of r.style) if (p.startsWith('--') && /(dur|ease|motion|speed|delay|transition|anim|spring)/i.test(p)) motionVariables.push([p, rootStyle.getPropertyValue(p).trim()]);
      }
    } catch { /* cross-origin stylesheet */ }
  }

  return {
    url: location.href,
    title: document.title.slice(0, 120),
    generator: safe(() => document.querySelector('meta[name="generator"]')?.content || null, null),
    window: { width: innerWidth, height: innerHeight, scrollY: Math.round(scrollY) },
    reducedMotionActive: matchMedia('(prefers-reduced-motion: reduce)').matches,
    detections,
    animations,
    totalAnimations: safe(() => document.getAnimations().length, 0),
    css: { ...css, transitions: top(css.transitions, 15), animations: top(css.animations, 12), easings: top(css.easings, 12), keyframes: [...new Set(css.keyframes)].slice(0, 60) },
    gsap: gsapInfo,
    scroll,
    motionVariables: motionVariables.slice(0, 40),
    fonts: safe(() => [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/"/g, '')} ${f.weight} ${f.style}`))].slice(0, 20), []),
    elements: { canvas: document.querySelectorAll('canvas').length, video: document.querySelectorAll('video').length, svg: document.querySelectorAll('svg').length, iframe: document.querySelectorAll('iframe').length },
    scripts: scripts.slice(0, 60),
  };
})
