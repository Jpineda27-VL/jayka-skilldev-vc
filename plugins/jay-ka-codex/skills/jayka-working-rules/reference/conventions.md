# Shared conventions of the jayka-* skills

Every JayKA skill follows these rules. If a skill says something different, the skill wins. What is in **My settings** wins over everything.

## 0. Language
- Write in the **user's language** (the language of their last message; English if unclear). Chat replies, reports and documents meant for people follow it.
- **Fixed tokens always stay in English**, whatever the user's language, because other skills and scripts read them back: statuses (`pending`, `answered`, `skipped`, `unsure`), interview keys (`identity.tones`), file and folder names, the section headings of the templates, and the origin tags (`Measured`, `Code`, `Inferred`). The text under those headings follows the user's language.
- The exact phrases quoted in the skills («Unknown argument…», «Continue?») are written in English here; say them in the user's language.
- Arguments: the English names are canonical. Common Spanish aliases are accepted and listed in each skill's table.

## 1. Arguments
- Every manual skill reads its arguments from the text accompanying its invocation in the user message. Codex does not substitute an arguments variable. Each skill has an Arguments table.
- Read them in this order: (1) the first word picks the mode or command, accepting the aliases in the table; (2) the rest is the target or free text.
- No arguments: the skill does what its table marks as «default». If it has none, show its options in one line and ask which one.
- Unrecognized word: answer only «Unknown argument `<word>`. Options: …» and do nothing else.
- A required piece of data is missing: ask for **only** that piece, with an example.

## 2. Paths
**Inside the project**

| Path | What it holds | Written by |
|---|---|---|
| `AGENTS.md` | Short entry point for the assistant | `new-project` |
| `.codex/state/CONTINUE.md` | State: done, pending, decisions | `continuity`, `new-project` |
| `.codex/structure/tree.md` | Approved folder tree and app routes | `project-structure` |
| `.codex/structure/screens.md` | Screen inventory and its parity | `views-parity` |
| `docs/project/interview.md` | Interview answers | `new-project` |
| `docs/project/initial-report.md` | Kick-off report | `new-project` |
| `docs/project/style.md` | Approved style brief | `style-build` |
| `docs/project/test-data.md` | Test accounts, how to reset data, what is still demo | `real-data` |
| `docs/plans/YYYY-MM-DD-<slug>.md` | Plans by blocks | `plan-builder` |
| `docs/claude/tasks/NNN-<slug>.md` | Tasks for Claude | `claude-low`, `claude-high` |
| `docs/claude/results/NNN-<slug>.md` | Reports Claude returns | Claude |
| `docs/claude/screenshots/NNN/` | Playwright screenshots of each task | Claude |
| `docs/security/YYYY-MM-DD-<web\|deploy>.md` | Security reports | `security-web`, `security-deploy` |

**Outside projects (personal library, `~/.codex/jayka/`)**

| Path | What it holds |
|---|---|
| `~/.codex/jayka/styles/` | Style profiles and `base-style.md` |
| `~/.codex/jayka/reverse/` | Reverse-engineering studies |
| `~/.codex/jayka/tools/` | Tools installed with permission (for example Playwright) |

If the project already uses another path for the same thing, respect the project's path and note it in `AGENTS.md`.

## 2b. How to name a skill when suggesting it
Use `$<name>` for both plugin and standalone skills, for example `$jayka-continuity close`. Standalone user skills live in `~/.agents/skills/`; project skills live in `.agents/skills/`.

Personal JayKA data defaults to `~/.codex/jayka/`. If `CODEX_HOME` is set, use `<CODEX_HOME>/jayka/` instead. The global instructions file is `<CODEX_HOME>/AGENTS.md` (default `~/.codex/AGENTS.md`). Project state in `.codex/state/` and `.codex/structure/` is a JayKA convention, not built-in Codex memory. Respect existing project paths and record them in `AGENTS.md`.

Resolve `<SKILL_DIR>` from the loaded SKILL.md location. Read sibling skills with available file or shell tools; never assume a Claude-specific tool exists. Use the actual available browser tool or the bundled Node scripts for browser work.

## 3. Names
- **Slug:** lowercase, ASCII only, words joined by hyphens, 50 characters at most. Example: «Order Flow» → `order-flow`.
- **Date:** `YYYY-MM-DD`, today's.
- **NNN:** three digits. The highest number that already exists in `docs/claude/tasks/` plus one; `001` if there is none. A task and its result share the number.

## 4. Creating folders and files
- A folder from the table that **does not exist**: ask once, with this text: «I'm going to create `<path>` for <purpose>. Continue?». If it already exists, do not ask.
- A file that already exists is **updated**, not overwritten. If it must be replaced entirely, first save the previous version as `<name>.<YYYY-MM-DD>.md`.

## 5. Gates (points where the user is awaited)
- One closed question with the options in view. Example: «Approve as is, or change something?».
- Do not move on without an explicit answer. Silence or a new topic does not count as «yes».
- A «yes» holds for that gate only, not for the next ones.

## 6. Origin of every claim (in reports and audits)
- `Measured`: came from a command, test, browser or script.
- `Code`: it is at `file:line`.
- `Inferred`: reasoned without checking. Never presented as measured.

## 7. «Done when»
Every skill has that section with checkable conditions. If one is not met, say which one and why; do not call it done.

## 8. Closing
As «When closing a block of work» says in `jayka-communication`.
