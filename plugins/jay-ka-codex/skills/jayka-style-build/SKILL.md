---
name: jayka-style-build
description: "Builds prototypes in your own style: takes the identity from the new-project interview and the style-self-learning profiles, proposes a base with reasons (or three new directions if there is nothing), gets your approval, turns it into tokens and builds screens verified on mobile and desktop. Invoke it with $jayka-style-build, optionally saying what to build."
---

# JayKA · Style Build

The **building** half of the style pair. It uses what `jayka-style-self-learning` learned (profiles) and what `jayka-new-project` defined (identity and technology) so new prototypes come out **consistent with your style and without an «AI-made» look**.

## Arguments
Received: the text accompanying the skill invocation in the user message · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | What it does |
|---|---|
| *(empty)* | **Default.** Starts at Step 0 and asks what is going to be built |
| `<what to build>` | Free text (for example «client home and orders panel»). It is used as the proposed scope of Step 4, which is still confirmed |

## Rules that are never broken
1. **The user decides the style.** You propose with reasons; nothing is applied without their approval.
2. **Do not invent the identity.** If there is no interview and no profiles, say so and propose directions, or run the mini-questionnaire (step 0). Never present an assumption as if it were their decision.
3. **Dependencies, fonts and external services** (packages, CDNs, Google Fonts, animation libraries) **require permission**, every time. Explain what they are and what they cost (weight, privacy, dependency). Prefer system font stacks or fonts already included in the project if the user does not authorize downloads.
4. Follow `jayka-working-rules`: plan before building, small groups, no keys, verify before saying «done».
5. If the project already has an approved design system, **do not replace it silently**: extend it or ask.

## Step 0 · Gather inputs
Look, in this order, and say what you found and what you did not:
1. `docs/project/initial-report.md` and `docs/project/interview.md` (from `jayka-new-project`). Read the interview **by key**, never by number:
   - Technology and platform: `tech.frontend`, `tech.backend`, `tech.database`, `tech.platform`.
   - Identity: all the `identity.*` keys (feeling, tones, avoid, typography, imagery, brand, references, mode, density).
   - Sensitive data: `quality.sensitivity`. Devices: `quality.devices`.
   - Only entries with status `answered` count. `unsure` ones trigger Step 2 for that trait; `skipped` ones and those that do not exist are treated as «no data» and you say which were missing.
   - If the interview has no keys (a format from before v0.6), say so and ask to run `$jayka-new-project resume` to convert it, or go on with the mini-questionnaire.
2. The personal library: `~/.codex/jayka/styles/<slug>/profile.md`, `tokens.json` and `base-style.md`.
3. A style already defined in the project (`docs/project/style.md`, existing tokens).
4. What the user asks now: **what is going to be built** (screens or prototype flow).

If the interview and the profiles are **both missing**: recommend running `jayka-new-project` (identity) and/or `jayka-style-self-learning` (profiles). If the user prefers to go on, run a **mini-questionnaire** of 6 questions (feeling, color tones, lettering, density, light or dark mode, references). Each one is answered or skipped by hand, as in `new-project`. «I don't know» is valid and triggers step 2. The six use the interview keys (`identity.feeling`, `identity.tones`, `identity.typography`, `identity.density`, `identity.mode`, `identity.references`) and are saved to `docs/project/interview.md` in the format of `jayka-new-project` (if the file does not exist, it is created with only those entries).

## Step 1 · Match with the profiles
Follow `reference/matching.md`. Deliver **up to 3 candidates** (or none, and say so):
- Which profile, **why it fits** (which user answer matches which trait of the profile).
- **What you would take** from it (tokens, patterns, motion) and **what you would leave**.
- What **worked or failed** according to its «Results and lessons» section.
- Technical compatibility: whether the tokens carry over as they are to the chosen technology or need translating.
The user chooses: **one**, **mix** (for example «colors of A, typography of B») or **none**.

## Step 2 · New directions (if there is no profile, or the user says «I don't know»)
Propose **3 directions that differ from each other**, not three variations of the same thing. Each one, in a few lines:
- Name and feeling in 5 words.
- Palette with roles and concrete values (derived with the recipe in `reference/matching.md`, with the contrast already verified).
- Type pairing and scale.
- Shape (radii, borders, shadows) and density.
- Motion (what is animated and how).
- A **distinctive motif** (something recognizable that is not generic).
- An honest risk of that direction.
If the user gave only tones (for example «red, blue and green»), the three directions **start from those tones**. If they already have exact palettes, they are integrated as they are. Check `reference/anti-slop.md` before proposing.

## Step 3 · Style brief (approval gate)
With what was chosen, write the **brief** (`reference/style-brief-template.md`) to `docs/project/style.md`, with the tokens in the project's format (CSS variables, Tailwind theme, theme file…). Show it summarized and ask: «Approve it as is, or change something?». **Do not build until they approve.** If they change something, update the brief and show only what changed.

## Step 4 · Build
1. Confirm the **prototype scope**. Recommend the minimum that shows the style: one key client screen and the main dashboard screen, if there are both.
2. Short plan by groups (tokens and base → components → screens). For big work, suggest `jayka-plan-builder`.
3. Build with the approved tokens: zero «loose» colors, sizes or radii outside the system. Realistic content, not «Lorem ipsum» or «Welcome to…».
4. Respect these bases (change them in **My settings** if you prefer others):
   - Text in `rem`, not `px`.
   - AA contrast at least; visible focus; touch targets of 44 px or more.
   - `prefers-reduced-motion` respected.
   - Real states: empty, loading, error, disabled.
   - Mobile first if the user uses it most (`quality.devices`).

## Step 5 · Verify (a single bounded round)
Do not enter an endless polishing loop: **one full round and, if needed, one confirmation round.**
1. Open the prototype in a browser at **1280 px** and **375 px** and look at all the screens built.
2. Check: cut-off or overlapping text, contrast of the important pairs, focus, touch targets, horizontal overflow, images, empty states.
3. Fix everything found **in a single batch**, and confirm once.
4. Report what was left unverified.

## Step 6 · Delivery and next steps
Summarize: style applied (from which profile or direction), files created, tokens, and what was not done. Close by suggesting, without running them:
- `jayka-companion-tools`: audit and polish (for example `impeccable audit` and `polish`) and the tools against the «AI look».
- `jayka-style-self-learning`, **when the project is finished**, to save its profile and enrich the library.

## Done when
- `docs/project/style.md` exists and the user approved it at the Step 3 gate.
- The screens of the confirmed scope are built, and outside the tokens file there are no loose colors: a search for `#[0-9a-fA-F]{3,8}\b`, `rgb(` and `hsl(` in the prototype files finds none (or each one is justified).
- All screens were reviewed at 1280 px and 375 px, with one round of fixes and one of confirmation at most.
- The delivery says what was left unverified.

## My settings
<!-- Change bases (for example «text in px», «always dark mode»), the weights of your preferences or which screens are built by default. -->
