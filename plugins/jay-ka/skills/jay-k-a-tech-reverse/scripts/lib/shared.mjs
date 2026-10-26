// Utilidades compartidas por scan-repo.mjs y capture-live.mjs. Sin dependencias.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export function loadSignatures() {
  const raw = JSON.parse(readFileSync(join(here, '..', 'signatures.json'), 'utf8'));
  return raw.signatures.map((s) => ({
    ...s,
    importsRe: (s.imports || []).map((p) => new RegExp(p)),
    scriptUrlRe: (s.scriptUrl || []).map((p) => new RegExp(p, 'i')),
    bannerRe: (s.banner || []).map((p) => new RegExp(p)),
  }));
}

export const bump = (obj, key, n = 1) => { obj[key] = (obj[key] || 0) + n; };

export const top = (obj, n = 12) =>
  Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([valor, veces]) => ({ valor, veces }));

export function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

// Convierte "0.3s", "300ms" a milisegundos.
export function toMs(num, unit) {
  const v = parseFloat(num);
  return unit === 's' ? Math.round(v * 1000) : Math.round(v);
}

const EASING_RE = /cubic-bezier\([^)]*\)|steps\([^)]*\)|linear\([^)]*\)|\b(?:ease-in-out|ease-in|ease-out|ease|linear|step-start|step-end)\b/g;
const DURATION_RE = /(\d*\.?\d+)(ms|s)\b/g;

function collectTiming(value, acc) {
  for (const m of value.matchAll(DURATION_RE)) bump(acc.duraciones, `${toMs(m[1], m[2])}ms`);
  for (const m of value.matchAll(EASING_RE)) bump(acc.curvas, m[0].replace(/\s+/g, ''));
}

export function emptyCssMotion() {
  return {
    keyframes: [], transiciones: {}, propiedadesTransicion: {}, animaciones: {}, duraciones: {}, curvas: {},
    movimientoReducido: 0, viewTransitions: 0, scrollDriven: 0, scrollSnap: 0, scrollSuaveCss: 0, willChange: {},
  };
}

// Analiza texto CSS/SCSS (o un <style> embebido) y acumula en `acc`. `where` se usa para ubicar hallazgos.
export function analyzeCss(text, acc = emptyCssMotion(), where = null) {
  for (const m of text.matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)) {
    acc.keyframes.push(where ? { nombre: m[1], archivo: where, linea: lineAt(text, m.index) } : { nombre: m[1] });
  }
  for (const m of text.matchAll(/(?:^|[;{\s])transition\s*:\s*([^;}]+)/g)) {
    const v = m[1].trim();
    if (/^(none|inherit|initial|unset)$/.test(v)) continue;
    bump(acc.transiciones, v.replace(/\s+/g, ' ').slice(0, 120));
    for (const part of v.split(',')) {
      const prop = part.trim().split(/\s+/)[0];
      if (prop && !/^\d/.test(prop)) bump(acc.propiedadesTransicion, prop);
    }
    collectTiming(v, acc);
  }
  for (const m of text.matchAll(/(?:^|[;{\s])transition-property\s*:\s*([^;}]+)/g)) {
    for (const p of m[1].split(',')) bump(acc.propiedadesTransicion, p.trim());
  }
  for (const m of text.matchAll(/(?:^|[;{\s])(?:transition|animation)-(?:duration|delay|timing-function)\s*:\s*([^;}]+)/g)) {
    collectTiming(m[1], acc);
  }
  for (const m of text.matchAll(/(?:^|[;{\s])animation\s*:\s*([^;}]+)/g)) {
    const v = m[1].trim();
    if (/^(none|inherit|initial|unset)$/.test(v)) continue;
    bump(acc.animaciones, v.replace(/\s+/g, ' ').slice(0, 120));
    collectTiming(v, acc);
  }
  acc.movimientoReducido += (text.match(/prefers-reduced-motion/g) || []).length;
  acc.viewTransitions += (text.match(/view-transition-name\s*:|@view-transition|::view-transition/g) || []).length;
  acc.scrollDriven += (text.match(/animation-timeline\s*:|scroll-timeline|view-timeline|animation-range/g) || []).length;
  acc.scrollSnap += (text.match(/scroll-snap-type\s*:/g) || []).length;
  acc.scrollSuaveCss += (text.match(/scroll-behavior\s*:\s*smooth/g) || []).length;
  for (const m of text.matchAll(/will-change\s*:\s*([^;}]+)/g)) bump(acc.willChange, m[1].trim());
  return acc;
}

export function emptyJsMotion() {
  return {
    llamadasGsap: {}, duraciones: {}, curvas: {}, stagger: {}, scrollTrigger: 0, scrub: {}, pin: {}, inicioFin: {},
    springs: 0, rigidez: {}, amortiguacion: {}, viewTransitionJs: 0, requestAnimationFrame: 0, intersectionObserver: 0,
    clasesTailwind: {},
  };
}

