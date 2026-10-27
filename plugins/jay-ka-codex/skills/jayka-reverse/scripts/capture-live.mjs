#!/usr/bin/env node
// Captures ONE live site with Playwright, read-only: load, scroll, hover, mouse movement and
// (optionally) an internal navigation. It does not submit forms, log in or evade blocks.
//
// Usage:
//   node capture-live.mjs <url> --out <folder> [options]
//   node capture-live.mjs --check                  exits 0 if Playwright and Chromium are ready, 3 if missing
//   node capture-live.mjs --print-probe            prints the probe ready to paste into another browser tool
//
// Options:
//   --viewports 1280x800,375x812   window sizes (both by default)
//   --steps 8                      scroll steps down to the end (0 = no scroll)
//   --hover 6                      interactive elements to move the mouse over (0 = none; never on mobile)
//   --track "<sel>,<sel>"          samples every frame the transform/opacity/clip-path/filter of those selectors
//                                  and deduces duration and easing (works for JS-made animations)
//   --nav                          clicks the first internal link and records the page transition
//   --video                        records a .webm video of each window
//   --no-reduced                   skips the pass with prefers-reduced-motion: reduce
//   --wait 1500                    wait after load (ms)
//   --timeout 45000                maximum load time (ms)
//   --headed                       shows the browser
//   --no-screenshots               does not save screenshots (only the JSON files)
//   --eval <file.js>               also evaluates that own probe on load (one expression) and saves
//                                  eval-<name>.json in each window (used by other JayKA skills)
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
if (!url && !flag('--check')) { console.error('Usage: node capture-live.mjs <url> --out <folder> [options]   (the URL must start with http://, https:// or file://)'); process.exit(2); }
const OUT = resolve(opt('--out', 'reverse-capture'));
const viewports = opt('--viewports', '1280x800,375x812').split(',').map((v) => { const [w, h] = v.split('x').map(Number); return { width: w, height: h }; });
const STEPS = Number(opt('--steps', '8'));
const HOVER = Number(opt('--hover', '6'));
const TRACK = opt('--track', '').split(',').map((s) => s.trim()).filter(Boolean);
const WAIT = Number(opt('--wait', '1500'));
const TIMEOUT = Number(opt('--timeout', '45000'));
const EVAL_FILE = opt('--eval', null);
const evalExpr = EVAL_FILE ? readFileSync(resolve(EVAL_FILE), 'utf8') : null;
const evalName = EVAL_FILE ? `eval-${EVAL_FILE.replace(/\\/g, '/').split('/').pop().replace(/\.[^.]+$/, '')}.json` : null;
const BLOCK_TITLE = /just a moment|attention required|access denied|verify you are human|captcha|are you a robot/i;
const TOOLS_DIR = resolve(process.env.CODEX_HOME || join(homedir(), '.codex'), 'jayka', 'tools');

async function loadPlaywright() {
  const bases = [process.env.JAYKA_TOOLS, TOOLS_DIR, process.cwd()].filter(Boolean);
  for (const base of bases) {
    try { return createRequire(join(base, 'package.json'))('playwright'); } catch { /* next */ }
  }
  try { return await import('playwright'); } catch { return null; }
}

const pw = await loadPlaywright();
if (!pw) {
  console.error(`Playwright is not installed. Install it (with the user's permission) in the tools folder, outside any project:\n  npm install --prefix "${TOOLS_DIR}" playwright\n  npx --prefix "${TOOLS_DIR}" playwright install chromium`);
  process.exit(3);
}
if (flag('--check')) {
  // Also checks that Playwright's Chromium browser is downloaded.
  const exe = pw.chromium.executablePath();
  if (!existsSync(exe)) { console.error(`Playwright is there, but Chromium is missing. Install it with:\n  npx --prefix "${TOOLS_DIR}" playwright install chromium`); process.exit(3); }
  console.log(`OK · Playwright ready · Chromium: ${exe}`);
  process.exit(0);
}

