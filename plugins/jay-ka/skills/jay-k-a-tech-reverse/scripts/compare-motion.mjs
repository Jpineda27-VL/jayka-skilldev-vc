#!/usr/bin/env node
// Compara el movimiento del original con el de la reproducción.
// Uso:
//   node compare-motion.mjs <original/pistas.json> <repro/pistas.json> [--canal ty] [--tolerancia 10]
//   node compare-motion.mjs <original/animaciones-vistas.json> <repro/animaciones-vistas.json>
// Sale con código 0 si todo coincide y 1 si algo no coincide.
import { readFileSync } from 'node:fs';
import { rmse } from './lib/curves.mjs';

const argv = process.argv.slice(2);
const [fa, fb] = argv.filter((a) => !a.startsWith('--') && /\.json$/i.test(a));
if (!fa || !fb) { console.error('Uso: node compare-motion.mjs <original.json> <repro.json> [--canal <canal>] [--tolerancia <porcentaje>]'); process.exit(2); }
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const CANAL = opt('--canal', null);
const TOL = Number(opt('--tolerancia', '10')) / 100;
const A = JSON.parse(readFileSync(fa, 'utf8'));
const B = JSON.parse(readFileSync(fb, 'utf8'));

const durOk = (a, b) => Math.abs(a - b) <= Math.max(a * TOL, 40);
const rows = [];
let fails = 0;

if (A.tramos && B.tramos) {
  const ta = A.tramos.filter((t) => !CANAL || t.canal === CANAL);
  const tb = B.tramos.filter((t) => !CANAL || t.canal === CANAL);
  const used = new Set();
  for (const a of ta) {
    let best = null;
    for (const [i, b] of tb.entries()) {
      if (used.has(i) || b.canal !== a.canal) continue;
      const score = rmse(a.curva, b.curva) + Math.abs(a.duracionMs - b.duracionMs) / Math.max(a.duracionMs, 1);
      if (!best || score < best.score) best = { i, b, score };
    }
    if (!best) { rows.push([a.objetivo, a.canal, a.duracionMs, '—', '—', '—', '✗ sin pareja en la reproducción']); fails++; continue; }
    used.add(best.i);
    const b = best.b;
    const errCurva = rmse(a.curva, b.curva);
    const ampA = a.hasta - a.desde, ampB = b.hasta - b.desde;
    const ampOk = Math.sign(ampA) === Math.sign(ampB) && Math.abs(Math.abs(ampB) - Math.abs(ampA)) <= Math.abs(ampA) * 0.2 + 1e-6;
    const scrubOk = a.ligadoAlScroll === b.ligadoAlScroll;
    const ok = durOk(a.duracionMs, b.duracionMs) && errCurva <= 0.05 && ampOk && scrubOk;
    if (!ok) fails++;
    const why = [!durOk(a.duracionMs, b.duracionMs) && 'duración', errCurva > 0.05 && 'curva', !ampOk && 'recorrido', !scrubOk && 'scrub'].filter(Boolean).join(', ');
    rows.push([a.objetivo, a.canal, a.duracionMs, b.duracionMs, `${(((b.duracionMs - a.duracionMs) / Math.max(a.duracionMs, 1)) * 100).toFixed(1)}%`, errCurva.toFixed(3), ok ? '✓' : `✗ ${why}`]);
  }
  console.log('| objetivo | canal | original ms | repro ms | dif. | error curva | resultado |');
} else if (Array.isArray(A) && Array.isArray(B)) {
  const key = (v) => `${v.nombre}|${[...v.propiedades].sort().join(',')}`;
  const firstOf = (list) => { const m = new Map(); for (const v of list) if (!m.has(key(v))) m.set(key(v), v); return m; };
  const ma = firstOf(A), mb = firstOf(B);
  for (const [k, a] of ma) {
    const b = mb.get(k);
    if (!b) { rows.push([a.nombre, a.propiedades.join(' '), a.duracionMs, '—', a.curva, '—', '✗ sin pareja']); fails++; continue; }
    const ok = durOk(Number(a.duracionMs), Number(b.duracionMs)) && a.curva === b.curva;
    if (!ok) fails++;
    rows.push([a.nombre, a.propiedades.join(' '), a.duracionMs, b.duracionMs, a.curva, b.curva, ok ? '✓' : '✗']);
  }
  console.log('| animación | propiedades | original ms | repro ms | curva original | curva repro | resultado |');
} else {
  console.error('Los dos archivos deben ser del mismo tipo: pistas.json o animaciones-vistas.json.');
  process.exit(2);
}
console.log('|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.join(' | ')} |`);
console.log(`\n${rows.length - fails}/${rows.length} coinciden (tolerancia de duración ±${TOL * 100}% o ±40 ms; error de curva ≤ 0.05).`);
process.exit(fails ? 1 : 0);
