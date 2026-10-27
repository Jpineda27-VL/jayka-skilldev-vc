---
name: jayka-menu
description: "Shows the catalog of jayka-* skills, one line per skill, how each is called and whether it is installed. With a name it explains that skill; with «search» it suggests which one to use; with «install-rules» it puts the base rules in AGENTS.md. Invoke it with $jayka-menu."
---

# JayKA · Menu

Shows the catalog. **One line per skill, no long explanations.**

**Installed or not:** check whether `../<name>/SKILL.md` exists relative to this skill using the available file or shell tools. Check the files even if a skill is absent from the session list.

**How it is called:** use `$<name>` in Codex, for example `$jayka-continuity close`, for plugin and standalone installations.

## Arguments
Received: the text accompanying the skill invocation in the user message · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| *(empty)* | `list`, `lista` | **Default.** Full catalog |
| `<skill>` | with or without the `jayka-` prefix | Reads its `SKILL.md` and summarizes it in 3 lines: what it is for, how it is called (its arguments) and what it delivers |
| `search <text>` | `buscar`, `which` | Suggests the skill that best fits what the user describes, plus an alternative if there is one, with the reason in one line |
| `install-rules [global \| project]` | `rules`, `instalar-reglas` | Puts in a `AGENTS.md` the short block of rules that must always hold. See «Install the base rules». Default: `project` |

## Install the base rules
The automatic skills are loaded when Codex thinks they are useful; `AGENTS.md` is read **always**. That is why the five rules that cannot fail (do not edit while chatting, secrets only the user's, permissions, no invented business rules, verify before «done») can also go in `AGENTS.md`.
1. Destination: `project` → `AGENTS.md` at the root of the current project; `global` → `~/.codex/AGENTS.md` (applies to every project).
2. Read the block in `../jayka-working-rules/reference/agents-md-block.md` (path relative to this skill) and the destination file, if it exists.
3. Show the block as is and where it will go. If the destination already has similar rules (for example about Git or secrets), say so: the block does not replace or delete them.
4. Ask: «Add this block at the end of `<destination>`?». Without a «yes», touch nothing.
5. With the yes:
   - If the file already has the marks `jayka:base-rules:start` and `…:end`, replace **only** what is between them.
   - If it does not, append the block at the end, separated by a blank line.
   - If the file does not exist, create it with only the block.
   - Never change anything outside the marks.
6. Show the lines that changed.

## Catalog (21 skills)
Output format: group, and below it `name <arguments>: short description [installed / not installed]`. Arguments shown are the canonical English ones; each skill lists its Spanish aliases.

### Automatic (Codex loads them when they apply; the rules that must always hold go with `install-rules`)
- `jayka-communication`: how to talk (clear language, summary first, no editing while chatting).
- `jayka-working-rules`: working rules and the shared conventions of the skills.
- `jayka-git-rules`: local commits; push and PR only on your order.

### Start and continue
- `jayka-new-project [resume | report]`: new project with a 42-question interview and a report.
- `jayka-project-structure [new | tidy | show]`: proposes the folders depending on frontend, backend or both.
- `jayka-continuity close | open`: closes and opens sessions without losing the thread.

### Security and publishing
- `jayka-security-web build | audit [<area>]`: headers, cookies, CSRF, limits, permissions and uploads.
- `jayka-security-deploy [<domain>]`: checklist before publishing.

### Visual style
- `jayka-style-self-learning [<path>] [--slug <name>]`: studies a finished project and saves its style in a profile.
- `jayka-style-build [<what to build>]`: builds prototypes with your profiles and the interview.
- `jayka-style-library list | show | compare | search | summary | gaps | log`: queries the profiles; read-only.
- `jayka-companion-tools [<moment>]`: suggests when to use Impeccable, Superpowers and other tools.

### Plans and Claude
- `jayka-plan-builder <what to build>`: plan by blocks in `.md` (uses Superpowers if installed).
- `jayka-claude-low <task>`: simple tasks for Claude, in `.md`.
- `jayka-claude-high [<plan> <block>]`: big work for Claude, with a full plan.

### Techniques
- `jayka-laravel-backend new | module <name> | review`: backend with services, business errors and tests.
- `jayka-photos [<which photos>]`: compressed WebP photo uploads with clear names.
- `jayka-views-parity inventory | change <screen> | verify [<screen>]`: two frontends with the same screens.
- `jayka-real-data [inventory | plan | seed | connect | flow]`: real sample data with seeders, no demo.
- `jayka-reverse live <url> | repo <path-or-git-url>`: reverse engineering of a site or repo: stack, measured animations and a report.

## At the end
Ask only one thing: «Which one do you want to use?».

## Done when
- Catalog: every skill of the list appears, each with its installation status **checked by file** (not assumed) and with the right invocation prefix for this installation.
- `<skill>`: the summary comes from its `SKILL.md` read right now. If it is not installed, say so and summarize from this catalog.
- `search`: one suggestion with a reason, or «none fits» and why.
- `install-rules`: the destination has the block exactly once, between its marks; nothing outside them changed; or, if the user did not approve, nothing changed.

## My settings
<!-- Add your own skills here or remove the ones you do not use. -->
