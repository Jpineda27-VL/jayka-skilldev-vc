#!/usr/bin/env node
// Pruebas deterministas del pack: estructura de las skills y comportamiento de cada script.
// No gastan tokens ni usan la red; los fixtures se crean en una carpeta temporal y se borran al final.
// Las pruebas con navegador corren solo si Playwright está instalado (capture-live.mjs --check).
// Uso: node tests/run.mjs [--solo <texto>] [--conservar]
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SK = join(ROOT, 'plugins', 'jay-ka', 'skills');
const S = (skill, script) => join(SK, skill, 'scripts', script);
const TMP = mkdtempSync(join(tmpdir(), 'jayka-tests-'));
const argv = process.argv.slice(2);
const ONLY = argv.includes('--solo') ? argv[argv.indexOf('--solo') + 1] : null;
// Secretos falsos armados en tiempo de ejecución, para que el repositorio no contenga ninguno literal.
const FAKE_STRIPE = ['sk', 'live', '51Hx' + 'ABCDEFGHIJKLMNOPQRSTUV'].join('_');
const FAKE_AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';

const results = [];
async function test(name, fn) {
  if (ONLY && !name.includes(ONLY)) return;
  try { const note = await fn(); results.push({ name, ok: true, note: note || '' }); }
  catch (e) { results.push({ name, ok: e.skip ? null : false, note: e.message }); }
}
const skip = (msg) => Object.assign(new Error(msg), { skip: true });
function assert(cond, msg) { if (!cond) throw new Error(msg); }
const has = (out, s, label = s) => assert(out.includes(s), `falta «${label}» en la salida`);
const hasNot = (out, s, label = s) => assert(!out.includes(s), `no debía aparecer «${label}»`);
const write = (base, files) => { for (const [p, c] of Object.entries(files)) { mkdirSync(dirname(join(base, p)), { recursive: true }); writeFileSync(join(base, p), c); } return base; };
const fixture = (name, files) => write(join(TMP, name), files);
function run(script, args, opts = {}) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: opts.timeout || 120000, env: { ...process.env, ...opts.env } });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
function runAsync(script, args, opts = {}) {
  return new Promise((res) => {
    const p = spawn(process.execPath, [script, ...args], { env: { ...process.env, ...opts.env } });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    const t = setTimeout(() => p.kill(), opts.timeout || 240000);
    p.on('close', (code) => { clearTimeout(t); res({ code, out }); });
  });
}
function serve(dir, extra = {}) {
  return new Promise((res) => {
    const srv = createServer((req, resp) => {
      const path = decodeURIComponent(req.url.split('?')[0]);
      if (extra[path]) { const [status, type, body] = extra[path]; resp.writeHead(status, { 'content-type': type }); return resp.end(body); }
      const f = dir ? join(dir, path === '/' ? 'index.html' : path) : null;
      if (f && existsSync(f) && !f.endsWith('/')) { resp.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'text/plain' }); return resp.end(readFileSync(f)); }
      resp.writeHead(404, { 'content-type': 'text/plain' }); resp.end('no existe');
    });
    srv.listen(0, '127.0.0.1', () => res({ url: `http://127.0.0.1:${srv.address().port}`, close: () => srv.close() }));
  });
}

