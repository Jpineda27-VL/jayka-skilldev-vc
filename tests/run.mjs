#!/usr/bin/env node
// Deterministic tests of the pack: structure of the skills and behavior of every script.
// They spend no tokens and use no network; fixtures are created in a temporary folder and deleted at the end.
// The browser tests run only if Playwright is installed (capture-live.mjs --check).
// Usage: node tests/run.mjs [--edition claude|codex] [--only <text>] [--keep]
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const editionIndex = process.argv.indexOf('--edition');
const EDITION = editionIndex < 0 ? 'claude' : process.argv[editionIndex + 1];
if (!['claude', 'codex'].includes(EDITION)) throw new Error('--edition must be claude or codex');
const SK = join(ROOT, 'plugins', EDITION === 'codex' ? 'jay-ka-codex' : 'jay-ka', 'skills');
const S = (skill, script) => join(SK, skill, 'scripts', script);
const TMP = mkdtempSync(join(tmpdir(), 'jayka-tests-'));
const argv = process.argv.slice(2);
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
// Fake secrets built at run time, so the repository contains no literal one.
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
const has = (out, s, label = s) => assert(out.includes(s), `missing «${label}» in the output`);
const hasNot = (out, s, label = s) => assert(!out.includes(s), `«${label}» should not appear`);
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
      resp.writeHead(404, { 'content-type': 'text/plain' }); resp.end('not found');
    });
    srv.listen(0, '127.0.0.1', () => res({ url: `http://127.0.0.1:${srv.address().port}`, close: () => srv.close() }));
  });
}

