#!/usr/bin/env node
// Scans a repository READ-ONLY: it runs nothing, installs nothing and opens no secret files.
// Usage: node scan-repo.mjs <folder> [--out repo-findings.json]
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname, basename, dirname, resolve } from 'node:path';
import {
  loadSignatures, analyzeCss, analyzeJs, emptyCssMotion, emptyJsMotion, summarizeCss, summarizeJs, lineAt,
} from './lib/shared.mjs';

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : null;
if (!root) {
  console.error('Usage: node scan-repo.mjs <folder> [--out file.json]');
  process.exit(2);
}
const ROOT = resolve(root);

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.output', '.svelte-kit', '.astro', 'out', 'vendor',
  'coverage', '.turbo', '.cache', '.vercel', '.netlify', 'storage', '.idea', '.vscode', '__pycache__',
]);
const SECRET_FILE = /^(\.env(\..*)?|.*\.(pem|key|p12|pfx|keystore|jks)|id_rsa.*|id_ed25519.*|credentials(\.json)?|secrets?\.(json|ya?ml)|\.npmrc|\.pypirc|auth\.json)$/i;
const ALLOWED_ENV_EXAMPLES = /^\.env\.(example|sample|template|dist)$/i;
const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro', '.html', '.htm', '.php', '.twig', '.liquid', '.njk', '.hbs', '.ejs', '.erb']);
const STYLE_EXT = new Set(['.css', '.scss', '.sass', '.less', '.pcss', '.styl']);
const CONFIG_RE = /^(tailwind|postcss|vite|next|nuxt|astro|svelte|webpack|rollup|gatsby|remix|tsconfig|components|app)\.config\.|^(components\.json|app\.json|composer\.json|angular\.json|vercel\.json|netlify\.toml)$/;
const LICENSE_RE = /^(licen[cs]e|copying|unlicense)(\.(md|txt))?$/i;
const MAX_FILES = 20000;
const MAX_BYTES = 1_500_000;

const signatures = loadSignatures();
const detections = new Map(); // id -> { id, name, category, evidence: [] }
const addEvidence = (sig, ev) => {
  if (!detections.has(sig.id)) detections.set(sig.id, { id: sig.id, name: sig.name, category: sig.category, evidence: [] });
  const d = detections.get(sig.id);
  if (d.evidence.length < 8) d.evidence.push(ev);
};

const meta = { root: ROOT, date: new Date().toISOString(), filesRead: 0, secretsSkipped: [], largeSkipped: 0, truncated: false };
const packages = [];
const lockfiles = [];
const configs = [];
const licenseFiles = [];
const cssAcc = emptyCssMotion();
const jsAcc = emptyJsMotion();
const files = [];

function walk(dir) {
  if (files.length >= MAX_FILES) { meta.truncated = true; return; }
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isSymbolicLink()) continue; // do not follow links: they may point outside the repo
    if (e.isDirectory()) {
      if (IGNORED_DIRS.has(e.name)) continue;
      walk(full);
    } else if (e.isFile()) {
      files.push(full);
      if (files.length >= MAX_FILES) { meta.truncated = true; return; }
    }
  }
}
walk(ROOT);

const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

for (const file of files) {
  const name = basename(file);
  if (SECRET_FILE.test(name) && !ALLOWED_ENV_EXAMPLES.test(name)) { meta.secretsSkipped.push(rel(file)); continue; }
  if (/^(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|composer\.lock)$/.test(name)) { lockfiles.push(rel(file)); continue; }
  if (CONFIG_RE.test(name)) configs.push(rel(file));
  if (LICENSE_RE.test(name)) licenseFiles.push(rel(file));

  const ext = extname(name).toLowerCase();
  const isPkg = name === 'package.json';
  if (!isPkg && !CODE_EXT.has(ext) && !STYLE_EXT.has(ext)) continue;
  let size;
  try { size = statSync(file).size; } catch { continue; }
  if (size > MAX_BYTES) { meta.largeSkipped++; continue; }
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  meta.filesRead++;

  if (isPkg) {
    let pkg;
    try { pkg = JSON.parse(text); } catch { continue; }
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.peerDependencies || {}) };
    const scripts = pkg.scripts || {};
    const risks = ['preinstall', 'install', 'postinstall', 'prepare', 'prepublish'].filter((k) => k in scripts)
      .map((k) => ({ script: k, command: scripts[k] }));
    packages.push({ path: rel(file), name: pkg.name || null, license: pkg.license || null, packageManager: pkg.packageManager || null, scripts, installScripts: risks, totalDependencies: Object.keys(deps).length });
    for (const sig of signatures) {
      for (const n of sig.npm || []) if (deps[n]) addEvidence(sig, { source: 'package.json', file: rel(file), package: n, version: deps[n] });
    }
    continue;
  }

  const isStyle = STYLE_EXT.has(ext);
  if (isStyle) analyzeCss(text, cssAcc, rel(file));
  else {
    analyzeJs(text, jsAcc);
    // CSS embedded in components and templates (<style> of Vue/Svelte/Astro/HTML)
    for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) analyzeCss(m[1], cssAcc, rel(file));
  }
  for (const sig of signatures) {
    for (const re of sig.importsRe) {
      const m = re.exec(text);
      if (m) { addEvidence(sig, { source: 'code', file: rel(file), line: lineAt(text, m.index), match: m[0].slice(0, 80) }); break; }
    }
  }
}

