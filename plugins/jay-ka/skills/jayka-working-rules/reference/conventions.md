# Shared conventions of the jayka-* skills

Every JayKA skill follows these rules. If a skill says something different, the skill wins. What is in **My settings** wins over everything.

## 0. Language
- Write in the **user's language** (the language of their last message; English if unclear). Chat replies, reports and documents meant for people follow it.
- **Fixed tokens always stay in English**, whatever the user's language, because other skills and scripts read them back: statuses (`pending`, `answered`, `skipped`, `unsure`), interview keys (`identity.tones`), file and folder names, the section headings of the templates, and the origin tags (`Measured`, `Code`, `Inferred`). The text under those headings follows the user's language.
- The exact phrases quoted in the skills («Unknown argument…», «Continue?») are written in English here; say them in the user's language.
- Arguments: the English names are canonical. Common Spanish aliases are accepted and listed in each skill's table.

## 1. Arguments
- Every manual skill receives its arguments in `$ARGUMENTS` and has an «Arguments» table with what it accepts.
- Read them in this order: (1) the first word picks the mode or command, accepting the aliases in the table; (2) the rest is the target or free text.
- No arguments: the skill does what its table marks as «default». If it has none, show its options in one line and ask which one.
- Unrecognized word: answer only «Unknown argument `<word>`. Options: …» and do nothing else.
- A required piece of data is missing: ask for **only** that piece, with an example.

## 2. Paths
**Inside the project**

| Path | What it holds | Written by |
|---|---|---|
| `CLAUDE.md` | Short entry point for the assistant | `new-project` |
| `.claude/state/CONTINUE.md` | State: done, pending, decisions | `continuity`, `new-project` |
| `.claude/structure/tree.md` | Approved folder tree and app routes | `project-structure` |
| `.claude/structure/screens.md` | Screen inventory and its parity | `views-parity` |
| `docs/project/interview.md` | Interview answers | `new-project` |
| `docs/project/initial-report.md` | Kick-off report | `new-project` |
| `docs/project/style.md` | Approved style brief | `style-build` |
| `docs/project/test-data.md` | Test accounts, how to reset data, what is still demo | `real-data` |
| `docs/plans/YYYY-MM-DD-<slug>.md` | Plans by blocks | `plan-builder` |
| `docs/codex/tasks/NNN-<slug>.md` | Tasks for Codex | `codex-low`, `codex-high` |
| `docs/codex/results/NNN-<slug>.md` | Reports Codex returns | Codex |
| `docs/codex/screenshots/NNN/` | Playwright screenshots of each task | Codex |
| `docs/security/YYYY-MM-DD-<web\|deploy>.md` | Security reports | `security-web`, `security-deploy` |

**Outside projects (personal library, `~/.claude/jayka/`)**

| Path | What it holds |
|---|---|
| `~/.claude/jayka/styles/` | Style profiles and `base-style.md` |
| `~/.claude/jayka/reverse/` | Reverse-engineering studies |
| `~/.claude/jayka/tools/` | Tools installed with permission (for example Playwright) |

If the project already uses another path for the same thing, respect the project's path and note it in `CLAUDE.md`.

## 2b. How to name a skill when suggesting it
The pack can be installed two ways, and the command changes:
- **As a plugin** (the path of the skill you are running contains `/plugins/`): `/jay-ka:<name>`, for example `/jay-ka:jayka-continuity close`.
- **Copied to `~/.claude/skills`** (`scripts/install.sh` or `install.ps1`): `/<name>`, for example `/jayka-continuity close`.

Whenever you tell the user to run a skill, write it with the prefix of the current installation. Inside the skill texts the names appear without prefix (`jayka-…`) because they hold for both ways.

## 3. Names
- **Slug:** lowercase, ASCII only, words joined by hyphens, 50 characters at most. Example: «Order Flow» → `order-flow`.
- **Date:** `YYYY-MM-DD`, today's.
- **NNN:** three digits. The highest number that already exists in `docs/codex/tasks/` plus one; `001` if there is none. A task and its result share the number.

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
