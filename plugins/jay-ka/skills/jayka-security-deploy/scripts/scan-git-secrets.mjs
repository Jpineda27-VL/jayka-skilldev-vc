#!/usr/bin/env node
// Busca secretos en TODO el historial de git (todas las ramas) y en los archivos versionados hoy.
// Solo lectura. Nunca imprime un secreto completo: muestra los 4 primeros caracteres y el largo.
// Uso: node scan-git-secrets.mjs [<repo>] [--out hallazgos.json]
// Sale con 0 si no hay hallazgos, 1 si hay, 2 si no es un repositorio git.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const repo = resolve(argv.find((a) => !a.startsWith('--')) || '.');
const outIdx = argv.indexOf('--out');
const OUT = outIdx >= 0 ? argv[outIdx + 1] : null;

const cfg = JSON.parse(readFileSync(join(here, 'secret-patterns.json'), 'utf8'));
const patterns = cfg.patrones.map((p) => ({ id: p.id, re: new RegExp(p.re, (p.flags || '') + 'g') }));
const fp = cfg.falsosPositivos.map((s) => s.toLowerCase());
const ENV_FILE = /(^|\/)\.env(\.(?!example$|sample$|template$|dist$)[^/]+)?$/;

const git = (...a) => spawnSync('git', ['-C', repo, ...a], { encoding: 'utf8' });
if (git('rev-parse', '--is-inside-work-tree').stdout.trim() !== 'true') { console.error(`No es un repositorio git: ${repo}`); process.exit(2); }

const mask = (v) => `${v.slice(0, 4)}… (${v.length} caracteres)`;
const findings = [];
const seen = new Set();
const add = (f) => { const k = `${f.tipo}|${f.valor}|${f.archivo}`; if (seen.has(k)) return; seen.add(k); findings.push(f); };

function scanLine(line, ctx) {
  for (const p of patterns) {
    p.re.lastIndex = 0;
    for (const m of line.matchAll(p.re)) {
      const value = m[1] || m[0];
      const low = value.toLowerCase();
      if (fp.some((w) => low.includes(w))) continue;
      add({ ...ctx, tipo: p.id, valor: mask(value), _v: value });
    }
  }
}

// 1. Historial: solo líneas añadidas de cada commit
const proc = spawn('git', ['-C', repo, 'log', '--all', '-p', '--no-color', '--no-ext-diff', '-U0', '--date=short', '--format=%x00COMMIT %h %ad'], { stdio: ['ignore', 'pipe', 'inherit'] });
let commit = null, fecha = null, file = null, commits = 0;
const rl = createInterface({ input: proc.stdout, crlfDelay: Infinity });
for await (const line of rl) {
  if (line.startsWith('\u0000COMMIT ')) { [, commit, fecha] = line.split(' '); commits++; continue; }
  if (line.startsWith('+++ ')) {
    file = line.startsWith('+++ b/') ? line.slice(6) : null;
    if (file && ENV_FILE.test(file)) add({ origen: 'historial', commit, fecha, archivo: file, tipo: 'archivo-env-versionado', valor: '—', _v: file });
    continue;
  }
  if (line.startsWith('+') && file) scanLine(line.slice(1), { origen: 'historial', commit, fecha, archivo: file });
}

// 2. Archivos versionados hoy
const tracked = git('ls-files').stdout.split('\n').filter(Boolean);
for (const f of tracked) if (ENV_FILE.test(f)) add({ origen: 'versionado hoy', commit: 'HEAD', fecha: '', archivo: f, tipo: 'archivo-env-versionado', valor: '—', _v: f });

// 3. ¿.env está ignorado?
const ignored = git('check-ignore', '-q', '.env').status === 0;

for (const f of findings) delete f._v;
const result = { repo, commitsRevisados: commits, envIgnorado: ignored, hallazgos: findings };
if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 2));

console.log(`Repositorio: ${repo} · commits revisados: ${commits} · .env en .gitignore: ${ignored ? 'sí' : 'NO'}`);
if (!findings.length) console.log('✓ Sin secretos detectados en el historial ni en los archivos versionados.');
else {
  console.log(`✗ ${findings.length} hallazgo(s). Cualquier secreto real que aparezca aquí debe considerarse comprometido: el usuario debe rotarlo.`);
  console.log('| origen | commit | fecha | archivo | tipo | valor |');
  console.log('|---|---|---|---|---|---|');
  for (const f of findings) console.log(`| ${f.origen} | ${f.commit} | ${f.fecha} | ${f.archivo} | ${f.tipo} | ${f.valor} |`);
}
if (!ignored) console.log('! .env no está en .gitignore: si el proyecto usa .env, agrégalo antes de crear uno.');
process.exit(findings.length ? 1 : 0);
