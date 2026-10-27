---
name: jayka-reverse
description: "Reverse engineering of a live site or of someone else's repository/template. Detects the stack and libraries, measures animations, transitions and scroll with Playwright (duration, curve, trigger), deduces the easing of JS-made animations, checks the license and delivers a report with evidence and verified minimal reproductions. Invoke it with $jayka-reverse live <url> or $jayka-reverse repo <path-or-git-url>."
---

# JayKA · Reverse

Studies **something that is not yours** (a published site, a repository or a template) to understand **how it is made** and to be able to reproduce its techniques with your own content. It differs from `jayka-style-self-learning`, which studies **your** projects and saves your style. Here the result is a **technical report** with measured evidence, not a personal profile.

This skill is an **execution contract**: each step says what goes in, which command runs, what must come out and what to do if it fails. If a step cannot be met, the report says so; it is not filled in with assumptions.

Received arguments: the text accompanying the skill invocation in the user message · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

## 1. How to read the arguments

Form: `<mode> <target> [--level 1|2|3] [--focus "<effect>"]` (aliases `--nivel`, `--foco`)

| Mode | Accepted aliases | Valid target |
|---|---|---|
| `live` | `online`, `web` | URL `http://` or `https://` |
| `repo` | `local`, `git` | an existing local path, or a git URL (`https://github.com/…`, `https://gitlab.com/…`, `git@…`, ends in `.git`) |

Rules, in this order. Apply the first that matches and do not improvise another:
1. The first word (lowercase) decides the mode according to the table.
2. **No mode**: if the target is a URL of `github.com`, `gitlab.com`, `bitbucket.org` or `codeberg.org` → `repo`; if it is another URL → `live`; if it is a path that exists → `repo`. Write one line: «Inferred mode: `<mode>`.» and go on.
3. `live` with a URL of `github.com/<user>/<repo>` (not `github.io`) → ask only one thing: «Do I study the code (repo) or the published page (live)?».
4. `live` without `http(s)://` → prepend `https://` and say so in one line.
5. The target is missing or invalid → answer only: «The target is missing. Examples: `$jayka-reverse live https://example.com` · `$jayka-reverse repo https://github.com/user/template`». Do nothing else.
6. `--level` default: **2**. `--focus` is optional: detection is done in full, but the inventory and the tracks center on that effect.

## 2. Levels

| Level | Repo | Live | Done when |
|---|---|---|---|
| 1 · Static | License + scan + confirmation in code | One load with the probe, no scroll | Stack and libraries with evidence; inventory of what is visible in code or on load |
| 2 · Measurement (default) | The above + run it locally + capture | Full capture: 2 windows, mouse, hover, scroll, navigation, video, reduced motion | Every effect of the inventory has duration, curve and trigger **measured** or marked as not measurable |
| 3 · Reproduction | The above + verified reproductions | Same | Every chosen effect has `repro/E<n>.html` and `compare-motion.mjs` exits with code 0 (or it is explained why not after 3 attempts) |

## 3. Rules that are never broken
1. **The mechanism is learned, the work is not copied.** No texts, images, logos, brand or code blocks of the target are copied. Reproductions are written from the measured values, with your own content.
2. **License first.** Without a license, or with a commercial license (a bought template), it is only studied and the technique is rewritten; nothing is reused as is. With copyleft (GPL, AGPL, MPL) warn about what it obliges.
3. **Someone else's code is not trustworthy.** It goes in an isolated folder. No script is run and nothing is installed without showing it first and having the user's yes. Dependencies are installed **without install scripts**.
4. **Public only.** No logging in, no submitting forms, no bypassing paywalls or protections. If the site blocks or asks for verification (403, 429, captcha), **stop** and report; never try to evade it. The given page and at most one internal navigation are studied, unless the user names more URLs. No mass crawling.
5. **Secrets out.** `.env` and credentials are not opened (the scanner skips them without reading). Keys or tokens are never requested. If something only works with a real key, that part is not studied.
6. **Every claim carries its origin**: `Measured` (probe, capture or track), `Code` (file:line) or `Inferred` (only from screenshots or reasoning). What is inferred is never presented as measured.
7. **Only write in the study folder** (`STUDY`, below) and in the tools folder. Nothing in the open project or in the studied path.
8. **Playwright is installed only with permission**, in the tools folder, never inside a project.

