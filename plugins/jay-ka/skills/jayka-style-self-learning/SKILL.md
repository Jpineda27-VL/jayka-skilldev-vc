---
name: jayka-style-self-learning
description: "Studies the frontend of a finished project (client view and dashboard), read-only, and saves a style profile (technology, palette, typography, spacing, components, patterns, motion, accessibility) plus a tokens.json in the personal library. Invoke it with /jayka-style-self-learning at the end of a project, optionally with its path."
argument-hint: "[<path>] [--slug <name>] [--no-browser]"
disable-model-invocation: true
---

# JayKA · Style Self-Learning

The **learning** half of the style pair. It studies a finished project and leaves a reusable **profile**. The other half, `jayka-style-build`, uses those profiles to build new prototypes in your style.

## Arguments
Received: `$ARGUMENTS` · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Default | What it does |
|---|---|---|
| `<path>` | the current folder | Project to study. If it does not exist, say so and stop |
| `--slug <name>` | the folder name, as a slug | Name of the profile in the library |
| `--no-browser` (`--sin-navegador`) | asked in Step 0 | Code-only study: skips Step 5 and the profile says so |

With the arguments given, Step 0 only asks what is missing.

## Rules that are never broken
1. **Read-only.** You do not modify, format, install or delete anything in the studied project. You do not run `npm install`, migrations or anything with effects.
2. **Frontend only**: the view the client sees and the dashboard or panel (and any other visible screen). From the backend you only look at what reaches the screen (templates, view routes). Do not study business logic.
3. **Do not touch secrets.** Do not open `.env`, keys or credential files. If they show up, ignore them and do not copy them into the profile.
4. **Every claim carries evidence**: file and line, or «measured in the browser». Mark what is **inferred** as inferred. Do not invent tokens that do not exist.
5. **The profile does not copy the project's content**: no client texts, no personal data, no brand images. Only the design system and the patterns.
6. Profiles live in the personal library (`~/.claude/jayka/styles/`), **outside** the studied project.

## Step 0 · Preparation (ask briefly, once)
1. Project path (default: the current folder) and a name for the profile (saved as `<slug>`).
2. Is it finished? If not, ask how much is left; the profile will say «project in progress».
3. Surfaces to study: client view, dashboard, others. If there are several apps (web and mobile), ask which ones.
4. Does the user authorize opening it in the browser (local server or published address) to **measure** real styles? It is optional and read-only. If not, the study is code-only.
5. Is there already a profile for that project? If so, this one becomes an **update** (keep the previous version as `profile.<date>.md`).

## Step 1 · Technology
Detect, with evidence, by looking at `package.json`, configuration files and templates:
- Frontend framework and language (React, Vue, Svelte, Blade, Astro, plain HTML, Expo…), and build tool.
- Styling approach: Tailwind, CSS Modules, SCSS, plain CSS, CSS-in-JS, component library (shadcn/ui, MUI, Chakra, Bootstrap…).
- **Animation and scrolling**: GSAP/ScrollTrigger, Framer Motion/Motion, Lenis, Locomotive, AOS, Lottie, Three.js, View Transitions, CSS animations.
- Icons (library or own SVG), charts (Recharts, Chart.js, D3…), maps, editors, tables.
- Images: formats, `srcset`, lazy loading, optimization.
- Rendering: SPA, SSR, static, server templates.
Search guide: `reference/extraction-guide.md`.

## Step 2 · Design system (tokens)
Extract, with their origin (CSS variable, Tailwind theme, constant, loose value):
- **Color**: full palette with **roles** (background, surface, text, soft text, primary, accent, success, warning, danger, borders, focus), dark version if there is one, and frequency of use. Measure the **contrast** of the important pairs (text/background, text on button, soft text) with `node "<SKILL_DIR>/scripts/contrast.mjs" <text> <background> [<text> <background> …]` (add `--large` for text of 24 px or more, or 18.66 px bold). Never estimate it by eye.
- **Typography**: families (and where they load from), weights, size scale, line height, letter spacing, units (rem or px), use of tabular numbers.
- **Spacing**: scale, base grid, container widths, page margins.
- **Shape**: radii, borders, shadows, opacities, blurs, gradients.
- **Motion**: durations, curves, what is animated and with which library, scroll effects, `prefers-reduced-motion`.
- **Breakpoints** and responsive behavior.
Save the result in `tokens.json` (format in `reference/tokens.schema.json`).

