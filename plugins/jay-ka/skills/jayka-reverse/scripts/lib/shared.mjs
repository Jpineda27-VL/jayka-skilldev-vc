// Utilities shared by scan-repo.mjs and capture-live.mjs. No dependencies.
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
  Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));

export function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

// Converts "0.3s", "300ms" to milliseconds.
export function toMs(num, unit) {
  const v = parseFloat(num);
  return unit === 's' ? Math.round(v * 1000) : Math.round(v);
}

const EASING_RE = /cubic-bezier\([^)]*\)|steps\([^)]*\)|linear\([^)]*\)|\b(?:ease-in-out|ease-in|ease-out|ease|linear|step-start|step-end)\b/g;
const DURATION_RE = /(\d*\.?\d+)(ms|s)\b/g;

function collectTiming(value, acc) {
  for (const m of value.matchAll(DURATION_RE)) bump(acc.durations, `${toMs(m[1], m[2])}ms`);
  for (const m of value.matchAll(EASING_RE)) bump(acc.easings, m[0].replace(/\s+/g, ''));
}

export function emptyCssMotion() {
  return {
    keyframes: [], transitions: {}, transitionProperties: {}, animations: {}, durations: {}, easings: {},
    reducedMotion: 0, viewTransitions: 0, scrollDriven: 0, scrollSnap: 0, smoothScrollCss: 0, willChange: {},
  };
}

// Analyzes CSS/SCSS text (or an embedded <style>) and accumulates into `acc`. `where` is used to locate findings.
export function analyzeCss(text, acc = emptyCssMotion(), where = null) {
  for (const m of text.matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)) {
    acc.keyframes.push(where ? { name: m[1], file: where, line: lineAt(text, m.index) } : { name: m[1] });
  }
  for (const m of text.matchAll(/(?:^|[;{\s])transition\s*:\s*([^;}]+)/g)) {
    const v = m[1].trim();
    if (/^(none|inherit|initial|unset)$/.test(v)) continue;
    bump(acc.transitions, v.replace(/\s+/g, ' ').slice(0, 120));
    for (const part of v.split(',')) {
      const prop = part.trim().split(/\s+/)[0];
      if (prop && !/^\d/.test(prop)) bump(acc.transitionProperties, prop);
    }
    collectTiming(v, acc);
  }
  for (const m of text.matchAll(/(?:^|[;{\s])transition-property\s*:\s*([^;}]+)/g)) {
    for (const p of m[1].split(',')) bump(acc.transitionProperties, p.trim());
  }
  for (const m of text.matchAll(/(?:^|[;{\s])(?:transition|animation)-(?:duration|delay|timing-function)\s*:\s*([^;}]+)/g)) {
    collectTiming(m[1], acc);
  }
  for (const m of text.matchAll(/(?:^|[;{\s])animation\s*:\s*([^;}]+)/g)) {
    const v = m[1].trim();
    if (/^(none|inherit|initial|unset)$/.test(v)) continue;
    bump(acc.animations, v.replace(/\s+/g, ' ').slice(0, 120));
    collectTiming(v, acc);
  }
  acc.reducedMotion += (text.match(/prefers-reduced-motion/g) || []).length;
  acc.viewTransitions += (text.match(/view-transition-name\s*:|@view-transition|::view-transition/g) || []).length;
  acc.scrollDriven += (text.match(/animation-timeline\s*:|scroll-timeline|view-timeline|animation-range/g) || []).length;
  acc.scrollSnap += (text.match(/scroll-snap-type\s*:/g) || []).length;
  acc.smoothScrollCss += (text.match(/scroll-behavior\s*:\s*smooth/g) || []).length;
  for (const m of text.matchAll(/will-change\s*:\s*([^;}]+)/g)) bump(acc.willChange, m[1].trim());
  return acc;
}

export function emptyJsMotion() {
  return {
    gsapCalls: {}, durations: {}, easings: {}, stagger: {}, scrollTrigger: 0, scrub: {}, pin: {}, startEnd: {},
    springs: 0, stiffness: {}, damping: {}, viewTransitionJs: 0, requestAnimationFrame: 0, intersectionObserver: 0,
    tailwindClasses: {},
  };
}

