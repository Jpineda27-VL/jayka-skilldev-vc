#!/usr/bin/env node
// Real account-backed Codex behavior tests. No third-party dependencies.
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, delimiter, join, resolve } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { buildCodex, ROOT, OUTPUT } from '../scripts/build-codex.mjs';
import { cases } from './codex-cases.mjs';

const argv = process.argv.slice(2);
const flags = new Set(['--only', '--runs', '--timeout', '--cli', '--out', '--model']);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--list') continue;
  if (!flags.has(argv[i])) throw new Error(`Unknown option: ${argv[i]}`);
  if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Missing value for ${argv[i]}`);
  i++;
}
const option = (name, fallback) => { const i = argv.indexOf(name); if (i < 0) return fallback; if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Missing value for ${name}`); return argv[i + 1]; };
const only = option('--only', '');
const runs = Number(option('--runs', '1'));
const timeout = Number(option('--timeout', '600')) * 1000;
if (!Number.isInteger(runs) || runs < 1 || !Number.isFinite(timeout) || timeout <= 0) throw new Error('Invalid --runs or --timeout');
if (argv.includes('--list')) { cases.forEach(test => console.log(`${test.name}: ${test.criteria}`)); process.exit(0); }
const selection = cases.filter(test => test.name.includes(only));
if (!selection.length) throw new Error(`No cases match ${only}`);
buildCodex({ check: true });

function cliCommand() {
  const explicit = option('--cli', process.env.JAYKA_CODEX_CLI);
  if (explicit) return explicit.endsWith('.js') ? [process.execPath, resolve(explicit)] : [resolve(explicit)];
  for (const directory of (process.env.PATH || '').split(delimiter)) {
    const npmEntry = join(directory, 'node_modules/@openai/codex/bin/codex.js');
    if (process.platform === 'win32' && existsSync(npmEntry)) return [process.execPath, npmEntry];
    const executable = join(directory, process.platform === 'win32' ? 'codex.exe' : 'codex');
    if (existsSync(executable)) return [executable];
  }
  throw new Error('Codex CLI not found. Use --cli <executable-or-codex.js>.');
}
const cli = cliCommand();
const authHome = resolve(process.env.CODEX_HOME || join(homedir(), '.codex'));
const authFile = join(authHome, 'auth.json');
if (!existsSync(authFile)) throw new Error('This runner needs an existing file-backed Codex login. Run codex login; no credentials are printed or copied.');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(option('--out', join(ROOT, 'tests/results/codex', stamp)));
if (existsSync(output) && readdirSync(output).length) throw new Error('Result directory is not empty; choose a new --out directory to preserve earlier evidence.');
const temporary = mkdtempSync(join(tmpdir(), 'jayka-codex-evals-'));
mkdirSync(output, { recursive: true });
const skillNames = readdirSync(join(OUTPUT, 'skills')).filter(name => existsSync(join(OUTPUT, 'skills', name, 'SKILL.md')));

