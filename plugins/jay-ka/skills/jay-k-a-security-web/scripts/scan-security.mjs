#!/usr/bin/env node
// Busca en el código patrones de riesgo de seguridad web. Solo lectura; no abre archivos de secretos.
// Los hallazgos son CANDIDATOS: cada uno se confirma leyendo el código antes de clasificarlo.
// Uso: node scan-security.mjs [<carpeta>] [--secciones 3,5] [--out hallazgos.json]
// Sale con 1 si hay algún hallazgo de severidad alta, 0 si no.
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, extname, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const ROOT = resolve(argv.find((a) => !a.startsWith('--')) || '.');
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const ONLY = opt('--secciones') ? new Set(opt('--secciones').split(',').map(Number)) : null;
const OUT = opt('--out');

const JS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro'];
const PHP = ['.php'];
const PY = ['.py'];
const TPL = ['.html', '.htm', '.twig', '.jinja', '.j2'];
const ALL = [...JS, ...PHP, ...PY, ...TPL];

// sección = número de sección en SKILL.md de jay-k-a-security-web
const RULES = [
  { id: 'innerhtml', sec: 5, sev: 'media', ext: JS, re: /\.(innerHTML|outerHTML)\s*=(?!\s*(['"`])\s*\2)|insertAdjacentHTML\(|document\.write\(/, msg: 'HTML insertado desde JS: XSS si el dato viene de fuera' },
  { id: 'html-sin-escapar', sec: 5, sev: 'media', ext: [...JS, ...TPL], re: /dangerouslySetInnerHTML|\sv-html=|\{@html\s|\|\s*safe\b/, msg: 'Salida sin escapar' },
  { id: 'eval', sec: 5, sev: 'alta', ext: JS, re: /\beval\s*\(|new\s+Function\s*\(/, msg: 'eval o new Function' },
  { id: 'sql-concatenado-js', sec: 5, sev: 'alta', ext: JS, re: /\b(query|execute|raw|unsafe)\s*\(\s*[`'"]\s*(SELECT|INSERT|UPDATE|DELETE|WITH)\b[^`'"]*(\$\{|['"]\s*\+)/i, msg: 'SQL armado con datos (usa parámetros)' },
  { id: 'token-en-localstorage', sec: 9, sev: 'media', ext: JS, re: /localStorage\.setItem\(\s*['"`][^'"`]*(token|jwt|auth|session)/i, msg: 'Token de sesión en localStorage (lo puede leer cualquier script)' },
  { id: 'cookie-sin-banderas', sec: 2, sev: 'media', ext: [...JS, ...PHP, ...PY], re: /\b(httpOnly|http_only|secure)\s*[:=]>?\s*false\b|'(http_only|secure)'\s*=>\s*false/i, msg: 'Cookie con HttpOnly o Secure apagado' },
  { id: 'tls-desactivado', sec: 1, sev: 'alta', ext: [...JS, ...PHP, ...PY], re: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0|verify\s*=\s*False|CURLOPT_SSL_VERIFYPEER\s*,\s*(false|0)/, msg: 'Verificación de certificados desactivada' },
  { id: 'hash-debil', sec: 8, sev: 'media', ext: [...JS, ...PHP, ...PY], re: /createHash\(\s*['"](md5|sha1)['"]\)|\b(md5|sha1)\s*\(\s*\$\w*pass|hashlib\.(md5|sha1)\(/i, msg: 'MD5/SHA1: inválido para contraseñas (usa bcrypt o argon2)' },
  { id: 'blade-sin-escapar', sec: 5, sev: 'media', ext: PHP, re: /\{!!\s*(?!\s*(csrf_field|method_field|json_encode|\$__env|Js::))/, msg: 'Blade {!! !!}: salida sin escapar' },
  { id: 'sql-crudo-php', sec: 5, sev: 'alta', ext: PHP, re: /(DB::(raw|select|statement|unprepared|insert|update|delete)|whereRaw|selectRaw|orderByRaw|havingRaw|groupByRaw)\s*\(\s*("[^"]*\$\w|[^)]*\.\s*\$\w)/, msg: 'SQL crudo con variables (usa enlaces ?)' },
  { id: 'consulta-con-superglobal', sec: 5, sev: 'alta', ext: PHP, re: /(mysqli?_query|->query)\s*\([^)]*\$_(GET|POST|REQUEST|COOKIE)/, msg: 'Consulta con $_GET/$_POST directo' },
  { id: 'eco-superglobal', sec: 5, sev: 'alta', ext: PHP, re: /echo\s+\$_(GET|POST|REQUEST|COOKIE)/, msg: 'Imprime entrada del usuario sin escapar' },
  { id: 'asignacion-masiva', sec: 5, sev: 'alta', ext: PHP, re: /(::create|->create|->update|->fill|->forceFill)\(\s*\$request->all\(\)/, msg: 'Asignación masiva con $request->all() (usa validated() o only())' },
  { id: 'guarded-vacio', sec: 5, sev: 'media', ext: PHP, re: /\$guarded\s*=\s*\[\s*\]/, msg: 'Modelo sin protección de asignación masiva' },
  { id: 'unserialize-entrada', sec: 5, sev: 'alta', ext: PHP, re: /unserialize\(\s*\$_(GET|POST|REQUEST|COOKIE)|unserialize\(\s*\$request/, msg: 'unserialize con datos del usuario' },
  { id: 'csrf-excepciones', sec: 3, sev: 'media', ext: PHP, re: /protected\s+\$except\s*=\s*\[\s*['"]|validateCsrfTokens\(\s*except:/, msg: 'Rutas excluidas de CSRF: confirma que cada una lo necesita' },
  { id: 'get-que-cambia', sec: 3, sev: 'media', ext: [...PHP, ...JS, ...PY], re: /(Route::get|router\.get|app\.get|@(app|bp|router)\.get)\(\s*['"][^'"]*(delete|destroy|remove|borrar|eliminar|cancel)/i, msg: 'Ruta GET con nombre de acción que cambia datos' },
  { id: 'nombre-de-archivo-del-usuario', sec: 7, sev: 'media', ext: [...PHP, ...JS, ...PY], re: /getClientOriginalName\(\)|\.originalname\b|secure_filename\(|\$_FILES\[[^\]]+\]\[['"]name['"]\]/, msg: 'Usa el nombre de archivo que manda el usuario: confirma que no se usa para guardar' },
  { id: 'csrf-exempt-python', sec: 3, sev: 'media', ext: PY, re: /@csrf_exempt|csrf_exempt\(/, msg: 'Vista sin CSRF' },
  { id: 'sql-fstring-python', sec: 5, sev: 'alta', ext: PY, re: /execute\(\s*f['"]|execute\([^)]*%\s*\(|execute\([^)]*\.format\(/, msg: 'SQL con f-string o formato (usa parámetros)' },
  { id: 'mark-safe', sec: 5, sev: 'media', ext: PY, re: /mark_safe\(/, msg: 'mark_safe: salida sin escapar' },
  { id: 'debug-encendido', sec: 1, sev: 'media', ext: [...PHP, ...PY], re: /'debug'\s*=>\s*true\b|^\s*DEBUG\s*=\s*True\b/m, msg: 'Depuración encendida fija en el código' },
];
// Reglas que miran el archivo completo
const FILE_RULES = [
  { id: 'cors-comodin-con-credenciales', sec: 3, sev: 'alta', ext: [...JS, ...PHP, ...PY], test: (t) => /(origin|allowed_origins|Access-Control-Allow-Origin)['"]?\s*[:=,]>?\s*\[?\s*['"]\*['"]/i.test(t) && /(credentials|supports_credentials|Allow-Credentials)['"]?\s*[:=,]>?\s*['"]?true/i.test(t), msg: 'CORS con * y credenciales a la vez' },
];

const secretCfgPath = join(here, '..', '..', 'jay-k-a-security-deploy', 'scripts', 'secret-patterns.json');
const secretCfg = existsSync(secretCfgPath) ? JSON.parse(readFileSync(secretCfgPath, 'utf8')) : null;
const secretRes = secretCfg ? secretCfg.patrones.map((p) => ({ id: p.id, re: new RegExp(p.re, p.flags || '') })) : [];
const fp = secretCfg ? secretCfg.falsosPositivos.map((s) => s.toLowerCase()) : [];

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
      if (r.re.test(line)) findings.push({ seccion: r.sec, severidad: r.sev, regla: r.id, archivo: rel, linea: i + 1, fragmento: line.trim().slice(0, 100), nota: r.msg });
    }
    if (!ONLY || ONLY.has(5)) {
      for (const s of secretRes) {
        const m = line.match(s.re);
        if (!m) continue;
        const v = m[1] || m[0];
        if (fp.some((w) => v.toLowerCase().includes(w))) continue;
        findings.push({ seccion: 0, severidad: 'alta', regla: `secreto:${s.id}`, archivo: rel, linea: i + 1, fragmento: `${v.slice(0, 4)}… (${v.length} caracteres)`, nota: 'Secreto escrito en el código: muévelo a una variable de entorno y rótalo' });
      }
    }
  });
  for (const r of FILE_RULES) {
    if ((ONLY && !ONLY.has(r.sec)) || !r.ext.includes(ext)) continue;
    if (r.test(text)) findings.push({ seccion: r.sec, severidad: r.sev, regla: r.id, archivo: rel, linea: 0, fragmento: '', nota: r.msg });
  }
}

const order = { alta: 0, media: 1 };
findings.sort((a, b) => order[a.severidad] - order[b.severidad] || a.seccion - b.seccion);
if (OUT) writeFileSync(OUT, JSON.stringify({ raiz: ROOT, archivosLeidos: read, hallazgos: findings }, null, 2));
console.log(`Carpeta: ${ROOT} · archivos leídos: ${read}${secretCfg ? '' : ' · (sin patrones de secretos: falta jay-k-a-security-deploy)'}`);
if (!findings.length) console.log('✓ Sin patrones de riesgo detectados. Esto no prueba que sea seguro: la revisión de permisos (IDOR) y límites se hace leyendo el código.');
else {
  console.log('| sev. | secc. | regla | archivo:línea | fragmento | nota |');
  console.log('|---|---|---|---|---|---|');
  for (const h of findings) console.log(`| ${h.severidad} | ${h.seccion || 'secretos'} | ${h.regla} | ${h.archivo}${h.linea ? ':' + h.linea : ''} | ${h.fragmento.replace(/\|/g, '\\|')} | ${h.nota} |`);
  const altas = findings.filter((h) => h.severidad === 'alta').length;
  console.log(`\n${findings.length} candidato(s), ${altas} de severidad alta. Confirma cada uno leyendo el código.`);
}
process.exit(findings.some((h) => h.severidad === 'alta') ? 1 : 0);