// ───────────────────────── Structure of the skills ─────────────────────────
await test('structure: frontmatter, arguments, closing and references', () => {
  const dirs = readdirSync(SK).filter((d) => existsSync(join(SK, d, 'SKILL.md')));
  assert(dirs.length === 21, `21 skills were expected, there are ${dirs.length}`);
  const automatic = ['jayka-communication', 'jayka-working-rules', 'jayka-git-rules'];
  const problems = [];
  for (const d of dirs) {
    const text = readFileSync(join(SK, d, 'SKILL.md'), 'utf8');
    const fm = text.split(/^---\s*$/m)[1] || '';
    const field = (k) => (fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1];
    if (!d.startsWith('jayka-')) problems.push(`${d}: the folder does not start with jayka-`);
    if (field('name') !== d) problems.push(`${d}: name does not match the folder`);
    if (!/^".*"$/.test(field('description') || '')) problems.push(`${d}: description without quotes`);
    const manual = !automatic.includes(d);
    if (EDITION === 'codex') {
      const policy = readFileSync(join(SK, d, 'agents/openai.yaml'), 'utf8');
      if (!policy.includes(`allow_implicit_invocation: ${!manual}`)) problems.push(`${d}: incorrect invocation policy`);
      if (/disable-model-invocation:|argument-hint:|\$ARGUMENTS/.test(text)) problems.push(`${d}: Claude-only metadata or arguments`);
    }
    if (manual) {
      if (EDITION === 'claude') {
      if (field('disable-model-invocation') !== 'true') problems.push(`${d}: missing disable-model-invocation`);
      if (!field('argument-hint')) problems.push(`${d}: missing argument-hint`);
      if (!text.includes('$ARGUMENTS')) problems.push(`${d}: missing $ARGUMENTS`);
      }
      if (!/## Done when|\| 1 · Static/.test(text)) problems.push(`${d}: missing «Done when»`);
      if (!text.includes('../jayka-working-rules/reference/conventions.md')) problems.push(`${d}: does not point to the conventions`);
      if (!text.includes('Unknown argument')) problems.push(`${d}: missing the unknown-argument answer`);
    }
    if (!text.includes('## My settings')) problems.push(`${d}: missing «My settings»`);
    for (const m of text.matchAll(/`(reference\/[\w.-]+)`/g)) if (!existsSync(join(SK, d, m[1]))) problems.push(`${d}: ${m[1]} does not exist`);
    for (const m of text.matchAll(/\.\.\/(jayka-[\w-]+)\/((?:reference|scripts)\/[\w./-]+?\.(?:md|mjs|js|json))/g)) if (!existsSync(join(SK, m[1], m[2]))) problems.push(`${d}: ../${m[1]}/${m[2]} does not exist`);
    for (const m of text.matchAll(/<SKILL_DIR>\/scripts\/([\w.-]+)/g)) if (!existsSync(join(SK, d, 'scripts', m[1]))) problems.push(`${d}: scripts/${m[1]} does not exist`);
  }
  assert(!problems.length, problems.join('\n   '));
  return `${dirs.length} skills checked`;
});

await test('structure: no old Spanish paths or old names left', () => {
  const bad = [];
  const walk = (p) => { for (const e of readdirSync(p, { withFileTypes: true })) { const f = join(p, e.name); if (e.isDirectory()) { if (e.name !== 'results') walk(f); } else if (/\.(md|mjs|js|json|yaml|sh)$/.test(e.name)) { const t = readFileSync(f, 'utf8'); for (const old of ['docs/proyecto', '.claude/estado', 'CONTINUAR.md', 'jay-k-a-', '.claude/jay-k-a', 'docs/planes']) if (t.includes(old)) bad.push(`${f.replace(ROOT, '')}: «${old}»`); } } };
  walk(join(ROOT, 'plugins')); walk(join(ROOT, 'scripts'));
  assert(!bad.length, bad.join('\n   '));
});

await test('structure: plugin.json and marketplace.json versions are equal', () => {
  const a = JSON.parse(readFileSync(join(ROOT, 'plugins', 'jay-ka', '.claude-plugin', 'plugin.json'), 'utf8')).version;
  const m = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  assert(a === m.metadata.version && a === m.plugins[0].version, `different versions: ${a} / ${m.metadata.version} / ${m.plugins[0].version}`);
  return `v${a}`;
});

await test('structure: the scripts pass node --check', () => {
  const bad = [];
  for (const d of readdirSync(SK)) {
    const walk = (p) => { if (!existsSync(p)) return; for (const e of readdirSync(p, { withFileTypes: true })) { const f = join(p, e.name); if (e.isDirectory()) walk(f); else if (/\.mjs$/.test(e.name) && spawnSync(process.execPath, ['--check', f]).status !== 0) bad.push(f); } };
    walk(join(SK, d, 'scripts'));
  }
  assert(!bad.length, `with syntax errors: ${bad.join(', ')}`);
});

await test('codex: generated package, marketplace and handoff references agree', async () => {
  const { buildCodex, OUTPUT } = await import('../scripts/build-codex.mjs');
  buildCodex({ check: true });
  const marketplace = JSON.parse(readFileSync(join(ROOT, '.agents/plugins/marketplace.json'), 'utf8'));
  const plugin = marketplace.plugins[0];
  assert(resolve(ROOT, plugin.source.path) === OUTPUT, 'marketplace must resolve to the generated plugin');
  const manifest = JSON.parse(readFileSync(join(OUTPUT, '.codex-plugin/plugin.json'), 'utf8'));
  const original = JSON.parse(readFileSync(join(ROOT, 'plugins/jay-ka/.claude-plugin/plugin.json'), 'utf8'));
  assert(manifest.name === plugin.name && manifest.version === original.version, 'plugin identity or version mismatch');
  assert(existsSync(resolve(OUTPUT, manifest.skills, 'jayka-menu/SKILL.md')), 'manifest skills path is invalid');
  const skills = join(OUTPUT, 'skills');
  const menu = readFileSync(join(skills, 'jayka-menu/SKILL.md'), 'utf8');
  for (const name of readdirSync(skills)) {
    assert(new RegExp('^- `' + name + '(?:[ `])', 'm').test(menu), `menu catalog omits ${name}`);
  }
  for (const name of ['jayka-claude-low', 'jayka-claude-high']) {
    const text = readFileSync(join(skills, name, 'SKILL.md'), 'utf8');
    assert(text.includes('docs/claude/tasks/') && text.includes('docs/claude/results/'), `${name}: wrong handoff paths`);
  }
  assert(!existsSync(join(skills, 'jayka-codex-low')), 'old handoff name remains');
  const inspect = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { inspect(path); continue; }
      if (!entry.name.endsWith('.md')) continue;
      const text = readFileSync(path, 'utf8');
      assert(!/\.claude|CLAUDE\.md|\$ARGUMENTS|\/jay-ka:|jayka-codex-(?:low|high)/.test(text), `${path}: obsolete host reference`);
      for (const match of text.matchAll(/`((?:\.\.\/jayka-[\w-]+\/)?reference\/[\w.-]+\.md)`/g)) {
        assert(existsSync(resolve(dirname(path), match[1])), `${path}: missing ${match[1]}`);
      }
    }
  };
  inspect(skills);
  return '21 skills, native invocation policy, Claude handoffs and relative resources';
});