// Collector that runs inside the page from before its scripts.
const initCollector = ({ track }) => {
  const describe = (el) => {
    if (!el || !el.tagName) return el ? String(el) : null;
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3) : [];
    if (cls.length) s += '.' + cls.join('.');
    return s.slice(0, 90);
  };
  window.__jka = { phase: 'load', seen: [], samples: {} };
  const seen = new WeakSet();
  setInterval(() => {
    let list;
    try { list = document.getAnimations(); } catch { return; }
    for (const a of list) {
      if (seen.has(a)) continue;
      seen.add(a);
      if (window.__jka.seen.length >= 3000) return;
      const eff = a.effect;
      const t = (eff && eff.getTiming && eff.getTiming()) || {};
      let props = [];
      let kf = [];
      try { kf = eff.getKeyframes(); props = [...new Set(kf.flatMap((k) => Object.keys(k)))].filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)); } catch { /* no keyframes */ }
      // In @keyframes the curve lives in each frame; the overall timing stays linear.
      const easing = t.easing && t.easing !== 'linear' ? t.easing : (kf[0] && kf[0].easing) || t.easing;
      window.__jka.seen.push({
        ms: Math.round(performance.now()), scrollY: Math.round(scrollY), phase: window.__jka.phase,
        type: a.constructor.name, name: a.animationName || a.transitionProperty || a.id || null,
        target: describe(eff && eff.target), pseudo: (eff && eff.pseudoElement) || null,
        durationMs: typeof t.duration === 'number' ? Math.round(t.duration) : String(t.duration), delayMs: Math.round(t.delay || 0),
        easing, iterations: t.iterations, timeline: a.timeline ? a.timeline.constructor.name : 'none', properties: props,
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
          const v = { opacity: +cs.opacity, tx: +m.m41.toFixed(3), ty: +m.m42.toFixed(3), scale: +Math.hypot(m.a, m.b).toFixed(4), rotation: +(Math.atan2(m.b, m.a) * 180 / Math.PI).toFixed(2), clip: cs.clipPath, filter: cs.filter };
          const arr = (window.__jka.samples[key] ||= []);
          const last = arr[arr.length - 1];
          const same = last && ['opacity', 'tx', 'ty', 'scale', 'rotation', 'clip', 'filter'].every((k) => last[k] === v[k]);
          if (!same && arr.length < 8000) arr.push({ t: +performance.now().toFixed(1), scrollY: Math.round(scrollY), phase: window.__jka.phase, ...v });
        });
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }
};

// Splits the samples of an element into motion segments and fits the curve of each one.
function analyzeTrack(key, samples) {
  const nums = (s) => (String(s).match(/-?\d*\.?\d+/g) || []).map(Number);
  const channelsOf = (s) => {
    const c = { opacity: s.opacity, tx: s.tx, ty: s.ty, scale: s.scale, rotation: s.rotation };
    nums(s.clip === 'none' ? '' : s.clip).slice(0, 4).forEach((n, i) => { c[`clip${i}`] = n; });
    nums(s.filter === 'none' ? '' : s.filter).slice(0, 2).forEach((n, i) => { c[`filter${i}`] = n; });
    return c;
  };
  const rows = samples.map((s) => ({ t: s.t, scrollY: s.scrollY, phase: s.phase, ch: channelsOf(s) }));
  const channels = [...new Set(rows.flatMap((r) => Object.keys(r.ch)))];
  // Splits a run where it changes direction. An initial jump (gsap.from sets the starting point at once)
  // stays as a short part and is discarded; a small bounce (overshoot) is joined to the previous part.
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
            target: key, channel: ch, phase: run[1].phase, startMs: Math.round(run[0].t), durationMs: Math.round(run[run.length - 1].t - run[0].t),
            from: series[0].v, to: series[series.length - 1].v, samples: run.length,
            scrollLinked: Math.abs(corr) > 0.95 && scrollRange > 50,
            fit: fitCurve(curve), curve,
          });
        }
      }
    };
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1], cur = rows[i];
      if (prev.ch[ch] === undefined || cur.ch[ch] === undefined) { flush(); continue; }
      if (Math.abs(cur.ch[ch] - prev.ch[ch]) < 1e-6) continue;
      if (run.length && cur.t - run[run.length - 1].t > 200) flush();
      // the segment starts at the last still value, one frame before the first change
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
const network = { resources: [], hosts: {}, types: {}, banners: [], codeSignatures: [], sourcemaps: [], errors: 0 };
const cssNet = emptyCssMotion();
const summary = { url, date: new Date().toISOString(), windows: [], blocked: null };
const seenBodies = new Set();

