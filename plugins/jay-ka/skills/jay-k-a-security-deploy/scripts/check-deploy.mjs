#!/usr/bin/env node
// Verifica un sitio publicado desde fuera, solo con peticiones GET de lectura y de a una:
// HTTPS y certificado, encabezados de seguridad, cookies, rutas que deben dar 404/403 y página de error.
// Úsalo SOLO contra un dominio del usuario y con su permiso.
// Uso: node check-deploy.mjs <dominio-o-url> [--solo-encabezados] [--out resultado.json]
// Sale con 0 si no hay fallas, 1 si hay alguna, 2 si no se pudo conectar.
import { writeFileSync } from 'node:fs';
import tls from 'node:tls';

const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--'));
if (!target) { console.error('Uso: node check-deploy.mjs <dominio-o-url> [--solo-encabezados] [--out resultado.json]'); process.exit(2); }
const ONLY_HEADERS = argv.includes('--solo-encabezados');
const outIdx = argv.indexOf('--out');
const OUT = outIdx >= 0 ? argv[outIdx + 1] : null;
const base = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`);
const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(base.hostname);
const UA = 'jay-k-a-security-deploy (verificacion del propietario)';
const rows = [];
const row = (seccion, punto, estado, detalle) => rows.push({ seccion, punto, estado, detalle });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, redirect = 'manual') {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { redirect, signal: ctrl.signal, headers: { 'user-agent': UA } });
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, headers: res.headers, body: buf.subarray(0, 65536).toString('latin1'), size: buf.length, url: res.url };
  } finally { clearTimeout(t); }
}

// 1. HTTPS
let home;
try { home = await get(base.href, 'follow'); } catch (e) { console.error(`No se pudo conectar con ${base.href}: ${e.cause?.code || e.message}`); process.exit(2); }
if (base.protocol === 'https:') {
  row('HTTPS', 'El sitio responde por HTTPS', home.status < 500 ? 'bien' : 'falla', `estado ${home.status}`);
  try {
    const plain = await get(`http://${base.host}${base.pathname}`);
    const loc = plain.headers.get('location') || '';
    const ok = [301, 302, 307, 308].includes(plain.status) && loc.startsWith('https://');
    row('HTTPS', 'HTTP redirige a HTTPS', ok ? 'bien' : 'falla', `${plain.status}${loc ? ' → ' + loc : ''}`);
  } catch (e) { row('HTTPS', 'HTTP redirige a HTTPS', 'revisar', `HTTP no respondió (${e.cause?.code || e.message}); si el puerto 80 está cerrado, los navegadores no podrán redirigir`); }
  try {
    const days = await new Promise((res, rej) => {
      const s = tls.connect({ host: base.hostname, port: Number(base.port) || 443, servername: base.hostname, timeout: 10000 }, () => {
        const c = s.getPeerCertificate(); s.end();
        res(Math.floor((new Date(c.valid_to) - Date.now()) / 86400000));
      });
      s.on('error', rej); s.on('timeout', () => rej(new Error('timeout')));
    });
    row('HTTPS', 'Certificado vigente', days > 21 ? 'bien' : days > 0 ? 'revisar' : 'falla', `vence en ${days} días`);
  } catch (e) { row('HTTPS', 'Certificado vigente', 'revisar', `no se pudo leer (${e.message})`); }
} else {
  row('HTTPS', 'El sitio responde por HTTPS', isLocal ? 'no aplica' : 'falla', isLocal ? 'prueba local por HTTP' : 'la URL dada es http://');
}