// ───────────────────────── reverse ─────────────────────────
await test('codex: behavior grader requires completed scanner execution', async () => {
  const { scriptWasExecuted } = await import('./codex-cases.mjs');
  const script = 'scan-security.mjs';
  assert(!scriptWasExecuted([{ command: "Get-Content 'scripts/scan-security.mjs'; node --version", exit_code: 0 }], script), 'reading scanner source counted as execution');
  assert(scriptWasExecuted([{ command: "node 'scripts/scan-security.mjs' .; git status", exit_code: 0 }], script), 'completed scanner call not recognized');
  assert(scriptWasExecuted([{ command: 'node scripts/scan-security.mjs .', exit_code: 1 }], script), 'finding exit code not recognized');
  assert(!scriptWasExecuted([{ command: 'node scripts/scan-security.mjs .', exit_code: null }], script), 'unfinished invocation counted as completed');
});

await test('reverse · scan-repo detects the stack and skips secrets', () => {
  const dir = fixture('repo', {
    'package.json': JSON.stringify({ name: 'demo', license: 'MIT', scripts: { postinstall: 'node setup.js' }, dependencies: { gsap: '^3.12.5', lenis: '^1.1.0' } }),
    '.env': `SECRET=${FAKE_STRIPE}\n`,
    'LICENSE': 'MIT License',
    'src/main.ts': "import gsap from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.from('.t', { y: 40, duration: 0.8, ease: 'power3.out', scrollTrigger: { start: 'top 80%', scrub: 1 } });\n",
    'src/style.css': '.b { transition: transform 200ms cubic-bezier(0.4,0,0.2,1); }\n@keyframes fadeUp { from { opacity: 0 } to { opacity: 1 } }\n',
  });
  const r = run(S('jayka-reverse', 'scan-repo.mjs'), [dir, '--out', join(TMP, 'repo.json')]);
  has(r.out, 'GSAP'); has(r.out, 'Lenis'); has(r.out, 'GSAP ScrollTrigger'); has(r.out, 'postinstall');
  has(r.out, 'secrets skipped (not opened): 1');
  hasNot(readFileSync(join(TMP, 'repo.json'), 'utf8'), FAKE_STRIPE, 'the .env secret');
});

await test('reverse · curve fitting recognizes power3.out and linear', async () => {
  const { fitCurve, CANDIDATES } = await import(pathToFileURL(S('jayka-reverse', 'lib/curves.mjs')).href);
  const f = CANDIDATES.find((c) => c.name.startsWith('power3.out')).f;
  const curve = Array.from({ length: 50 }, (_, i) => f(i / 49));
  assert(fitCurve(curve)[0].name.startsWith('power3.out'), `it fitted ${fitCurve(curve)[0].name}`);
  assert(fitCurve(Array.from({ length: 50 }, (_, i) => i / 49))[0].name === 'linear', 'linear was not recognized');
});

