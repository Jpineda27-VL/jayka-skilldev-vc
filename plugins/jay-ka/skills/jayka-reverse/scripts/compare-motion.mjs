#!/usr/bin/env node
// Compares the motion of the original with that of the reproduction.
// Usage:
//   node compare-motion.mjs <original/tracks.json> <repro/tracks.json> [--channel ty] [--tolerance 10]
//   node compare-motion.mjs <original/animations-seen.json> <repro/animations-seen.json>
// Exits 0 if everything matches and 1 if something does not.
import { readFileSync } from 'node:fs';
import { rmse } from './lib/curves.mjs';

const argv = process.argv.slice(2);
const [fa, fb] = argv.filter((a) => !a.startsWith('--') && /\.json$/i.test(a));
if (!fa || !fb) { console.error('Usage: node compare-motion.mjs <original.json> <repro.json> [--channel <channel>] [--tolerance <percent>]'); process.exit(2); }
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const CHANNEL = opt('--channel', null);
const TOL = Number(opt('--tolerance', '10')) / 100;
const A = JSON.parse(readFileSync(fa, 'utf8'));
const B = JSON.parse(readFileSync(fb, 'utf8'));

const durOk = (a, b) => Math.abs(a - b) <= Math.max(a * TOL, 40);
const rows = [];
let fails = 0;

if (A.segments && B.segments) {
  const sa = A.segments.filter((t) => !CHANNEL || t.channel === CHANNEL);
  const sb = B.segments.filter((t) => !CHANNEL || t.channel === CHANNEL);
  const used = new Set();
  for (const a of sa) {
    let best = null;
    for (const [i, b] of sb.entries()) {
      if (used.has(i) || b.channel !== a.channel) continue;
      const score = rmse(a.curve, b.curve) + Math.abs(a.durationMs - b.durationMs) / Math.max(a.durationMs, 1);
      if (!best || score < best.score) best = { i, b, score };
    }
    if (!best) { rows.push([a.target, a.channel, a.durationMs, '—', '—', '—', '✗ no match in the reproduction']); fails++; continue; }
    used.add(best.i);
    const b = best.b;
    const curveError = rmse(a.curve, b.curve);
    const ampA = a.to - a.from, ampB = b.to - b.from;
    const ampOk = Math.sign(ampA) === Math.sign(ampB) && Math.abs(Math.abs(ampB) - Math.abs(ampA)) <= Math.abs(ampA) * 0.2 + 1e-6;
    const scrubOk = a.scrollLinked === b.scrollLinked;
    const ok = durOk(a.durationMs, b.durationMs) && curveError <= 0.05 && ampOk && scrubOk;
    if (!ok) fails++;
    const why = [!durOk(a.durationMs, b.durationMs) && 'duration', curveError > 0.05 && 'curve', !ampOk && 'travel', !scrubOk && 'scrub'].filter(Boolean).join(', ');
    rows.push([a.target, a.channel, a.durationMs, b.durationMs, `${(((b.durationMs - a.durationMs) / Math.max(a.durationMs, 1)) * 100).toFixed(1)}%`, curveError.toFixed(3), ok ? '✓' : `✗ ${why}`]);
  }
  console.log('| target | channel | original ms | repro ms | diff. | curve error | result |');
} else if (Array.isArray(A) && Array.isArray(B)) {
  const key = (v) => `${v.name}|${[...v.properties].sort().join(',')}`;
  const firstOf = (list) => { const m = new Map(); for (const v of list) if (!m.has(key(v))) m.set(key(v), v); return m; };
  const ma = firstOf(A), mb = firstOf(B);
  for (const [k, a] of ma) {
    const b = mb.get(k);
    if (!b) { rows.push([a.name, a.properties.join(' '), a.durationMs, '—', a.easing, '—', '✗ no match']); fails++; continue; }
    const ok = durOk(Number(a.durationMs), Number(b.durationMs)) && a.easing === b.easing;
    if (!ok) fails++;
    rows.push([a.name, a.properties.join(' '), a.durationMs, b.durationMs, a.easing, b.easing, ok ? '✓' : '✗']);
  }
  console.log('| animation | properties | original ms | repro ms | original easing | repro easing | result |');
} else {
  console.error('Both files must be of the same type: tracks.json or animations-seen.json.');
  process.exit(2);
}
console.log('|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.join(' | ')} |`);
console.log(`\n${rows.length - fails}/${rows.length} match (duration tolerance ±${TOL * 100}% or ±40 ms; curve error ≤ 0.05).`);
process.exit(fails ? 1 : 0);
