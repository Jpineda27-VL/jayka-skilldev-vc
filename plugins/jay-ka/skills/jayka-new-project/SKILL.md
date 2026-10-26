---
name: jayka-new-project
description: "Starts a new project with a guided 42-question interview (goal, users, technology, data, visual identity, security and publishing), each one answered or skipped by hand, and delivers a report of what is defined and what is missing. Invoke it with /jayka-new-project (or with «resume» to continue a saved interview)."
argument-hint: "[resume | report]"
disable-model-invocation: true
---

# JayKA · New Project

Orchestrates the start of a project: interview, report and base files. It works **without inventing**: whatever the user does not answer stays pending.

## Arguments
Received: `$ARGUMENTS` · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| *(empty)* | `new`, `nuevo` | **Default.** Interview from question 1. If `docs/project/interview.md` already exists, ask first: «There is a saved interview. Resume it, or start a new one (the old one is saved with its date)?» |
| `resume` | `continue`, `retomar`, `continuar` | Reads `docs/project/interview.md` and continues from the first block that has `pending` questions. If it does not exist, say so and offer to start. If it is in an older format (without keys), first convert it to the template's format, moving each answer to its key by number, save the original as `interview.<YYYY-MM-DD>.md` and say so. If it only has some entries (for example those of `style-build`'s mini-questionnaire), create the missing ones as `pending` |
| `report` | `informe` | Asks nothing: rewrites `docs/project/initial-report.md` from the saved interview |

## Interview rules (mandatory)
1. **Every question is resolved by hand.** The user answers by writing, or writes `skip` themselves (`saltar` also works). None is skipped on its own, none is filled in by you and none stays blank unless they say so.
2. Answering and skipping are equally valid. Do not pressure or insist on skipped ones.
3. «I don't know» is a valid written answer: it is recorded as `unsure`. In the identity part it means options will be suggested to them later.
4. Ask the questions in **blocks of 4 to 6**, numbered, with the block name. The user answers by number (`7: ...`, `8: skip`). If numbers are left unresolved, show them again (only those) before moving to the next block.
5. Do not move to another block with unresolved questions. If the user wants to leave a whole block for later, they write `skip block` (`saltar bloque`), and all its questions are recorded as skipped.
6. At the start, create `docs/project/interview.md` from `reference/interview-template.md`: the 42 entries, all `pending` (the folder is created following the conventions). Update each entry **as soon as** its answer arrives, and the progress line of the header when each block closes. If the conversation is cut, it is resumed with `resume`.
7. Do not ask for keys, tokens or account data. If the user mentions external services (payments, email, maps), only note which ones. The user handles the keys (see `jayka-working-rules`).
8. Colors: **do not ask for exact codes**. Tones are enough («red, blue and green», «warm», «sober»). It is only to probe; concrete palettes are suggested or integrated later. If they already have an exact palette, note it, but do not ask for it.

## Questions (42)
Each question has a **number** (to answer in the chat: `7: …`) and a **stable key** (in backticks) which is what gets saved in `interview.md` and what the other skills use. Keys never change: if you add a question in **My settings**, it takes a new key with the `extra.` prefix; if you remove one, its key simply does not appear. Ask the questions in the user's language.

**A. The project**
1. `project.name` What is the project called (even if provisional)?
2. `project.sentence` What is it, in a single sentence?
3. `project.problem` What problem does it solve?
4. `project.user` Who will use it? (describe the person)
5. `project.user-name` What is that user called inside the app? (client, patient, member…)
6. `project.references` Do you know something similar? What would you do differently?

**B. Scope**
7. `scope.must-have` Which features are essential for the first version?
8. `scope.later` Which features would wait for later?
9. `scope.out-of-scope` What will this project NOT do?
10. `scope.transactions` Are there payments, sales, bookings or orders? How do they work (online, cash, outside the app)?
11. `scope.languages` In which language or languages does it run?
12. `scope.region` In which country or area is it used? (currency, time zone, laws)

**C. Users and roles**
13. `users.types` What types of user will there be?
14. `users.permissions` What can each one do? (roles and permissions)
15. `users.access` How do they log in? (username and password, Google, link, no account)
16. `users.onboarding` Who creates the accounts? (themselves, an administrator, by invitation)
17. `users.admin-panel` Will there be an administration panel? Who uses it?