await test('reverse · compare-motion accepts the same and rejects the different', () => {
  const curve = (f) => Array.from({ length: 50 }, (_, i) => +f(i / 49).toFixed(4));
  const track = (dur, f) => ({ segments: [{ target: '#a', channel: 'opacity', durationMs: dur, from: 0, to: 1, scrollLinked: false, curve: curve(f) }] });
  const q = (t) => 1 - (1 - t) ** 4;
  writeFileSync(join(TMP, 'p-a.json'), JSON.stringify(track(800, q)));
  writeFileSync(join(TMP, 'p-b.json'), JSON.stringify(track(790, q)));
  writeFileSync(join(TMP, 'p-c.json'), JSON.stringify(track(500, (t) => t)));
  const ok = run(S('jayka-reverse', 'compare-motion.mjs'), [join(TMP, 'p-a.json'), join(TMP, 'p-b.json')]);
  const bad = run(S('jayka-reverse', 'compare-motion.mjs'), [join(TMP, 'p-a.json'), join(TMP, 'p-c.json')]);
  assert(ok.code === 0, `same exited with ${ok.code}`); assert(bad.code === 1, `different exited with ${bad.code}`);
  has(bad.out, 'duration'); has(bad.out, 'curve');
});

// ───────────────────────── security ─────────────────────────
await test('security-web · scan-security finds risks and not the safe query', () => {
  const dir = fixture('risks', {
    'app/Http/Controllers/OrderController.php': "<?php\nclass P {\n  function a($request) { return Order::create($request->all()); }\n  function b($q) { return DB::select(\"SELECT * FROM p WHERE n = '$q'\"); }\n  function c($q) { return DB::select('SELECT * FROM p WHERE id = ?', [$q]); }\n}\n",
    'src/app.js': `el.innerHTML = data.name;\ndb.query(\`SELECT * FROM u WHERE id = \${id}\`);\nconst cfg = { origin: '*', credentials: true };\nconst k = "${FAKE_AWS}";\n`,
    'tests/app.test.js': 'el.innerHTML = x;\n',
  });
  const r = run(S('jayka-security-web', 'scan-security.mjs'), [dir]);
  assert(r.code === 1, `code ${r.code}`);
  for (const id of ['mass-assignment', 'raw-sql-php', 'sql-concat-js', 'cors-wildcard-credentials', 'innerhtml', 'secret:aws-access-key']) has(r.out, id);
  hasNot(r.out, 'OrderController.php:5', 'the query with parameters');
  hasNot(r.out, 'tests/app.test.js', 'the test files');
  hasNot(r.out, FAKE_AWS, 'the full key');
});

await test('security-deploy · scan-git-secrets finds deleted secrets and masks them', () => {
  if (spawnSync('git', ['--version']).status !== 0) throw skip('git is not installed');
  const dir = fixture('git-secrets', { 'config.js': `const stripe = "${FAKE_STRIPE}";\nconst k = "your-api-key-here";\n`, '.env': 'DB_PASSWORD=x\n' });
  const g = (...a) => spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  g('init', '-q'); g('config', 'user.email', 't@t'); g('config', 'user.name', 't'); g('add', '-A'); g('commit', '-qm', 'one');
  writeFileSync(join(dir, 'config.js'), 'const stripe = process.env.STRIPE;\n'); writeFileSync(join(dir, '.gitignore'), '.env\n');
  g('rm', '-q', '--cached', '.env'); g('add', '-A'); g('commit', '-qm', 'two');
  const r = run(S('jayka-security-deploy', 'scan-git-secrets.mjs'), [dir]);
  assert(r.code === 1, `code ${r.code}: ${r.out}`);
  has(r.out, 'stripe-live'); has(r.out, 'tracked-env-file');
  hasNot(r.out, FAKE_STRIPE, 'the full key'); hasNot(r.out, 'your-api-key-here');
});

await test('security-deploy · check-deploy flags an exposed .env and respects 404', async () => {
  const srv = await serve(null, { '/': [200, 'text/html', '<html>Home</html>'], '/.env': [200, 'text/plain', 'APP_KEY=base64:x\nDB_PASSWORD=y\n'] });
  try {
    const r = await runAsync(S('jayka-security-deploy', 'check-deploy.mjs'), [srv.url]);
    assert(r.code === 1, `code ${r.code}: ${r.out}`);
    assert(/\/\.env \| ✗ fail/.test(r.out), '/.env did not come out as a failure');
    assert(/\/\.git\/config \| ✓ ok/.test(r.out), '/.git/config did not come out as ok');
    assert(/Nonexistent path \| ✓ ok/.test(r.out), 'the error page did not come out ok');
  } finally { srv.close(); }
});

