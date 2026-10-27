# JayKA for Codex

The repository distributes two plugins. Claude's source, marketplace, install scripts and evals stay under their existing paths. Codex has a separate generated package and marketplace:

```text
.claude-plugin/marketplace.json                 Claude catalog
.agents/plugins/marketplace.json                Codex catalog
plugins/jay-ka/                                 Maintained Claude edition
plugins/jay-ka-codex/.codex-plugin/plugin.json    Codex compatibility manifest
plugins/jay-ka-codex/skills/                     21 adapted skills and their resources
scripts/build-codex.mjs                         Reproducible Codex package generator
```

The checked-in Codex package is ready for a plugin host to read without building it during installation. It uses the supported Codex compatibility manifest, declares `skills: "./skills/"` and requires a local executor because some workflows execute Node scripts. There are no MCP servers or account connections to configure.

## Install the plugin

From a terminal with a Codex CLI that supports plugin marketplaces:

```text
codex plugin marketplace add Jpineda27-VL/jayka-skilldev-vc
codex plugin add jay-ka-codex@jayka-skilldev-codex
```

Alternatively, open the desktop app's Plugins Directory, choose the **JayKA for Codex** source, and install **jay-ka-codex**. Restart the app if needed and start a new chat. Use `$jayka-menu` to inspect the catalog.

The remote command works once these files are published to the remote default branch. Before publication, from this checkout's root use:

```text
codex plugin marketplace add .
codex plugin add jay-ka-codex@jayka-skilldev-codex
```

Adding a marketplace registers the source; it does not itself demonstrate successful plugin installation. No Codex account configuration is modified by the build or test scripts. The original Claude installation instructions remain in the READMEs.

## Compatibility decisions

| Claude edition | Codex edition |
| --- | --- |
| `/jay-ka:jayka-menu` | `$jayka-menu` |
| `disable-model-invocation: true` | `agents/openai.yaml` with `allow_implicit_invocation: false` |
| Three automatic skills | The same three skills with implicit invocation enabled |
| `argument-hint` and `$ARGUMENTS` | Arguments read from the user's invocation text and the existing Arguments table |
| `CLAUDE.md` | `AGENTS.md` |
| `.claude/state/`, `.claude/structure/` | `.codex/state/`, `.codex/structure/` (JayKA conventions, not built-in memory) |
| `~/.claude/jayka/` | `<CODEX_HOME>/jayka/`, default `~/.codex/jayka/` |
| `jayka-codex-low`, `jayka-codex-high` | `jayka-claude-low`, `jayka-claude-high` |
| `docs/codex/tasks/`, `results/`, `screenshots/` | `docs/claude/tasks/`, `results/`, `screenshots/` |
| Claude-specific file tools | Available file, shell and browser tools |

Codex prepares task files for Claude and reviews its returned reports. The user opens those files in Claude in the same project; the skills do not assume an installed Claude connector or transfer tasks automatically. Existing project paths take precedence, so an existing Claude project is not migrated merely by installing the Codex plugin. Personal style libraries are separate by default; existing paths can be recorded in the project's instructions.

## Maintain and validate

Edit the Claude source and the adapter for any Codex-specific differences, then regenerate:

```text
node scripts/build-codex.mjs
node scripts/build-codex.mjs --check
node tests/run.mjs
node tests/run.mjs --edition codex
```

Commit generated package changes together with the source changes when committing is authorized. Do not edit generated files directly: the generator replaces them. Unexpected files in the generated folder stop the build for manual review; the generator never deletes them. The plugin version follows the original manifest version.

The deterministic suite checks the skill metadata, invocation policies, marketplace resolution, handoff paths, resource references, generated freshness, script syntax and script behavior. Browser checks are skipped when Playwright is unavailable. `JAYKA_TOOLS` can select an existing Playwright installation for either edition. The Codex scripts otherwise search `<CODEX_HOME>/jayka/tools/`, defaulting to `~/.codex/jayka/tools/`. Tests do not install browser dependencies.

For repeatable behavior tests using real `codex exec` calls and your account tokens:

```text
node tests/codex-evals.mjs
node tests/codex-evals.mjs --only menu-catalog
node tests/codex-evals.mjs --runs 3
```

The runner installs the plugin separately for every case, uses disposable projects and profiles, and saves responses, actual file changes, tool events and token usage. See [behavior scenarios and isolation details](../tests/CODEX-EVALS.md). These runs are separate from the deterministic suite and are never started by it.

See the [October 26, 2026 validation results](CODEX-EVAL-RESULTS.md) for the 13 scenarios, discovered issues, corrective reruns and remaining limits.

The real CLI marketplace registration and plugin installation were also checked with an isolated temporary Codex profile. All 21 installed SKILL.md files matched the generated package, including both Claude task skills. This validates installation from the local repository; remote GitHub installation awaits publication of these changes.

Claude eval cases remain specific to Claude. No Codex behavioral eval service or successful desktop UI session is claimed by the deterministic tests or CLI installation check. To validate behavior after installing it in a new Codex chat:

1. Run `$jayka-menu`: confirm the 21 skills are checked against installed files and both Claude task skills appear.
2. Run `$jayka-continuity open` in a disposable empty project: it should report missing state without inventing prior work.
3. Ask a conversational question: JayKA should respond in your language without editing files.
4. Run `$jayka-claude-low` with a small task: review its scope and confirm it prepares a file under `docs/claude/tasks/`, without running Claude or making a commit automatically.
5. Check that the three automatic skills are discoverable and manual skills remain explicitly invocable.

## Official references

- [Plugin packaging, repo marketplaces and CLI registration](https://developers.openai.com/plugins/build/plugins)
- [Skills, invocation and openai.yaml policy](https://learn.chatgpt.com/docs/build-skills)
