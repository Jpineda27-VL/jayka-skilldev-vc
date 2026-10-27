# Reverse engineering · <name of the target>

- **Target:** <url or repo>
- **Mode and level:** <live|repo> · level <1|2|3>
- **Date:** <YYYY-MM-DD>
- **Capture method:** <capture-live.mjs with Playwright | manual with <tool>>
- **Focus:** <requested effect or «complete»>

## 1. Summary
<3 to 5 lines: what it is, what it is made with and what makes it different.>

## 2. License
- **Class:** <Permissive | Copyleft | Commercial | No license | Not applicable (live site)>
- **Evidence:** <file or field>
- **What it allows:** <one line>

## 3. Stack
| Layer | Technology | Version | Origin |
|---|---|---|---|
| Framework | | | |
| Styles | | | |
| Animation | | | |
| Scroll | | | |
| Page transition | | | |
| 3D / canvas / vector | | | |
| Builder / CMS | | | |

## 4. Inventory of effects
| Id | Effect | Where | Trigger | Mechanism | Values | Origin |
|---|---|---|---|---|---|---|
| E1 | | | | | | |

### Detail per effect
#### E1 · <name>
- **What is seen:** <short description, with reference to screenshots: `capture/live-1280x800/02-scroll-03.png`>
- **How it works:** <mechanism in 2 or 3 lines>
- **Values:** <properties, duration (ms), delay, curve, stagger, start/end, scrub, pin>
- **Evidence:** <Measured: JSON file and field | Code: file:line | Inferred: why>
- **How to reproduce it:** <recipe in words, without copying its code>

## 5. Accessibility and performance of the motion
- **Reduced motion:** <verdict and figures>
- **Costly properties animated:** <list or «none»>
- **Hijacked scroll:** <yes/no and with what>
- **Weight:** <libraries and canvas/WebGL>

## 6. Reproductions (level 3)
| Id | File | Comparison | Result |
|---|---|---|---|
| E1 | `repro/E1.html` | `compare-motion.mjs` channel <channel> | ✓ / ✗ <reason> |

## 7. What stayed unmeasured or inferred
- <point and reason>

## 8. How to use this
- <what is worth carrying to your own project and what is not>
- <next suggested skill or tool>

## Files
- `repo-findings.json` · `capture/summary.json` · `capture/network.json` · `capture/live-*/` · `tracks/` · `repro/`
