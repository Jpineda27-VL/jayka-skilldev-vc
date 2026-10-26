#!/usr/bin/env node
// Captura de UN sitio en vivo con Playwright, en solo lectura: carga, scroll, hover, movimiento del ratón y
// (opcional) una navegación interna. No envía formularios, no inicia sesión, no evade bloqueos.
//
// Uso:
//   node capture-live.mjs <url> --out <carpeta> [opciones]
//   node capture-live.mjs --check                  sale con 0 si Playwright y Chromium están listos, 3 si faltan
//   node capture-live.mjs --print-probe            imprime la sonda lista para pegar en otra herramienta de navegador
//
// Opciones:
//   --viewports 1280x800,375x812   tamaños de ventana (por defecto ambos)
//   --steps 8                      pasos de scroll hasta el final (0 = sin scroll)
//   --hover 6                      elementos interactivos a los que pasar el ratón (0 = ninguno; nunca en celular)
//   --track "<sel>,<sel>"          muestrea cada fotograma transform/opacity/clip-path/filter de esos selectores
//                                  y deduce duración y easing (sirve para animaciones hechas con JS)
//   --nav                          hace clic en el primer enlace interno y graba la transición de página
//   --video                        graba video .webm de cada ventana
//   --no-reduced                   no hace la pasada con prefers-reduced-motion: reduce
//   --wait 1500                    espera tras cargar (ms)
//   --timeout 45000                tiempo máximo de carga (ms)
//   --headed                       muestra el navegador
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadSignatures, analyzeCss, emptyCssMotion, summarizeCss, bump, top } from './lib/shared.mjs';
import { normalize, fitCurve, pearson } from './lib/curves.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const probeSrc = readFileSync(join(here, 'probe.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '').trim();
const sigRaw = JSON.parse(readFileSync(join(here, 'signatures.json'), 'utf8'));
const probeExpr = `(${probeSrc})(${JSON.stringify({ signatures: sigRaw.signatures })})`;

const argv = process.argv.slice(2);
if (argv.includes('--print-probe')) { console.log(probeExpr); process.exit(0); }

