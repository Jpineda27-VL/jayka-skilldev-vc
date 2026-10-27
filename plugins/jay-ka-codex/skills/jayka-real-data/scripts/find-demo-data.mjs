#!/usr/bin/env node
// Finds hand-written demo data in screen code: lorem ipsum, sample names and emails, placeholder images,
// demo/mock constants, faker outside seeders and arrays of literal objects.
// Read-only. It ignores seeders, factories, tests, fixtures and stories (that is where sample data DOES belong).
// Usage: node find-demo-data.mjs [<folder>] [--out inventory.json]
// Exits 1 if it found candidates, 0 if not.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, extname, resolve } from 'node:path';

const argv = process.argv.slice(2);
const ROOT = resolve(argv.find((a) => !a.startsWith('--')) || '.');
const outIdx = argv.indexOf('--out');
const OUT = outIdx >= 0 ? argv[outIdx + 1] : null;

const EXT = new Set(['.js', '.mjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro', '.html', '.htm', '.php', '.twig', '.dart', '.kt', '.swift', '.py', '.erb', '.hbs', '.json']);
const IGNORED = new Set(['node_modules', 'vendor', '.git', 'dist', 'build', '.next', '.nuxt', 'out', 'coverage', 'storage', 'tests', 'test', '__tests__', 'spec', 'seeders', 'seeds', 'factories', 'fixtures', '__fixtures__', 'mocks', '__mocks__', 'stories', '.storybook', 'docs', 'migrations', 'lang', 'locales', 'i18n']);
const SKIP_FILE = /\.(test|spec|stories|min)\.[a-z]+$|^(package(-lock)?|composer|tsconfig|jsconfig)\.json$|Seeder\.php$|Factory\.php$/i;

// The patterns cover English and Spanish demo wording, since either may show up in a project.
const RULES = [
  { id: 'lorem-ipsum', re: /lorem ipsum|dolor sit amet/i },
  { id: 'sample-name', re: /\b(John|Jane) Doe\b|\bJuan P[eé]rez\b|\bFulan[oa]\b|\bMengan[oa]\b|\bAcme (Inc|Corp)\b/ },
  { id: 'sample-email', re: /[\w.+-]+@(example|ejemplo|test|demo|correo)\.(com|org|net)\b/i },
  { id: 'fake-phone', re: /\b555[-\s]?\d{4}\b|\b123[-\s]?456[-\s]?789\d?\b|\b(000|111)[-\s]?\d{3}[-\s]?\d{4}\b/ },
  { id: 'placeholder-image', re: /placehold\.(co|it)|via\.placeholder\.com|picsum\.photos|placekitten|dummyimage\.com|source\.unsplash\.com|loremflickr|placeimg/i },
  { id: 'demo-constant', re: /\b(const|let|var|export\s+const|public|private|protected|static)\s+\$?\w*(demo|mock|fake|dummy|sample|ejemplo|prueba)\w*\s*[:=]/i },
  { id: 'demo-constant', re: /\bDEMO_[A-Z_]+\b|\b(datos|data)(De)?(Demo|Mock|Prueba|Ejemplo|Fake)\b/ },
  { id: 'faker-in-screen', re: /@faker-js|\bfaker\.(person|name|internet|commerce|lorem|location|phone)|\$this->faker|Faker\\Factory/ },
  { id: 'pending-to-connect', re: /(TODO|FIXME|PENDIENTE|HACK)\b[^\n]{0,60}(connect|conectar|api\b|backend|datos reales|real data|hardcod|a mano|quemad)/i },
  { id: 'demo-label', re: /["'>]\s*(Demo|Demostración|Datos de ejemplo|Sample data)\s*["'<]/i, note: 'already labeled: confirm it is still demo' },
];
// Literal array with 3 or more data objects (id, name, price…): typical of screens with hand-written data
const ARRAY_JS = /(?:const|let|var|export\s+const)\s+(\w+)\s*(?::[^=\n]+)?=\s*\[\s*\{[^\]]{0,1500}?\b(id|name|nombre|title|titulo|price|precio|email|status|estado)\s*:[^\]]{0,1500}?\}\s*,\s*\{[^\]]{0,1500}?\}\s*,\s*\{/g;
const ARRAY_PHP = /\$(\w+)\s*=\s*\[\s*\[\s*['"](id|name|nombre|title|titulo|price|precio|email|status|estado)['"]\s*=>[^;]{0,1500}?\]\s*,\s*\[[^;]{0,1500}?\]\s*,\s*\[/g;

const files = [];
const walk = (d) => {
  let es; try { es = readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of es) {
    const f = join(d, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) { if (!IGNORED.has(e.name.toLowerCase())) walk(f); }
    else if (e.isFile() && EXT.has(extname(e.name).toLowerCase()) && !SKIP_FILE.test(e.name) && !/^\.env/.test(e.name)) files.push(f);
  }
};
walk(ROOT);

const lineAt = (t, i) => t.slice(0, i).split('\n').length;
const report = [];
for (const f of files) {
  try { if (statSync(f).size > 800_000) continue; } catch { continue; }
  const text = readFileSync(f, 'utf8');
  const hits = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const r of RULES) if (r.re.test(line)) hits.push({ type: r.id, line: i + 1, snippet: line.trim().slice(0, 90), note: r.note });
  });
  for (const re of [ARRAY_JS, ARRAY_PHP]) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) hits.push({ type: 'handwritten-data-array', line: lineAt(text, m.index), snippet: `${m[1]} = [ {…}, {…}, {…} … ]` });
  }
  if (hits.length) report.push({ file: relative(ROOT, f).replace(/\\/g, '/'), total: hits.length, types: [...new Set(hits.map((h) => h.type))], findings: hits.slice(0, 20) });
}
report.sort((a, b) => b.total - a.total);
if (OUT) writeFileSync(OUT, JSON.stringify({ root: ROOT, filesChecked: files.length, files: report }, null, 2));

console.log(`Folder: ${ROOT} · files checked: ${files.length} · with candidates: ${report.length}`);
if (!report.length) { console.log('✓ No hand-written demo data found.'); process.exit(0); }
console.log('| file | candidates | types | first example |');
console.log('|---|---|---|---|');
for (const r of report) {
  const h = r.findings[0];
  console.log(`| ${r.file} | ${r.total} | ${r.types.join(', ')} | :${h.line} ${h.snippet.replace(/\|/g, '\\|')} |`);
}
console.log('\nThese are candidates: confirm each file before moving it to the Step 1 inventory.');
process.exit(1);
