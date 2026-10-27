---
name: jayka-plan-builder
description: "Builds a plan by blocks for big work, relying on Superpowers (brainstorming and writing-plans), and leaves it in an approved .md file before executing. If Superpowers is not installed, it says so and does not pretend. Invoke it with $jayka-plan-builder <what to build>, or «continue <plan>» to execute an approved one."
---

# JayKA · Plan Builder

For **big** work: a new feature, a complete view, a migration, a redesign. For small tasks **do not use it**: ask for the change directly (or use `jayka-claude-low` if Claude does it).

## Arguments
Received: the text accompanying the skill invocation in the user message · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| `<what to build>` | | Free text. Starts at the honesty rule and continues from Step 1 |
| `continue <plan-path>` | `resume`, `continuar`, `seguir` | Reads that plan and goes straight to Step 6, from the first unchecked block. If the plan is not approved, go back to Step 5 |
| *(empty)* | | If `docs/plans/` has plans with unchecked blocks, list them and ask: «Do I continue one of these or do we plan something new?». If there are none, ask: «What are we going to plan?» |

## Honesty rule (the first one)
This skill is meant to work **with Superpowers** (`brainstorming` and `writing-plans`). Before starting, **check the list of available skills** and look for `brainstorming` and `writing-plans` (they may appear as `superpowers:brainstorming` and `superpowers:writing-plans`).

### If they are installed
Really use them: invoke them with the skills tool, in that order. Do not pretend you ran them.

### If they are NOT installed
Do not go on silently. Say exactly this (in your own words, but with this content):
> «Plan Builder is meant to use Superpowers and I do not have it installed, so it cannot run as designed. Options: (a) you install it and I tell you how; I do not install anything without your permission, (b) I go on with a reduced version that uses only my own instructions: it works, but it is **not the same**, without Superpowers' guided brainstorming, (c) we leave it for another time.»
- Do not invent results of tools you did not run.
- If they choose (b), note in the plan: «Made with the reduced version (without Superpowers)».
- If they choose (a), tell them what to install and wait. Do not install it on your own.

## Step 1 · Minimum context
Read only what is needed, without modifying anything: `AGENTS.md`, the project state (for example `.codex/state/CONTINUE.md`), the decisions already made and the files the work would touch. **Do not repeat questions already answered in the documents.** Summarize the context in 5 lines for the plan.

## Step 2 · Clarify (brainstorming)
With Superpowers: invoke `brainstorming`. Without it, reduced version: ask at most **5 questions**, one at a time, about goal, who uses it, what stays out, constraints and how it will be known to be right.
Result: **goal in one sentence**, **scope** (in, out), **acceptance criteria** and **risks**.

## Step 3 · Plan by blocks
With Superpowers: invoke `writing-plans` with that result. Without it, use `reference/plan-template.md`.
A block is a unit that can be **built, verified and committed on its own** (one session or less). Each block carries:
- Goal and scope (files or modules).
- Concrete steps.
- Verification (tests and what to look at in the browser).
- Dependencies on other blocks and size (S, M, L).
- What decision it needs from the user, if any.
Order by dependency and by risk: the uncertain first.

## Step 4 · Write the plan
File: `docs/plans/YYYY-MM-DD-<slug>.md` (date, slug and folder following the conventions). The plan is **minimum, self-sufficient context**: someone (or an agent) who reads only that file must be able to execute it. That saves tokens: the plan is read instead of repeating the conversation.
Content rules:
- No secrets, keys or personal data.
- What is undecided goes under **Pending decisions**, it is not invented.
- Every block with `[ ]` boxes that are checked when done.

## Step 5 · Approval (gate)
Show the plan **summarized**: goal, list of blocks with size and order, and the pending decisions. Ask: «Approve it as is, change something, or drop a block?». **Do not execute until they approve.**

## Step 6 · Execute (offer options, the user chooses)
1. **Here**, block by block: build, verify, check the box, local commit (see `jayka-git-rules`) and report. One block at a time.
2. **With Claude**: generate the task from the block with `jayka-claude-low` (simple block) or `jayka-claude-high` (complete view or flow).
3. **Mixed**: the delicate part here, the mechanical part with Claude.
While executing, keep the plan **alive**: boxes checked, scope changes noted with a date, new decisions.

## Step 7 · Closing
When all blocks are finished: summary of what was done and not done, test results, and next step. Suggest `jayka-companion-tools` (audit and polish) if there was an interface, and `jayka-continuity` to save the state.

## What it does NOT do
- It does not execute without approval.
- It does not decide business decisions for the user.
- It does not replace Superpowers: it uses it, or says it cannot.

## Done when
- **Plan:** the plan file exists; every block has goal, steps, verification, dependencies and size; what is undecided is under «Pending decisions»; the user approved it at the Step 5 gate; nothing was executed before. If the reduced version was used, the plan says so.
- **Execute:** every finished block has its box checked, its verification run with the real result and its local commit. The Step 7 closing was delivered.

## My settings
<!-- Change the plans folder, the block size or the maximum number of questions of the reduced version. -->