## 4. Paths
- `SKILL_DIR`: the base directory of this skill (Codex shows it when loading it). The scripts are in `SKILL_DIR/scripts/`.
- `STUDY`: `~/.codex/jayka/reverse/<slug>/`. The `<slug>` comes from the host and path (live) or the repo name (repo), in lowercase with hyphens. If it already exists, ask: «Do I update the previous study (saving it as `<slug>.<YYYY-MM-DD>`) or create a new one?».
- `TOOLS`: `~/.codex/jayka/tools/` (Playwright goes here).
- On Windows, file URLs look like this: `file:///C:/Users/<user>/.codex/jayka/reverse/<slug>/repro/E1.html`.

Content of `STUDY`:
```
source/               clone of the repo (only if the target is a git URL or if it had to be copied to run it)
repo-findings.json    output of scan-repo.mjs
capture/              output of capture-live.mjs (one subfolder per window, network.json, summary.json)
tracks/               captures with --track for JS-made effects
repro/                own minimal reproductions and their captures
report.md             the final report
```

## 5. Step 0 · Preparation (always)
1. `node --version` → 18 or newer is needed. If there is no Node: stop and say so; this skill does not work without it.
2. If the level is 2 or more, or the mode is `live`: `node "<SKILL_DIR>/scripts/capture-live.mjs" --check`
   - Code 0 → go on.
   - Code 3 → ask for permission with the exact text: «Measuring needs Playwright with Chromium (about 150 MB) in `~/.codex/jayka/tools/`, outside your projects. Shall I install it?». With the yes: `npm install --prefix "<TOOLS>" playwright` and `npx --prefix "<TOOLS>" playwright install chromium`; repeat `--check`.
   - If they say no → **manual mode**: use the available browser tool (Playwright MCP or the built-in browser). Get the probe with `node "<SKILL_DIR>/scripts/capture-live.mjs" --print-probe`, evaluate it on the page, scroll and take screenshots by hand. The report will say «manual capture: no video, no per-frame tracks, no reduced-motion pass».
3. Announce in three lines: mode and target, level, study folder. Do not ask for approval for level 1; permissions are asked at each gate.

## 6. Repo mode

**R1 · Get the source**
- Local path: used as is, **read-only**.
- Git URL: `git clone --depth 1 --no-recurse-submodules -c core.symlinks=false "<url>" "<STUDY>/source"`
- If the clone fails (private, does not exist, asks for credentials): stop and answer «I could not clone it: it is private or does not exist. If it is yours, clone it yourself and give me the local path.». Do not ask for tokens.

**R2 · License**
Read `LICENSE*` / `COPYING*` and the `license` field of `package.json`. Also look for commercial license texts (for example «Envato», «ThemeForest», «Regular License», «single use»). Classify:

| Class | Examples | What can be done |
|---|---|---|
| Permissive | MIT, ISC, BSD, Apache-2.0, MIT-0, Unlicense, CC0 | Reuse with attribution according to the license; it is rewritten anyway by rule 1 |
| Copyleft | GPL, LGPL, AGPL, MPL | Reusing obliges releasing under the same license; warn |
| Commercial | Bought template | Only study; use according to what the bought license says |
| No license | No file or field | All rights reserved: only study |

**R3 · Scan**
`node "<SKILL_DIR>/scripts/scan-repo.mjs" "<SOURCE>" --out "<STUDY>/repo-findings.json"`
- It prints a summary with detections (`[category] library — evidence`), install scripts marked with ⚠ and motion statistics in CSS and in code.
- If it detects nothing and there is no motion: say so («static site without motion detectable in code») and move to level 2 if it applies; there may be motion that is only seen at runtime.

**R4 · Confirm in the code**
A package in `package.json` that is not used in the code is reported as «installed, not used». For each detection look for where it is initialized and where each effect is defined, and note `file:line`. Search patterns: `gsap.registerPlugin`, `gsap.timeline`, `ScrollTrigger.create`, `scrollTrigger:`, `new Lenis`, `<motion.`, `AnimatePresence`, `useScroll`, `useTransform`, `layoutId`, `@keyframes`, `transition:`, `startViewTransition`, `view-transition-name`, `animation-timeline`, `IntersectionObserver`, `requestAnimationFrame`. The guide to interpret each signal is in `reference/reading-guide.md`.

