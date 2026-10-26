#!/usr/bin/env node
// Escanea un repositorio en SOLO LECTURA: no ejecuta nada, no instala nada, no abre archivos de secretos.
// Uso: node scan-repo.mjs <carpeta> [--out hallazgos-repo.json]
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
  console.error('Uso: node scan-repo.mjs <carpeta> [--out archivo.json]');
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
const detections = new Map(); // id -> { id, name, category, evidencia: [] }
const addEvidence = (sig, ev) => {
  if (!detections.has(sig.id)) detections.set(sig.id, { id: sig.id, nombre: sig.name, categoria: sig.category, evidencia: [] });
  const d = detections.get(sig.id);
  if (d.evidencia.length < 8) d.evidencia.push(ev);
};

const meta = { raiz: ROOT, fecha: new Date().toISOString(), archivosLeidos: 0, secretosOmitidos: [], grandesOmitidos: 0, truncado: false };
const packages = [];
const lockfiles = [];
const configs = [];
const licenseFiles = [];
const cssAcc = emptyCssMotion();
const jsAcc = emptyJsMotion();
const files = [];

function walk(dir) {
  if (files.length >= MAX_FILES) { meta.truncado = true; return; }
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isSymbolicLink()) continue; // no seguir enlaces: pueden apuntar fuera del repo
    if (e.isDirectory()) {
      if (IGNORED_DIRS.has(e.name)) continue;
      walk(full);
    } else if (e.isFile()) {
      files.push(full);
      if (files.length >= MAX_FILES) { meta.truncado = true; return; }
    }
  }
}
walk(ROOT);

const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

for (const file of files) {
  const name = basename(file);
  if (SECRET_FILE.test(name) && !ALLOWED_ENV_EXAMPLES.test(name)) { meta.secretosOmitidos.push(rel(file)); continue; }
  if (/^(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|composer\.lock)$/.test(name)) { lockfiles.push(rel(file)); continue; }
  if (CONFIG_RE.test(name)) configs.push(rel(file));
  if (LICENSE_RE.test(name)) licenseFiles.push(rel(file));

  const ext = extname(name).toLowerCase();
  const isPkg = name === 'package.json';
  if (!isPkg && !CODE_EXT.has(ext) && !STYLE_EXT.has(ext)) continue;
  let size;
  try { size = statSync(file).size; } catch { continue; }
  if (size > MAX_BYTES) { meta.grandesOmitidos++; continue; }
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  meta.archivosLeidos++;

  if (isPkg) {
    let pkg;
    try { pkg = JSON.parse(text); } catch { continue; }
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.peerDependencies || {}) };
    const scripts = pkg.scripts || {};
    const riesgos = ['preinstall', 'install', 'postinstall', 'prepare', 'prepublish'].filter((k) => k in scripts)
      .map((k) => ({ script: k, comando: scripts[k] }));
    packages.push({ ruta: rel(file), nombre: pkg.name || null, licencia: pkg.license || null, packageManager: pkg.packageManager || null, scripts, scriptsDeInstalacion: riesgos, totalDependencias: Object.keys(deps).length });
    for (const sig of signatures) {
      for (const n of sig.npm || []) if (deps[n]) addEvidence(sig, { fuente: 'package.json', archivo: rel(file), paquete: n, version: deps[n] });
    }
    continue;
  }

  const isStyle = STYLE_EXT.has(ext);
  if (isStyle) analyzeCss(text, cssAcc, rel(file));
  else {
    analyzeJs(text, jsAcc);
    // CSS embebido en componentes y plantillas (<style> de Vue/Svelte/Astro/HTML)
    for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) analyzeCss(m[1], cssAcc, rel(file));
  }
  for (const sig of signatures) {
    for (const re of sig.importsRe) {
      const m = re.exec(text);
      if (m) { addEvidence(sig, { fuente: 'codigo', archivo: rel(file), linea: lineAt(text, m.index), coincidencia: m[0].slice(0, 80) }); break; }
    }
  }
}