// 2. Encabezados
const h = (n) => home.headers.get(n);
const hsts = h('strict-transport-security');
const maxAge = Number((hsts || '').match(/max-age=(\d+)/)?.[1] || 0);
row('Encabezados', 'Strict-Transport-Security', isLocal ? 'no aplica' : maxAge >= 15552000 ? 'bien' : hsts ? 'revisar' : 'falla', hsts || 'ausente');
const csp = h('content-security-policy');
let cspState = csp ? 'bien' : 'falla';
const cspNotes = [];
if (csp) {
  const script = (csp.match(/script-src([^;]*)/) || csp.match(/default-src([^;]*)/) || [])[1] || '';
  if (/'unsafe-inline'/.test(script) && !/'nonce-|'sha(256|384|512)-/.test(script)) { cspState = 'revisar'; cspNotes.push("script con 'unsafe-inline'"); }
  if (/(^|\s)\*(\s|$)/.test(script)) { cspState = 'revisar'; cspNotes.push('script-src con *'); }
  if (!/frame-ancestors/.test(csp)) cspNotes.push('sin frame-ancestors');
}
row('Encabezados', 'Content-Security-Policy', cspState, csp ? `${csp.slice(0, 90)}${csp.length > 90 ? '…' : ''}${cspNotes.length ? ' · ' + cspNotes.join(', ') : ''}` : 'ausente');
row('Encabezados', 'X-Content-Type-Options', h('x-content-type-options') === 'nosniff' ? 'bien' : 'falla', h('x-content-type-options') || 'ausente');
row('Encabezados', 'Referrer-Policy', h('referrer-policy') ? 'bien' : 'falla', h('referrer-policy') || 'ausente');
row('Encabezados', 'Permissions-Policy', h('permissions-policy') ? 'bien' : 'revisar', h('permissions-policy') ? 'presente' : 'ausente');
const xfo = h('x-frame-options');
row('Encabezados', 'Protección contra iframes', xfo || /frame-ancestors/.test(csp || '') ? 'bien' : 'falla', xfo ? `X-Frame-Options: ${xfo}` : /frame-ancestors/.test(csp || '') ? 'por CSP frame-ancestors' : 'ni X-Frame-Options ni frame-ancestors');
row('Encabezados', 'Cross-Origin-Opener-Policy', h('cross-origin-opener-policy') ? 'bien' : 'revisar', h('cross-origin-opener-policy') || 'ausente');
row('Encabezados', 'Sin X-Powered-By', h('x-powered-by') ? 'falla' : 'bien', h('x-powered-by') || 'ausente');
const server = h('server');
row('Encabezados', 'Server sin versión', server && /\d/.test(server) ? 'falla' : 'bien', server || 'ausente');

// 3. Cookies de la página principal
const cookies = typeof home.headers.getSetCookie === 'function' ? home.headers.getSetCookie() : [];
if (!cookies.length) row('Cookies', 'Cookies al cargar', 'no aplica', 'la página principal no envía cookies');
for (const c of cookies) {
  const name = c.split('=')[0];
  const miss = [];
  if (!isLocal && !/;\s*secure/i.test(c)) miss.push('Secure');
  if (!/;\s*samesite=/i.test(c)) miss.push('SameSite');
  const sessionLike = /sess|sid|token|auth|laravel_session|remember/i.test(name);
  if (sessionLike && !/;\s*httponly/i.test(c)) miss.push('HttpOnly');
  row('Cookies', `Cookie ${name}`, miss.length ? (sessionLike ? 'falla' : 'revisar') : 'bien', miss.length ? `le falta: ${miss.join(', ')}` : 'banderas correctas');
}

