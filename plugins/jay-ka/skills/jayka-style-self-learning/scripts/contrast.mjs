#!/usr/bin/env node
// Contraste WCAG entre pares de colores (texto y fondo).
// Uso: node contrast.mjs <texto> <fondo> [<texto> <fondo> ...] [--grande]
// Ejemplo: node contrast.mjs "#26264F" "#FFF8EF" "rgba(0,0,0,.6)" white
// Acepta #hex (3, 4, 6 u 8), rgb(), rgba(), hsl(), white, black.
import { parseColor, contrast, level, toHex } from './lib/color.mjs';

const argv = process.argv.slice(2);
const large = argv.includes('--grande');
const vals = argv.filter((a) => a !== '--grande');
if (!vals.length || vals.length % 2) { console.error('Uso: node contrast.mjs <texto> <fondo> [<texto> <fondo> ...] [--grande]'); process.exit(2); }
let fails = 0;
console.log(`| texto | fondo | ratio | nivel (${large ? 'texto grande' : 'texto normal'}) |`);
console.log('|---|---|---|---|');
for (let i = 0; i < vals.length; i += 2) {
  const fg = parseColor(vals[i]), bg = parseColor(vals[i + 1]);
  if (!fg || !bg) { console.log(`| ${vals[i]} | ${vals[i + 1]} | — | color no reconocido |`); fails++; continue; }
  const r = contrast(fg, bg);
  const lv = level(r, large);
  if (lv === 'no cumple') fails++;
  console.log(`| ${toHex(fg)} | ${toHex(bg)} | ${r}:1 | ${lv} |`);
}
process.exit(fails ? 1 : 0);