// View Transitions y scroll nativo por CSS también cuentan como detección
if (cssAcc.viewTransitions > 0) {
  const sig = signatures.find((s) => s.id === 'view-transitions');
  addEvidence(sig, { fuente: 'css', detalle: `${cssAcc.viewTransitions} reglas de view-transition` });
}

const pm = lockfiles.some((l) => l.endsWith('pnpm-lock.yaml')) ? 'pnpm'
  : lockfiles.some((l) => l.endsWith('yarn.lock')) ? 'yarn'
  : lockfiles.some((l) => /bun\.lockb?$/.test(l)) ? 'bun'
  : lockfiles.some((l) => l.endsWith('package-lock.json')) ? 'npm' : null;

const result = {
  meta,
  licencia: { archivos: licenseFiles, enPackageJson: [...new Set(packages.map((p) => p.licencia).filter(Boolean))] },
  gestorDePaquetes: pm,
  lockfiles,
  configuraciones: configs,
  paquetes: packages,
  detecciones: [...detections.values()].sort((a, b) => a.categoria.localeCompare(b.categoria)),
  movimiento: { css: summarizeCss(cssAcc), codigo: summarizeJs(jsAcc) },
};

const json = JSON.stringify(result, null, 2);
if (out) {
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(out, json);
}

// Resumen legible en la salida estándar
const lines = [];
lines.push(`Raíz: ${ROOT}`);
lines.push(`Archivos leídos: ${meta.archivosLeidos}${meta.truncado ? ' (TRUNCADO en ' + MAX_FILES + ')' : ''} · grandes omitidos: ${meta.grandesOmitidos} · secretos omitidos (sin abrir): ${meta.secretosOmitidos.length}`);
lines.push(`Licencia: ${licenseFiles.join(', ') || 'sin archivo'} · package.json: ${result.licencia.enPackageJson.join(', ') || 'sin campo'}`);
lines.push(`Gestor de paquetes: ${pm || 'no detectado'} · lockfiles: ${lockfiles.join(', ') || 'ninguno'}`);
for (const p of packages) {
  if (p.scriptsDeInstalacion.length) lines.push(`⚠ ${p.ruta} tiene scripts de instalación: ${p.scriptsDeInstalacion.map((r) => r.script + ' → ' + r.comando).join(' | ')}`);
}
lines.push('Detecciones:');
for (const d of result.detecciones) {
  const ev = d.evidencia[0];
  const where = ev.fuente === 'package.json' ? `${ev.paquete}@${ev.version}` : ev.archivo ? `${ev.archivo}:${ev.linea ?? ''}` : ev.detalle;
  lines.push(`  [${d.categoria}] ${d.nombre} — ${where}${d.evidencia.length > 1 ? ` (+${d.evidencia.length - 1})` : ''}`);
}
const c = result.movimiento.css;
const j = result.movimiento.codigo;
lines.push(`CSS: ${c.totalKeyframes} @keyframes · reduced-motion: ${c.movimientoReducido} · view-transition: ${c.viewTransitions} · scroll-driven: ${c.scrollDriven}`);
lines.push(`CSS duraciones: ${c.duraciones.slice(0, 6).map((d) => `${d.valor}×${d.veces}`).join(', ') || '—'}`);
lines.push(`CSS curvas: ${c.curvas.slice(0, 6).map((d) => `${d.valor}×${d.veces}`).join(', ') || '—'}`);
lines.push(`Código: gsap ${JSON.stringify(j.llamadasGsap)} · scrollTrigger: ${j.scrollTrigger} · springs: ${j.springs} · startViewTransition: ${j.viewTransitionJs} · IntersectionObserver: ${j.intersectionObserver}`);
lines.push(`Código curvas: ${j.curvas.slice(0, 6).map((d) => `${d.valor}×${d.veces}`).join(', ') || '—'}`);
if (out) lines.push(`JSON completo: ${resolve(out)}`);
console.log(lines.join('\n'));