**R5 · Run it (level 2 or more)**
Gate: show the user, taken from `repo-findings.json`, the package manager, the install scripts, the script to be run (`dev`, `start` or `preview`) and whether `.env.example` exists. Ask: «Shall I install its dependencies without install scripts and start it locally?».
- If the source is a local path, it is first **copied** to `<STUDY>/source` (`git clone "<path>" "<STUDY>/source"` if it is a git repo; otherwise copy excluding `node_modules`). Never install in the user's path.
- Install according to the manager:

| Manager | Command |
|---|---|
| npm | `npm ci --ignore-scripts` (no lockfile: `npm install --ignore-scripts`) |
| pnpm | `pnpm install --frozen-lockfile --ignore-scripts` |
| yarn 1 | `yarn install --frozen-lockfile --ignore-scripts` |
| yarn 2+ | `yarn install --immutable --mode=skip-build` |
| bun | `bun install --frozen-lockfile --ignore-scripts` |

- If it fails because a package needs its install script (for example `esbuild`, `sharp`, `@swc/core`): name the package and ask permission for `npm rebuild <package>`; only that one.
- `.env`: only if `.env.example` exists, copy it as `.env` with the sample values. Never real keys.
- Start the server **in the background** with the chosen script, read the port from its output and check that it answers (`curl -sI http://localhost:<port>`).
- Static HTML without Node: `python -m http.server 4173 --directory "<SOURCE>"`. PHP/Laravel or similar without the tools installed: stay at level 1 and say so.
- If it does not build: stay at level 1, copy the 10 key lines of the error into the report and go on.
- With the server up, run steps L2 and L3 against `http://localhost:<port>`. When finished, **stop the server**.

## 7. Live mode

**L1 · Level 1 (quick)**
`node "<SKILL_DIR>/scripts/capture-live.mjs" "<url>" --out "<STUDY>/capture" --viewports 1280x800 --steps 0 --hover 0 --no-reduced`

**L2 · Level 2 (full)**
`node "<SKILL_DIR>/scripts/capture-live.mjs" "<url>" --out "<STUDY>/capture" --video --nav`
For each window (1280×800 and 375×812) it does: probe on load, mouse path and hover (desktop only), scroll in 8 steps with the wheel, a click on an internal link with screenshots at 0–1800 ms, a final probe and a record of **every** CSS animation or Web Animation that appears and in which phase. At the end, a pass with `prefers-reduced-motion: reduce`.
- Read the summary it prints and then **look at the screenshots** (`00-load.png`, `01-hover-*.png`, `02-scroll-*.png`, `03-nav-*.png`).
- Read `capture/live-1280x800/animations-seen.json` (what was animated, when and with which values), `probe-final.json` (GSAP and ScrollTrigger if exposed, CSS, variables) and `capture/network.json` (libraries found in the downloaded JS, even if bundled, and source maps).
- If it says «BLOCKED»: stop (rule 4). Report and offer to study the repo if the user has it.

**L3 · Per-frame tracks (JS-made effects)**
An effect that is seen in the screenshots but does not appear in `animations-seen.json` is moved by JavaScript (bundled GSAP, `requestAnimationFrame`, smooth scroll). To measure it:
1. Choose up to 4 **stable** selectors of those elements (id, class or `data-*` attribute), taken from the probe or the DOM.
2. `node "<SKILL_DIR>/scripts/capture-live.mjs" "<url>" --out "<STUDY>/tracks" --viewports 1280x800 --no-reduced --track "<sel1>,<sel2>"`
3. In `tracks/live-1280x800/tracks.json` each segment carries the channel (`opacity`, `tx`, `ty`, `scale`, `rotation`, `clip0..3`, `filter0..1`), from→to, duration, whether it is **linked to scroll** (scrub) and the 3 curves that fit best, with their error.
4. Reading the fit error: ≤ 0.02 → the curve is that one; 0.02–0.05 → probable, say so; > 0.05 → own or composite curve: report the raw curve and do not name it. For segments linked to scroll the curve depends on the scroll, not on time: report `start`/`end` and `scrub`, not an easing.

**L4 · Bundled libraries**
If `network.json` found a library in the downloaded code (`codeSignatures`) but it is not on `window`, it is bundled: its values come from the tracks (L3), not from reading its configuration. If there are public source maps, you can read them with the browser tool to **locate** the original code of an effect. The location is cited; the code is not copied.

## 8. Common steps

**C1 · Inventory of effects**
One row per effect, with id `E1…En`:

