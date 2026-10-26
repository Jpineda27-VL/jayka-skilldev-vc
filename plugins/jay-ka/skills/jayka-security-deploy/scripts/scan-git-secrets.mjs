#!/usr/bin/env node
// Looks for secrets in the WHOLE git history (all branches) and in the files tracked today.
// Read-only. Never prints a full secret: it shows the first 4 characters and the length.
// Usage: node scan-git-secrets.mjs [<repo>] [--out findings.json]
// Exits 0 if there are no findings, 1 if there are, 2 if it is not a git repository.
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
const patterns = cfg.patterns.map((p) => ({ id: p.id, re: new RegExp(p.re, (p.flags || '') + 'g') }));
const fp = cfg.falsePositives.map((s) => s.toLowerCase());
const ENV_FILE = /(^|\/)\.env(\.(?!example$|sample$|template$|dist$)[^/]+)?$/;

const git = (...a) => spawnSync('git', ['-C', repo, ...a], { encoding: 'utf8' });
if (git('rev-parse', '--is-inside-work-tree').stdout.trim() !== 'true') { console.error(`Not a git repository: ${repo}`); process.exit(2); }

const mask = (v) => `${v.slice(0, 4)}… (${v.length} characters)`;
const findings = [];
const seen = new Set();
const add = (f) => { const k = `${f.type}|${f.value}|${f.file}`; if (seen.has(k)) return; seen.add(k); findings.push(f); };

function scanLine(line, ctx) {
  for (const p of patterns) {
    p.re.lastIndex = 0;
    for (const m of line.matchAll(p.re)) {
      const value = m[1] || m[0];
      const low = value.toLowerCase();
      if (fp.some((w) => low.includes(w))) continue;
      add({ ...ctx, type: p.id, value: mask(value) });
    }
  }
}

// 1. History: only the lines added by each commit
const proc = spawn('git', ['-C', repo, 'log', '--all', '-p', '--no-color', '--no-ext-diff', '-U0', '--date=short', '--format=%x00COMMIT %h %ad'], { stdio: ['ignore', 'pipe', 'inherit'] });
let commit = null, date = null, file = null, commits = 0;
const rl = createInterface({ input: proc.stdout, crlfDelay: Infinity });
for await (const line of rl) {
  if (line.startsWith('\u0000COMMIT ')) { [, commit, date] = line.split(' '); commits++; continue; }
  if (line.startsWith('+++ ')) {
    file = line.startsWith('+++ b/') ? line.slice(6) : null;
    if (file && ENV_FILE.test(file)) add({ source: 'history', commit, date, file, type: 'tracked-env-file', value: '—' });
    continue;
  }
  if (line.startsWith('+') && file) scanLine(line.slice(1), { source: 'history', commit, date, file });
}

// 2. Files tracked today
const tracked = git('ls-files').stdout.split('\n').filter(Boolean);
for (const f of tracked) if (ENV_FILE.test(f)) add({ source: 'tracked today', commit: 'HEAD', date: '', file: f, type: 'tracked-env-file', value: '—' });

// 3. Is .env ignored?
const ignored = git('check-ignore', '-q', '.env').status === 0;

const result = { repo, commitsChecked: commits, envIgnored: ignored, findings };
if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 2));

console.log(`Repository: ${repo} · commits checked: ${commits} · .env in .gitignore: ${ignored ? 'yes' : 'NO'}`);
if (!findings.length) console.log('✓ No secrets detected in the history or in the tracked files.');
else {
  console.log(`✗ ${findings.length} finding(s). Any real secret listed here must be considered compromised: the user must rotate it.`);
  console.log('| source | commit | date | file | type | value |');
  console.log('|---|---|---|---|---|---|');
  for (const f of findings) console.log(`| ${f.source} | ${f.commit} | ${f.date} | ${f.file} | ${f.type} | ${f.value} |`);
}
if (!ignored) console.log('! .env is not in .gitignore: if the project uses .env, add it before creating one.');
process.exit(findings.length ? 1 : 0);
