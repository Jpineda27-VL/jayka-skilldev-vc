# Matching identity with profiles, and deriving palettes

## 1. Comparison dimensions
Compare the interview (or the mini-questionnaire) with each profile on these dimensions. Score 0 (does not match), 1 (partial), 2 (matches) and **explain each score with evidence**.

| Dimension | Where it comes from in the interview | Where it comes from in the profile |
|---|---|---|
| Feeling | `identity.feeling` | Section 1 (feeling in 5 words) |
| Color family | `identity.tones` and `identity.avoid` | Section 3 (roles, harmony) |
| Typography | `identity.typography` | Section 4 |
| Imagery | `identity.imagery` | Section 9 |
| Density | `identity.density` | Sections 5, 8 |
| Mode | `identity.mode` | Section 3 (dark) |
| Audience and tone | `project.user`, `identity.references` | Section 1 and voice of the texts |
| Platform | `tech.platform`, `quality.devices` | Section 2 and mobile layouts |
| Technology | `tech.frontend` | Section 2 |

Rules:
- A tone the user wanted to **avoid** (`identity.avoid`) that the profile uses as primary is a **veto**: do not propose it, or say so clearly.
- Technology weighs little for style, but a lot for effort: if the tokens do not carry over, say so («CSS variables must be translated into a Tailwind theme»).
- If two profiles tie, prefer the one with a positive **«Results and lessons»**.
- If none reaches 10 out of 18, do not force it: «none fits well» and move on to new directions.

## 2. Feeling synonyms (to interpret answers)
- **Warm / welcoming:** cream or ivory backgrounds, terracotta, coral or gold accents, rounded corners, photos with natural light.
- **Festive / cheerful:** saturated and contrasting colors, organic shapes, patterns or stripes, light motion.
- **Sober / corporate:** cool neutrals, a single accent, strict grid, little decoration, neutral typography.
- **Technical / precise:** monospaced in data, thin lines, high density, cool accents, lots of visible data.
- **Elegant / premium:** high contrast, lots of white space, serif or very thin typography, restrained palette.
- **Youthful / energetic:** vivid color, large shapes, heavy typography, marked motion.
- **Brutalist / raw:** thick borders, hard shadows without blur, large type, flat palette.
- **Minimalist:** few elements, clear typographic hierarchy, almost no color.
If the user uses a word that is not here, ask what concrete example they have in mind.

## 3. Deriving a palette from loose tones
When there are only color families («red, blue, green»), do not pick three colors and paste them together. Follow this:
1. **Choose a protagonist** (the tone that most defines the feeling) and a contrasting **accent**; the third one, if there is one, is for support or state (success, warning).
2. Work in **OKLCH** (or HSL if there is nothing better): fix a hue and vary lightness and chroma.
3. **Neutrals with intent:** never pure gray. Tint them toward the protagonist hue (low chroma) or toward its warm/cool opposite depending on the feeling.
4. **Mandatory roles:** background, surface, text, soft text, primary, accent, success, warning, danger, border, focus. All with a concrete value.
5. **Scale per role:** 3 or 4 steps (soft, base, strong, text on it).
6. **Check contrast** (WCAG): normal text ≥ 4.5:1, large text ≥ 3:1, components and icons ≥ 3:1. Soft text on background ≥ 4.5:1. Text on primary and on accent ≥ 4.5:1. If a color the user likes does not pass for text, use it for shapes and not for text, and say so. Use `jayka-style-self-learning/scripts/contrast.mjs`.
7. **Dark mode** (if requested): do not invert; lower the lightness of surfaces, raise the accent chroma a little and re-check contrast.
8. A **danger** and a **success** color that do not clash with the protagonist (for example, if the primary is red, danger needs another treatment so it is not confused).
9. Always deliver the palette with **hex values**, the **measured contrast pair** and one sentence on why it works.

## 4. Carrying tokens from a profile to another technology
- CSS variables → Tailwind theme: each color variable goes to `theme.extend.colors`; radii to `borderRadius`; spacing to `spacing`.
- Tailwind → CSS variables: generate `:root { --color-… }` from the theme.
- Web → mobile app: a theme file (`theme.ts`) with the same keys; `rem` values become scaled numbers.
- Keep **role names**, not value names (`primary`, not `blue-600`).

## 5. What to say when there are no profiles
«There are no profiles in the library yet. I can propose three new directions or, better, study one of your finished projects with `jayka-style-self-learning` so next time it comes out more tailored to you.»
