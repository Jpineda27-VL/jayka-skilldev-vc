#!/usr/bin/env node
// WCAG contrast between pairs of colors (text and background).
// Usage: node contrast.mjs <text> <background> [<text> <background> ...] [--large]
// Example: node contrast.mjs "#26264F" "#FFF8EF" "rgba(0,0,0,.6)" white
// Accepts #hex (3, 4, 6 or 8), rgb(), rgba(), hsl(), white, black.
import { parseColor, contrast, level, toHex } from './lib/color.mjs';

const argv = process.argv.slice(2);
const large = argv.includes('--large');
const vals = argv.filter((a) => a !== '--large');
if (!vals.length || vals.length % 2) { console.error('Usage: node contrast.mjs <text> <background> [<text> <background> ...] [--large]'); process.exit(2); }
let fails = 0;
console.log(`| text | background | ratio | level (${large ? 'large text' : 'normal text'}) |`);
console.log('|---|---|---|---|');
for (let i = 0; i < vals.length; i += 2) {
  const fg = parseColor(vals[i]), bg = parseColor(vals[i + 1]);
  if (!fg || !bg) { console.log(`| ${vals[i]} | ${vals[i + 1]} | — | color not recognized |`); fails++; continue; }
  const r = contrast(fg, bg);
  const lv = level(r, large);
  if (lv === 'fail') fails++;
  console.log(`| ${toHex(fg)} | ${toHex(bg)} | ${r}:1 | ${lv} |`);
}
process.exit(fails ? 1 : 0);
