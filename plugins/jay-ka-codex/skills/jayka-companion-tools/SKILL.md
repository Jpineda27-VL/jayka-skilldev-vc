---
name: jayka-companion-tools
description: "Suggests, at the right moment, which other tools to use (Impeccable to audit and polish, Superpowers to plan, design skills against the AI look, security, tests) without replacing or running them. Invoke it with $jayka-companion-tools, optionally saying what moment you are in."
---

# JayKA · Companion Tools

This skill **does no work of its own**: it recommends which tool by other authors fits the moment, so nothing is reinvented. There are very good tools (for example Impeccable, Superpowers); here we only know **when** to use them.

## Arguments
Received: the text accompanying the skill invocation in the user message · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | What it does |
|---|---|
| *(empty)* | **Default.** Takes the moment from the last thing that happened in the conversation. If it cannot be known, ask: «What moment are you in: before a plan, after building interface, animation, security, code quality, data or between sessions?» |
| `<moment>` | Free text («I finished the login», «I am going to plan the panel»). Pick the section below that fits |
| `all` (`todo`) | Answer as in «If the user asks "what else is there?"» |

## Rules
1. **Only suggest.** Do not run any recommended tool unless the user asks. Do not replace it with a version of your own.
2. **Check what is installed.** For third-party tools, look at the list of skills available in the session. Recommend the installed ones by their exact name; for those that are **not** there, give the name, what it is for and that it is not installed. For `jayka-*` skills, check by file (`../<name>/SKILL.md`), because manual skills do not appear in the session list. **Never install anything** (it requires the user's explicit permission, and they decide the installation).
3. **Few suggestions, well chosen.** At most 3 per moment, each in one line: what it is, why now, and what you get. Mark the one you recommend first.
4. Do not invent capabilities: if you do not know a tool, do not describe it.
5. The decision is the user's. End with: «Shall I run any of them?».

## When to suggest what

### Before a plan or a big block of work
(more than ~5 files, several days, unclear requirements, or changes that touch data)
- **Superpowers `brainstorming`**: clarifies the idea before planning.
- **Superpowers `writing-plans`**: writes the plan to be executed, in `.md`.
- **`jayka-plan-builder`**: builds the plan by blocks using the above; for Claude, see `jayka-claude-low` and `jayka-claude-high`.

### After building or changing the interface
- **Impeccable**: `audit` (technical quality: accessibility, performance, responsive), `critique` (UX review), `polish` (final pass), `harden` (edge cases, errors), `adapt` (other sizes and devices).
- For the **AI look**: `design-taste-frontend`, `emil-design-eng` (polish and animation details), `ui-ux-pro-max` (styles, palettes and UX guidelines), `high-end-visual-design`, `minimalist-ui` or `industrial-brutalist-ui` depending on the style, `redesign-existing-projects` to improve something already built.
- **Break test:** `break-ui` (extreme data: long names, empty lists, huge numbers).

### Animation and motion
`animate` (build), `review-animations` (review), `improve-animations` (audit the whole project), `animation-performance` (if it is slow), `animate-expo` (React Native / Expo), `mobile-native` (make a web app feel native on the phone).

### Security
- `jayka-security-web` (build or audit), `jayka-security-deploy` (before publishing).
- `security-review` and `differential-review` (review of changes with a security focus).

### Code quality and tests
- `/code-review` (errors in the diff), `simplify` (reuse and cleanup), `safe-refactor` (restructure without changing behavior), `surgical-patch` (minimal fix), `verify-and-stop` (check that what was asked is met without widening scope), `investigate-first` (failures that are not understood).
- `playwright-skill` (automate and review in a browser).

### Data and charts
`dataviz` (any chart or number panel).

### Between sessions
`jayka-continuity` (close and open), `jayka-style-self-learning` (when a project is finished, to save its style).

## Output format
```text
For this moment ([what just happened]):
1. [tool] (installed | not installed): [what for, in one line].
2. …
Shall I run any of them?
```

## If the user asks «what else is there?»
List the installed tools that fit what they are doing, grouped as above, without long descriptions.

## Done when
- There are 3 suggestions or fewer, each with its installation status **checked** (in the session list for third-party tools, by file for `jayka-*`).
- It ends with «Shall I run any of them?» and nothing was run or installed.

## My settings
<!-- Add your favorite tools or remove those you do not use. Example: «always suggest impeccable audit after style-build». -->
