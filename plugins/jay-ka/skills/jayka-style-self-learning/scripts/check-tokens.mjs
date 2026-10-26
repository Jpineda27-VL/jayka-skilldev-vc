#!/usr/bin/env node
// Validates a tokens.json against the format of reference/tokens.schema.json (which is a commented example):
// known keys, types, readable colors, date and slug, and RECALCULATES every declared contrast.
// Usage: node check-tokens.mjs <tokens.json>
// Exits 0 if there are no errors, 1 if there are.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseColor, contrast, level } from './lib/color.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
if (!file) { console.error('Usage: node check-tokens.mjs <tokens.json>'); process.exit(2); }
const ref = JSON.parse(readFileSync(join(here, '..', 'reference', 'tokens.schema.json'), 'utf8'));
delete ref.$comment;
let data;
try { data = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`Invalid JSON: ${e.message}`); process.exit(1); }
delete data.$comment;

const errors = [], warnings = [], info = [];
const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

// 1. Shape: compare with the example. null is always valid (datum not found).
function compare(val, example, path) {
  if (val === null || example === null || example === undefined) return;
  const kv = kind(val), ke = kind(example);
  if (kv !== ke) { errors.push(`${path}: expected ${ke}, found ${kv}`); return; }
  if (ke === 'object') {
    for (const k of Object.keys(val)) {
      if (path === 'color.roles' || path === 'color.dark' || path === 'shape.radii') continue; // free names
      if (!(k in example)) warnings.push(`${path ? path + '.' : ''}${k}: key not foreseen in the format`);
      else compare(val[k], example[k], path ? `${path}.${k}` : k);
    }
  } else if (ke === 'array' && example.length) {
    val.forEach((item, i) => compare(item, example[0], `${path}[${i}]`));
  }
}
compare(data, ref, '');

// 2. Date and slug
if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) errors.push(`date: «${data.date}» is not YYYY-MM-DD`);
if (data.project && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.project)) errors.push(`project: «${data.project}» is not a slug (lowercase and hyphens)`);

// 3. Readable colors
const roles = (data.color && data.color.roles) || {};
const checkColors = (obj, path) => { for (const [k, v] of Object.entries(obj || {})) if (v !== null && !parseColor(v)) errors.push(`${path}.${k}: color not recognized «${v}»`); };
checkColors(roles, 'color.roles');
if (data.color && data.color.dark && typeof data.color.dark === 'object') checkColors(data.color.dark.roles || data.color.dark, 'color.dark');
((data.color && data.color.others) || []).forEach((o, i) => { if (o && o.value && !parseColor(o.value)) errors.push(`color.others[${i}].value: color not recognized «${o.value}»`); });

// 4. Declared contrasts: they are recalculated
const declared = new Set();
((data.color && data.color.contrast) || []).forEach((c, i) => {
  const [a, b] = String(c.pair || '').split('/');
  declared.add(`${a}/${b}`);
  const fg = parseColor(roles[a] || ''), bg = parseColor(roles[b] || '');
  if (!fg || !bg) { warnings.push(`color.contrast[${i}] «${c.pair}»: some role is not in color.roles; it could not be recalculated`); return; }
  const r = contrast(fg, bg), lv = level(r);
  if (typeof c.ratio !== 'number' || Math.abs(c.ratio - r) > 0.15) errors.push(`color.contrast[${i}] «${c.pair}»: declares ${c.ratio}, the calculation gives ${r}`);
  if (c.passes && c.passes !== lv) errors.push(`color.contrast[${i}] «${c.pair}»: declares ${c.passes}, it corresponds to ${lv}`);
});

// 5. Important pairs not declared: they are reported, calculated
for (const [a, b] of [['text', 'background'], ['textSoft', 'background'], ['text', 'surface'], ['primary', 'background'], ['danger', 'background']]) {
  if (declared.has(`${a}/${b}`) || !roles[a] || !roles[b]) continue;
  const fg = parseColor(roles[a]), bg = parseColor(roles[b]);
  if (fg && bg) { const r = contrast(fg, bg); info.push(`${a}/${b}: ${r}:1 (${level(r)}) — not declared; add it to color.contrast`); }
}

console.log(`File: ${file}`);
for (const e of errors) console.log(`✗ ${e}`);
for (const w of warnings) console.log(`! ${w}`);
for (const i of info) console.log(`· ${i}`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
