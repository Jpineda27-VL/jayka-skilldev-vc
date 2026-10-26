---
name: jayka-codex-high
description: "For BIG work asked of Codex (a complete view, a form, a flow): goes through Plan Builder, splits the plan into ordered .md tasks with criteria, tests and visual review, and defines the .md report Codex returns. The user reviews at the end. Invoke it with /jayka-codex-high <plan> <block>, or «review NNN» when Codex returns the result."
argument-hint: "[<plan-path> <block>] | review <NNN>"
disable-model-invocation: true
---

# JayKA · Codex High

To ask Codex for **a big block**: «create a complete view with a form», «build the order flow». Codex builds the **complete base outline**; the user **reviews and finishes** at the end. For small changes use `jayka-codex-low`.

## Arguments
Received: `$ARGUMENTS` · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| `<plan-path> <block>` | | Uses that block (number or title) of that approved plan and goes to Step 2 |
| `review <NNN>` | `revisar` | Step 4 for task `NNN` |
| *(empty)* | | Looks in `docs/plans/` for approved plans with unchecked blocks. If there are, list them and ask which block. If there are none, go to Step 1 (plan first) |

Codex is used **only if the user asks**. This skill prepares everything; the user decides when and how to hand it over.

## Step 1 · Plan first (mandatory)
1. Use `jayka-plan-builder`. If Superpowers is not installed, Plan Builder will say so and the user will choose; respect that choice and note it in the plan.
2. From the approved plan, take **one block at a time**. If the plan does not exist yet, create it first; do not write loose tasks for big work.
3. **Clean state:** check `git status`; if there are uncommitted changes, propose a prior local commit (with `jayka-git-rules`) so that afterwards only Codex's work can be reviewed. Ask for approval.
4. **Codex environment:** same as in `jayka-codex-low` (Step 1, point 4): find out whether it has Playwright and can start the app, and note it in the task field.

## Step 2 · Design the big task
A big task = **one block of the plan** with a complete outline. Follow `reference/task-template.md`, which adds to the basics:
- **Goal and expected result** in clear language, with the screen or flow described from top to bottom.
- **View specification:** sections, fields (name, type, required, validation, error messages), states (empty, loading, error, success), texts, actions and where each one leads.
- **Rules:** validation and logic **go on the server**; the screen only shows and sends. If the project has business rules, point to the document where they are and **do not invent new rules**: what is undecided is left marked as pending.
- **Data:** which tables or models it uses, which new migrations (only add, never edit the applied ones) and sample data by seeder, not written by hand in the screen.
- **Routes and names** following the project's conventions.
- **Style:** use the existing tokens and components (or the brief from `jayka-style-build`); no loose colors or sizes.
- **Scope:** list of files to create and to touch; nothing outside the list without asking permission in the report.
- **Tests:** one test per important rule, plus those of the area; real result in the report.
- **Mandatory visual review:** every new screen at 375 px and 1280 px, going through the flow (including validation errors and empty states), with screenshots in `docs/codex/screenshots/NNN/`. Without Playwright, Codex **does not install it nor describe what it did not see**: it declares it «NOT DONE» and leaves the exact list of what to look at (the template carries the three situations).
- **Fixed prohibitions:** do not install dependencies, do not touch secrets or environment variables, no push, no PR, no switching branch, do not change business rules or the approved style.
- **Stop points:** if something is ambiguous, Codex **stops at that part**, notes it under «Doubts» and moves on with the rest.
- **What it must return:** the report at `docs/codex/results/NNN-<slug>.md` (`reference/report-template.md`).

If the block is too big for one task (more than ~15 files or several independent screens), **split it** into tasks `NNN`, `NNN+1`, … with an order and dependencies, and they are handed over **one by one**.

## Step 3 · Hand over to the user
Show a summary: tasks, order, scope and criteria. Ask: «Do I hand them to Codex, or do you prefer to paste them yourself?». If they ask to delegate and the Codex plugin is installed, use that route; if not, say which files to paste. **One task at a time.**

## Step 4 · Review what Codex returns
Do not trust the report. For each task:
1. Read the report.
2. Review the **real diff**: only allowed files? dependencies, secrets, edited migrations, invented rules?
3. Run the tests yourself.
4. **Visual review, always:** look at the screens at 375 px and 1280 px and go through the flow (success, validation errors, empty state) with the available browser tool. If the report says «NOT DONE», also go through its list point by point. For load screenshots at both sizes, `node "<SKILL_DIR>/../jayka-reverse/scripts/capture-live.mjs" <url> --out docs/codex/screenshots/NNN/review --steps 0 --hover 0 --no-reduced` works; the states of the flow (errors, empty) are reviewed by hand, because the script does not submit forms. If a report describes screens but says it had no Playwright, treat it as **does not meet**.
5. Compare with the acceptance criteria and with the plan.
6. Deliver to the user: **meets / meets with remarks / does not meet**, list of what is missing and of what Codex decided on its own. **Without a visual review done by someone, the verdict cannot be «meets».**
7. Check the boxes of the plan, and make a local commit of what was approved (see `jayka-git-rules`).

## Step 5 · Final review by the user
When all tasks are finished, prepare a **review summary** for the user: what was created, how to test it (routes and test data, no real keys), what is pending and which decisions are waiting. The user finishes and adjusts. Suggest `jayka-companion-tools` (audit and polish) and `jayka-continuity` to save the state.

## What it does NOT do
- It does not run Codex on its own.
- It does not write big tasks without an approved plan.
- It does not widen the scope or decide business rules.

## Done when
- **Prepare:** every task `docs/codex/tasks/NNN-<slug>.md` (numbering following the conventions) comes from a block of an approved plan and has the view specification, file scope, tests, visual review, prohibitions, stop points and response format; if it was split, the order and the dependencies are written.
- **Review:** every task has a verdict based on your own review of the diff, the tests and the browser; the plan's boxes are checked and what was approved has a local commit.
- **Final:** the Step 5 review summary was delivered.

## My settings
<!-- Change folders, files-per-task limit, test command or Playwright sizes.
Codex environment (so it is not asked every time): Playwright = yes | no · command to start the app = … -->