## Step 3 · Components and patterns
- Inventory: buttons (variants and states), cards, forms and fields, navigation (top, bottom, side bar), tables, modals and sheets, alerts, badges, charts, empty, loading and error states.
- **Layouts**: how the client view is built (header, hero, sections, footer) and the dashboard (sidebar, top bar, number cards, tables, filters, panels).
- **Distinctive motifs**: what makes the project recognizable (a type of photo, a shape, a stripe, an underline). Describe it and say why it works.

## Step 4 · Visual language and experience
- **Feeling** in 5 words, and which concrete decisions produce it («warm: cream background, coral accent, very rounded corners…»).
- Imagery and illustration: style, treatment, proportions.
- Voice of the texts: tone, length, short examples (without real data).
- Interaction: feedback, transitions, gestures, behavior on mobile.
- **Accessibility**: measured contrast, visible focus, touch targets, screen readers, reduced motion, text sizes.
- **Visible performance**: fonts, heavy images, costly animations.

## Step 5 · Browser measurement (if authorized)
The capture tool of `jayka-reverse` is used with this skill's style probe. For each surface (a local or published URL):

`node "<SKILL_DIR>/../jayka-reverse/scripts/capture-live.mjs" "<url>" --out "~/.claude/jayka/styles/<slug>/measurements/<surface>" --steps 0 --hover 0 --no-reduced --eval "<SKILL_DIR>/scripts/style-probe.js"`

Add `--no-screenshots` if the user does not want to save screenshots.
- For each window (1280 px and 375 px) it produces `eval-style-probe.json` with: backgrounds, text colors, borders, families, size/weight/line height, radii, paddings, gaps, shadows, `:root` variables, loaded fonts and **the real contrast of every visible text/background pair** (with the effective background, composing transparencies), including the pairs that fail.
- Compare what was measured with what the code says. If they differ, the measured value wins and the difference is noted.
- If `capture-live.mjs --check` exits with code 3 (Playwright is missing), ask permission to install it as `jayka-reverse` explains. If there is no permission, or `jayka-reverse` is not installed, use the available browser tool to evaluate the content of `scripts/style-probe.js` on each screen, at both sizes.
- Do not log in with real accounts. If a test account is needed, the user provides it.

## Step 6 · Write the profile
Folder: `~/.claude/jayka/styles/<slug>/`
- `profile.md`: follows `reference/profile-template.md`.
- `tokens.json`: follows `reference/tokens.schema.json`. Validate it with `node "<SKILL_DIR>/scripts/check-tokens.mjs" "<path>/tokens.json"`: it checks keys, types, colors, date, slug and **recalculates every declared contrast**. Fix until it exits with code 0.
- `screenshots/` (optional).
- `measurements/` (if Step 5 happened): the measured JSON files, as evidence.
Then **update `~/.claude/jayka/styles/base-style.md`**: the traits that repeat across profiles (families, tones, radii, patterns), with the count of how many projects each appears in. If there is only one profile, the base style is that one; do not invent trends.
Folders are created following the conventions.

## Step 7 · Hand back to the user
Short summary:
1. The **5 identity traits** of the project.
2. What is **reusable** (tokens and patterns worth carrying to other projects).
3. What you would **not** repeat (weaknesses: low contrast, too much animation, inconsistencies).
4. What stayed **inferred** or unmeasured.
5. One question: «Did this style work for the project's goal? What would you change?». Save the user's answer in the **Results and lessons** section of the profile (only what they say).
Close by reminding them that `jayka-style-build` can already use this profile and that `jayka-style-library` is for comparing them.

## Done when
- `profile.md` (with all the sections of `reference/profile-template.md`) and `tokens.json` exist in `~/.claude/jayka/styles/<slug>/`, and `check-tokens.mjs` exits with code 0.
- Every claim of the profile has evidence (`file:line` or «measured in the browser») or is marked as inferred.
- The contrasts of the important pairs are calculated, not estimated.
- `base-style.md` is updated with the counts.
- Nothing was modified in the studied project and no secrets file was opened.
- The Step 7 question was asked. The user's answer is saved when it arrives.

## My settings
<!-- Add here what else you want it to study (for example microcopy tone, visible SEO) or what not (for example the dashboard). -->