function watchNetwork(page, pending) {
  page.on('response', (resp) => {
    const req = resp.request();
    const type = req.resourceType();
    const u = resp.url();
    if (u.startsWith('data:')) return;
    bump(network.types, type);
    try { bump(network.hosts, new URL(u).host); } catch { /* odd url */ }
    if (resp.status() >= 400) network.errors++;
    if (network.resources.length < 400) network.resources.push({ type, status: resp.status(), url: u.slice(0, 200), bytes: Number(resp.headers()['content-length'] || 0) || null });
    const sm = resp.headers()['sourcemap'] || resp.headers()['x-sourcemap'];
    if (sm) network.sourcemaps.push({ file: u.slice(0, 200), map: sm });
    if ((type === 'script' || type === 'stylesheet') && resp.status() < 400 && !seenBodies.has(u)) {
      seenBodies.add(u);
      pending.push(resp.text().then((text) => {
        if (text.length > 4_000_000) return;
        if (type === 'stylesheet') { analyzeCss(text, cssNet, u.slice(0, 160)); return; }
        const tail = text.slice(-400).match(/[#@]\s*sourceMappingURL=(\S+)\s*$/);
        if (tail && !tail[1].startsWith('data:')) network.sourcemaps.push({ file: u.slice(0, 200), map: tail[1].slice(0, 200) });
        for (const sig of signatures) {
          for (const re of sig.bannerRe) {
            const m = re.exec(text);
            if (m) { network.codeSignatures.push({ id: sig.id, name: sig.name, version: m[1] || null, file: u.slice(0, 160) }); break; }
          }
        }
        for (const c of text.slice(0, 3000).matchAll(/\/\*![\s\S]{0,400}?\*\//g)) {
          const b = c[0].replace(/\s+/g, ' ').slice(0, 140);
          if (/\d+\.\d+\.\d+/.test(b) && network.banners.length < 40) network.banners.push({ file: u.slice(0, 160), banner: b });
        }
      }).catch(() => {}));
    }
  });
}

async function setPhase(page, phase) { await page.evaluate((f) => { if (window.__jka) window.__jka.phase = f; }, phase).catch(() => {}); }
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
  const info = { window: tag, files: [] };
  summary.windows.push(info);

  let resp;
  try {
    resp = await page.goto(url, { waitUntil: 'load', timeout: TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  } catch (e) {
    info.error = `Did not load: ${String(e.message).split('\n')[0]}`;
    await context.close();
    continue;
  }
  const status = resp ? resp.status() : 0;
  const title = await page.title().catch(() => '');
  if (status >= 400 || BLOCK_TITLE.test(title)) {
    summary.blocked = { status, title: title.slice(0, 80) };
    info.error = 'The site blocked or asked for verification. Stopping: no attempt is made to evade it.';
    await page.screenshot({ path: join(dir, 'blocked.png') }).catch(() => {});
    await context.close();
    break;
  }
  await pause(WAIT);

  const save = (name, data) => { writeFileSync(join(dir, name), JSON.stringify(data, null, 2)); info.files.push(name); };
  const shot = async (name) => {
    if (flag('--no-screenshots')) return;
    await page.screenshot({ path: join(dir, name) }).catch(() => {});
    info.files.push(name);
  };

  const probeLoad = await page.evaluate(probeExpr).catch((e) => ({ error: String(e) }));
  save('probe-load.json', probeLoad);
  if (evalExpr) save(evalName, await page.evaluate(evalExpr).catch((e) => ({ error: String(e).slice(0, 300) })));
  await shot('00-load.png');

  // Mouse movement and hover (desktop only)
  if (!mobile) {
    await setPhase(page, 'mouse');
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
        await setPhase(page, `hover:${t.d}`);
        await page.mouse.move(t.x, t.y, { steps: 4 });
        await pause(700);
        if (i < 3) await shot(`01-hover-${i + 1}.png`);
        await page.mouse.move(5, 5, { steps: 2 });
        await pause(350);
      }
    }
  }

  // Scroll in steps, like a person (mouse wheel on desktop)
  if (STEPS > 0) {
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight).catch(() => 0);
    let current = 0;
    for (let i = 1; i <= STEPS; i++) {
      await setPhase(page, `scroll-${i}`);
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

  // Transition between pages
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
      const before = await page.evaluate(() => { window.__jkaMark = 1; window.__jka.phase = 'nav'; return window.__jka; }).catch(() => null);
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
      const spa = await page.evaluate(() => window.__jkaMark === 1).catch(() => false);
      info.navigation = { destination: link, type: spa ? 'no reload (SPA / transition library / View Transitions)' : 'full document reload' };
      // With a full reload the collector starts from zero: what was collected before the click is kept.
      if (!spa && before) info.beforeNavigating = before;
    } else {
      info.navigation = { destination: null, note: 'No visible internal link was found.' };
    }
  }

  const probeEnd = await page.evaluate(probeExpr).catch((e) => ({ error: String(e) }));
  save('probe-final.json', probeEnd);
  const collected = await page.evaluate(() => window.__jka).catch(() => null);
  const before = info.beforeNavigating;
  delete info.beforeNavigating;
  const seenAnims = [...((before && before.seen) || []), ...((collected && collected.seen) || [])];
  save('animations-seen.json', seenAnims);
  if (TRACK.length) {
    const samples = [
      ...Object.entries((before && before.samples) || {}),
      ...Object.entries((collected && collected.samples) || {}).map(([k, s]) => [before ? `${k} (destination page)` : k, s]),
    ];
    const segs = samples.flatMap(([k, s]) => analyzeTrack(k, s));
    // samplesPerSelector helps to diagnose: 0 = the selector does not exist; 1 = it exists but did not move.
    save('tracks.json', { selectors: TRACK, samplesPerSelector: Object.fromEntries(samples.map(([k, s]) => [k, s.length])), segments: segs });
    info.tracks = segs.map((s) => ({ target: s.target, channel: s.channel, phase: s.phase, durationMs: s.durationMs, from: s.from, to: s.to, scrub: s.scrollLinked, bestCurve: s.fit[0] }));
  }

  // Summary of what was seen in this window
  const byPhase = {}, dur = {}, easings = {}, props = {};
  for (const v of seenAnims) { bump(byPhase, v.phase.split(':')[0]); bump(dur, `${v.durationMs}ms`); if (v.easing) bump(easings, v.easing); for (const p of v.properties) bump(props, p); }
  info.animationsSeen = { total: seenAnims.length, byPhase, durations: top(dur, 8), easings: top(easings, 8), properties: top(props, 10) };
  info.detections = (probeEnd.detections || probeLoad.detections || []).map((d) => `${d.name}${d.version ? ' ' + d.version : ''}`);
  info.gsap = probeEnd.gsap ? { version: probeEnd.gsap.version, tweens: probeEnd.gsap.tweens?.length ?? 0, scrollTriggers: probeEnd.gsap.scrollTriggers?.length ?? 0 } : null;

  await Promise.all(pending);
  const video = page.video();
  await context.close();
  if (video) {
    const p = await video.path().catch(() => null);
    if (p && existsSync(p)) { renameSync(p, join(dir, 'video.webm')); info.files.push('video.webm'); }
  }
}

// Pass with reduced motion (first window)
if (!flag('--no-reduced') && !summary.blocked) {
  const vp = viewports[0];
  const context = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: TIMEOUT });
    await pause(WAIT);
    const p = await page.evaluate(probeExpr);
    const normal = summary.windows[0] && JSON.parse(readFileSync(join(OUT, summary.windows[0].window, 'probe-load.json'), 'utf8'));
    const cmp = {
      animationsOnLoad: { normal: normal?.totalAnimations ?? null, reduced: p.totalAnimations },
      gsapTweens: { normal: normal?.gsap?.tweens?.length ?? null, reduced: p.gsap?.tweens?.length ?? null },
      reducedMotionCssRules: p.css.reducedMotion,
    };
    const less = (cmp.animationsOnLoad.normal ?? 0) > cmp.animationsOnLoad.reduced || (cmp.gsapTweens.normal ?? 0) > (cmp.gsapTweens.reduced ?? 0);
    cmp.verdict = less ? 'reduces motion' : cmp.reducedMotionCssRules > 0 ? 'has rules but no difference was noticed on load' : 'does not respect it (no rules and no difference)';
    writeFileSync(join(OUT, 'reduced-motion.json'), JSON.stringify({ ...cmp, probe: p }, null, 2));
    summary.reducedMotion = cmp;
  } catch (e) {
    summary.reducedMotion = { error: String(e.message).split('\n')[0] };
  }
  await context.close();
}

