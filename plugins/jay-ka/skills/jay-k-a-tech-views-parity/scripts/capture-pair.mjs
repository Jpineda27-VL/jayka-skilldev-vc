#!/usr/bin/env node
// Compara la misma pantalla en dos frontends: capturas de página completa lado a lado y diferencias de
// títulos, acciones (botones y enlaces), campos y texto. Solo lectura: no hace clics ni envía formularios.
//
// Uso:
//   node capture-pair.mjs --a <urlA> --b <urlB> --out <carpeta> [opciones]
//   node capture-pair.mjs --rutas <archivo> --out <carpeta> [opciones]   (una línea por pantalla: id | urlA | urlB)
// Opciones:
//   --viewports 1280x800,375x812   tamaños (por defecto ambos)
//   --ua-a <movil|escritorio|texto> agente de usuario del frontend A (por defecto el del navegador)
//   --ua-b <movil|escritorio|texto> agente de usuario del frontend B (útil si el servidor elige frontend por dispositivo)
//   --wait 1200                    espera tras cargar (ms)
// Sale con 0 si todas las pantallas coinciden, 1 si alguna difiere, 3 si falta Playwright.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const OUT = resolve(opt('--out', 'paridad'));
const viewports = opt('--viewports', '1280x800,375x812').split(',').map((v) => { const [width, height] = v.split('x').map(Number); return { width, height }; });
const WAIT = Number(opt('--wait', '1200'));
const UA = {
  movil: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  escritorio: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
};
const uaFor = (v) => (v ? UA[v] || v : undefined);

let pairs = [];
if (opt('--rutas')) {
  pairs = readFileSync(opt('--rutas'), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('|').map((s) => s.trim())).filter((p) => p.length >= 3).map(([id, a, b]) => ({ id, a, b }));
} else if (opt('--a') && opt('--b')) {
  pairs = [{ id: 'pantalla', a: opt('--a'), b: opt('--b') }];
}
if (!pairs.length) { console.error('Uso: node capture-pair.mjs --a <urlA> --b <urlB> --out <carpeta>  |  --rutas <archivo> --out <carpeta>'); process.exit(2); }

function loadPlaywright() {
  for (const base of [process.env.JAYKA_TOOLS, join(homedir(), '.claude', 'jay-k-a', 'tools'), process.cwd()].filter(Boolean)) {
    try { return createRequire(join(base, 'package.json'))('playwright'); } catch { /* siguiente */ }
  }
  return null;
}
const pw = loadPlaywright();
if (!pw) { console.error(`Falta Playwright. Instálalo (con permiso) con:\n  npm install --prefix "${join(homedir(), '.claude', 'jay-k-a', 'tools')}" playwright\n  npx --prefix "${join(homedir(), '.claude', 'jay-k-a', 'tools')}" playwright install chromium`); process.exit(3); }

// Qué se extrae de cada pantalla
const extract = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const txt = (el) => (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
  const list = (sel) => [...new Set([...document.querySelectorAll(sel)].filter(vis).map(txt).filter(Boolean))];
  const fields = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(vis).map((f) => {
    const label = (f.id && document.querySelector(`label[for="${CSS.escape(f.id)}"]`)) || f.closest('label');
    return (label ? txt(label) : '') || f.getAttribute('placeholder') || f.getAttribute('aria-label') || f.name || f.type;
  });
  const main = document.querySelector('main') || document.body;
  const words = [...new Set((main.innerText || '').toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])];
  return {
    titulo: document.title,
    encabezados: list('h1, h2, h3'),
    acciones: list('button, [role=button], a[href], input[type=submit]').slice(0, 80),
    campos: fields,
    imagenes: [...document.querySelectorAll('img')].filter(vis).length,
    palabras: words,
  };
};