const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def; };
const flag = (name) => argv.includes(name);
const url = argv.find((a) => /^(https?|file):\/\//i.test(a));
if (!url && !flag('--check')) { console.error('Uso: node capture-live.mjs <url> --out <carpeta> [opciones]   (la URL debe empezar con http://, https:// o file://)'); process.exit(2); }
const OUT = resolve(opt('--out', 'captura-inversa'));
const viewports = opt('--viewports', '1280x800,375x812').split(',').map((v) => { const [w, h] = v.split('x').map(Number); return { width: w, height: h }; });
const STEPS = Number(opt('--steps', '8'));
const HOVER = Number(opt('--hover', '6'));
const TRACK = opt('--track', '').split(',').map((s) => s.trim()).filter(Boolean);
const WAIT = Number(opt('--wait', '1500'));
const TIMEOUT = Number(opt('--timeout', '45000'));
const BLOCK_TITLE = /just a moment|attention required|access denied|verify you are human|captcha|are you a robot/i;

async function loadPlaywright() {
  const bases = [process.env.JAYKA_TOOLS, join(homedir(), '.claude', 'jay-k-a', 'tools'), process.cwd()].filter(Boolean);
  for (const base of bases) {
    try { return createRequire(join(base, 'package.json'))('playwright'); } catch { /* siguiente */ }
  }
  try { return await import('playwright'); } catch { return null; }
}

const pw = await loadPlaywright();
if (!pw) {
  const tools = join(homedir(), '.claude', 'jay-k-a', 'tools');
  console.error(`Playwright no está instalado. Instálalo (con permiso del usuario) en la carpeta de herramientas, fuera de cualquier proyecto:\n  npm install --prefix "${tools}" playwright\n  npx --prefix "${tools}" playwright install chromium`);
  process.exit(3);
}
if (flag('--check')) {
  // Comprueba también que el navegador Chromium de Playwright esté descargado.
  const exe = pw.chromium.executablePath();
  if (!existsSync(exe)) { console.error(`Playwright está, pero falta Chromium. Instálalo con:\n  npx --prefix "${join(homedir(), '.claude', 'jay-k-a', 'tools')}" playwright install chromium`); process.exit(3); }
  console.log(`OK · Playwright listo · Chromium: ${exe}`);
  process.exit(0);
}

// Colector que corre dentro de la página desde antes que sus scripts.
const initCollector = ({ track }) => {
  const describe = (el) => {
    if (!el || !el.tagName) return el ? String(el) : null;
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3) : [];
    if (cls.length) s += '.' + cls.join('.');
    return s.slice(0, 90);
  };
  window.__jka = { fase: 'carga', vistas: [], muestras: {} };
  const seen = new WeakSet();
  setInterval(() => {
    let list;
    try { list = document.getAnimations(); } catch { return; }
    for (const a of list) {
      if (seen.has(a)) continue;
      seen.add(a);
      if (window.__jka.vistas.length >= 3000) return;
      const eff = a.effect;
      const t = (eff && eff.getTiming && eff.getTiming()) || {};
      let props = [];
      let kf = [];
      try { kf = eff.getKeyframes(); props = [...new Set(kf.flatMap((k) => Object.keys(k)))].filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)); } catch { /* sin fotogramas */ }
      // En @keyframes la curva vive en cada fotograma; el tiempo general queda en linear.
      const curva = t.easing && t.easing !== 'linear' ? t.easing : (kf[0] && kf[0].easing) || t.easing;
      window.__jka.vistas.push({
        ms: Math.round(performance.now()), scrollY: Math.round(scrollY), fase: window.__jka.fase,
        tipo: a.constructor.name, nombre: a.animationName || a.transitionProperty || a.id || null,
        objetivo: describe(eff && eff.target), pseudo: (eff && eff.pseudoElement) || null,
        duracionMs: typeof t.duration === 'number' ? Math.round(t.duration) : String(t.duration), retrasoMs: Math.round(t.delay || 0),
        curva, iteraciones: t.iterations, linea: a.timeline ? a.timeline.constructor.name : 'ninguna', propiedades: props,
      });
    }
  }, 50);
  if (track && track.length) {
    const sample = () => {
      for (const sel of track) {
        let els;
        try { els = document.querySelectorAll(sel); } catch { continue; }
        els.forEach((el, i) => {
          if (i > 2) return;
          const key = els.length > 1 ? `${sel} [${i}]` : sel;
          const cs = getComputedStyle(el);
          const m = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform);
          const v = { opacity: +cs.opacity, tx: +m.m41.toFixed(3), ty: +m.m42.toFixed(3), escala: +Math.hypot(m.a, m.b).toFixed(4), rotacion: +(Math.atan2(m.b, m.a) * 180 / Math.PI).toFixed(2), recorte: cs.clipPath, filtro: cs.filter };
          const arr = (window.__jka.muestras[key] ||= []);
          const last = arr[arr.length - 1];
          const same = last && ['opacity', 'tx', 'ty', 'escala', 'rotacion', 'recorte', 'filtro'].every((k) => last[k] === v[k]);
          if (!same && arr.length < 8000) arr.push({ t: +performance.now().toFixed(1), scrollY: Math.round(scrollY), fase: window.__jka.fase, ...v });
        });
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }
};