await browser.close();

network.hosts = top(network.hosts, 20);
network.css = summarizeCss(cssNet);
writeFileSync(join(OUT, 'network.json'), JSON.stringify(network, null, 2));
summary.network = { types: network.types, hosts: network.hosts.slice(0, 10), codeSignatures: network.codeSignatures, sourcemaps: network.sourcemaps.length, banners: network.banners.length };
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));

// Readable summary
const L = [`URL: ${url}`];
if (summary.blocked) L.push(`⛔ BLOCKED (status ${summary.blocked.status}, «${summary.blocked.title}»). Not continued.`);
for (const v of summary.windows) {
  L.push(`— ${v.window}${v.error ? ' · ' + v.error : ''}`);
  if (v.error) continue;
  L.push(`  Detected: ${v.detections.join(', ') || 'nothing by signatures'}`);
  if (v.gsap) L.push(`  GSAP ${v.gsap.version}: ${v.gsap.tweens} tweens, ${v.gsap.scrollTriggers} ScrollTriggers`);
  L.push(`  Animations seen: ${v.animationsSeen.total} · by phase ${JSON.stringify(v.animationsSeen.byPhase)}`);
  L.push(`  Durations: ${v.animationsSeen.durations.map((d) => `${d.value}×${d.count}`).join(', ') || '—'}`);
  L.push(`  Easings: ${v.animationsSeen.easings.map((d) => `${d.value}×${d.count}`).join(', ') || '—'}`);
  if (v.navigation) L.push(`  Navigation: ${v.navigation.destination || '—'} → ${v.navigation.type || v.navigation.note}`);
  for (const p of v.tracks || []) {
    const tail = p.scrub ? ' · LINKED TO SCROLL (the curve depends on the scroll: use start/end/scrub, not an easing)' : ` · curve ≈ ${p.bestCurve.name} (error ${p.bestCurve.error})`;
    L.push(`  Track ${p.target} ${p.channel} (${p.phase}): ${p.from}→${p.to} in ${p.durationMs}ms${tail}`);
  }
}
if (summary.reducedMotion) L.push(`Reduced motion: ${summary.reducedMotion.verdict || summary.reducedMotion.error}`);
L.push(`Network: ${JSON.stringify(network.types)} · signatures in JS: ${network.codeSignatures.map((f) => `${f.name}${f.version ? ' ' + f.version : ''}`).join(', ') || '—'} · source maps: ${network.sourcemaps.length}`);
L.push(`CSS downloaded: ${network.css.totalKeyframes} @keyframes · durations ${network.css.durations.slice(0, 5).map((d) => d.value).join(', ') || '—'} · easings ${network.css.easings.slice(0, 4).map((d) => d.value).join(', ') || '—'}`);
L.push(`Folder: ${OUT}`);
console.log(L.join('\n'));