// ───────────────────────── Estructura de las skills ─────────────────────────
await test('estructura: frontmatter, argumentos, cierre y referencias', () => {
  const dirs = readdirSync(SK).filter((d) => existsSync(join(SK, d, 'SKILL.md')));
  assert(dirs.length === 21, `se esperaban 21 skills, hay ${dirs.length}`);
  const automatic = ['jay-k-a-communication', 'jay-k-a-working-rules', 'jay-k-a-git-rules'];
  const problems = [];
  for (const d of dirs) {
    const text = readFileSync(join(SK, d, 'SKILL.md'), 'utf8');
    const fm = text.split(/^---\s*$/m)[1] || '';
    const field = (k) => (fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1];
    if (field('name') !== d) problems.push(`${d}: name no coincide con la carpeta`);
    if (!/^".*"$/.test(field('description') || '')) problems.push(`${d}: description sin comillas`);
    const manual = !automatic.includes(d);
    if (manual) {
      if (field('disable-model-invocation') !== 'true') problems.push(`${d}: falta disable-model-invocation`);
      if (!field('argument-hint')) problems.push(`${d}: falta argument-hint`);
      if (!text.includes('$ARGUMENTS')) problems.push(`${d}: falta $ARGUMENTS`);
      if (!/Terminado cuando|\| 1 · Estático/.test(text)) problems.push(`${d}: falta «Terminado cuando»`);
      if (!text.includes('../jay-k-a-working-rules/reference/convenciones.md')) problems.push(`${d}: no apunta a las convenciones`);
    }
    if (!text.includes('## Mis ajustes')) problems.push(`${d}: falta «Mis ajustes»`);
    for (const m of text.matchAll(/`(reference\/[\w.-]+)`/g)) if (!existsSync(join(SK, d, m[1]))) problems.push(`${d}: no existe ${m[1]}`);
    for (const m of text.matchAll(/\.\.\/(jay-k-a-[\w-]+)\/((?:reference|scripts)\/[\w./-]+?\.(?:md|mjs|js|json))/g)) if (!existsSync(join(SK, m[1], m[2]))) problems.push(`${d}: no existe ../${m[1]}/${m[2]}`);
    for (const m of text.matchAll(/<SKILL_DIR>\/scripts\/([\w.-]+)/g)) if (!existsSync(join(SK, d, 'scripts', m[1]))) problems.push(`${d}: no existe scripts/${m[1]}`);
  }
  assert(!problems.length, problems.join('\n   '));
  return `${dirs.length} skills revisadas`;
});

await test('estructura: versiones de plugin.json y marketplace.json iguales', () => {
  const a = JSON.parse(readFileSync(join(ROOT, 'plugins', 'jay-ka', '.claude-plugin', 'plugin.json'), 'utf8')).version;
  const m = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  assert(a === m.metadata.version && a === m.plugins[0].version, `versiones distintas: ${a} / ${m.metadata.version} / ${m.plugins[0].version}`);
  return `v${a}`;
});

await test('estructura: los scripts pasan node --check', () => {
  const bad = [];
  for (const d of readdirSync(SK)) {
    const walk = (p) => { if (!existsSync(p)) return; for (const e of readdirSync(p, { withFileTypes: true })) { const f = join(p, e.name); if (e.isDirectory()) walk(f); else if (/\.mjs$/.test(e.name) && spawnSync(process.execPath, ['--check', f]).status !== 0) bad.push(f); } };
    walk(join(SK, d, 'scripts'));
  }
  assert(!bad.length, `con errores de sintaxis: ${bad.join(', ')}`);
});

// ───────────────────────── tech-reverse ─────────────────────────
await test('tech-reverse · scan-repo detecta stack y omite secretos', () => {
  const dir = fixture('repo', {
    'package.json': JSON.stringify({ name: 'demo', license: 'MIT', scripts: { postinstall: 'node setup.js' }, dependencies: { gsap: '^3.12.5', lenis: '^1.1.0' } }),
    '.env': `SECRET=${FAKE_STRIPE}\n`,
    'LICENSE': 'MIT License',
    'src/main.ts': "import gsap from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.from('.t', { y: 40, duration: 0.8, ease: 'power3.out', scrollTrigger: { start: 'top 80%', scrub: 1 } });\n",
    'src/style.css': '.b { transition: transform 200ms cubic-bezier(0.4,0,0.2,1); }\n@keyframes fadeUp { from { opacity: 0 } to { opacity: 1 } }\n',
  });
  const r = run(S('jay-k-a-tech-reverse', 'scan-repo.mjs'), [dir, '--out', join(TMP, 'repo.json')]);
  has(r.out, 'GSAP'); has(r.out, 'Lenis'); has(r.out, 'GSAP ScrollTrigger'); has(r.out, 'postinstall');
  has(r.out, 'secretos omitidos (sin abrir): 1');
  hasNot(readFileSync(join(TMP, 'repo.json'), 'utf8'), FAKE_STRIPE, 'el secreto del .env');
});

await test('tech-reverse · ajuste de curvas reconoce power3.out y linear', async () => {
  const { fitCurve, CANDIDATES } = await import(pathToFileURL(S('jay-k-a-tech-reverse', 'lib/curves.mjs')).href);
  const f = CANDIDATES.find((c) => c.nombre.startsWith('power3.out')).f;
  const curve = Array.from({ length: 50 }, (_, i) => f(i / 49));
  assert(fitCurve(curve)[0].nombre.startsWith('power3.out'), `ajustó ${fitCurve(curve)[0].nombre}`);
  assert(fitCurve(Array.from({ length: 50 }, (_, i) => i / 49))[0].nombre === 'linear', 'linear no se reconoció');
});

