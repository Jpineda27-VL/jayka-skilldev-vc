#!/usr/bin/env node
// Checks a published site from the outside, with read-only GET requests, one at a time:
// HTTPS and certificate, security headers, cookies, paths that must return 404/403 and the error page.
// Use it ONLY against a domain owned by the user and with their permission.
// Usage: node check-deploy.mjs <domain-or-url> [--headers-only] [--out result.json]
// Exits 0 if nothing fails, 1 if something fails, 2 if it could not connect.
import { writeFileSync } from 'node:fs';
import tls from 'node:tls';

const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--'));
if (!target) { console.error('Usage: node check-deploy.mjs <domain-or-url> [--headers-only] [--out result.json]'); process.exit(2); }
const ONLY_HEADERS = argv.includes('--headers-only');
const outIdx = argv.indexOf('--out');
const OUT = outIdx >= 0 ? argv[outIdx + 1] : null;
const base = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`);
const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(base.hostname);
const UA = 'jayka-security-deploy (owner verification)';
const rows = [];
const row = (section, check, status, detail) => rows.push({ section, check, status, detail });
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
try { home = await get(base.href, 'follow'); } catch (e) { console.error(`Could not connect to ${base.href}: ${e.cause?.code || e.message}`); process.exit(2); }
if (base.protocol === 'https:') {
  row('HTTPS', 'The site answers over HTTPS', home.status < 500 ? 'ok' : 'fail', `status ${home.status}`);
  try {
    const plain = await get(`http://${base.host}${base.pathname}`);
    const loc = plain.headers.get('location') || '';
    const good = [301, 302, 307, 308].includes(plain.status) && loc.startsWith('https://');
    row('HTTPS', 'HTTP redirects to HTTPS', good ? 'ok' : 'fail', `${plain.status}${loc ? ' → ' + loc : ''}`);
  } catch (e) { row('HTTPS', 'HTTP redirects to HTTPS', 'review', `HTTP did not answer (${e.cause?.code || e.message}); if port 80 is closed, browsers will not be able to redirect`); }
  try {
    const days = await new Promise((res, rej) => {
      const s = tls.connect({ host: base.hostname, port: Number(base.port) || 443, servername: base.hostname, timeout: 10000 }, () => {
        const c = s.getPeerCertificate(); s.end();
        res(Math.floor((new Date(c.valid_to) - Date.now()) / 86400000));
      });
      s.on('error', rej); s.on('timeout', () => rej(new Error('timeout')));
    });
    row('HTTPS', 'Valid certificate', days > 21 ? 'ok' : days > 0 ? 'review' : 'fail', `expires in ${days} days`);
  } catch (e) { row('HTTPS', 'Valid certificate', 'review', `could not be read (${e.message})`); }
} else {
  row('HTTPS', 'The site answers over HTTPS', isLocal ? 'n/a' : 'fail', isLocal ? 'local test over HTTP' : 'the given URL is http://');
}

// 2. Headers
const h = (n) => home.headers.get(n);
const hsts = h('strict-transport-security');
const maxAge = Number((hsts || '').match(/max-age=(\d+)/)?.[1] || 0);
row('Headers', 'Strict-Transport-Security', isLocal ? 'n/a' : maxAge >= 15552000 ? 'ok' : hsts ? 'review' : 'fail', hsts || 'missing');
const csp = h('content-security-policy');
let cspState = csp ? 'ok' : 'fail';
const cspNotes = [];
if (csp) {
  const script = (csp.match(/script-src([^;]*)/) || csp.match(/default-src([^;]*)/) || [])[1] || '';
  if (/'unsafe-inline'/.test(script) && !/'nonce-|'sha(256|384|512)-/.test(script)) { cspState = 'review'; cspNotes.push("script with 'unsafe-inline'"); }
  if (/(^|\s)\*(\s|$)/.test(script)) { cspState = 'review'; cspNotes.push('script-src with *'); }
  if (!/frame-ancestors/.test(csp)) cspNotes.push('no frame-ancestors');
}
row('Headers', 'Content-Security-Policy', cspState, csp ? `${csp.slice(0, 90)}${csp.length > 90 ? '…' : ''}${cspNotes.length ? ' · ' + cspNotes.join(', ') : ''}` : 'missing');
row('Headers', 'X-Content-Type-Options', h('x-content-type-options') === 'nosniff' ? 'ok' : 'fail', h('x-content-type-options') || 'missing');
row('Headers', 'Referrer-Policy', h('referrer-policy') ? 'ok' : 'fail', h('referrer-policy') || 'missing');
row('Headers', 'Permissions-Policy', h('permissions-policy') ? 'ok' : 'review', h('permissions-policy') ? 'present' : 'missing');
const xfo = h('x-frame-options');
row('Headers', 'Iframe protection', xfo || /frame-ancestors/.test(csp || '') ? 'ok' : 'fail', xfo ? `X-Frame-Options: ${xfo}` : /frame-ancestors/.test(csp || '') ? 'through CSP frame-ancestors' : 'neither X-Frame-Options nor frame-ancestors');
row('Headers', 'Cross-Origin-Opener-Policy', h('cross-origin-opener-policy') ? 'ok' : 'review', h('cross-origin-opener-policy') || 'missing');
row('Headers', 'No X-Powered-By', h('x-powered-by') ? 'fail' : 'ok', h('x-powered-by') || 'absent');
const server = h('server');
row('Headers', 'Server without version', server && /\d/.test(server) ? 'fail' : 'ok', server || 'absent');