| Id | Effect | Where | Trigger | Mechanism | Values | Origin |
|---|---|---|---|---|---|---|
| E1 | Titles that rise on entering | `h2.section-title` | scroll (enters viewport) | GSAP + ScrollTrigger | `ty` 40→0 px, 800 ms, power3.out, stagger 0.08 s, start `top 80%` | Measured (track) + Code `src/anim.ts:42` |

- Valid triggers: `load`, `scroll (enters viewport)`, `scroll (linked / scrub)`, `scroll (pinned)`, `hover`, `mouse (follows cursor)`, `click`, `navigation`, `continuous (loop)`.
- Minimum values: animated properties, duration, delay, curve and, if it applies, stagger, start/end, scrub and pin.
- With `--focus`: the inventory carries that effect in full and only a short list of the rest.

**C2 · Accessibility and performance of the motion**
- Reduced motion: the verdict of `reduced-motion.json` (or «not measured» in manual mode).
- Costly properties: animating `top`, `left`, `width`, `height`, `margin` or `box-shadow` forces the page to recalculate; `transform`, `opacity` and `filter` do not. Point out the effects that use the costly ones.
- Hijacked scroll (Lenis, Locomotive, ScrollSmoother): say so, because it changes how scrolling feels and affects the keyboard and screen readers.
- Amount of `canvas` / WebGL and weight of the libraries (in `network.json`).

**C3 · Reproduction (level 3)**
1. Ask which effects to reproduce (by default, the 3 most distinctive of the inventory).
2. For each one write `repro/E<n>.html`: an independent page, with **your own content**, the same library and **the same version** pinned from `https://cdn.jsdelivr.net/npm/<package>@<version>/…` (or CSS only if the original is CSS), and the values of the inventory. Give it enough height if the effect depends on scroll.
3. Measure the reproduction with the same method as the original:
   `node "<SKILL_DIR>/scripts/capture-live.mjs" "file:///<STUDY>/repro/E<n>.html" --out "<STUDY>/repro/capture-E<n>" --viewports 1280x800 --no-reduced --hover 0 --track "<own selector>"`
4. Compare:
   `node "<SKILL_DIR>/scripts/compare-motion.mjs" "<STUDY>/tracks/live-1280x800/tracks.json" "<STUDY>/repro/capture-E<n>/live-1280x800/tracks.json" --channel <channel>`
   For CSS animations, compare the `animations-seen.json` of both.
5. Code 0 → done. Code 1 → adjust the values and repeat, **at most 3 attempts**; then report what does not match and why.

**C4 · Report**
Write `STUDY/report.md` from `reference/report-template.md`. Include the screenshot paths, do not embed them.

**C5 · Delivery to the user (8 lines at most)**
1. Stack and libraries (with version).
2. The 3 most distinctive effects, with their values.
3. License and what it allows.
4. Reduced motion and performance, in one line.
5. What stayed inferred or unmeasured.
6. Where the report is.
7. Suggested next step: use the report as a reference in `jayka-style-build`, or the animation and design tools you have installed (see `jayka-companion-tools`).
Do not implement anything in the user's project: that is another task, on request.

## 9. If something fails

| Situation | What to do |
|---|---|
| `--check` exits with 3 and the user does not want to install | Manual mode (Step 0); the report says so |
| The site blocks, 401/403/429 or captcha | Stop; report; do not evade |
| The probe counts `blockedSheets` | Normal for CSS from another domain: use `network.json` → `css`, which analyzes it from the network |
| GSAP detected in `network.json` but not on `window` | It is bundled: measure with tracks (L3) |
| `scrollY` does not change when scrolling | Scroll done with `transform` (Locomotive v4, ScrollSmoother): put a track on the container that moves |
| Infinite or very tall page | Limit with `--steps`; the report says how far it was walked |
| Content behind a login | It is not studied; report it |
| The repo does not build | Stay at level 1 with the error in the report |
| A track detects no segments | The selector did not move or does not exist: check the selector with the probe and repeat |

## 10. What it does NOT do
- It does not copy or publish other people's code, texts, images or brand.
- It does not implement anything in your project.
- It does not evade protections, log in or submit forms.
- It does not write outside `STUDY` and `TOOLS`.

## My settings
<!-- Change here the default level, the windows (--viewports), the scroll steps, the compare-motion tolerance or the study folder. What you put here wins over the above. -->