const browser = await pw.chromium.launch();
const results = [];
mkdirSync(OUT, { recursive: true });
for (const p of pairs) {
  for (const vp of viewports) {
    const tag = `${p.id}-${vp.width}`;
    const side = async (url, ua, name) => {
      const ctx = await browser.newContext({ viewport: vp, userAgent: ua, isMobile: vp.width < 768, hasTouch: vp.width < 768 });
      const page = await ctx.newPage();
      try {
        const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(WAIT);
        await page.screenshot({ path: join(OUT, `${tag}-${name}.png`), fullPage: true });
        return { estado: resp ? resp.status() : 0, ...(await page.evaluate(extract)) };
      } catch (e) { return { error: String(e.message).split('\n')[0] }; } finally { await ctx.close(); }
    };
    const A = await side(p.a, uaFor(opt('--ua-a')), 'A');
    const B = await side(p.b, uaFor(opt('--ua-b')), 'B');
    const r = { id: p.id, ventana: `${vp.width}x${vp.height}`, a: p.a, b: p.b, capturaA: `${tag}-A.png`, capturaB: `${tag}-B.png` };
    if (A.error || B.error) { Object.assign(r, { resultado: 'error', detalle: A.error || B.error }); results.push(r); continue; }
    const diff = (x, y) => x.filter((v) => !y.includes(v));
    const wa = new Set(A.palabras), wb = new Set(B.palabras);
    const inter = [...wa].filter((w) => wb.has(w)).length;
    const jaccard = wa.size + wb.size - inter ? inter / (wa.size + wb.size - inter) : 1;
    Object.assign(r, {
      estadoA: A.estado, estadoB: B.estado,
      soloEnA: { encabezados: diff(A.encabezados, B.encabezados), acciones: diff(A.acciones, B.acciones), campos: diff(A.campos, B.campos) },
      soloEnB: { encabezados: diff(B.encabezados, A.encabezados), acciones: diff(B.acciones, A.acciones), campos: diff(B.campos, A.campos) },
      imagenes: { a: A.imagenes, b: B.imagenes },
      similitudTexto: Math.round(jaccard * 100) / 100,
    });
    const nDiff = ['encabezados', 'acciones', 'campos'].reduce((n, k) => n + r.soloEnA[k].length + r.soloEnB[k].length, 0);
    r.resultado = nDiff === 0 && jaccard >= 0.9 && A.estado < 400 && B.estado < 400 ? 'igual' : 'difiere';
    results.push(r);
  }
}
await browser.close();

writeFileSync(join(OUT, 'paridad.json'), JSON.stringify(results, null, 2));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const li = (arr) => (arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="ok">—</p>');
const html = `<!doctype html><meta charset="utf-8"><title>Paridad</title><style>
body{font:14px system-ui,sans-serif;margin:24px;color:#222}section{margin:0 0 48px}h2{margin:0 0 4px}.meta{color:#666;margin:0 0 12px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}.cols img{width:100%;border:1px solid #ddd}
.igual{color:#1b6b42}.difiere,.error{color:#b3123f}.ok{color:#888}table{border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ddd;padding:4px 8px;vertical-align:top;text-align:left}</style>
<h1>Paridad entre frontends</h1>
${results.map((r) => `<section><h2>${esc(r.id)} · ${r.ventana} · <span class="${r.resultado}">${r.resultado}</span></h2>
<p class="meta">A: ${esc(r.a)} · B: ${esc(r.b)}${r.similitudTexto !== undefined ? ` · similitud de texto ${r.similitudTexto}` : ''}${r.detalle ? ' · ' + esc(r.detalle) : ''}</p>
${r.soloEnA ? `<table><tr><th></th><th>Solo en A</th><th>Solo en B</th></tr>${['encabezados', 'acciones', 'campos'].map((k) => `<tr><th>${k}</th><td>${li(r.soloEnA[k])}</td><td>${li(r.soloEnB[k])}</td></tr>`).join('')}</table>` : ''}
<div class="cols"><figure><figcaption>A</figcaption><img src="${r.capturaA}"></figure><figure><figcaption>B</figcaption><img src="${r.capturaB}"></figure></div></section>`).join('')}`;
writeFileSync(join(OUT, 'paridad.html'), html);

console.log('| pantalla | ventana | resultado | solo en A | solo en B | similitud texto |');
console.log('|---|---|---|---|---|---|');
for (const r of results) {
  const label = { encabezados: 'título', acciones: 'acción', campos: 'campo' };
  const fmt = (o) => (o ? ['encabezados', 'acciones', 'campos'].flatMap((k) => o[k].map((x) => `${label[k]}: ${x}`)).slice(0, 4).join('; ').replace(/\|/g, '\\|') || '—' : '—');
  console.log(`| ${r.id} | ${r.ventana} | ${r.resultado}${r.detalle ? ' (' + r.detalle + ')' : ''} | ${fmt(r.soloEnA)} | ${fmt(r.soloEnB)} | ${r.similitudTexto ?? '—'} |`);
}
console.log(`\nInforme visual: ${join(OUT, 'paridad.html')}`);
process.exit(results.every((r) => r.resultado === 'igual') ? 0 : 1);