// Separa las muestras de un elemento en tramos de movimiento y ajusta la curva de cada uno.
function analyzeTrack(key, samples) {
  const nums = (s) => (String(s).match(/-?\d*\.?\d+/g) || []).map(Number);
  const channelsOf = (s) => {
    const c = { opacity: s.opacity, tx: s.tx, ty: s.ty, escala: s.escala, rotacion: s.rotacion };
    nums(s.recorte === 'none' ? '' : s.recorte).slice(0, 4).forEach((n, i) => { c[`recorte${i}`] = n; });
    nums(s.filtro === 'none' ? '' : s.filtro).slice(0, 2).forEach((n, i) => { c[`filtro${i}`] = n; });
    return c;
  };
  const rows = samples.map((s) => ({ t: s.t, scrollY: s.scrollY, fase: s.fase, ch: channelsOf(s) }));
  const channels = [...new Set(rows.flatMap((r) => Object.keys(r.ch)))];
  // Parte un tramo donde cambia de sentido. Un salto inicial (gsap.from coloca el punto de partida de golpe)
  // queda como parte corta y se descarta; un rebote pequeño (overshoot) se une al tramo anterior.
  const splitMonotonic = (run, ch) => {
    const parts = [];
    let cur = [run[0]], dir = 0;
    for (let i = 1; i < run.length; i++) {
      const d = Math.sign(run[i].ch[ch] - run[i - 1].ch[ch]);
      if (dir && d && d !== dir) { parts.push(cur); cur = [run[i - 1]]; }
      if (d) dir = d;
      cur.push(run[i]);
    }
    parts.push(cur);
    const amp = (p) => Math.abs(p[p.length - 1].ch[ch] - p[0].ch[ch]);
    const out = [];
    for (const p of parts) {
      const prev = out[out.length - 1];
      if (prev && prev.length >= 5 && amp(p) < amp(prev) * 0.15) { prev.push(...p.slice(1)); continue; }
      out.push(p);
    }
    return out;
  };
  const segs = [];
  for (const ch of channels) {
    let run = [];
    const flush = () => {
      for (const part of run.length >= 5 ? splitMonotonic(run, ch) : []) analyzePart(part);
      run = [];
    };
    const analyzePart = (run) => {
      if (run.length >= 5) {
        const series = run.map((r) => ({ t: r.t, v: r.ch[ch] }));
        const amp = Math.abs(series[series.length - 1].v - series[0].v);
        const curve = normalize(series);
        if (curve && amp > 0.01) {
          const corr = pearson(run.map((r) => r.scrollY), run.map((r) => r.ch[ch]));
          const scrollRange = Math.max(...run.map((r) => r.scrollY)) - Math.min(...run.map((r) => r.scrollY));
          segs.push({
            objetivo: key, canal: ch, fase: run[1].fase, inicioMs: Math.round(run[0].t), duracionMs: Math.round(run[run.length - 1].t - run[0].t),
            desde: series[0].v, hasta: series[series.length - 1].v, muestras: run.length,
            ligadoAlScroll: Math.abs(corr) > 0.95 && scrollRange > 50,
            ajuste: fitCurve(curve), curva: curve,
          });
        }
      }
    };
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1], cur = rows[i];
      if (prev.ch[ch] === undefined || cur.ch[ch] === undefined) { flush(); continue; }
      if (Math.abs(cur.ch[ch] - prev.ch[ch]) < 1e-6) continue;
      if (run.length && cur.t - run[run.length - 1].t > 200) flush();
      // el tramo arranca en el último valor quieto, un fotograma antes del primer cambio
      if (!run.length) run.push({ ...prev, t: cur.t - 16.7 });
      run.push(cur);
    }
    flush();
  }
  return segs;
}

const signatures = loadSignatures();
mkdirSync(OUT, { recursive: true });
const browser = await pw.chromium.launch({ headless: !flag('--headed') });
const network = { recursos: [], hosts: {}, tipos: {}, banners: [], firmasEnCodigo: [], sourcemaps: [], errores: 0 };
const cssNet = emptyCssMotion();
const resumen = { url, fecha: new Date().toISOString(), ventanas: [], bloqueado: null };
const seenBodies = new Set();

