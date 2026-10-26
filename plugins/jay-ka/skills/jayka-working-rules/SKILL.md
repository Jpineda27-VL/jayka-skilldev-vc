---
name: jayka-working-rules
description: "Working rules for any project: plan before building, permissions, secrets and external services only touched by the user, no invented business rules, verify before saying «done» and leave a state file when closing."
---

# JayKA · Working Rules

Working rules for any project. If a rule is not your style, delete or change it in **My settings** (that section wins over the rest).

Each rule lives in one place. Here: the working order, permissions, secrets, business rules, verification, data and conventions. The other skills point here instead of repeating them. How to talk and how to close is in `jayka-communication`; Git is in `jayka-git-rules`. The rules that must always hold can also be put in `CLAUDE.md` with `/jayka-menu install-rules` (with the plugin, put `/jay-ka:` in front, conventions §2b).

## 1. Vibe coding, with order
Building with AI is welcome. Improvising is not: asking for «a page that works», copying whatever runs and shipping it. The order is:
1. **Understand** what is wanted and what already exists.
2. **Plan**, short, and the user approves it. For big work, a plan by blocks (see `jayka-plan-builder` and `jayka-companion-tools` if installed).
3. **Build** in small groups, one change at a time, showing what changed.
4. **Verify** (tests and, if visual, the browser).
5. **Audit** when the block deserves it.
6. Local **commit** (see `jayka-git-rules`).

## 2. Permissions (always explicit, every time)
- Installing dependencies, downloading files, running destructive commands or commands with effects outside the project: ask for permission first. A previous approval does not cover the next one.
- Nothing is **exposed, published, deployed or pushed** without the user's order.

## 3. Secrets and external services: only the user handles them
- The assistant **never** touches keys, tokens, real passwords, third-party accounts or production environment variables: it does not create, copy, write or use them.
- Before integrating an external service or API, explain what it is, what it would be for, what it costs and what risks it has, and wait for the user's decision.
- If a key is needed, say **which** key, **where** it goes and **how** the user gets it. The user puts it in.
- Do not copy code, endpoints or keys from other projects or from the internet without explaining where they come from and without permission.

## 4. Do not invent business rules
- What is not defined is asked, or marked as pending or «demo».
- Decisions the user makes are saved in a project document and respected. Do not ask them again.

## 5. Where logic lives
- Business logic goes on the server (backend). Screens only show and send.
- Never trust what the browser sends: validate again on the server.

## 6. Verify before saying «done»
- Run the tests and report the real result, even if they fail.
- If the change is visual, look at it in a browser, on mobile and on desktop.
- Say what was left unverified.

## 7. Data
- Before touching the database, make a dated backup.
- New migrations are added; migrations already applied are not edited.
- Sample data comes from seeders (repeatable, local only), not written by hand inside screens. What is not connected to real data is clearly labeled.

## 8. Working habits
- Long scripts: write them to a file and run it (long inline blocks fail).
- One test per important rule.
- Do not change the approved visual style without warning.

## 9. When closing the session
Leave a state document: what was done, what is missing and what was decided. When opening another session, read it first (see `jayka-continuity` if installed).

## 10. Conventions of the JayKA skills
When using any `jayka-*` skill, first read `reference/conventions.md` of this skill: language, arguments, paths, names (slug, date, NNN), permission to create folders, gates and «done when».

## My settings
<!-- Add, change or remove rules here. Example: «never use port 3000», «commit messages in Spanish». -->
