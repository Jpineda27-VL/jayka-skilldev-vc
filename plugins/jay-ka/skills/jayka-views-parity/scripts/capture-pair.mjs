#!/usr/bin/env node
// Compares the same screen in two frontends: full-page screenshots side by side and differences in
// titles, actions (buttons and links), fields and text. Read-only: it does not click or submit forms.
//
// Usage:
//   node capture-pair.mjs --a <urlA> --b <urlB> --out <folder> [options]
//   node capture-pair.mjs --routes <file> --out <folder> [options]   (one line per screen: id | urlA | urlB)
// Options:
//   --viewports 1280x800,375x812   sizes (both by default)
//   --ua-a <mobile|desktop|text>   user agent of frontend A (the browser's by default)
//   --ua-b <mobile|desktop|text>   user agent of frontend B (useful if the server picks the frontend by device)
//   --wait 1200                    wait after load (ms)
// Exits 0 if all screens match, 1 if any differs, 3 if Playwright is missing.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const OUT = resolve(opt('--out', 'parity'));
const viewports = opt('--viewports', '1280x800,375x812').split(',').map((v) => { const [width, height] = v.split('x').map(Number); return { width, height }; });
const WAIT = Number(opt('--wait', '1200'));
const TOOLS_DIR = join(homedir(), '.claude', 'jayka', 'tools');
const UA = {
  mobile: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  movil: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  escritorio: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
};
const uaFor = (v) => (v ? UA[v] || v : undefined);

let pairs = [];
const routesFile = opt('--routes') || opt('--rutas');
if (routesFile) {
  pairs = readFileSync(routesFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('|').map((s) => s.trim())).filter((p) => p.length >= 3).map(([id, a, b]) => ({ id, a, b }));
} else if (opt('--a') && opt('--b')) {
  pairs = [{ id: 'screen', a: opt('--a'), b: opt('--b') }];
}
if (!pairs.length) { console.error('Usage: node capture-pair.mjs --a <urlA> --b <urlB> --out <folder>  |  --routes <file> --out <folder>'); process.exit(2); }

function loadPlaywright() {
  for (const base of [process.env.JAYKA_TOOLS, TOOLS_DIR, process.cwd()].filter(Boolean)) {
    try { return createRequire(join(base, 'package.json'))('playwright'); } catch { /* next */ }
  }
  return null;
}
const pw = loadPlaywright();
if (!pw) { console.error(`Playwright is missing. Install it (with permission) with:\n  npm install --prefix "${TOOLS_DIR}" playwright\n  npx --prefix "${TOOLS_DIR}" playwright install chromium`); process.exit(3); }

// What is extracted from each screen
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
    title: document.title,
    headings: list('h1, h2, h3'),
    actions: list('button, [role=button], a[href], input[type=submit]').slice(0, 80),
    fields,
    images: [...document.querySelectorAll('img')].filter(vis).length,
    words,
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
        return { status: resp ? resp.status() : 0, ...(await page.evaluate(extract)) };
      } catch (e) { return { error: String(e.message).split('\n')[0] }; } finally { await ctx.close(); }
    };
    const A = await side(p.a, uaFor(opt('--ua-a')), 'A');
    const B = await side(p.b, uaFor(opt('--ua-b')), 'B');
    const r = { id: p.id, window: `${vp.width}x${vp.height}`, a: p.a, b: p.b, screenshotA: `${tag}-A.png`, screenshotB: `${tag}-B.png` };
    if (A.error || B.error) { Object.assign(r, { result: 'error', detail: A.error || B.error }); results.push(r); continue; }
    const diff = (x, y) => x.filter((v) => !y.includes(v));
    const wa = new Set(A.words), wb = new Set(B.words);
    const inter = [...wa].filter((w) => wb.has(w)).length;
    const jaccard = wa.size + wb.size - inter ? inter / (wa.size + wb.size - inter) : 1;
    Object.assign(r, {
      statusA: A.status, statusB: B.status,
      onlyInA: { headings: diff(A.headings, B.headings), actions: diff(A.actions, B.actions), fields: diff(A.fields, B.fields) },
      onlyInB: { headings: diff(B.headings, A.headings), actions: diff(B.actions, A.actions), fields: diff(B.fields, A.fields) },
      images: { a: A.images, b: B.images },
      textSimilarity: Math.round(jaccard * 100) / 100,
    });
    const nDiff = ['headings', 'actions', 'fields'].reduce((n, k) => n + r.onlyInA[k].length + r.onlyInB[k].length, 0);
    r.result = nDiff === 0 && jaccard >= 0.9 && A.status < 400 && B.status < 400 ? 'same' : 'differs';
    results.push(r);
  }
}
await browser.close();

writeFileSync(join(OUT, 'parity.json'), JSON.stringify(results, null, 2));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const li = (arr) => (arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="ok">—</p>');
const html = `<!doctype html><meta charset="utf-8"><title>Parity</title><style>
body{font:14px system-ui,sans-serif;margin:24px;color:#222}section{margin:0 0 48px}h2{margin:0 0 4px}.meta{color:#666;margin:0 0 12px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}.cols img{width:100%;border:1px solid #ddd}
.same{color:#1b6b42}.differs,.error{color:#b3123f}.ok{color:#888}table{border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ddd;padding:4px 8px;vertical-align:top;text-align:left}</style>
<h1>Parity between frontends</h1>
${results.map((r) => `<section><h2>${esc(r.id)} · ${r.window} · <span class="${r.result}">${r.result}</span></h2>
<p class="meta">A: ${esc(r.a)} · B: ${esc(r.b)}${r.textSimilarity !== undefined ? ` · text similarity ${r.textSimilarity}` : ''}${r.detail ? ' · ' + esc(r.detail) : ''}</p>
${r.onlyInA ? `<table><tr><th></th><th>Only in A</th><th>Only in B</th></tr>${['headings', 'actions', 'fields'].map((k) => `<tr><th>${k}</th><td>${li(r.onlyInA[k])}</td><td>${li(r.onlyInB[k])}</td></tr>`).join('')}</table>` : ''}
<div class="cols"><figure><figcaption>A</figcaption><img src="${r.screenshotA}"></figure><figure><figcaption>B</figcaption><img src="${r.screenshotB}"></figure></div></section>`).join('')}`;
writeFileSync(join(OUT, 'parity.html'), html);

console.log('| screen | window | result | only in A | only in B | text similarity |');
console.log('|---|---|---|---|---|---|');
const label = { headings: 'heading', actions: 'action', fields: 'field' };
const fmt = (o) => (o ? ['headings', 'actions', 'fields'].flatMap((k) => o[k].map((x) => `${label[k]}: ${x}`)).slice(0, 4).join('; ').replace(/\|/g, '\\|') || '—' : '—');
for (const r of results) {
  console.log(`| ${r.id} | ${r.window} | ${r.result}${r.detail ? ' (' + r.detail + ')' : ''} | ${fmt(r.onlyInA)} | ${fmt(r.onlyInB)} | ${r.textSimilarity ?? '—'} |`);
}
console.log(`\nVisual report: ${join(OUT, 'parity.html')}`);
process.exit(results.every((r) => r.result === 'same') ? 0 : 1);