function watchNetwork(page, pending) {
  page.on('response', (resp) => {
    const req = resp.request();
    const type = req.resourceType();
    const u = resp.url();
    if (u.startsWith('data:')) return;
    bump(network.tipos, type);
    try { bump(network.hosts, new URL(u).host); } catch { /* url rara */ }
    if (resp.status() >= 400) network.errores++;
    if (network.recursos.length < 400) network.recursos.push({ tipo: type, estado: resp.status(), url: u.slice(0, 200), bytes: Number(resp.headers()['content-length'] || 0) || null });
    const sm = resp.headers()['sourcemap'] || resp.headers()['x-sourcemap'];
    if (sm) network.sourcemaps.push({ archivo: u.slice(0, 200), mapa: sm });
    if ((type === 'script' || type === 'stylesheet') && resp.status() < 400 && !seenBodies.has(u)) {
      seenBodies.add(u);
      pending.push(resp.text().then((text) => {
        if (text.length > 4_000_000) return;
        if (type === 'stylesheet') { analyzeCss(text, cssNet, u.slice(0, 160)); return; }
        const tail = text.slice(-400).match(/[#@]\s*sourceMappingURL=(\S+)\s*$/);
        if (tail && !tail[1].startsWith('data:')) network.sourcemaps.push({ archivo: u.slice(0, 200), mapa: tail[1].slice(0, 200) });
        for (const sig of signatures) {
          for (const re of sig.bannerRe) {
            const m = re.exec(text);
            if (m) { network.firmasEnCodigo.push({ id: sig.id, nombre: sig.name, version: m[1] || null, archivo: u.slice(0, 160) }); break; }
          }
        }
        for (const c of text.slice(0, 3000).matchAll(/\/\*![\s\S]{0,400}?\*\//g)) {
          const b = c[0].replace(/\s+/g, ' ').slice(0, 140);
          if (/\d+\.\d+\.\d+/.test(b) && network.banners.length < 40) network.banners.push({ archivo: u.slice(0, 160), banner: b });
        }
      }).catch(() => {}));
    }
  });
}

async function setFase(page, fase) { await page.evaluate((f) => { if (window.__jka) window.__jka.fase = f; }, fase).catch(() => {}); }
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

for (const vp of viewports) {
  const mobile = vp.width < 768;
  const tag = `live-${vp.width}x${vp.height}`;
  const dir = join(OUT, tag);
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: vp, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion: 'no-preference',
    recordVideo: flag('--video') ? { dir, size: vp } : undefined,
  });
  await context.addInitScript(initCollector, { track: TRACK });
  const page = await context.newPage();
  const pending = [];
  watchNetwork(page, pending);
  const info = { ventana: tag, archivos: [] };
  resumen.ventanas.push(info);

  let resp;
  try {
    resp = await page.goto(url, { waitUntil: 'load', timeout: TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  } catch (e) {
    info.error = `No cargó: ${String(e.message).split('\n')[0]}`;
    await context.close();
    continue;
  }
  const status = resp ? resp.status() : 0;
  const title = await page.title().catch(() => '');
  if (status >= 400 || BLOCK_TITLE.test(title)) {
    resumen.bloqueado = { estado: status, titulo: title.slice(0, 80) };
    info.error = 'El sitio bloqueó o pidió verificación. Se detiene: no se intenta evadir.';
    await page.screenshot({ path: join(dir, 'bloqueo.png') }).catch(() => {});
    await context.close();
    break;
  }
  await pause(WAIT);

  const save = (name, data) => { writeFileSync(join(dir, name), JSON.stringify(data, null, 2)); info.archivos.push(name); };
  const shot = async (name) => { await page.screenshot({ path: join(dir, name) }).catch(() => {}); info.archivos.push(name); };

  const probeLoad = await page.evaluate(probeExpr).catch((e) => ({ error: String(e) }));
  save('sonda-carga.json', probeLoad);
  await shot('00-carga.png');

  // Movimiento del ratón y hover (solo escritorio)
  if (!mobile) {
    await setFase(page, 'raton');
    for (let i = 0; i <= 30; i++) { await page.mouse.move((vp.width * i) / 30, vp.height * (0.3 + 0.4 * (i / 30))); await pause(40); }
    if (HOVER > 0) {
      const targets = await page.evaluate((n) => {
        const out = [];
        for (const el of document.querySelectorAll('a[href], button, [role="button"]')) {
          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 8 || r.top < 0 || r.bottom > innerHeight || getComputedStyle(el).visibility === 'hidden') continue;
          out.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, d: (el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '')).slice(0, 60) });
          if (out.length >= n) break;
        }
        return out;
      }, HOVER).catch(() => []);
      for (const [i, t] of targets.entries()) {
        await setFase(page, `hover:${t.d}`);
        await page.mouse.move(t.x, t.y, { steps: 4 });
        await pause(700);
        if (i < 3) await shot(`01-hover-${i + 1}.png`);
        await page.mouse.move(5, 5, { steps: 2 });
        await pause(350);
      }
    }
  }

  // Scroll por pasos, como una persona (rueda del ratón en escritorio)
  if (STEPS > 0) {
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight).catch(() => 0);
    let current = 0;
    for (let i = 1; i <= STEPS; i++) {
      await setFase(page, `scroll-${i}`);
      const target = Math.round((total * i) / STEPS);
      if (!mobile) {
        await page.mouse.move(vp.width / 2, vp.height / 2);
        let delta = target - current;
        while (Math.abs(delta) > 0) { const d = Math.sign(delta) * Math.min(120, Math.abs(delta)); await page.mouse.wheel(0, d); delta -= d; await pause(16); }
      } else {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), target).catch(() => {});
      }
      current = target;
      await pause(700);
      await shot(`02-scroll-${String(i).padStart(2, '0')}.png`);
    }
  }

  // Transición entre páginas
  if (flag('--nav')) {
    const link = await page.evaluate(() => {
      const here = location.origin + location.pathname;
      const cands = [...document.querySelectorAll('header a[href], nav a[href], a[href]')];
      for (const a of cands) {
        let u;
        try { u = new URL(a.href, location.href); } catch { continue; }
        if (u.origin !== location.origin || u.origin + u.pathname === here || a.hasAttribute('download') || a.target === '_blank') continue;
        const r = a.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        a.setAttribute('data-jka-nav', '1');
        return u.href;
      }
      return null;
    }).catch(() => null);
    if (link) {
      const before = await page.evaluate(() => { window.__jkaMarca = 1; window.__jka.fase = 'nav'; return window.__jka; }).catch(() => null);
      const el = await page.$('[data-jka-nav="1"]');
      await el?.scrollIntoViewIfNeeded().catch(() => {});
      await el?.click({ noWaitAfter: true }).catch(() => {});
      const t0 = Date.now();
      for (const ms of [0, 150, 300, 500, 800, 1200, 1800]) {
        const wait = ms - (Date.now() - t0);
        if (wait > 0) await pause(wait);
        await shot(`03-nav-${String(ms).padStart(4, '0')}ms.png`);
      }
      await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
      const spa = await page.evaluate(() => window.__jkaMarca === 1).catch(() => false);
      info.navegacion = { destino: link, tipo: spa ? 'sin recarga (SPA / librería de transición / View Transitions)' : 'recarga completa del documento' };
      // Con recarga completa el colector empieza de cero: se guarda lo recogido antes del clic.
      if (!spa && before) info.antesDeNavegar = before;
    } else {
      info.navegacion = { destino: null, nota: 'No se encontró un enlace interno visible.' };
    }
  }

  const probeEnd = await page.evaluate(probeExpr).catch((e) => ({ error: String(e) }));
  save('sonda-final.json', probeEnd);
  const collected = await page.evaluate(() => window.__jka).catch(() => null);
  const before = info.antesDeNavegar;
  delete info.antesDeNavegar;
  const vistas = [...((before && before.vistas) || []), ...((collected && collected.vistas) || [])];
  save('animaciones-vistas.json', vistas);
  if (TRACK.length) {
    const muestras = [
      ...Object.entries((before && before.muestras) || {}),
      ...Object.entries((collected && collected.muestras) || {}).map(([k, s]) => [before ? `${k} (página de destino)` : k, s]),
    ];
    const segs = muestras.flatMap(([k, s]) => analyzeTrack(k, s));
    // muestrasPorSelector sirve para diagnosticar: 0 = el selector no existe; 1 = existe pero no se movió.
    save('pistas.json', { selectores: TRACK, muestrasPorSelector: Object.fromEntries(muestras.map(([k, s]) => [k, s.length])), tramos: segs });
    info.pistas = segs.map((s) => ({ objetivo: s.objetivo, canal: s.canal, fase: s.fase, duracionMs: s.duracionMs, desde: s.desde, hasta: s.hasta, scrub: s.ligadoAlScroll, mejorCurva: s.ajuste[0] }));
  }

  // Resumen de lo visto en esta ventana
  const porFase = {}, dur = {}, curvas = {}, props = {};
  for (const v of vistas) { bump(porFase, v.fase.split(':')[0]); bump(dur, `${v.duracionMs}ms`); if (v.curva) bump(curvas, v.curva); for (const p of v.propiedades) bump(props, p); }
  info.animacionesVistas = { total: vistas.length, porFase, duraciones: top(dur, 8), curvas: top(curvas, 8), propiedades: top(props, 10) };
  info.detecciones = (probeEnd.detecciones || probeLoad.detecciones || []).map((d) => `${d.nombre}${d.version ? ' ' + d.version : ''}`);
  info.gsap = probeEnd.gsap ? { version: probeEnd.gsap.version, tweens: probeEnd.gsap.tweens?.length ?? 0, scrollTriggers: probeEnd.gsap.scrollTriggers?.length ?? 0 } : null;

  await Promise.all(pending);
  const video = page.video();
  await context.close();
  if (video) {
    const p = await video.path().catch(() => null);
    if (p && existsSync(p)) { renameSync(p, join(dir, 'video.webm')); info.archivos.push('video.webm'); }
  }
}