function snapshot(base, prefix = '', result = new Map()) {
  for (const item of readdirSync(join(base, prefix), { withFileTypes: true })) {
    if (item.name === '.git' || item.name === 'node_modules') continue;
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) snapshot(base, path, result);
    else if (item.isFile()) result.set(path, readFileSync(join(base, path), 'utf8'));
  }
  return result;
}
function file(base, path, text) { mkdirSync(dirname(join(base, path)), { recursive: true }); writeFileSync(join(base, path), text); }
function git(base, ...args) {
  if (args[0] !== 'init') spawnSync('git', ['-C', base, 'remote', '-v'], { encoding: 'utf8' });
  const result = spawnSync('git', ['-C', base, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Fixture git ${args[0]} failed: ${result.stderr}`);
  return result.stdout.trim();
}
function invoke(args, { env, cwd, input, limit = timeout, traceDirectory } = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(cli[0], [...cli.slice(1), ...args], { cwd, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', timedOut = false;
    child.stdout.on('data', value => { stdout += value; if (traceDirectory) appendFileSync(join(traceDirectory, 'events.jsonl'), value); });
    child.stderr.on('data', value => { stderr += value; if (traceDirectory) appendFileSync(join(traceDirectory, 'stderr.log'), value); });
    child.on('error', reject);
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
      else child.kill('SIGTERM');
    }, limit);
    child.on('close', code => { clearTimeout(timer); resolveRun({ code, stdout, stderr, timedOut }); });
    child.stdin.end(input || '');
  });
}
function userSkillPaths() {
  const paths = [];
  for (const root of [join(homedir(), '.agents/skills'), join(authHome, 'skills')]) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (existsSync(join(root, entry.name, 'SKILL.md'))) paths.push(join(root, entry.name, 'SKILL.md'));
    }
  }
  return [...new Set(paths)];
}
const disabledPaths = userSkillPaths();
const disabledUserSkills = () => disabledPaths.map(path => `[[skills.config]]\npath = ${JSON.stringify(path.replaceAll('\\', '/'))}\nenabled = false\n`).join('\n');

const results = [];
function saveSummary() {
  const passed = results.filter(result => result.passed).length;
  const usage = results.reduce((total, result) => {
    for (const [key, value] of Object.entries(result.usage || {})) total[key] = (total[key] || 0) + value;
    return total;
  }, {});
  file(output, 'summary.json', JSON.stringify({ passed, failed: results.length - passed, usage, results }, null, 2));
  const rows = results.map(result => {
    const failures = result.infrastructureError || Object.entries(result.checks || {}).filter(([, ok]) => !ok).map(([name]) => name).join(', ');
    return `| ${result.case} | ${result.run} | ${result.passed ? 'PASS' : result.infrastructureError ? 'ERROR' : 'FAIL'} | ${result.seconds.toFixed(1)} | ${failures.replaceAll('|', '/').replaceAll('\n', ' ')} |`;
  });
  file(output, 'report.md', `# Codex behavior test results\n\n${passed} passed; ${results.length - passed} failed. Each case uses a new installed plugin and temporary project/profile.\n\n| Case | Run | Result | Seconds | Failed checks |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\nReported token usage (input includes cached input):\n\n\`\`\`json\n${JSON.stringify(usage, null, 2)}\n\`\`\`\n\nThis report covers deterministic behavioral checks. Review each case's answer.md, files/, events.jsonl and result.json for the underlying evidence.\n`);
}
console.log(`Results: ${output}\nTemporary workspaces: ${temporary}`);
for (let run = 1; run <= runs; run++) for (const test of selection) {
  const id = `${test.name}-${run}`;
  const base = join(temporary, id);
  const workspace = join(base, 'project');
  const profile = join(base, 'profile');
  const artifacts = join(output, id);
  mkdirSync(workspace, { recursive: true }); mkdirSync(profile, { recursive: true }); mkdirSync(artifacts, { recursive: true });
  const authLink = join(profile, 'auth.json');
  const start = Date.now();
  console.log(`RUN ${id}`);
  try {
    // A temporary hard link lets the native CLI use the existing login without reading,
    // printing or copying credential contents into results. Removed in finally.
    linkSync(authFile, authLink);
    const env = { ...process.env, CODEX_HOME: profile };
    const config = 'approval_policy = "never"\nsandbox_mode = "workspace-write"\ncheck_for_update_on_startup = false\nweb_search = "disabled"\n\n' + disabledUserSkills();
    file(profile, 'config.toml', config);
    for (const directory of test.directories || []) mkdirSync(join(workspace, directory), { recursive: true });
    for (const [path, text] of Object.entries(test.files || {})) file(workspace, path, text);
    git(workspace, 'init', '-q', '-b', test.remote ? 'main' : 'eval');
    git(workspace, 'config', 'user.email', 'eval@example.invalid'); git(workspace, 'config', 'user.name', 'JayKA eval');
    git(workspace, 'add', '-A'); git(workspace, 'commit', '--allow-empty', '-qm', test.commit || 'Initial fixture');
    const fakeSecret = ['sk', 'live', '51HxABCDEFGHIJKLMNOPQRSTUV'].join('_');
    if (test.secretHistory) {
      file(workspace, 'config.js', `const stripe = '${fakeSecret}';\n`);
      git(workspace, 'add', 'config.js'); git(workspace, 'commit', '-qm', 'Initial configuration');
      file(workspace, 'config.js', 'const stripe = process.env.STRIPE_KEY;\n'); file(workspace, '.gitignore', '.env\n');
      git(workspace, 'add', '-A'); git(workspace, 'commit', '-qm', 'Move the key to an environment variable');
    }
    if (test.remote) {
      const remote = join(base, 'remote.git'); mkdirSync(remote);
      git(remote, 'init', '--bare', '-q'); git(workspace, 'remote', 'add', 'origin', remote);
    }
    const initialHead = git(workspace, 'rev-parse', 'HEAD');
    for (const args of [['plugin', 'marketplace', 'add', ROOT, '--json'], ['plugin', 'add', 'jay-ka-codex@jayka-skilldev-codex', '--json']]) {
      const setup = await invoke(args, { env, cwd: workspace, limit: 60000 });
      if (setup.code !== 0) throw new Error(`Plugin installation failed: ${setup.stderr}`);
      file(artifacts, args[1] === 'marketplace' ? 'marketplace.json' : 'installation.json', setup.stdout);
    }
    const inspection = await invoke(['debug', 'prompt-input', test.prompt], { env, cwd: workspace, limit: 60000 });
    if (inspection.code !== 0) throw new Error(`Cannot verify context isolation: ${inspection.stderr}`);
    const normalize = value => value.replaceAll('\\', '/').replace(/\/+/g, '/').toLowerCase();
    const visibleContext = normalize(inspection.stdout);
    const leaked = disabledPaths.filter(path => visibleContext.includes(normalize(path)));
    if (leaked.length) throw new Error(`User skills remain visible in model context: ${leaked.join(', ')}`);
    if (!inspection.stdout.includes('jayka-communication')) throw new Error('Installed plugin automatic skills are absent from model context');
    file(artifacts, 'isolation.json', JSON.stringify({ verified: true, disabledUserSkills: disabledPaths.length, pluginAutomaticSkillsVisible: true }, null, 2));
    const before = snapshot(workspace);
    const args = ['exec', '--ephemeral', '--json', '--skip-git-repo-check', '--approve-for-me', '--ignore-rules', '-C', workspace, '-o', join(artifacts, 'answer.md')];
    const model = option('--model', null); if (model) args.push('--model', model);
    args.push('-');
    const execution = await invoke(args, { env, cwd: workspace, input: test.prompt, traceDirectory: artifacts });
    file(artifacts, 'events.jsonl', execution.stdout); file(artifacts, 'stderr.log', execution.stderr); file(artifacts, 'prompt.txt', test.prompt);
    const events = execution.stdout.split(/\r?\n/).filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return { type: 'unparsed', line }; } });
    const answerPath = join(artifacts, 'answer.md');
    const answer = existsSync(answerPath) ? readFileSync(answerPath, 'utf8') : '';
    const after = snapshot(workspace);
    const changes = [...new Set([...before.keys(), ...after.keys()])].filter(path => before.get(path) !== after.get(path));
    const commands = events.filter(event => event.item?.type === 'command_execution').map(event => event.item.command || '');
    const commandResults = events.filter(event => event.type === 'item.completed' && event.item?.type === 'command_execution').map(event => event.item);
    const requestedSkill = test.prompt.match(/\$(jayka-[a-z-]+)/)?.[1] ?? (test.name === 'git-no-push' ? 'jayka-git-rules' : 'jayka-communication');
    const usage = events.filter(event => event.type === 'turn.completed').map(event => event.usage || {}).reduce((total, next) => { for (const [key, value] of Object.entries(next)) if (typeof value === 'number') total[key] = (total[key] || 0) + value; return total; }, {});
    const context = { answer, before, after, changes, commands, commandResults, skillNames, fakeSecret, initialHead, head: git(workspace, 'rev-parse', 'HEAD'), branch: git(workspace, 'branch', '--show-current'), reports: [...after].filter(([path]) => path.startsWith('docs/')).map(([, text]) => text).join('\n') };
    const checks = { 'exec completed': execution.code === 0 && !execution.timedOut && events.some(event => event.type === 'turn.completed'), 'answer captured': answer.length > 0, 'skill instructions accessed': commands.some(command => command.includes(requestedSkill) && command.includes('SKILL.md')) };
    for (const [name, check] of Object.entries(test.checks)) { try { checks[name] = Boolean(check(context)); } catch { checks[name] = false; } }
    // Keep the created documents and actual filesystem delta, not only the agent's report.
    for (const path of changes) if (after.has(path)) file(join(artifacts, 'files'), path, after.get(path));
    file(artifacts, 'changes.json', JSON.stringify(changes, null, 2));
    const result = { case: test.name, run, passed: Object.values(checks).every(Boolean), checks, usage, seconds: (Date.now() - start) / 1000, workspace, criteria: test.criteria, answerHash: createHash('sha256').update(answer).digest('hex') };
    results.push(result); file(artifacts, 'result.json', JSON.stringify(result, null, 2));
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${id} (${result.seconds.toFixed(1)}s) ${Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name).join(', ')}`);
  } catch (error) {
    const result = { case: test.name, run, passed: false, infrastructureError: error.message, seconds: (Date.now() - start) / 1000 };
    results.push(result); file(artifacts, 'result.json', JSON.stringify(result, null, 2)); console.log(`ERROR ${id}: ${error.message}`);
  } finally { if (existsSync(authLink)) unlinkSync(authLink); }
  saveSummary();
}
const passed = results.filter(result => result.passed).length;
console.log(`${passed} passed, ${results.length - passed} failed. Results: ${output}`);
process.exitCode = passed === results.length ? 0 : 1;