**D. Technology**
18. `tech.frontend` What technology do you want for what the user sees (frontend)? If you do not know, say so and it will be suggested.
19. `tech.backend` And for the server (backend)?
20. `tech.database` Which database?
21. `tech.platform` Will it be a website, a mobile app or both? Which is the main one?
22. `tech.hosting` Where will it be published? (hosting or server)
23. `tech.domain` Do you already have a domain?
24. `tech.external-services` Which external services would you use? (email, maps, payments, notifications…). Only which ones, no keys.

**E. Data and rules**
25. `data.entities` What are the main things that get stored? (for example products, orders, appointments)
26. `data.rules` Which business rules are already decided?
27. `data.personal` What personal data is stored? (name, phone, documents)
28. `data.files` Are photos or files uploaded? Of what kind and by whom?
29. `data.retention` How long is data kept and how is it backed up?

**F. Visual identity**
30. `identity.feeling` What feeling should it give? (warm, sober, festive, technical, youthful, elegant…)
31. `identity.tones` What color tones do you imagine? (families only: red, blue, green…)
32. `identity.avoid` Which colors do you want to avoid?
33. `identity.typography` What kind of lettering do you like? (serif, sans-serif, rounded, handwritten…) or «suggest».
34. `identity.imagery` What image style? (real photos, illustrations, icons, no images)
35. `identity.brand` Is there a logo or a brand? Does it stay?
36. `identity.references` Which sites or apps do you like visually, and what do you like about each?
37. `identity.mode` Light mode, dark mode or both?
38. `identity.density` Airy and spacious design, or compact and information-heavy?

**G. Quality and publishing**
39. `quality.sensitivity` How sensitive is the data? Is there data on minors, health or money?
40. `quality.devices` From which devices will it be used most? (phone, desktop, tablet)
41. `quality.dates` Are there important dates or stages?
42. `quality.working-style` How do you prefer to work? (pace, how much you want to review, what you want to approve before it is done)

## After the interview

### 1. Kick-off report
Write `docs/project/initial-report.md` from `reference/initial-report-template.md` and show it summarized. Every datum cites its key, so it can be traced back to the answer:
- **Defined:** what is already clear, a few lines per topic.
- **Skipped:** the questions the user skipped.
- **Doubts:** those answered «I don't know».
- **Missing to start well:** what is worth resolving before building, ordered by importance, and what happens if it is not resolved.
- **Risks:** for example sensitive data without a security plan, undefined technology, unclosed business rules.
- **Identity suggestions:** if they gave only tones or said «I don't know», propose 2 or 3 directions (feeling, color families, lettering) for them to choose. If there are profiles from `jayka-style-self-learning`, mention which one looks similar and why.

### 2. Base files (only with approval)
Ask before creating any. Create what they approve:
- `CLAUDE.md` at the root, from `reference/claude-md-template.md` (under 40 lines; what is undefined says «to be defined»). Ask separately whether to add the base rules block; if yes, add it following «Install the base rules» of `jayka-menu`.
- `.claude/state/CONTINUE.md` with the initial state and the pending items, using the template of `jayka-continuity` (`../jayka-continuity/reference/continue-template.md`, path relative to this skill). The pending items are those of «Missing to start well».
- The folder structure, with `jayka-project-structure`.
- `git init` and a first commit, with `jayka-git-rules`.
- Optional: a **starter prompt** (text to paste into another chat) built from the answers.

### 3. Next steps you suggest (without running them)
- `jayka-style-build`, for the prototype's visual style.
- `jayka-plan-builder`, to plan the first big block.
- `jayka-security-web`, if there is login, forms or uploads.
- `jayka-companion-tools`, for audits and polish.
Only mention the ones that are installed; if they are not, say so.

## Done when
- The 42 entries of `docs/project/interview.md` follow the template's format and have status `answered`, `skipped` or `unsure`. None stays `pending`, and the progress line of the header adds up to 42.
- `docs/project/initial-report.md` exists with its six sections and was shown summarized.
- The base files created are **only** those the user approved, and it was said which were not created.
- The next steps were suggested without running them.

## My settings
<!-- Add, remove or change questions here. Example: «add a question about accessibility», «remove the identity ones». Keep the rule: answer or skip, always by hand. -->
