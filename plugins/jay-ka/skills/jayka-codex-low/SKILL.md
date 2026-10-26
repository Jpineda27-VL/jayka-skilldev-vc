---
name: jayka-codex-low
description: "Prepares a SIMPLE task for Codex as an .md file (closed scope, criteria, basic tests and visual review) and defines the .md report it must return. For small, manual changes, without a big plan. Invoke it with /jayka-codex-low <task>, or «review NNN» when Codex returns the result."
argument-hint: "<task in one sentence> | review <NNN>"
disable-model-invocation: true
---

# JayKA · Codex Low

For **simple tasks** asked of Codex: change cards, adjust a screen, fix a detail, move a component. **No big plan**: a short instruction in `.md`, and Codex returns a short report in `.md`. For a complete view or flow use `jayka-codex-high`.

## Arguments
Received: `$ARGUMENTS` · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| `<task in one sentence>` | | Steps 1 to 3: prepares the task |
| `review <NNN>` | `revisar` | Step 4: reviews what Codex returned for task `NNN`. If `docs/codex/results/NNN-*.md` does not exist, say so and stop |
| *(empty)* | | Ask: «What task do we give Codex? (one sentence)» |

## When yes and when no
- **Yes:** the change fits in a few files, the result is easy to check, there are no new business decisions.
- **No:** a new view must be designed, a complete form, new data or new rules, or the scope is unclear. Then: `jayka-codex-high` (or `jayka-plan-builder` first).
- Codex is used **only if the user asks**. This skill prepares the task; **the user decides when and how to hand it to Codex** (pastes it into Codex, or asks to delegate it if they have the Codex plugin).

## Step 1 · Before writing the task
1. **Clarify the task in one sentence** and confirm the scope with the user (what yes, what no). If data is missing, ask the minimum.
2. **Clean state:** check `git status`. If there are uncommitted changes, propose a **local commit** before handing the task to Codex (with `jayka-git-rules`), so that afterwards only what Codex changes can be reviewed. Do not do it without the user's approval.
3. **One task at a time.** If the user asks for several, make several separate tasks, in order.
4. **Codex environment:** does it have Playwright and can it start the app? If it is not recorded in **My settings**, ask once: «Does the Codex you will use have Playwright and can it start the app?». The answer (yes / no / unknown) goes into the «Playwright in your environment» field of the task, together with the command to start the app. Offer to save the answer in **My settings** so as not to ask again.

## Step 2 · Write the task
File: `docs/codex/tasks/NNN-<slug>.md` (NNN, slug and folder following the conventions). Use `reference/task-template.md`. Content rules:
- **Short:** one page at most.
- **Closed scope:** list of files it may touch and the order «do not touch anything outside that list; if needed, stop and ask in the report».
- Checkable **acceptance criteria**.
- **Mandatory verification:** the basic tests needed (those of the area, not the whole suite if it is long) and visual review of the affected screen at **375 px and 1280 px**: with Playwright if it has it; if not, Codex declares it «NOT DONE» and leaves the list of what to look at (the template already carries the three situations).
- **Fixed prohibitions:** do not install dependencies, do not touch secrets or environment variables, do not push, do not change business rules, do not change the approved style.
- **Response format:** the report at `docs/codex/results/NNN-<slug>.md`, with `reference/report-template.md`.
- No secrets or personal data.

## Step 3 · Hand over to the user
Show the task summarized and say where the file is. Ask: «Do I hand it to Codex or do you prefer to paste it yourself?». If the user asks to delegate it and the Codex plugin is installed, use that route; if not, say they must paste the content of the file.

## Step 4 · When Codex returns the result
Do not trust the report: **review it**.
1. Read `docs/codex/results/NNN-<slug>.md`.
2. Review the **real diff** (`git diff`): did it touch only what was allowed? Are there unexpected changes, dependencies, secrets?
3. Run the tests yourself.
4. **Visual review**, if the change shows on screen. Do it **always**; and if the report says «NOT DONE», also go through its list point by point. With the available browser tool, or with screenshots at both sizes:
   `node "<SKILL_DIR>/../jayka-reverse/scripts/capture-live.mjs" <url> --out docs/codex/screenshots/NNN/review --steps 0 --hover 0 --no-reduced`
   (`SKILL_DIR` is the base directory of this skill). Look at the screenshots it generates (`00-load.png` in each size).
   If a report describes screens but says it had no Playwright, treat it as **does not meet**: it described what it did not see.
5. Compare with the acceptance criteria.
6. Report to the user: **meets / meets with remarks / does not meet**, and what failed. Do not call it good without checking. **Without a visual review done by someone, the verdict cannot be «meets».**
7. If something must be fixed, write a short follow-up task (another `NNN`), do not edit the previous one.
8. Local commit of the approved result (see `jayka-git-rules`).

## What it does NOT do
- It does not run Codex on its own.
- It does not widen the scope.
- It does not write big plans (that is `codex-high`).

## Done when
- **Prepare:** `docs/codex/tasks/NNN-<slug>.md` exists, takes one page or less and has the list of allowed files, acceptance criteria, verification, prohibitions and response format; the user knows where it is and how to hand it over.
- **Review:** the verdict (meets / meets with remarks / does not meet) is based on the diff, the tests and the browser reviewed by you, not on Codex's report; what was approved has a local commit.

## My settings
<!-- Change the tasks folder, the default tests, the Playwright screen size or the prohibitions.
Codex environment (so it is not asked every time): Playwright = yes | no · command to start the app = … -->