// Pasada con movimiento reducido (primera ventana)
if (!flag('--no-reduced') && !resumen.bloqueado) {
  const vp = viewports[0];
  const context = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: TIMEOUT });
    await pause(WAIT);
    const p = await page.evaluate(probeExpr);
    const normal = resumen.ventanas[0] && JSON.parse(readFileSync(join(OUT, resumen.ventanas[0].ventana, 'sonda-carga.json'), 'utf8'));
    const cmp = {
      animacionesAlCargar: { normal: normal?.totalAnimaciones ?? null, reducido: p.totalAnimaciones },
      tweensGsap: { normal: normal?.gsap?.tweens?.length ?? null, reducido: p.gsap?.tweens?.length ?? null },
      reglasCssReducedMotion: p.css.movimientoReducido,
    };
    const menos = (cmp.animacionesAlCargar.normal ?? 0) > cmp.animacionesAlCargar.reducido || (cmp.tweensGsap.normal ?? 0) > (cmp.tweensGsap.reducido ?? 0);
    cmp.veredicto = menos ? 'reduce el movimiento' : cmp.reglasCssReducedMotion > 0 ? 'tiene reglas pero no se notó diferencia al cargar' : 'no lo respeta (no hay reglas ni diferencia)';
    writeFileSync(join(OUT, 'movimiento-reducido.json'), JSON.stringify({ ...cmp, sonda: p }, null, 2));
    resumen.movimientoReducido = cmp;
  } catch (e) {
    resumen.movimientoReducido = { error: String(e.message).split('\n')[0] };
  }
  await context.close();
}