await test('tech-reverse · compare-motion acepta igual y rechaza distinto', () => {
  const curve = (f) => Array.from({ length: 50 }, (_, i) => +f(i / 49).toFixed(4));
  const pista = (dur, f) => ({ tramos: [{ objetivo: '#a', canal: 'opacity', duracionMs: dur, desde: 0, hasta: 1, ligadoAlScroll: false, curva: curve(f) }] });
  const q = (t) => 1 - (1 - t) ** 4;
  writeFileSync(join(TMP, 'p-a.json'), JSON.stringify(pista(800, q)));
  writeFileSync(join(TMP, 'p-b.json'), JSON.stringify(pista(790, q)));
  writeFileSync(join(TMP, 'p-c.json'), JSON.stringify(pista(500, (t) => t)));
  const ok = run(S('jay-k-a-tech-reverse', 'compare-motion.mjs'), [join(TMP, 'p-a.json'), join(TMP, 'p-b.json')]);
  const bad = run(S('jay-k-a-tech-reverse', 'compare-motion.mjs'), [join(TMP, 'p-a.json'), join(TMP, 'p-c.json')]);
  assert(ok.code === 0, `igual salió con ${ok.code}`); assert(bad.code === 1, `distinto salió con ${bad.code}`);
  has(bad.out, 'duración'); has(bad.out, 'curva');
});

// ───────────────────────── security ─────────────────────────
await test('security-web · scan-security encuentra riesgos y no la consulta segura', () => {
  const dir = fixture('riesgos', {
    'app/Http/Controllers/PedidoController.php': "<?php\nclass P {\n  function a($request) { return Pedido::create($request->all()); }\n  function b($q) { return DB::select(\"SELECT * FROM p WHERE n = '$q'\"); }\n  function c($q) { return DB::select('SELECT * FROM p WHERE id = ?', [$q]); }\n}\n",
    'src/app.js': `el.innerHTML = datos.nombre;\ndb.query(\`SELECT * FROM u WHERE id = \${id}\`);\nconst cfg = { origin: '*', credentials: true };\nconst k = "${FAKE_AWS}";\n`,
    'tests/app.test.js': 'el.innerHTML = x;\n',
  });
  const r = run(S('jay-k-a-security-web', 'scan-security.mjs'), [dir]);
  assert(r.code === 1, `código ${r.code}`);
  for (const id of ['asignacion-masiva', 'sql-crudo-php', 'sql-concatenado-js', 'cors-comodin-con-credenciales', 'innerhtml', 'secreto:aws-access-key']) has(r.out, id);
  hasNot(r.out, 'PedidoController.php:5', 'la consulta con parámetros');
  hasNot(r.out, 'tests/app.test.js', 'los archivos de prueba');
  hasNot(r.out, FAKE_AWS, 'la clave completa');
});

await test('security-deploy · scan-git-secrets encuentra secretos borrados y enmascara', () => {
  if (spawnSync('git', ['--version']).status !== 0) throw skip('git no está instalado');
  const dir = fixture('git-secretos', { 'config.js': `const stripe = "${FAKE_STRIPE}";\nconst k = "your-api-key-here";\n`, '.env': 'DB_PASSWORD=x\n' });
  const g = (...a) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  g('init', '-q'); g('config', 'user.email', 't@t'); g('config', 'user.name', 't'); g('add', '-A'); g('commit', '-qm', 'uno');
  writeFileSync(join(dir, 'config.js'), 'const stripe = process.env.STRIPE;\n'); writeFileSync(join(dir, '.gitignore'), '.env\n');
  g('rm', '-q', '--cached', '.env'); g('add', '-A'); g('commit', '-qm', 'dos');
  const r = run(S('jay-k-a-security-deploy', 'scan-git-secrets.mjs'), [dir]);
  assert(r.code === 1, `código ${r.code}`);
  has(r.out, 'stripe-live'); has(r.out, 'archivo-env-versionado');
  hasNot(r.out, FAKE_STRIPE, 'la clave completa'); hasNot(r.out, 'your-api-key-here');
});