// View Transitions and native CSS scroll also count as detections
if (cssAcc.viewTransitions > 0) {
  const sig = signatures.find((s) => s.id === 'view-transitions');
  addEvidence(sig, { source: 'css', detail: `${cssAcc.viewTransitions} view-transition rules` });
}

const pm = lockfiles.some((l) => l.endsWith('pnpm-lock.yaml')) ? 'pnpm'
  : lockfiles.some((l) => l.endsWith('yarn.lock')) ? 'yarn'
  : lockfiles.some((l) => /bun\.lockb?$/.test(l)) ? 'bun'
  : lockfiles.some((l) => l.endsWith('package-lock.json')) ? 'npm' : null;

const result = {
  meta,
  license: { files: licenseFiles, inPackageJson: [...new Set(packages.map((p) => p.license).filter(Boolean))] },
  packageManager: pm,
  lockfiles,
  configs,
  packages,
  detections: [...detections.values()].sort((a, b) => a.category.localeCompare(b.category)),
  motion: { css: summarizeCss(cssAcc), code: summarizeJs(jsAcc) },
};

const json = JSON.stringify(result, null, 2);
if (out) {
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, json);
}

// Readable summary on standard output
const lines = [];
lines.push(`Root: ${ROOT}`);
lines.push(`Files read: ${meta.filesRead}${meta.truncated ? ' (TRUNCATED at ' + MAX_FILES + ')' : ''} · large skipped: ${meta.largeSkipped} · secrets skipped (not opened): ${meta.secretsSkipped.length}`);
lines.push(`License: ${licenseFiles.join(', ') || 'no file'} · package.json: ${result.license.inPackageJson.join(', ') || 'no field'}`);
lines.push(`Package manager: ${pm || 'not detected'} · lockfiles: ${lockfiles.join(', ') || 'none'}`);
for (const p of packages) {
  if (p.installScripts.length) lines.push(`⚠ ${p.path} has install scripts: ${p.installScripts.map((r) => r.script + ' → ' + r.command).join(' | ')}`);
}
lines.push('Detections:');
for (const d of result.detections) {
  const ev = d.evidence[0];
  const where = ev.source === 'package.json' ? `${ev.package}@${ev.version}` : ev.file ? `${ev.file}:${ev.line ?? ''}` : ev.detail;
  lines.push(`  [${d.category}] ${d.name} — ${where}${d.evidence.length > 1 ? ` (+${d.evidence.length - 1})` : ''}`);
}
const c = result.motion.css;
const j = result.motion.code;
lines.push(`CSS: ${c.totalKeyframes} @keyframes · reduced-motion: ${c.reducedMotion} · view-transition: ${c.viewTransitions} · scroll-driven: ${c.scrollDriven}`);
lines.push(`CSS durations: ${c.durations.slice(0, 6).map((d) => `${d.value}×${d.count}`).join(', ') || '—'}`);
lines.push(`CSS easings: ${c.easings.slice(0, 6).map((d) => `${d.value}×${d.count}`).join(', ') || '—'}`);
lines.push(`Code: gsap ${JSON.stringify(j.gsapCalls)} · scrollTrigger: ${j.scrollTrigger} · springs: ${j.springs} · startViewTransition: ${j.viewTransitionJs} · IntersectionObserver: ${j.intersectionObserver}`);
lines.push(`Code easings: ${j.easings.slice(0, 6).map((d) => `${d.value}×${d.count}`).join(', ') || '—'}`);
if (out) lines.push(`Full JSON: ${resolve(out)}`);
console.log(lines.join('\n'));
