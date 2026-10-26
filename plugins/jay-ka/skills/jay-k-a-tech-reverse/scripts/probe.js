// Sonda de SOLO LECTURA que se evalúa dentro de la página. No hace clics, no envía formularios, no lee cookies ni storage.
// Es una expresión de función: capture-live.mjs la evalúa como `(<este archivo>)(firmas)`.
// Para pegarla a mano en otra herramienta de navegador: `node capture-live.mjs --print-probe`.
(function probe(SIG) {
  const signatures = (SIG && SIG.signatures) || [];
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), window);
  const describe = (el) => {
    if (typeof el === 'function') return 'función'; // nunca volcar código ajeno
    if (el === window) return 'window';
    if (el === document) return 'document';
    if (!el || !el.tagName) return el && typeof el === 'object' ? 'objeto' : String(el);
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3) : [];
    if (cls.length) s += '.' + cls.join('.');
    return s.slice(0, 90);
  };
  const safe = (fn, fallback = null) => { try { return fn(); } catch (e) { return fallback === null ? { error: String(e).slice(0, 120) } : fallback; } };
  const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
  const top = (o, n = 12) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([valor, veces]) => ({ valor, veces }));

  // 1. Recursos cargados
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean);
  const styles = [...document.querySelectorAll('link[rel~="stylesheet"]')].map((l) => l.href);
  const resources = safe(() => performance.getEntriesByType('resource').map((r) => r.name), []);
  const allUrls = [...new Set([...scripts, ...styles, ...resources])];

  // 2. Detección por firmas
  const detecciones = [];
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
      detecciones.push({ id: s.id, nombre: s.name, categoria: s.category, version: version ? String(version) : null, evidencia: ev.slice(0, 5) });
    }
  }

  // 3. Animaciones vivas en este instante (CSS animations, CSS transitions y Web Animations, incluidas las de Motion)
  const animaciones = safe(() => document.getAnimations().slice(0, 80).map((a) => {
    const eff = a.effect;
    const t = eff && eff.getTiming ? eff.getTiming() : {};
    const kf = eff && eff.getKeyframes ? safe(() => eff.getKeyframes(), []) : [];
    const props = [...new Set(kf.flatMap((k) => Object.keys(k).filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p))))];
    const timeline = a.timeline ? a.timeline.constructor.name : 'ninguna';
    return {
      tipo: a.constructor.name,
      nombre: a.animationName || a.transitionProperty || a.id || null,
      objetivo: describe(eff && eff.target),
      pseudo: (eff && eff.pseudoElement) || null,
      duracionMs: typeof t.duration === 'number' ? Math.round(t.duration) : t.duration,
      retrasoMs: Math.round(t.delay || 0),
      // En @keyframes la curva vive en cada fotograma; el tiempo general queda en linear.
      curva: t.easing && t.easing !== 'linear' ? t.easing : (kf[0] && kf[0].easing) || t.easing,
      iteraciones: t.iterations,
      relleno: t.fill,
      direccion: t.direction,
      estado: a.playState,
      linea: timeline,
      propiedades: props,
      fotogramas: kf.slice(0, 4).map((k) => { const o = { ...k }; delete o.computedOffset; return o; }),
    };
  }), []);

  // 4. Movimiento declarado en CSS (solo hojas legibles: las de otro dominio se cuentan como bloqueadas)
  const css = { keyframes: [], transiciones: {}, animaciones: {}, curvas: {}, movimientoReducido: 0, viewTransitions: 0, scrollDriven: 0, scrollSnap: 0, hojasBloqueadas: 0 };
  const walkRules = (rules, inReduced) => {
    for (const r of rules) {
      if (r.type === 7 || r.constructor.name === 'CSSKeyframesRule') { css.keyframes.push(r.name); continue; }
      if (r.media && /prefers-reduced-motion/.test(r.media.mediaText)) { css.movimientoReducido++; walkRules(r.cssRules, true); continue; }
      if (r.cssRules && r.cssRules.length) { walkRules(r.cssRules, inReduced); }
      const st = r.style;
      if (!st) continue;
      const tr = st.getPropertyValue('transition');
      if (tr && !/^(none|all 0s ease 0s)$/.test(tr)) bump(css.transiciones, tr.slice(0, 120));
      const an = st.getPropertyValue('animation');
      if (an && an !== 'none') bump(css.animaciones, an.slice(0, 120));
      for (const p of ['transition-timing-function', 'animation-timing-function']) {
        const v = st.getPropertyValue(p);
        if (v) for (const e of v.split(/,(?![^(]*\))/)) bump(css.curvas, e.trim());
      }
      if (st.getPropertyValue('view-transition-name')) css.viewTransitions++;
      if (st.getPropertyValue('animation-timeline')) css.scrollDriven++;
      if (st.getPropertyValue('scroll-snap-type')) css.scrollSnap++;
    }
  };
  for (const sheet of document.styleSheets) {
    try { walkRules(sheet.cssRules, false); } catch { css.hojasBloqueadas++; }
  }

  // 5. GSAP y ScrollTrigger en tiempo real (si están expuestos en window)
  const gsapInfo = safe(() => {
    const g = window.gsap;
    if (!g) return null;
    const INTERNAS = ['ease', 'duration', 'delay', 'stagger', 'scrollTrigger', 'immediateRender', 'lazy', 'overwrite', 'callbackScope', 'data', 'id', 'paused', 'reversed', 'runBackwards', 'startAt', 'parent', 'repeatRefresh', 'inherit'];
    const all = g.globalTimeline.getChildren(true, true, false);
    // delayedCall crea tweens cuyo objetivo es una función: no son animaciones visibles
    const isCall = (tw) => tw.targets && tw.targets().some((t) => typeof t === 'function');
    const tweens = all.filter((tw) => !isCall(tw)).slice(0, 60).map((tw) => ({
      tipo: typeof tw.getChildren === 'function' ? 'timeline' : tw.duration() === 0 ? 'set (sin duración)' : 'tween',
      objetivos: (tw.targets ? tw.targets() : []).slice(0, 3).map(describe),
      totalObjetivos: tw.targets ? tw.targets().length : 0,
      duracionS: tw.duration(),
      retrasoS: tw.delay(),
      repeticiones: tw.repeat ? tw.repeat() : 0,
      curva: tw.vars && (typeof tw.vars.ease === 'string' ? tw.vars.ease : tw.vars.ease ? 'personalizada' : 'por defecto'),
      stagger: tw.vars && tw.vars.stagger !== undefined ? JSON.stringify(tw.vars.stagger).slice(0, 60) : null,
      propiedades: tw.vars ? Object.keys(tw.vars).filter((k) => !INTERNAS.includes(k) && !/^on[A-Z]/.test(k)).slice(0, 10) : [],
      conScrollTrigger: !!(tw.scrollTrigger || (tw.vars && tw.vars.scrollTrigger)),
    }));
    const st = window.ScrollTrigger ? window.ScrollTrigger.getAll().slice(0, 60).map((t) => ({
      disparador: describe(t.trigger),
      inicioPx: Math.round(t.start),
      finPx: Math.round(t.end),
      inicio: t.vars && t.vars.start,
      fin: t.vars && t.vars.end,
      scrub: t.vars ? t.vars.scrub ?? null : null,
      pin: !!(t.pin),
      toggleActions: t.vars && t.vars.toggleActions,
      snap: t.vars && t.vars.snap ? JSON.stringify(t.vars.snap).slice(0, 60) : null,
    })) : null;
    return { version: g.version, defaults: safe(() => g.defaults(), null), llamadasDiferidas: all.filter(isCall).length, tweens, scrollTriggers: st };
  });

  // 6. Scroll suave y otras pistas
  const htmlClass = document.documentElement.className || '';
  const scroll = {
    clasesHtml: String(htmlClass).slice(0, 200),
    lenisInstancia: safe(() => (window.lenis && window.lenis.options) ? JSON.parse(JSON.stringify(window.lenis.options, (k, v) => (typeof v === 'object' && v instanceof Element ? describe(v) : typeof v === 'function' ? 'funcion' : v))) : null, null),
    scrollBehaviorHtml: getComputedStyle(document.documentElement).scrollBehavior,
    alturaDocumento: document.documentElement.scrollHeight,
    altoVentana: innerHeight,
  };

  // 7. Variables CSS de movimiento en :root y fuentes cargadas
  const rootStyle = getComputedStyle(document.documentElement);
  const varsMovimiento = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const r of sheet.cssRules) {
        if (r.selectorText === ':root' && r.style) for (const p of r.style) if (p.startsWith('--') && /(dur|ease|motion|speed|delay|transition|anim|spring)/i.test(p)) varsMovimiento.push([p, rootStyle.getPropertyValue(p).trim()]);
      }
    } catch { /* hoja de otro dominio */ }
  }

  return {
    url: location.href,
    titulo: document.title.slice(0, 120),
    generador: safe(() => document.querySelector('meta[name="generator"]')?.content || null, null),
    ventana: { ancho: innerWidth, alto: innerHeight, scrollY: Math.round(scrollY) },
    movimientoReducidoActivo: matchMedia('(prefers-reduced-motion: reduce)').matches,
    detecciones,
    animaciones,
    totalAnimaciones: safe(() => document.getAnimations().length, 0),
    css: { ...css, transiciones: top(css.transiciones, 15), animaciones: top(css.animaciones, 12), curvas: top(css.curvas, 12), keyframes: [...new Set(css.keyframes)].slice(0, 60) },
    gsap: gsapInfo,
    scroll,
    variablesMovimiento: varsMovimiento.slice(0, 40),
    fuentes: safe(() => [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/"/g, '')} ${f.weight} ${f.style}`))].slice(0, 20), []),
    elementos: { canvas: document.querySelectorAll('canvas').length, video: document.querySelectorAll('video').length, svg: document.querySelectorAll('svg').length, iframe: document.querySelectorAll('iframe').length },
    scripts: scripts.slice(0, 60),
  };
})