await test('security-deploy · check-deploy marca .env expuesto y respeta 404', async () => {
  const srv = await serve(null, { '/': [200, 'text/html', '<html>Inicio</html>'], '/.env': [200, 'text/plain', 'APP_KEY=base64:x\nDB_PASSWORD=y\n'] });
  try {
    const r = await runAsync(S('jay-k-a-security-deploy', 'check-deploy.mjs'), [srv.url]);
    assert(r.code === 1, `código ${r.code}`);
    assert(/\/\.env \| ✗ falla/.test(r.out), '/.env no salió como falla');
    assert(/\/\.git\/config \| ✓ bien/.test(r.out), '/.git/config no salió como bien');
    assert(/Ruta inexistente \| ✓ bien/.test(r.out), 'la página de error no salió bien');
  } finally { srv.close(); }
});

// ───────────────────────── style ─────────────────────────
await test('style · contrast.mjs calcula WCAG', () => {
  const ok = run(S('jay-k-a-style-self-learning', 'contrast.mjs'), ['#26264F', '#FFF8EF']);
  const bad = run(S('jay-k-a-style-self-learning', 'contrast.mjs'), ['#999', 'white']);
  has(ok.out, '13.53:1'); has(ok.out, 'AAA'); assert(ok.code === 0, 'el par bueno falló');
  has(bad.out, 'no cumple'); assert(bad.code === 1, 'el par malo pasó');
});

await test('style · check-tokens valida el ejemplo y rechaza contrastes falsos', () => {
  const ref = join(SK, 'jay-k-a-style-self-learning', 'reference', 'tokens.schema.json');
  assert(run(S('jay-k-a-style-self-learning', 'check-tokens.mjs'), [ref]).code === 0, 'el ejemplo de referencia no valida');
  writeFileSync(join(TMP, 'tokens-mal.json'), JSON.stringify({ proyecto: 'Mi Proyecto', fecha: '26/10/2026', color: { roles: { texto: '#26264F', fondo: '#FFF8EF', acento: 'azulito' }, contraste: [{ par: 'texto/fondo', ratio: 9, cumple: 'AAA' }] } }));
  const r = run(S('jay-k-a-style-self-learning', 'check-tokens.mjs'), [join(TMP, 'tokens-mal.json')]);
  assert(r.code === 1, 'tokens malos pasaron'); has(r.out, 'declara 9'); has(r.out, 'azulito'); has(r.out, 'no es un slug');
});

// ───────────────────────── real-data ─────────────────────────
await test('real-data · find-demo-data encuentra demos y respeta seeders', () => {
  const dir = fixture('demo', {
    'src/pages/Pedidos.jsx': "const pedidos = [\n  { id: 1, nombre: 'A', precio: 1 },\n  { id: 2, nombre: 'B' },\n  { id: 3, nombre: 'C' },\n];\n// TODO: conectar con la API\nexport default () => <img src=\"https://picsum.photos/200\" />;\n",
    'src/pages/Perfil.vue': '<template><p>Lorem ipsum dolor sit amet</p><p>juan@example.com</p></template>\n',
    'src/pages/Real.jsx': 'export const Real = () => fetch("/api/pedidos");\n',
    'database/seeders/DemoSeeder.php': '<?php $this->faker->name(); // John Doe\n',
  });
  const r = run(S('jay-k-a-tech-real-data', 'find-demo-data.mjs'), [dir]);
  assert(r.code === 1, `código ${r.code}`);
  has(r.out, 'Pedidos.jsx'); has(r.out, 'arreglo-de-datos-a-mano'); has(r.out, 'Perfil.vue');
  hasNot(r.out, 'DemoSeeder'); hasNot(r.out, 'Real.jsx');
});

// ───────────────────────── Con navegador (opcional) ─────────────────────────
const pwReady = run(S('jay-k-a-tech-reverse', 'capture-live.mjs'), ['--check']).code === 0;
const page = (ease, dur) => `<!doctype html><title>t</title><style>.card{animation:fade 600ms ease-out both}@keyframes fade{from{opacity:0}to{opacity:1}}#box{width:80px;height:80px;background:red}</style>
<div class="card">Tarjeta</div><div id="box"></div><script>const e=${ease};const b=document.getElementById('box');setTimeout(()=>{const t0=performance.now();b.style.opacity='0';
function f(n){const p=Math.min(1,(n-t0)/${dur});b.style.opacity=String(e(p));if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)},300)</script>`;