// 3. Cookies of the home page
const cookies = typeof home.headers.getSetCookie === 'function' ? home.headers.getSetCookie() : [];
if (!cookies.length) row('Cookies', 'Cookies on load', 'n/a', 'the home page sets no cookies');
for (const c of cookies) {
  const name = c.split('=')[0];
  const miss = [];
  if (!isLocal && !/;\s*secure/i.test(c)) miss.push('Secure');
  if (!/;\s*samesite=/i.test(c)) miss.push('SameSite');
  const sessionLike = /sess|sid|token|auth|laravel_session|remember/i.test(name);
  if (sessionLike && !/;\s*httponly/i.test(c)) miss.push('HttpOnly');
  row('Cookies', `Cookie ${name}`, miss.length ? (sessionLike ? 'fail' : 'review') : 'ok', miss.length ? `missing: ${miss.join(', ')}` : 'flags correct');
}

// 4. Paths that must return 404/403 and 5. error page
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
    try { r = await get(new URL(p, base).href); } catch (e) { row('Paths', p, 'review', `no answer (${e.cause?.code || e.message})`); continue; }
    const ct = r.headers.get('content-type') || '';
    if ([401, 403, 404, 410].includes(r.status)) { row('Paths', p, 'ok', String(r.status)); continue; }
    if (r.status >= 300 && r.status < 400) { row('Paths', p, 'ok', `${r.status} → ${r.headers.get('location') || ''}`); continue; }
    if (r.status >= 500) { row('Paths', p, 'review', `${r.status}: server error instead of 404`); continue; }
    const exposed = sig ? sig.test(r.body) : /zip|octet-stream/.test(ct) && r.size > 0;
    const spaFallback = /text\/html/.test(ct) && Math.abs(r.size - home.size) < 64;
    if (exposed) row('Paths', p, 'fail', `${r.status} and the content looks real (${ct || 'no type'}, ${r.size} bytes)`);
    else if (spaFallback) row('Paths', p, 'ok', `${r.status} with the home page (generic app response)`);
    else row('Paths', p, 'review', `${r.status} (${ct || 'no type'}, ${r.size} bytes): should return 404; check what it returns`);
  }

  await pause(150);
  const LEAK = /Stack trace|Traceback \(most recent call last\)|Whoops!|Symfony\\Component|vendor\/laravel|Illuminate\\|at [\w.$<>]+ \((?:\/|[A-Z]:\\)[^)]*:\d+:\d+\)|DEBUG\s*=\s*True|Exception in thread|Fatal error:|on line <b>\d+<\/b>|SQLSTATE\[/;
  const probe = `/jka-${Date.now()}-does-not-exist`;
  try {
    const r = await get(new URL(probe, base).href);
    const leak = r.body.match(LEAK);
    row('Error page', 'Nonexistent path', leak ? 'fail' : r.status === 404 ? 'ok' : 'review', leak ? `${r.status}: shows «${leak[0].slice(0, 40)}»` : `${r.status} without traces${r.status === 404 ? '' : ' (should be 404)'}`);
  } catch (e) { row('Error page', 'Nonexistent path', 'review', e.cause?.code || e.message); }
}

const fails = rows.filter((r) => r.status === 'fail').length;
const review = rows.filter((r) => r.status === 'review').length;
if (OUT) writeFileSync(OUT, JSON.stringify({ url: base.href, date: new Date().toISOString(), rows }, null, 2));
const icon = { ok: '✓', fail: '✗', review: '!', 'n/a': '–' };
console.log(`Site: ${base.href}`);
console.log('| section | check | status | detail |');
console.log('|---|---|---|---|');
for (const r of rows) console.log(`| ${r.section} | ${r.check} | ${icon[r.status]} ${r.status} | ${String(r.detail).replace(/\|/g, '\\|')} |`);
console.log(`\n${fails} fail(s) · ${review} to review · ${rows.length} checks.`);
process.exit(fails ? 1 : 0);
