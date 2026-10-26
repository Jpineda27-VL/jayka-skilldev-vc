# Plan and decisions of the `jay-ka-skilldev-vc` repository

This document is the continuity point: whoever opens the project in a new session reads it first.

## Purpose
Optional **helper skills** for developers who build with AI («vibe coding») and want to keep order through the chat, without typing commands or remembering processes. They are not a framework: a project keeps its own skills and rules, and these are used only when they help. Generic: nothing specific to one project.

## Decisions
- **Language (2026-10-26, v0.10.0):** all skills, templates, scripts, tests and docs are in **English**. Claude answers and writes human-readable documents in the user's language. Machine-read tokens always stay in English (statuses, interview keys, file and folder names, template headings, origin tags). Arguments are English with Spanish aliases. The README exists in English and Spanish (`README.md`, `README.es.md`). No Spanish glossary for now; add one only if Spanish output turns out inconsistent.
- **Naming:** plugin `jay-ka`, skills `jayka-<command>`, called as `/jay-ka:jayka-<command>` (or `/jayka-<command>` when copied to `~/.claude/skills`). History: `jay-k-a-` (v0.1–0.8) → `jayka-` (v0.9); `tech-` dropped; `init` renamed `menu`.
- **Paths:** project files in English (`.claude/state/CONTINUE.md`, `docs/project/…`, `docs/plans/`, `docs/codex/{tasks,results,screenshots}/`, `docs/security/`); personal library at `~/.claude/jayka/{styles,reverse,tools}/`. Single source: `jayka-working-rules/reference/conventions.md`.
- The repository is a **Claude Code plugin marketplace** with one plugin, `jay-ka`, that carries all the skills. Alternative: a script that copies the skills to `~/.claude/skills`.
- GitHub owner: account `Jpineda27-VL`. Created **private**; the author makes it public when they want. Built locally first; no push until the author orders it.
- Skills have a **My settings** section so each person can change the rules. Self-learning skills are left as an idea for later.
- The assistant **never** touches keys, tokens or external services: only the user. Written in `jayka-working-rules`.
- **Vibe coding, with order:** understand, plan, approve, build in groups, verify, audit. Building with AI is welcome; improvising is not.
- Nothing from other tools (Impeccable, Superpowers, etc.) is replaced: they are only **suggested** (`jayka-companion-tools`).
- The five rules that must always hold can also be put in `CLAUDE.md` with `/jayka-menu install-rules`, because `CLAUDE.md` is always read while automatic skills load only when Claude judges them useful.

## Catalog
Automatic = Claude loads it when it applies (its description is always in view, the full text enters on use); manual = only with `/name`.

| Skill | Type | What it does |
|---|---|---|
| `jayka-menu` | manual | Catalog, one line per skill; `search`; `install-rules` |
| `jayka-communication` | automatic | How to talk: user's language, summary first, no editing while chatting |
| `jayka-working-rules` | automatic | Working rules and the shared conventions |
| `jayka-git-rules` | automatic | Local commits; push and PR only on order; defers to the user's own Git rules |
| `jayka-security-deploy` | manual | Pre-publishing checklist with scripts: git-history secrets, HTTPS, headers, cookies, 24 sensitive paths |
| `jayka-security-web` | manual | Web security rules, `build` / `audit`, with a risk-pattern scanner |
| `jayka-project-structure` | manual | Folder tree for frontend-only, backend-only or both |
| `jayka-new-project` | manual | 42-question interview with stable keys, each answered or skipped by hand; report; base files |
| `jayka-continuity` | manual | `close` saves state, memory, graph and commit; `open` reads the state |
| `jayka-style-self-learning` | manual | Studies a finished project (frontend), saves a profile + `tokens.json`, with measured contrast |
| `jayka-style-build` | manual | Builds prototypes from the interview and the profiles |
| `jayka-style-library` | manual | Read-only queries over the profiles |
| `jayka-laravel-backend` | manual | Services, business errors, one action per POST, audit log, tests |
| `jayka-photos` | manual | Uploads: WebP, 1200 px, 5 MB, clear names |
| `jayka-views-parity` | manual | Two frontends with the same screens; measured side-by-side comparison |
| `jayka-plan-builder` | manual | Plan by blocks in `.md`; uses Superpowers if installed, says so if not |
| `jayka-codex-low` | manual | Simple tasks for Codex; the reviewer always does the visual check |
| `jayka-codex-high` | manual | Big work for Codex, through a plan |
| `jayka-real-data` | manual | Repeatable seeders, no demo data, end-to-end flow test |
| `jayka-companion-tools` | manual | Suggests when to use Impeccable, Superpowers and other tools |
| `jayka-reverse` | manual | Reverse engineering of a site (`live`) or repo (`repo`), levels 1–3, with Playwright measurements and easing fitting |

## Execution standard
Skills are written as an **execution contract**, not loose instructions:
- Arguments with reading rules in order, and an exact answer for unknown ones.
- Each step: what goes in, the exact command, what must come out and what to do if it fails.
- A checkable «Done when…» for each level or phase.
- Permission gates with the exact text of the question.
- Scripts of their own when something can be measured instead of described.

## History
- **A · Common base:** conventions file, arguments table and «Done when» in every manual skill.
- **B · Measuring scripts:** `check-deploy`, `scan-git-secrets`, `scan-security`, `style-probe`, `contrast`, `check-tokens`, `find-demo-data`, `capture-pair`; `capture-live` gained `--eval` and `--no-screenshots`.
- **C · Templates:** `CONTINUE.md`, interview with stable keys, initial report, `CLAUDE.md`; Codex tasks declare whether Playwright exists and never claim a visual check they did not do.
- **D · One home per rule** in the three automatic skills; `install-rules` block for `CLAUDE.md`.
- **E · Tests:** `tests/run.mjs` (16 deterministic checks, 16/16) and `plugins/jay-ka/evals/` (13 `claude plugin eval` cases; the 7 `no-shell` ones passed 7/7 on Windows, including `reply-in-spanish`).
- **Install tested** from a local folder as plugin, and with both copy scripts. Fixed while testing: `menu` checks installation by file; commands carry the `/jay-ka:` prefix.
- **Rename and English (v0.9–0.10).**

## Pending
- Run the `needs-shell` eval cases on macOS, Linux or WSL (Claude Code cannot sandbox a terminal on Windows).
- Decide whether to shorten the manual skills' descriptions to lower the fixed cost (about 3,200 tokens per session).
- Before publishing: check for personal data, choose a license, push, and verify the install command against the published repository.
- Review all skills with a stronger model.

## How we work
1. Build skills by groups, showing each one before calling it good.
2. Test each skill installed for real, not only written.
3. When the author orders it: review for personal data, choose a license, push.