await test('navegador · capture-live mide easing y compara reproducción', async () => {
  if (!pwReady) throw skip('Playwright no está instalado (capture-live.mjs --check)');
  const dir = fixture('sitio', { 'index.html': page('(t)=>1-Math.pow(1-t,4)', 800), 'mal.html': page('(t)=>t', 500) });
  const srv = await serve(dir);
  try {
    const common = ['--viewports', '1280x800', '--steps', '0', '--hover', '0', '--no-reduced', '--sin-capturas', '--track', '#box'];
    const a = await runAsync(S('jay-k-a-tech-reverse', 'capture-live.mjs'), [`${srv.url}/index.html`, '--out', join(TMP, 'cap-a'), ...common]);
    has(a.out, 'power3.out', 'curva power3.out medida'); has(a.out, 'ease-out', 'curva del @keyframes');
    const b = await runAsync(S('jay-k-a-tech-reverse', 'capture-live.mjs'), [`${srv.url}/mal.html`, '--out', join(TMP, 'cap-b'), ...common]);
    const cmp = run(S('jay-k-a-tech-reverse', 'compare-motion.mjs'), [join(TMP, 'cap-a', 'live-1280x800', 'pistas.json'), join(TMP, 'cap-b', 'live-1280x800', 'pistas.json'), '--canal', 'opacity']);
    assert(cmp.code === 1, 'la reproducción equivocada pasó la comparación');
    return b.code === 0 ? '' : 'aviso: la segunda captura salió con código distinto de 0';
  } finally { srv.close(); }
});

await test('navegador · style-probe mide contraste real', async () => {
  if (!pwReady) throw skip('Playwright no está instalado');
  const dir = fixture('estilo', { 'index.html': '<!doctype html><style>body{background:#FFF8EF;color:#26264F}.s{color:#AAAAAA;background:#fff}</style><p>Texto</p><p class="s">Suave</p>' });
  const srv = await serve(dir);
  try {
    await runAsync(S('jay-k-a-tech-reverse', 'capture-live.mjs'), [srv.url, '--out', join(TMP, 'cap-e'), '--viewports', '1280x800', '--steps', '0', '--hover', '0', '--no-reduced', '--sin-capturas', '--eval', S('jay-k-a-style-self-learning', 'style-probe.js')]);
    const j = JSON.parse(readFileSync(join(TMP, 'cap-e', 'live-1280x800', 'eval-style-probe.json'), 'utf8'));
    assert(j.contraste.queNoCumplen.some((p) => p.par.startsWith('#AAAAAA')), 'no detectó el par que no cumple');
  } finally { srv.close(); }
});

await test('navegador · capture-pair distingue igual de distinto', async () => {
  if (!pwReady) throw skip('Playwright no está instalado');
  const web = '<!doctype html><main><h1>Pedidos</h1><h2>Pendientes</h2><p>Tus pedidos en curso y su estado actual.</p><button>Filtrar</button><a href="/n">Nuevo</a></main>';
  const app = '<!doctype html><main><h1>Pedidos</h1><p>Tus pedidos en curso y su estado actual.</p><button>Filtrar</button></main>';
  const dir = fixture('paridad', { 'web.html': web, 'app.html': app, 'igual.html': web });
  const srv = await serve(dir);
  try {
    writeFileSync(join(TMP, 'rutas.txt'), `distinta | ${srv.url}/web.html | ${srv.url}/app.html\nigual | ${srv.url}/web.html | ${srv.url}/igual.html\n`);
    const r = await runAsync(S('jay-k-a-tech-views-parity', 'capture-pair.mjs'), ['--rutas', join(TMP, 'rutas.txt'), '--out', join(TMP, 'par'), '--viewports', '1280x800']);
    assert(/\| distinta \| 1280x800 \| difiere/.test(r.out), 'la pantalla distinta no salió como difiere');
    assert(/\| igual \| 1280x800 \| igual/.test(r.out), 'la pantalla igual no salió como igual');
    has(r.out, 'Pendientes');
  } finally { srv.close(); }
});

// ───────────────────────── Resumen ─────────────────────────
if (!argv.includes('--conservar')) rmSync(TMP, { recursive: true, force: true });
else console.log(`Fixtures conservados en ${TMP}`);
let fail = 0;
for (const r of results) {
  const icon = r.ok === true ? '✓' : r.ok === null ? '–' : '✗';
  if (r.ok === false) fail++;
  console.log(`${icon} ${r.name}${r.note ? ` — ${r.note.replace(/\n/g, '\n   ')}` : ''}`);
}
const skipped = results.filter((r) => r.ok === null).length;
console.log(`\n${results.length - fail - skipped} pasaron · ${fail} fallaron · ${skipped} omitidas`);
process.exit(fail ? 1 : 0);