await browser.close();

network.hosts = top(network.hosts, 20);
network.css = summarizeCss(cssNet);
writeFileSync(join(OUT, 'red.json'), JSON.stringify(network, null, 2));
resumen.red = { tipos: network.tipos, hosts: network.hosts.slice(0, 10), firmasEnCodigo: network.firmasEnCodigo, sourcemaps: network.sourcemaps.length, banners: network.banners.length };
writeFileSync(join(OUT, 'resumen.json'), JSON.stringify(resumen, null, 2));

// Resumen legible
const L = [`URL: ${url}`];
if (resumen.bloqueado) L.push(`⛔ BLOQUEADO (estado ${resumen.bloqueado.estado}, «${resumen.bloqueado.titulo}»). No se continuó.`);
for (const v of resumen.ventanas) {
  L.push(`— ${v.ventana}${v.error ? ' · ' + v.error : ''}`);
  if (v.error) continue;
  L.push(`  Detectado: ${v.detecciones.join(', ') || 'nada por firmas'}`);
  if (v.gsap) L.push(`  GSAP ${v.gsap.version}: ${v.gsap.tweens} tweens, ${v.gsap.scrollTriggers} ScrollTriggers`);
  L.push(`  Animaciones vistas: ${v.animacionesVistas.total} · por fase ${JSON.stringify(v.animacionesVistas.porFase)}`);
  L.push(`  Duraciones: ${v.animacionesVistas.duraciones.map((d) => `${d.valor}×${d.veces}`).join(', ') || '—'}`);
  L.push(`  Curvas: ${v.animacionesVistas.curvas.map((d) => `${d.valor}×${d.veces}`).join(', ') || '—'}`);
  if (v.navegacion) L.push(`  Navegación: ${v.navegacion.destino || '—'} → ${v.navegacion.tipo || v.navegacion.nota}`);
  for (const p of v.pistas || []) {
    const tail = p.scrub ? ' · LIGADO AL SCROLL (la curva depende del scroll: usa start/end/scrub, no un easing)' : ` · curva ≈ ${p.mejorCurva.nombre} (error ${p.mejorCurva.error})`;
    L.push(`  Pista ${p.objetivo} ${p.canal} (${p.fase}): ${p.desde}→${p.hasta} en ${p.duracionMs}ms${tail}`);
  }
}
if (resumen.movimientoReducido) L.push(`Movimiento reducido: ${resumen.movimientoReducido.veredicto || resumen.movimientoReducido.error}`);
L.push(`Red: ${JSON.stringify(network.tipos)} · firmas en JS: ${network.firmasEnCodigo.map((f) => `${f.nombre}${f.version ? ' ' + f.version : ''}`).join(', ') || '—'} · source maps: ${network.sourcemaps.length}`);
L.push(`CSS descargado: ${network.css.totalKeyframes} @keyframes · duraciones ${network.css.duraciones.slice(0, 5).map((d) => d.valor).join(', ') || '—'} · curvas ${network.css.curvas.slice(0, 4).map((d) => d.valor).join(', ') || '—'}`);
L.push(`Carpeta: ${OUT}`);
console.log(L.join('\n'));
