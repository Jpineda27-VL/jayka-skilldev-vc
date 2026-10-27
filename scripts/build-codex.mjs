#!/usr/bin/env node
// Generate the Codex edition from the maintained Claude skills. No dependencies or network.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const OUTPUT = join(ROOT, 'plugins', 'jay-ka-codex');
const SOURCE = join(ROOT, 'plugins', 'jay-ka');
const json = (value) => JSON.stringify(value, null, 2) + '\n';

function* files(dir, prefix = '') {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not supported in the package: ${path}`);
    if (entry.isDirectory()) yield* files(join(dir, entry.name), path);
    else if (entry.isFile()) yield path;
  }
}

const rename = (value) => value.replaceAll('codex-low', 'claude-low').replaceAll('codex-high', 'claude-high').replaceAll('claude-md-', 'agents-md-');

function adaptMarkdown(text, path) {
  text = rename(text.replaceAll('\r\n', '\n'))
    // Swap the host and the destination agent, rather than making Codex delegate to itself.
    .replace(/\bCodex\b/g, '__JAYKA_DESTINATION_AGENT__')
    .replace(/\bClaude Code\b|\bClaude\b/g, 'Codex')
    .replaceAll('__JAYKA_DESTINATION_AGENT__', 'Claude')
    .replaceAll('CLAUDE.md', 'AGENTS.md')
    .replaceAll('.claude', '.codex')
    .replaceAll('docs/codex/', 'docs/claude/')
    .replaceAll('`$ARGUMENTS`', 'the text accompanying the skill invocation in the user message')
    .replace(/\/jay-ka:(jayka-[a-z-]+)/g, (_, name) => `$${name}`)
    .replace(/(?<![.\w/-])\/(jayka-[a-z-]+)/g, (_, name) => `$${name}`)
    .replace(/ \(as a plugin: `\/jay-ka:` in front, conventions §2b\)/g, '')
    .replace(/ \(with the plugin, put `\/jay-ka:` in front, conventions §2b\)/g, '')
    .replace('which Codex shows when loading it', 'located from the loaded SKILL.md path');

  if (path.endsWith('/SKILL.md')) {
    text = text.replace(/^(argument-hint|disable-model-invocation):.*\n/gm, '');
  }
  if (path === 'jayka-menu/SKILL.md') {
    text = text.replace(/^\*\*Installed or not:\*\*.*$/m,
      '**Installed or not:** check whether `../<name>/SKILL.md` exists relative to this skill using the available file or shell tools. Check the files even if a skill is absent from the session list.');
    text = text.replace(/^\*\*How it is called:\*\*.*$/m,
      '**How it is called:** use `$<name>` in Codex, for example `$jayka-continuity close`, for plugin and standalone installations.');
    text = text.replace('### Automatic (Codex loads them when they apply;',
      '### Catalog and help\n- `jayka-menu [<skill> | search <need> | install-rules [global | project]]`: show this catalog, explain a skill or install the base rules.\n\n### Automatic (Codex loads them when they apply;');
  }
  if (path === 'jayka-working-rules/reference/conventions.md') {
    text = text.replace(/^.*Every manual skill receives its arguments.*$/m,
      '- Every manual skill reads its arguments from the text accompanying its invocation in the user message. Codex does not substitute an arguments variable. Each skill has an Arguments table.');
    text = text.replace(/## 2b\. How to name a skill when suggesting it[\s\S]*?(?=## 3\.)/,
      '## 2b. How to name a skill when suggesting it\nUse `$<name>` for both plugin and standalone skills, for example `$jayka-continuity close`. Standalone user skills live in `~/.agents/skills/`; project skills live in `.agents/skills/`.\n\n' +
      'Personal JayKA data defaults to `~/.codex/jayka/`. If `CODEX_HOME` is set, use `<CODEX_HOME>/jayka/` instead. The global instructions file is `<CODEX_HOME>/AGENTS.md` (default `~/.codex/AGENTS.md`). Project state in `.codex/state/` and `.codex/structure/` is a JayKA convention, not built-in Codex memory. Respect existing project paths and record them in `AGENTS.md`.\n\n' +
      'Resolve `<SKILL_DIR>` from the loaded SKILL.md location. Read sibling skills with available file or shell tools; never assume a Claude-specific tool exists. Use the actual available browser tool or the bundled Node scripts for browser work.\n\n');
  }
  if (path === 'jayka-git-rules/SKILL.md') {
    text = text.replace(/^- If the chat starts on `main`[^\n]*$/m,
      '- With a remote, when a session starts on `main`, ask: «Do we stay on `main` or use a branch?» and wait for the answer **before editing project files, staging, committing, creating or switching branches**. Read-only inspection is allowed. Skip this gate only if the user has already explicitly chosen the branch in this session; a request to add a file or commit does not itself choose a branch.');
  }
  // There is no assumed Claude connector. Handoffs are always concrete files for the user.
  text = text.replace(/\(pastes it into Claude, or asks to delegate it if they have the Claude plugin\)/g,
    '(opens the task file in Claude and asks it to follow the instructions)');
  text = text.replace(/Ask: «Do I hand it to Claude or do you prefer to paste it yourself\?»\.[^\n]*/g,
    'Tell the user to open Claude in the same project and ask it to follow the task file. Do not assume a Claude connector exists or send the task automatically.');
  text = text.replace(/Ask: «Do I hand them to Claude, or do you prefer to paste them yourself\?»\.[^\n]*/g,
    'Tell the user which task file to open in Claude in the same project. Do not assume a Claude connector exists or send tasks automatically. **One task at a time.**');
  return text;
}

export function expectedPackage() {
  const expected = new Map();
  const put = (path, content) => expected.set(path, Buffer.from(content));
  const sourceManifest = JSON.parse(readFileSync(join(SOURCE, '.claude-plugin/plugin.json'), 'utf8'));
  put('.codex-plugin/plugin.json', json({
    ...sourceManifest,
    name: 'jay-ka-codex',
    description: 'JayKA for Codex: planning, continuity, Git, security, style and task handoffs to Claude.',
    skills: './skills/',
    requires_local_executor: true,
  }));
  for (const path of files(join(SOURCE, 'skills'))) {
    const target = `skills/${rename(path)}`;
    const input = readFileSync(join(SOURCE, 'skills', path));
    if (path.endsWith('.md')) put(target, adaptMarkdown(input.toString('utf8'), path));
    else if (path.endsWith('/capture-live.mjs') || path.endsWith('/capture-pair.mjs')) {
      put(target, input.toString('utf8').replaceAll('\r\n', '\n').replace(
        "join(homedir(), '.claude', 'jayka', 'tools')",
        "resolve(process.env.CODEX_HOME || join(homedir(), '.codex'), 'jayka', 'tools')"));
    } else expected.set(target, input);
    if (path.endsWith('/SKILL.md')) {
      const manual = /^disable-model-invocation: true\s*$/m.test(input.toString('utf8'));
      put(`skills/${rename(dirname(path)).replaceAll('\\', '/')}/agents/openai.yaml`,
        `policy:\n  allow_implicit_invocation: ${!manual}\n`);
    }
  }
  return expected;
}

export function buildCodex({ check = false } = {}) {
  const expected = expectedPackage();
  const extra = [...files(OUTPUT)].filter((path) => !expected.has(path));
  if (extra.length) throw new Error(`Unexpected files in generated package; review them manually (nothing deleted):\n${extra.join('\n')}`);
  const changed = [];
  for (const [path, content] of expected) {
    const destination = join(OUTPUT, path);
    if (existsSync(destination) && content.equals(readFileSync(destination))) continue;
    changed.push(path);
    if (!check) {
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, content);
    }
  }
  if (check && changed.length) throw new Error(`Codex package is out of date. Run node scripts/build-codex.mjs:\n${changed.join('\n')}`);
  return { files: expected.size, changed: changed.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== '--check')) throw new Error('Usage: node scripts/build-codex.mjs [--check]');
    const result = buildCodex({ check: args.includes('--check') });
    console.log(`Codex package: ${result.files} files, ${result.changed} changed (${relative(ROOT, OUTPUT)}).`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