// 4. Rutas que deben dar 404/403 y 5. página de error
if (!ONLY_HEADERS) {
  const PATHS = [
    ['/.env', /^[A-Z][A-Z0-9_]*=/m],
    ['/.env.production', /^[A-Z][A-Z0-9_]*=/m],
    ['/.git/config', /\[core\]/],
    ['/.git/HEAD', /^ref: /],
    ['/.DS_Store', /Bud1/],
    ['/composer.json', /"require"/],
    ['/composer.lock', /"packages"/],
    ['/package.json', /"(dependencies|scripts)"/],
    ['/storage/logs/laravel.log', /\[\d{4}-\d\d-\d\d[^\]]*\]\s+\w+\.(ERROR|INFO|DEBUG|WARNING)/],
    ['/phpinfo.php', /phpinfo\(\)|PHP Version/],
    ['/info.php', /phpinfo\(\)|PHP Version/],
    ['/backup.sql', /(CREATE TABLE|INSERT INTO)/i],
    ['/database.sql', /(CREATE TABLE|INSERT INTO)/i],
    ['/dump.sql', /(CREATE TABLE|INSERT INTO)/i],
    ['/backup.zip', null],
    ['/wp-config.php.bak', /DB_PASSWORD/],
    ['/server-status', /Server Status/i],
    ['/_debugbar/open', /phpdebugbar|debugbar/i],
    ['/telescope', /Telescope/],
    ['/horizon', /Horizon/],
    ['/node_modules/', /Index of|Directory listing for/i],
    ['/vendor/', /Index of|Directory listing for/i],
    ['/storage/', /Index of|Directory listing for/i],
    ['/backups/', /Index of|Directory listing for/i],
  ];
  for (const [p, sig] of PATHS) {
    await pause(150);
    let r;
    try { r = await get(new URL(p, base).href); } catch (e) { row('Rutas', p, 'revisar', `sin respuesta (${e.cause?.code || e.message})`); continue; }
    const ct = r.headers.get('content-type') || '';
    if ([401, 403, 404, 410].includes(r.status)) { row('Rutas', p, 'bien', String(r.status)); continue; }
    if (r.status >= 300 && r.status < 400) { row('Rutas', p, 'bien', `${r.status} → ${r.headers.get('location') || ''}`); continue; }
    if (r.status >= 500) { row('Rutas', p, 'revisar', `${r.status}: error del servidor en vez de 404`); continue; }
    const exposed = sig ? sig.test(r.body) : /zip|octet-stream/.test(ct) && r.size > 0;
    const spaFallback = /text\/html/.test(ct) && Math.abs(r.size - home.size) < 64;
    if (exposed) row('Rutas', p, 'falla', `${r.status} y el contenido parece real (${ct || 'sin tipo'}, ${r.size} bytes)`);
    else if (spaFallback) row('Rutas', p, 'bien', `${r.status} con la página principal (respuesta genérica de la app)`);
    else row('Rutas', p, 'revisar', `${r.status} (${ct || 'sin tipo'}, ${r.size} bytes): debería dar 404; revisa qué devuelve`);
  }

  await pause(150);
  const LEAK = /Stack trace|Traceback \(most recent call last\)|Whoops!|Symfony\\Component|vendor\/laravel|Illuminate\\|at [\w.$<>]+ \((?:\/|[A-Z]:\\)[^)]*:\d+:\d+\)|DEBUG\s*=\s*True|Exception in thread|Fatal error:|on line <b>\d+<\/b>|SQLSTATE\[/;
  const probe = `/jka-${Date.now()}-no-existe`;
  try {
    const r = await get(new URL(probe, base).href);
    const leak = r.body.match(LEAK);
    row('Página de error', 'Ruta inexistente', leak ? 'falla' : r.status === 404 ? 'bien' : 'revisar', leak ? `${r.status}: muestra «${leak[0].slice(0, 40)}»` : `${r.status} sin trazas${r.status === 404 ? '' : ' (debería ser 404)'}`);
  } catch (e) { row('Página de error', 'Ruta inexistente', 'revisar', e.cause?.code || e.message); }
}

const fails = rows.filter((r) => r.estado === 'falla').length;
const review = rows.filter((r) => r.estado === 'revisar').length;
if (OUT) writeFileSync(OUT, JSON.stringify({ url: base.href, fecha: new Date().toISOString(), filas: rows }, null, 2));
const icon = { bien: '✓', falla: '✗', revisar: '!', 'no aplica': '–' };
console.log(`Sitio: ${base.href}`);
console.log('| sección | punto | estado | detalle |');
console.log('|---|---|---|---|');
for (const r of rows) console.log(`| ${r.seccion} | ${r.punto} | ${icon[r.estado]} ${r.estado} | ${String(r.detalle).replace(/\|/g, '\\|')} |`);
console.log(`\n${fails} falla(s) · ${review} para revisar · ${rows.length} puntos.`);
process.exit(fails ? 1 : 0);
