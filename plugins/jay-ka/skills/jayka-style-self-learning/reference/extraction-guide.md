# Extraction guide (read-only)

Use the environment's file search tools (do not modify anything). The patterns are regular expressions. Adapt them to the framework you find.

## 1. Technology
- `package.json` (and `composer.json`, `pubspec.yaml`, `requirements.txt` if present): interface dependencies.
- Configuration files: `tailwind.config.*`, `postcss.config.*`, `vite.config.*`, `next.config.*`, `astro.config.*`, `app.json` (Expo), `components.json` (shadcn).
- **Animation and scroll:** look for these names in dependencies and imports: `gsap`, `ScrollTrigger`, `framer-motion`, `motion`, `lenis`, `locomotive-scroll`, `aos`, `lottie`, `three`, `react-spring`, `@react-spring`, `anime`, `swiper`, `embla`. In CSS: `@keyframes`, `animation:`, `transition:`, `scroll-behavior`, `scroll-snap`, `view-transition`, `animation-timeline`.
- **Icons:** `lucide`, `heroicons`, `phosphor`, `tabler`, `fontawesome`, `material-icons`, `react-icons`, or loose SVGs / an own icons file.
- **Charts:** `recharts`, `chart.js`, `d3`, `echarts`, `apexcharts`, `visx`, or hand-made SVG.
- **Fonts:** `@font-face`, `fonts.googleapis.com`, `next/font`, `@fontsource`, `font-family`.

## 2. Tokens in the code
- CSS variables: `^\s*--[\w-]+\s*:`  (in `*.css`, `*.scss`).
- Tailwind theme: the `theme.extend` key in `tailwind.config.*`.
- SCSS/Less variables: `^\s*[\$@][\w-]+\s*:`.
- Loose colors (to measure frequency): `#[0-9a-fA-F]{3,8}\b`, `rgba?\(`, `hsla?\(`. Normalize `#abc` to `#aabbcc` and group. Leave out pure black and white when looking for the palette, but note them.
- Text sizes: `font-size\s*:`; weights: `font-weight\s*:`.
- Spacing: `(margin|padding|gap)\s*:` and utility classes (`p-4`, `gap-6`…).
- Radii, shadows, borders: `border-radius\s*:`, `box-shadow\s*:`, `border\s*:`.
- Breakpoints: `@media\s*\(`.
- Dark mode: `prefers-color-scheme`, `[data-theme`, `.dark`.
- Reduced motion: `prefers-reduced-motion`.

## 3. Components and views
- Typical folders: `components/`, `ui/`, `partials/`, `views/`, `resources/views`, `app/`, `pages/`, `screens/`.
- For each repeated component, note variants (props or `--variant` classes) and states (`:hover`, `:focus-visible`, `[disabled]`, `aria-*`).
- Layouts: find the main layout file (`layout`, `_app`, `app.blade.php`, `RootLayout`).

## 4. Contrast (WCAG 2.x)
Relative luminance: `L = 0.2126·R + 0.7152·G + 0.0722·B`, with each channel `c = C/255` converted to `c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`.
Contrast ratio: `(L1 + 0.05) / (L2 + 0.05)` with `L1` the larger.
Thresholds: normal text AA 4.5:1 (AAA 7:1); large text (≥ 24 px, or ≥ 18.66 px bold) AA 3:1; components and icons 3:1.
Calculate with `scripts/contrast.mjs` (for example `node scripts/contrast.mjs "#26264F" "#FFF8EF"`). Do not use external sites with the project's data.

## 5. Browser measurement (optional, read-only)
The probe is in `scripts/style-probe.js` and runs with the capture tool of `jayka-reverse` (see Step 5 of `SKILL.md`). It measures backgrounds, text colors, borders, families, size/weight/line height, radii, paddings, gaps, shadows, `:root` variables, loaded fonts and the real contrast of every visible text/background pair.

Notes:
- Colors come out in hex; with transparency they are shown as `#RRGGBB / alpha`.
- Measure on desktop (1280 px wide) and on mobile (375 px); note the differences.
- Also measure a key interactive state (focus of a button or field) if possible, by hand with the browser tool.
- If a library does not appear on `window`, it does not mean it is unused (it may be bundled): confirm in `package.json`.

## 6. What NOT to do
- Do not open or copy `.env` or credentials.
- Do not log in with real accounts or submit forms.
- Do not save screenshots with clients' personal data: ask the user for a test account or crop.
- Do not copy the project's own texts, logos or photos into the profile.