// Analiza código fuente (JS/TS/JSX/Vue/Svelte/Astro/plantillas). Las duraciones quedan tal cual:
// GSAP y Motion usan segundos; react-spring usa milisegundos. La unidad se decide al leer la librería.
export function analyzeJs(text, acc = emptyJsMotion()) {
  for (const m of text.matchAll(/\bgsap\.(to|from|fromTo|set|timeline|quickTo|matchMedia)\s*\(/g)) bump(acc.llamadasGsap, m[1]);
  for (const m of text.matchAll(/\bduration\s*:\s*(\d*\.?\d+)/g)) bump(acc.duraciones, m[1]);
  for (const m of text.matchAll(/\bease\s*:\s*['"`]([^'"`]+)['"`]/g)) bump(acc.curvas, m[1]);
  for (const m of text.matchAll(/\bease\s*:\s*\[([^\]]+)\]/g)) bump(acc.curvas, `[${m[1].replace(/\s+/g, '')}]`);
  for (const m of text.matchAll(/\bstagger\s*:\s*([^,}\n]+)/g)) bump(acc.stagger, m[1].trim().slice(0, 60));
  const hasScrollTrigger = /scrollTrigger|ScrollTrigger/.test(text);
  acc.scrollTrigger += (text.match(/scrollTrigger\s*:|ScrollTrigger\.create\(/g) || []).length;
  if (hasScrollTrigger) {
    for (const m of text.matchAll(/\bscrub\s*:\s*([^,}\n]+)/g)) bump(acc.scrub, m[1].trim());
    for (const m of text.matchAll(/\bpin\s*:\s*([^,}\n]+)/g)) bump(acc.pin, m[1].trim());
    for (const m of text.matchAll(/\b(start|end)\s*:\s*['"`]([^'"`]+)['"`]/g)) bump(acc.inicioFin, `${m[1]}: ${m[2]}`);
  }
  acc.springs += (text.match(/type\s*:\s*['"]spring['"]/g) || []).length;
  for (const m of text.matchAll(/\bstiffness\s*:\s*(\d*\.?\d+)/g)) bump(acc.rigidez, m[1]);
  for (const m of text.matchAll(/\bdamping\s*:\s*(\d*\.?\d+)/g)) bump(acc.amortiguacion, m[1]);
  acc.viewTransitionJs += (text.match(/startViewTransition\s*\(/g) || []).length;
  acc.requestAnimationFrame += (text.match(/requestAnimationFrame\s*\(/g) || []).length;
  acc.intersectionObserver += (text.match(/new\s+IntersectionObserver\s*\(/g) || []).length;
  for (const m of text.matchAll(/(?<=["'`\s])(transition(?:-(?:all|colors|opacity|shadow|transform))?|duration-\d+|delay-\d+|ease-(?:in-out|in|out|linear|\[[^\]\s]+\])|animate-[\w-]+)(?=["'`\s])/g)) {
    bump(acc.clasesTailwind, m[1]);
  }
  return acc;
}

export function summarizeCss(acc) {
  return {
    keyframes: acc.keyframes.slice(0, 40),
    totalKeyframes: acc.keyframes.length,
    transiciones: top(acc.transiciones, 15),
    propiedadesTransicion: top(acc.propiedadesTransicion, 12),
    animaciones: top(acc.animaciones, 12),
    duraciones: top(acc.duraciones, 12),
    curvas: top(acc.curvas, 12),
    movimientoReducido: acc.movimientoReducido,
    viewTransitions: acc.viewTransitions,
    scrollDriven: acc.scrollDriven,
    scrollSnap: acc.scrollSnap,
    scrollSuaveCss: acc.scrollSuaveCss,
    willChange: top(acc.willChange, 8),
  };
}

export function summarizeJs(acc) {
  return {
    llamadasGsap: acc.llamadasGsap,
    duraciones: top(acc.duraciones, 12),
    curvas: top(acc.curvas, 12),
    stagger: top(acc.stagger, 8),
    scrollTrigger: acc.scrollTrigger,
    scrub: top(acc.scrub, 6),
    pin: top(acc.pin, 6),
    inicioFin: top(acc.inicioFin, 12),
    springs: acc.springs,
    rigidez: top(acc.rigidez, 6),
    amortiguacion: top(acc.amortiguacion, 6),
    viewTransitionJs: acc.viewTransitionJs,
    requestAnimationFrame: acc.requestAnimationFrame,
    intersectionObserver: acc.intersectionObserver,
    clasesTailwind: top(acc.clasesTailwind, 20),
  };
}

export function slugify(text) {
  return text.toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'objetivo';
}
