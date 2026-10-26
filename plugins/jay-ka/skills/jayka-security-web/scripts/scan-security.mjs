#!/usr/bin/env node
// Looks in the code for web security risk patterns. Read-only; does not open secret files.
// Findings are CANDIDATES: each one is confirmed by reading the code before classifying it.
// Usage: node scan-security.mjs [<folder>] [--sections 3,5] [--out findings.json]
// Exits 1 if there is any high-severity finding, 0 otherwise.
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, extname, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const ROOT = resolve(argv.find((a) => !a.startsWith('--')) || '.');
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const ONLY = opt('--sections') ? new Set(opt('--sections').split(',').map(Number)) : null;
const OUT = opt('--out');

const JS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro'];
const PHP = ['.php'];
const PY = ['.py'];
const TPL = ['.html', '.htm', '.twig', '.jinja', '.j2'];
const ALL = [...JS, ...PHP, ...PY, ...TPL];

// sec = section number in SKILL.md of jayka-security-web
const RULES = [
  { id: 'innerhtml', sec: 5, sev: 'medium', ext: JS, re: /\.(innerHTML|outerHTML)\s*=(?!\s*(['"`])\s*\2)|insertAdjacentHTML\(|document\.write\(/, msg: 'HTML inserted from JS: XSS if the data comes from outside' },
  { id: 'unescaped-html', sec: 5, sev: 'medium', ext: [...JS, ...TPL], re: /dangerouslySetInnerHTML|\sv-html=|\{@html\s|\|\s*safe\b/, msg: 'Unescaped output' },
  { id: 'eval', sec: 5, sev: 'high', ext: JS, re: /\beval\s*\(|new\s+Function\s*\(/, msg: 'eval or new Function' },
  { id: 'sql-concat-js', sec: 5, sev: 'high', ext: JS, re: /\b(query|execute|raw|unsafe)\s*\(\s*[`'"]\s*(SELECT|INSERT|UPDATE|DELETE|WITH)\b[^`'"]*(\$\{|['"]\s*\+)/i, msg: 'SQL built with data (use parameters)' },
  { id: 'token-in-localstorage', sec: 9, sev: 'medium', ext: JS, re: /localStorage\.setItem\(\s*['"`][^'"`]*(token|jwt|auth|session)/i, msg: 'Session token in localStorage (any script can read it)' },
  { id: 'cookie-missing-flags', sec: 2, sev: 'medium', ext: [...JS, ...PHP, ...PY], re: /\b(httpOnly|http_only|secure)\s*[:=]>?\s*false\b|'(http_only|secure)'\s*=>\s*false/i, msg: 'Cookie with HttpOnly or Secure turned off' },
  { id: 'tls-disabled', sec: 1, sev: 'high', ext: [...JS, ...PHP, ...PY], re: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0|verify\s*=\s*False|CURLOPT_SSL_VERIFYPEER\s*,\s*(false|0)/, msg: 'Certificate verification disabled' },
  { id: 'weak-hash', sec: 8, sev: 'medium', ext: [...JS, ...PHP, ...PY], re: /createHash\(\s*['"](md5|sha1)['"]\)|\b(md5|sha1)\s*\(\s*\$\w*pass|hashlib\.(md5|sha1)\(/i, msg: 'MD5/SHA1: invalid for passwords (use bcrypt or argon2)' },
  { id: 'blade-unescaped', sec: 5, sev: 'medium', ext: PHP, re: /\{!!\s*(?!\s*(csrf_field|method_field|json_encode|\$__env|Js::))/, msg: 'Blade {!! !!}: unescaped output' },
  { id: 'raw-sql-php', sec: 5, sev: 'high', ext: PHP, re: /(DB::(raw|select|statement|unprepared|insert|update|delete)|whereRaw|selectRaw|orderByRaw|havingRaw|groupByRaw)\s*\(\s*("[^"]*\$\w|[^)]*\.\s*\$\w)/, msg: 'Raw SQL with variables (use ? bindings)' },
  { id: 'query-with-superglobal', sec: 5, sev: 'high', ext: PHP, re: /(mysqli?_query|->query)\s*\([^)]*\$_(GET|POST|REQUEST|COOKIE)/, msg: 'Query with $_GET/$_POST directly' },
  { id: 'echo-superglobal', sec: 5, sev: 'high', ext: PHP, re: /echo\s+\$_(GET|POST|REQUEST|COOKIE)/, msg: 'Prints user input unescaped' },
  { id: 'mass-assignment', sec: 5, sev: 'high', ext: PHP, re: /(::create|->create|->update|->fill|->forceFill)\(\s*\$request->all\(\)/, msg: 'Mass assignment with $request->all() (use validated() or only())' },
  { id: 'empty-guarded', sec: 5, sev: 'medium', ext: PHP, re: /\$guarded\s*=\s*\[\s*\]/, msg: 'Model without mass-assignment protection' },
  { id: 'unserialize-input', sec: 5, sev: 'high', ext: PHP, re: /unserialize\(\s*\$_(GET|POST|REQUEST|COOKIE)|unserialize\(\s*\$request/, msg: 'unserialize with user data' },
  { id: 'csrf-exceptions', sec: 3, sev: 'medium', ext: PHP, re: /protected\s+\$except\s*=\s*\[\s*['"]|validateCsrfTokens\(\s*except:/, msg: 'Routes excluded from CSRF: confirm each one needs it' },
  { id: 'get-mutates', sec: 3, sev: 'medium', ext: [...PHP, ...JS, ...PY], re: /(Route::get|router\.get|app\.get|@(app|bp|router)\.get)\(\s*['"][^'"]*(delete|destroy|remove|borrar|eliminar|cancel)/i, msg: 'GET route with an action name that changes data' },
  { id: 'user-supplied-filename', sec: 7, sev: 'medium', ext: [...PHP, ...JS, ...PY], re: /getClientOriginalName\(\)|\.originalname\b|secure_filename\(|\$_FILES\[[^\]]+\]\[['"]name['"]\]/, msg: 'Uses the filename the user sends: confirm it is not used to store the file' },
  { id: 'csrf-exempt-python', sec: 3, sev: 'medium', ext: PY, re: /@csrf_exempt|csrf_exempt\(/, msg: 'View without CSRF' },
  { id: 'sql-fstring-python', sec: 5, sev: 'high', ext: PY, re: /execute\(\s*f['"]|execute\([^)]*%\s*\(|execute\([^)]*\.format\(/, msg: 'SQL with f-string or formatting (use parameters)' },
  { id: 'mark-safe', sec: 5, sev: 'medium', ext: PY, re: /mark_safe\(/, msg: 'mark_safe: unescaped output' },
  { id: 'debug-on', sec: 1, sev: 'medium', ext: [...PHP, ...PY], re: /'debug'\s*=>\s*true\b|^\s*DEBUG\s*=\s*True\b/m, msg: 'Debug hard-coded as on' },
];
// Rules that look at the whole file
const FILE_RULES = [
  { id: 'cors-wildcard-credentials', sec: 3, sev: 'high', ext: [...JS, ...PHP, ...PY], test: (t) => /(origin|allowed_origins|Access-Control-Allow-Origin)['"]?\s*[:=,]>?\s*\[?\s*['"]\*['"]/i.test(t) && /(credentials|supports_credentials|Allow-Credentials)['"]?\s*[:=,]>?\s*['"]?true/i.test(t), msg: 'CORS with * and credentials at the same time' },
];

const secretCfgPath = join(here, '..', '..', 'jayka-security-deploy', 'scripts', 'secret-patterns.json');
const secretCfg = existsSync(secretCfgPath) ? JSON.parse(readFileSync(secretCfgPath, 'utf8')) : null;
const secretRes = secretCfg ? secretCfg.patterns.map((p) => ({ id: p.id, re: new RegExp(p.re, p.flags || '') })) : [];
const fp = secretCfg ? secretCfg.falsePositives.map((s) => s.toLowerCase()) : [];

const IGNORED = new Set(['node_modules', '.git', 'vendor', 'dist', 'build', '.next', '.nuxt', '.output', '.svelte-kit', 'out', 'coverage', 'storage', '.cache', '__pycache__', 'venv', '.venv', 'tests', 'test', '__tests__', 'spec', 'public/build']);
const SECRET_FILE = /^(\.env(\..*)?|.*\.(pem|key|p12|pfx)|id_rsa.*|credentials(\.json)?)$/i;
const SKIP_FILE = /\.(min|test|spec)\.[a-z]+$|\.stories\./;

const files = [];
const walk = (d) => {
  let es; try { es = readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of es) {
    const f = join(d, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) { if (!IGNORED.has(e.name)) walk(f); }
    else if (e.isFile()) files.push(f);
  }
};
walk(ROOT);

const findings = [];
let read = 0;
for (const f of files) {
  const name = basename(f);
  const ext = extname(name).toLowerCase();
  if (SECRET_FILE.test(name) || SKIP_FILE.test(name) || !ALL.includes(ext)) continue;
  try { if (statSync(f).size > 1_000_000) continue; } catch { continue; }
  const text = readFileSync(f, 'utf8');
  read++;
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const r of RULES) {
      if ((ONLY && !ONLY.has(r.sec)) || !r.ext.includes(ext)) continue;
      if (r.re.test(line)) findings.push({ section: r.sec, severity: r.sev, rule: r.id, file: rel, line: i + 1, snippet: line.trim().slice(0, 100), note: r.msg });
    }
    if (!ONLY || ONLY.has(5)) {
      for (const s of secretRes) {
        const m = line.match(s.re);
        if (!m) continue;
        const v = m[1] || m[0];
        if (fp.some((w) => v.toLowerCase().includes(w))) continue;
        findings.push({ section: 0, severity: 'high', rule: `secret:${s.id}`, file: rel, line: i + 1, snippet: `${v.slice(0, 4)}… (${v.length} characters)`, note: 'Secret written in the code: move it to an environment variable and rotate it' });
      }
    }
  });
  for (const r of FILE_RULES) {
    if ((ONLY && !ONLY.has(r.sec)) || !r.ext.includes(ext)) continue;
    if (r.test(text)) findings.push({ section: r.sec, severity: r.sev, rule: r.id, file: rel, line: 0, snippet: '', note: r.msg });
  }
}

const order = { high: 0, medium: 1 };
findings.sort((a, b) => order[a.severity] - order[b.severity] || a.section - b.section);
if (OUT) writeFileSync(OUT, JSON.stringify({ root: ROOT, filesRead: read, findings }, null, 2));
console.log(`Folder: ${ROOT} · files read: ${read}${secretCfg ? '' : ' · (no secret patterns: jayka-security-deploy is missing)'}`);
if (!findings.length) console.log('✓ No risk patterns detected. This does not prove it is safe: permissions (IDOR) and limits are reviewed by reading the code.');
else {
  console.log('| sev. | sect. | rule | file:line | snippet | note |');
  console.log('|---|---|---|---|---|---|');
  for (const h of findings) console.log(`| ${h.severity} | ${h.section || 'secrets'} | ${h.rule} | ${h.file}${h.line ? ':' + h.line : ''} | ${h.snippet.replace(/\|/g, '\\|')} | ${h.note} |`);
  const highs = findings.filter((h) => h.severity === 'high').length;
  console.log(`\n${findings.length} candidate(s), ${highs} of high severity. Confirm each one by reading the code.`);
}
process.exit(findings.some((h) => h.severity === 'high') ? 1 : 0);