// ───────────────────────── style ─────────────────────────
await test('style · contrast.mjs calculates WCAG', () => {
  const ok = run(S('jayka-style-self-learning', 'contrast.mjs'), ['#26264F', '#FFF8EF']);
  const bad = run(S('jayka-style-self-learning', 'contrast.mjs'), ['#999', 'white']);
  has(ok.out, '13.53:1'); has(ok.out, 'AAA'); assert(ok.code === 0, 'the good pair failed');
  has(bad.out, 'fail'); assert(bad.code === 1, 'the bad pair passed');
});

await test('style · check-tokens validates the example and rejects false contrasts', () => {
  const ref = join(SK, 'jayka-style-self-learning', 'reference', 'tokens.schema.json');
  assert(run(S('jayka-style-self-learning', 'check-tokens.mjs'), [ref]).code === 0, 'the reference example does not validate');
  writeFileSync(join(TMP, 'tokens-bad.json'), JSON.stringify({ project: 'My Project', date: '26/10/2026', color: { roles: { text: '#26264F', background: '#FFF8EF', accent: 'bluish' }, contrast: [{ pair: 'text/background', ratio: 9, passes: 'AAA' }] } }));
  const r = run(S('jayka-style-self-learning', 'check-tokens.mjs'), [join(TMP, 'tokens-bad.json')]);
  assert(r.code === 1, 'bad tokens passed'); has(r.out, 'declares 9'); has(r.out, 'bluish'); has(r.out, 'is not a slug');
});

// ───────────────────────── real-data ─────────────────────────
await test('real-data · find-demo-data finds demos and respects seeders', () => {
  const dir = fixture('demo', {
    'src/pages/Orders.jsx': "const orders = [\n  { id: 1, name: 'A', price: 1 },\n  { id: 2, name: 'B' },\n  { id: 3, name: 'C' },\n];\n// TODO: connect to the API\nexport default () => <img src=\"https://picsum.photos/200\" />;\n",
    'src/pages/Profile.vue': '<template><p>Lorem ipsum dolor sit amet</p><p>john@example.com</p></template>\n',
    'src/pages/Real.jsx': 'export const Real = () => fetch("/api/orders");\n',
    'database/seeders/DemoSeeder.php': '<?php $this->faker->name(); // John Doe\n',
  });
  const r = run(S('jayka-real-data', 'find-demo-data.mjs'), [dir]);
  assert(r.code === 1, `code ${r.code}`);
  has(r.out, 'Orders.jsx'); has(r.out, 'handwritten-data-array'); has(r.out, 'Profile.vue');
  hasNot(r.out, 'DemoSeeder'); hasNot(r.out, 'Real.jsx');
});

// ───────────────────────── With a browser (optional) ─────────────────────────
const pwReady = run(S('jayka-reverse', 'capture-live.mjs'), ['--check']).code === 0;
const page = (ease, dur) => `<!doctype html><title>t</title><style>.card{animation:fade 600ms ease-out both}@keyframes fade{from{opacity:0}to{opacity:1}}#box{width:80px;height:80px;background:red}</style>
<div class="card">Card</div><div id="box"></div><script>const e=${ease};const b=document.getElementById('box');setTimeout(()=>{const t0=performance.now();b.style.opacity='0';
function f(n){const p=Math.min(1,(n-t0)/${dur});b.style.opacity=String(e(p));if(p<1)requestAnimationFrame(f)}requestAnimationFrame(f)},300)</script>`;

