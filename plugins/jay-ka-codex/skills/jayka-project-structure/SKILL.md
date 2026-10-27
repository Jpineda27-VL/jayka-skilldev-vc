---
name: jayka-project-structure
description: "Proposes the folder hierarchy of a project depending on whether it has only a frontend, only a backend or both (plus docs, state, backups and tools). Invoke it with $jayka-project-structure new when starting a project, or «tidy» for an existing one."
---

# JayKA · Project Structure

Helps decide how folders are organized. **You propose; you do not move or rename anything without the user's approval.**

## Arguments
Received: the text accompanying the skill invocation in the user message · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| *(empty)* | | **Default.** If the current folder has code (more files than `README`, `.git` and `.codex`), act as `tidy`; otherwise as `new`. Say so in one line |
| `new` | `nuevo` | Proposes the tree for a project that is starting |
| `tidy` | `existing`, `ordenar`, `existente` | Looks at the current structure and proposes changes, without moving anything |
| `show` | `ver` | Shows the approved tree in `.codex/structure/tree.md`. If it does not exist, say so |

## 1. Ask first (short, one at a time)
1. What is it? Only frontend, only backend, or both? Is there a mobile app, an admin panel, a public API?
2. With `tidy`: look at the current structure and respect it wherever it already works.
3. In which language should folder names be (English, Spanish…)? Use the project's language and do not mix.
4. A single repository (monorepo) or one per part?

## 2. Base structures
The names are examples; adapt them to the project's language and framework.

**Frontend only (static site or app):**
```text
project/
  src/              code
  public/           static files
  docs/             decisions and notes
  .codex/          state and rules for the assistant
```

**Backend only (API or service):**
```text
project/
  src/ (or app/)    code, with business rules in services
  tests/            one test per important rule
  database/         migrations and seeders
  docs/
  backups/          dated backups (outside the repository if heavy)
  .codex/
```

**Frontend and backend (monorepo):**
```text
project/
  frontend/         what the user sees (may have subfolders: web, app, panel)
  backend/          server, database and tests
  shared/           shared code or types, only if really shared
  design-system/    tokens (colors, fonts), icons, logo
  docs/
  tools/            deployment scripts and utilities
  backups/
  .codex/
```

## 3. The `.codex/` folder (for working with the assistant)
```text
.codex/
  state/            what is done, what is missing, decisions (the continuity point)
  rules/            working rules of the project
  structure/        tree.md (this tree and the app routes) and screens.md
```
With a short `AGENTS.md` at the root, pointing to those documents.

## 4. Order rules
- One folder, one responsibility. If a folder mixes two things, separate them.
- Business logic lives in the backend; the frontend only shows and sends.
- What must not be uploaded to the repository goes in `.gitignore`: secrets, heavy backups, user-uploaded files, dependencies.
- File and route names in lowercase, without spaces or accents; if the project uses another language, do it the same way everywhere.
- The app's routes are documented in one place (`.codex/structure/tree.md`).
- Large data files or backups: outside the code.

## 5. Delivery
1. Show the proposed tree and why (3 lines).
2. If the project already exists, list what would move and wait for approval. Moving files is done with Git (`git mv`) and in a separate commit.
3. If it is new, create the folders only after the user approves.
4. Leave the approved tree written in `.codex/structure/tree.md`.

## Done when
- The approved tree is in `.codex/structure/tree.md`.
- With `new`: the approved folders exist and no others.
- With `tidy`: every approved move was done with `git mv` in a separate commit, and afterwards the project still starts (tests or build run, with their result). What was not approved stayed the same.

## My settings
<!-- Your favorite folder names, for example ui/ and server/, or your own convention. -->
