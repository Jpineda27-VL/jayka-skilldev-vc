# jayka-skilldev-vc

*Español: [README.es.md](README.es.md)*

**Optional helper skills for Claude Code**, for developers who build with AI («vibe coding») and want to keep order **through the chat**, without typing commands or remembering processes.

You describe what you want; the skills take care of the order around it: a plan before building, permissions asked, secrets left to you, verification before «done», clean commits, state saved between sessions. They are **helpers, not a framework**: a project keeps its own skills and rules, and you use these only when they help.

> Status: v0.10.0 · 21 skills · tested installed as a plugin and by copy. The skills are written in English and **answer in your language** (English, Spanish…). See `docs/PLAN.md`.

## Install

**Option A: as a plugin (recommended).** Inside Claude Code:

```text
/plugin marketplace add Jpineda27-VL/jayka-skilldev-vc
/plugin install jay-ka@jayka-skilldev-vc
```

Skills of a plugin carry the plugin name first: `/jay-ka:jayka-menu`, `/jay-ka:jayka-continuity close`…

**Option B: copy the skills to your global folder** (then they are called without the prefix: `/jayka-menu`).

```bash
# macOS, Linux or Git Bash
./scripts/install.sh
```

```powershell
# Windows PowerShell
./scripts/install.ps1
```

The script does not overwrite existing skills; add `--force` (bash) or `-Force` (PowerShell) to replace them. Do not use both options at once: you would see every skill twice.

## First steps
```text
/jay-ka:jayka-menu                      the catalog, one line per skill
/jay-ka:jayka-menu search <need>        which skill fits what you need
/jay-ka:jayka-menu install-rules        put the base rules in your CLAUDE.md (asks first)
```

## What is inside

| Group | Skills |
|---|---|
| **Automatic** (Claude loads them when they apply) | `jayka-communication`, `jayka-working-rules`, `jayka-git-rules` |
| **Start and continue** | `jayka-new-project` (42-question interview), `jayka-project-structure`, `jayka-continuity` (`close` / `open`) |
| **Security** | `jayka-security-web` (`build` / `audit`), `jayka-security-deploy` |
| **Visual style** | `jayka-style-self-learning`, `jayka-style-build`, `jayka-style-library`, `jayka-companion-tools` |
| **Plans and Codex** | `jayka-plan-builder`, `jayka-codex-low`, `jayka-codex-high` |
| **Techniques** | `jayka-laravel-backend`, `jayka-photos`, `jayka-views-parity`, `jayka-real-data`, `jayka-reverse` |

`jayka-reverse` studies a site or repository that is not yours (`live <url>` / `repo <path>`): stack, libraries and **measured** animations, transitions and scroll, plus a verified reproduction. It needs Node 18+ and, to measure sites, Playwright with Chromium; the skill asks permission before installing it in `~/.claude/jayka/tools/`, outside your projects.

Several skills run **their own scripts** (security checks, contrast, parity, demo-data finder…) instead of only describing what to check. They need Node 18+.

## Language
The skills are written in English. Claude answers and writes documents (reports, state files, interviews) in **the language you write in**. Fixed tokens that other skills read back (statuses like `pending`, interview keys like `identity.tones`, file names) stay in English. Arguments are in English with common Spanish aliases (`close` = `cerrar`).

## Make them yours
Every skill ends with a **My settings** section. Change or add rules there; that section wins over the rest. If a skill does not fit how you work, simply do not use it.

## What they do NOT do
- They never touch your keys, tokens or external services: that is only yours.
- They do not replace other tools (Impeccable, Superpowers…): they only suggest them.
- They do not push, open pull requests or deploy unless you ask in the chat.

## Tests
Two layers:

```bash
# 1. Deterministic: structure of the 21 skills and behavior of every script (spends no tokens)
node tests/run.mjs
```

The 3 browser tests run only if Playwright is in `~/.claude/jayka/tools/` (or in the folder given by the `JAYKA_TOOLS` variable); otherwise they are skipped.

```bash
# 2. Behavior with Claude: scenarios in plugins/jay-ka/evals/ (they use your account)
cd plugins/jay-ka
claude plugin eval . --tag no-shell --scaffold --allow-tools Write Edit --trust-plugin --runs 1
```

Details, cases and limits in `plugins/jay-ka/evals/README.md`.

## License
[MIT](LICENSE).
