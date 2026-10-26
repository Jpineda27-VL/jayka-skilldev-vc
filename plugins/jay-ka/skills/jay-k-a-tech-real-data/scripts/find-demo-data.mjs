#!/usr/bin/env node
// Encuentra datos de demostración escritos a mano en el código de las pantallas: lorem ipsum, nombres y correos
// de ejemplo, imágenes de relleno, constantes demo/mock, faker fuera de seeders y arreglos de objetos literales.
// Solo lectura. Ignora seeders, factories, pruebas, fixtures y stories (ahí los datos de ejemplo SÍ van).
// Uso: node find-demo-data.mjs [<carpeta>] [--out inventario.json]
// Sale con 1 si encontró candidatos, 0 si no.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, extname, basename, resolve } from 'node:path';

const argv = process.argv.slice(2);
const ROOT = resolve(argv.find((a) => !a.startsWith('--')) || '.');
const outIdx = argv.indexOf('--out');
const OUT = outIdx >= 0 ? argv[outIdx + 1] : null;

const EXT = new Set(['.js', '.mjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro', '.html', '.htm', '.php', '.twig', '.dart', '.kt', '.swift', '.py', '.erb', '.hbs', '.json']);
const IGNORED = new Set(['node_modules', 'vendor', '.git', 'dist', 'build', '.next', '.nuxt', 'out', 'coverage', 'storage', 'tests', 'test', '__tests__', 'spec', 'seeders', 'seeds', 'factories', 'fixtures', '__fixtures__', 'mocks', '__mocks__', 'stories', '.storybook', 'docs', 'migrations', 'lang', 'locales', 'i18n']);
const SKIP_FILE = /\.(test|spec|stories|min)\.[a-z]+$|^(package(-lock)?|composer|tsconfig|jsconfig)\.json$|Seeder\.php$|Factory\.php$/i;

const RULES = [
  { id: 'lorem-ipsum', re: /lorem ipsum|dolor sit amet/i },
  { id: 'nombre-de-ejemplo', re: /\b(John|Jane) Doe\b|\bJuan P[eé]rez\b|\bFulan[oa]\b|\bMengan[oa]\b|\bAcme (Inc|Corp)\b/ },
  { id: 'correo-de-ejemplo', re: /[\w.+-]+@(example|ejemplo|test|demo|correo)\.(com|org|net)\b/i },
  { id: 'telefono-ficticio', re: /\b555[-\s]?\d{4}\b|\b123[-\s]?456[-\s]?789\d?\b|\b(000|111)[-\s]?\d{3}[-\s]?\d{4}\b/ },
  { id: 'imagen-de-relleno', re: /placehold\.(co|it)|via\.placeholder\.com|picsum\.photos|placekitten|dummyimage\.com|source\.unsplash\.com|loremflickr|placeimg/i },
  { id: 'constante-demo', re: /\b(const|let|var|export\s+const|public|private|protected|static)\s+\$?\w*(demo|mock|fake|dummy|sample|ejemplo|prueba)\w*\s*[:=]/i },
  { id: 'constante-demo', re: /\bDEMO_[A-Z_]+\b|\b(datos|data)(De)?(Demo|Mock|Prueba|Ejemplo|Fake)\b/ },
  { id: 'faker-en-pantalla', re: /@faker-js|\bfaker\.(person|name|internet|commerce|lorem|location|phone)|\$this->faker|Faker\\Factory/ },
  { id: 'pendiente-de-conectar', re: /(TODO|FIXME|PENDIENTE|HACK)\b[^\n]{0,60}(conectar|api\b|backend|datos reales|real data|hardcod|a mano|quemad)/i },
  { id: 'rotulo-demostracion', re: /["'>]\s*(Demo|Demostración|Datos de ejemplo|Sample data)\s*["'<]/i, nota: 'ya está rotulado: confirma que siga siendo demostración' },
];
// Arreglo literal con 3 o más objetos de datos (id, nombre, precio…): típico de pantallas con datos a mano
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
    for (const r of RULES) if (r.re.test(line)) hits.push({ tipo: r.id, linea: i + 1, fragmento: line.trim().slice(0, 90), nota: r.nota });
  });
  for (const re of [ARRAY_JS, ARRAY_PHP]) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) hits.push({ tipo: 'arreglo-de-datos-a-mano', linea: lineAt(text, m.index), fragmento: `${m[1]} = [ {…}, {…}, {…} … ]` });
  }
  if (hits.length) report.push({ archivo: relative(ROOT, f).replace(/\\/g, '/'), total: hits.length, tipos: [...new Set(hits.map((h) => h.tipo))], hallazgos: hits.slice(0, 20) });
}
report.sort((a, b) => b.total - a.total);
if (OUT) writeFileSync(OUT, JSON.stringify({ raiz: ROOT, archivosRevisados: files.length, archivos: report }, null, 2));

console.log(`Carpeta: ${ROOT} · archivos revisados: ${files.length} · con candidatos: ${report.length}`);
if (!report.length) { console.log('✓ No se encontraron datos de demostración escritos a mano.'); process.exit(0); }
console.log('| archivo | candidatos | tipos | primer ejemplo |');
console.log('|---|---|---|---|');
for (const r of report) {
  const h = r.hallazgos[0];
  console.log(`| ${r.archivo} | ${r.total} | ${r.tipos.join(', ')} | :${h.linea} ${h.fragmento.replace(/\|/g, '\\|')} |`);
}
console.log('\nSon candidatos: confirma cada archivo antes de pasarlo al inventario del Paso 1.');
process.exit(1);
