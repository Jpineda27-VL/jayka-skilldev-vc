#!/usr/bin/env node
// Valida un tokens.json contra el formato de reference/tokens.schema.json (que es un ejemplo comentado):
// claves conocidas, tipos, colores legibles, fecha y slug, y RECALCULA cada contraste declarado.
// Uso: node check-tokens.mjs <tokens.json>
// Sale con 0 si no hay errores, 1 si los hay.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseColor, contrast, level } from './lib/color.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
if (!file) { console.error('Uso: node check-tokens.mjs <tokens.json>'); process.exit(2); }
const ref = JSON.parse(readFileSync(join(here, '..', 'reference', 'tokens.schema.json'), 'utf8'));
delete ref.$comment;
let data;
try { data = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`JSON inválido: ${e.message}`); process.exit(1); }
delete data.$comment;

const errors = [], warnings = [], info = [];
const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

// 1. Forma: compara con el ejemplo. null siempre vale (dato no encontrado).
function compare(val, example, path) {
  if (val === null || example === null || example === undefined) return;
  const kv = kind(val), ke = kind(example);
  if (kv !== ke) { errors.push(`${path}: se esperaba ${ke}, hay ${kv}`); return; }
  if (ke === 'object') {
    for (const k of Object.keys(val)) {
      if (path === 'color.roles' || path === 'color.oscuro' || path === 'forma.radios') continue; // nombres libres
      if (!(k in example)) warnings.push(`${path ? path + '.' : ''}${k}: clave no prevista en el formato`);
      else compare(val[k], example[k], path ? `${path}.${k}` : k);
    }
  } else if (ke === 'array' && example.length) {
    val.forEach((item, i) => compare(item, example[0], `${path}[${i}]`));
  }
}
compare(data, ref, '');

// 2. Fecha y slug
if (data.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha)) errors.push(`fecha: «${data.fecha}» no es AAAA-MM-DD`);
if (data.proyecto && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.proyecto)) errors.push(`proyecto: «${data.proyecto}» no es un slug (minúsculas y guiones)`);

// 3. Colores legibles
const roles = (data.color && data.color.roles) || {};
const checkColors = (obj, path) => { for (const [k, v] of Object.entries(obj || {})) if (v !== null && !parseColor(v)) errors.push(`${path}.${k}: color no reconocido «${v}»`); };
checkColors(roles, 'color.roles');
if (data.color && data.color.oscuro && typeof data.color.oscuro === 'object') checkColors(data.color.oscuro.roles || data.color.oscuro, 'color.oscuro');
((data.color && data.color.otros) || []).forEach((o, i) => { if (o && o.valor && !parseColor(o.valor)) errors.push(`color.otros[${i}].valor: color no reconocido «${o.valor}»`); });

// 4. Contrastes declarados: se recalculan
const declared = new Set();
((data.color && data.color.contraste) || []).forEach((c, i) => {
  const [a, b] = String(c.par || '').split('/');
  declared.add(`${a}/${b}`);
  const fg = parseColor(roles[a] || ''), bg = parseColor(roles[b] || '');
  if (!fg || !bg) { warnings.push(`color.contraste[${i}] «${c.par}»: algún rol no está en color.roles; no se pudo recalcular`); return; }
  const r = contrast(fg, bg), lv = level(r);
  if (typeof c.ratio !== 'number' || Math.abs(c.ratio - r) > 0.15) errors.push(`color.contraste[${i}] «${c.par}»: declara ${c.ratio}, el cálculo da ${r}`);
  if (c.cumple && c.cumple !== lv) errors.push(`color.contraste[${i}] «${c.par}»: declara ${c.cumple}, corresponde ${lv}`);
});

// 5. Pares importantes no declarados: se informan calculados
for (const [a, b] of [['texto', 'fondo'], ['textoSuave', 'fondo'], ['texto', 'superficie'], ['primario', 'fondo'], ['peligro', 'fondo']]) {
  if (declared.has(`${a}/${b}`) || !roles[a] || !roles[b]) continue;
  const fg = parseColor(roles[a]), bg = parseColor(roles[b]);
  if (fg && bg) { const r = contrast(fg, bg); info.push(`${a}/${b}: ${r}:1 (${level(r)}) — no declarado; agrégalo a color.contraste`); }
}

console.log(`Archivo: ${file}`);
for (const e of errors) console.log(`✗ ${e}`);
for (const w of warnings) console.log(`! ${w}`);
for (const i of info) console.log(`· ${i}`);
console.log(`${errors.length} error(es), ${warnings.length} aviso(s).`);
process.exit(errors.length ? 1 : 0);