await test('browser · capture-live measures easing and compares a reproduction', async () => {
  if (!pwReady) throw skip('Playwright is not installed (capture-live.mjs --check)');
  const dir = fixture('site', { 'index.html': page('(t)=>1-Math.pow(1-t,4)', 800), 'bad.html': page('(t)=>t', 500) });
  const srv = await serve(dir);
  try {
    const common = ['--viewports', '1280x800', '--steps', '0', '--hover', '0', '--no-reduced', '--no-screenshots', '--track', '#box'];
    const a = await runAsync(S('jayka-reverse', 'capture-live.mjs'), [`${srv.url}/index.html`, '--out', join(TMP, 'cap-a'), ...common]);
    has(a.out, 'power3.out', 'measured curve power3.out'); has(a.out, 'ease-out', 'curve of the @keyframes');
    const b = await runAsync(S('jayka-reverse', 'capture-live.mjs'), [`${srv.url}/bad.html`, '--out', join(TMP, 'cap-b'), ...common]);
    const cmp = run(S('jayka-reverse', 'compare-motion.mjs'), [join(TMP, 'cap-a', 'live-1280x800', 'tracks.json'), join(TMP, 'cap-b', 'live-1280x800', 'tracks.json'), '--channel', 'opacity']);
    assert(cmp.code === 1, 'the wrong reproduction passed the comparison');
    return b.code === 0 ? '' : 'warning: the second capture exited with a non-zero code';
  } finally { srv.close(); }
});

await test('browser · style-probe measures real contrast', async () => {
  if (!pwReady) throw skip('Playwright is not installed');
  const dir = fixture('style', { 'index.html': '<!doctype html><style>body{background:#FFF8EF;color:#26264F}.s{color:#AAAAAA;background:#fff}</style><p>Text</p><p class="s">Soft</p>' });
  const srv = await serve(dir);
  try {
    await runAsync(S('jayka-reverse', 'capture-live.mjs'), [srv.url, '--out', join(TMP, 'cap-e'), '--viewports', '1280x800', '--steps', '0', '--hover', '0', '--no-reduced', '--no-screenshots', '--eval', S('jayka-style-self-learning', 'style-probe.js')]);
    const j = JSON.parse(readFileSync(join(TMP, 'cap-e', 'live-1280x800', 'eval-style-probe.json'), 'utf8'));
    assert(j.contrast.failing.some((p) => p.pair.startsWith('#AAAAAA')), 'it did not detect the failing pair');
  } finally { srv.close(); }
});

await test('browser · capture-pair tells same from different', async () => {
  if (!pwReady) throw skip('Playwright is not installed');
  const web = '<!doctype html><main><h1>Orders</h1><h2>Pending</h2><p>Your orders in progress and their current status.</p><button>Filter</button><a href="/n">New</a></main>';
  const app = '<!doctype html><main><h1>Orders</h1><p>Your orders in progress and their current status.</p><button>Filter</button></main>';
  const dir = fixture('parity', { 'web.html': web, 'app.html': app, 'same.html': web });
  const srv = await serve(dir);
  try {
    writeFileSync(join(TMP, 'routes.txt'), `different | ${srv.url}/web.html | ${srv.url}/app.html\nsame | ${srv.url}/web.html | ${srv.url}/same.html\n`);
    const r = await runAsync(S('jayka-views-parity', 'capture-pair.mjs'), ['--routes', join(TMP, 'routes.txt'), '--out', join(TMP, 'par'), '--viewports', '1280x800']);
    assert(/\| different \| 1280x800 \| differs/.test(r.out), 'the different screen did not come out as differs');
    assert(/\| same \| 1280x800 \| same/.test(r.out), 'the same screen did not come out as same');
    has(r.out, 'Pending');
  } finally { srv.close(); }
});

// ───────────────────────── Summary ─────────────────────────
if (!argv.includes('--keep')) rmSync(TMP, { recursive: true, force: true });
else console.log(`Fixtures kept at ${TMP}`);
let fail = 0;
for (const r of results) {
  const icon = r.ok === true ? '✓' : r.ok === null ? '–' : '✗';
  if (r.ok === false) fail++;
  console.log(`${icon} ${r.name}${r.note ? ` — ${r.note.replace(/\n/g, '\n   ')}` : ''}`);
}
const skipped = results.filter((r) => r.ok === null).length;
console.log(`\n${results.length - fail - skipped} passed · ${fail} failed · ${skipped} skipped`);
process.exit(fail ? 1 : 0);