// Analyzes source code (JS/TS/JSX/Vue/Svelte/Astro/templates). Durations are left as they are:
// GSAP and Motion use seconds; react-spring uses milliseconds. The unit is decided when reading the library.
export function analyzeJs(text, acc = emptyJsMotion()) {
  for (const m of text.matchAll(/\bgsap\.(to|from|fromTo|set|timeline|quickTo|matchMedia)\s*\(/g)) bump(acc.gsapCalls, m[1]);
  for (const m of text.matchAll(/\bduration\s*:\s*(\d*\.?\d+)/g)) bump(acc.durations, m[1]);
  for (const m of text.matchAll(/\bease\s*:\s*['"`]([^'"`]+)['"`]/g)) bump(acc.easings, m[1]);
  for (const m of text.matchAll(/\bease\s*:\s*\[([^\]]+)\]/g)) bump(acc.easings, `[${m[1].replace(/\s+/g, '')}]`);
  for (const m of text.matchAll(/\bstagger\s*:\s*([^,}\n]+)/g)) bump(acc.stagger, m[1].trim().slice(0, 60));
  const hasScrollTrigger = /scrollTrigger|ScrollTrigger/.test(text);
  acc.scrollTrigger += (text.match(/scrollTrigger\s*:|ScrollTrigger\.create\(/g) || []).length;
  if (hasScrollTrigger) {
    for (const m of text.matchAll(/\bscrub\s*:\s*([^,}\n]+)/g)) bump(acc.scrub, m[1].trim());
    for (const m of text.matchAll(/\bpin\s*:\s*([^,}\n]+)/g)) bump(acc.pin, m[1].trim());
    for (const m of text.matchAll(/\b(start|end)\s*:\s*['"`]([^'"`]+)['"`]/g)) bump(acc.startEnd, `${m[1]}: ${m[2]}`);
  }
  acc.springs += (text.match(/type\s*:\s*['"]spring['"]/g) || []).length;
  for (const m of text.matchAll(/\bstiffness\s*:\s*(\d*\.?\d+)/g)) bump(acc.stiffness, m[1]);
  for (const m of text.matchAll(/\bdamping\s*:\s*(\d*\.?\d+)/g)) bump(acc.damping, m[1]);
  acc.viewTransitionJs += (text.match(/startViewTransition\s*\(/g) || []).length;
  acc.requestAnimationFrame += (text.match(/requestAnimationFrame\s*\(/g) || []).length;
  acc.intersectionObserver += (text.match(/new\s+IntersectionObserver\s*\(/g) || []).length;
  for (const m of text.matchAll(/(?<=["'`\s])(transition(?:-(?:all|colors|opacity|shadow|transform))?|duration-\d+|delay-\d+|ease-(?:in-out|in|out|linear|\[[^\]\s]+\])|animate-[\w-]+)(?=["'`\s])/g)) {
    bump(acc.tailwindClasses, m[1]);
  }
  return acc;
}

export function summarizeCss(acc) {
  return {
    keyframes: acc.keyframes.slice(0, 40),
    totalKeyframes: acc.keyframes.length,
    transitions: top(acc.transitions, 15),
    transitionProperties: top(acc.transitionProperties, 12),
    animations: top(acc.animations, 12),
    durations: top(acc.durations, 12),
    easings: top(acc.easings, 12),
    reducedMotion: acc.reducedMotion,
    viewTransitions: acc.viewTransitions,
    scrollDriven: acc.scrollDriven,
    scrollSnap: acc.scrollSnap,
    smoothScrollCss: acc.smoothScrollCss,
    willChange: top(acc.willChange, 8),
  };
}

export function summarizeJs(acc) {
  return {
    gsapCalls: acc.gsapCalls,
    durations: top(acc.durations, 12),
    easings: top(acc.easings, 12),
    stagger: top(acc.stagger, 8),
    scrollTrigger: acc.scrollTrigger,
    scrub: top(acc.scrub, 6),
    pin: top(acc.pin, 6),
    startEnd: top(acc.startEnd, 12),
    springs: acc.springs,
    stiffness: top(acc.stiffness, 6),
    damping: top(acc.damping, 6),
    viewTransitionJs: acc.viewTransitionJs,
    requestAnimationFrame: acc.requestAnimationFrame,
    intersectionObserver: acc.intersectionObserver,
    tailwindClasses: top(acc.tailwindClasses, 20),
  };
}

export function slugify(text) {
  return text.toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'target';
}
