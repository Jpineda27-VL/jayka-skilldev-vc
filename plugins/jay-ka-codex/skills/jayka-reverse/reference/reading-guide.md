# Reading guide: from signal to mechanism

How to turn what comes out of `scan-repo.mjs`, `capture-live.mjs` and the probe into a concrete mechanism with values. If a signal is not in this guide, describe it as it is and mark it `Inferred`.

## 1. Who moves the element?

| Signal | Mechanism | Where the values are |
|---|---|---|
| Appears in `animations-seen.json` with `type: CSSTransition` | CSS transition | `durationMs`, `easing`, `name` (the property) |
| `type: CSSAnimation` | `@keyframes` | `name` = name of the keyframes; look it up in the CSS to see the frames |
| `type: Animation` with `timeline: DocumentTimeline` | Web Animations API: `el.animate()`, Motion (`motion` / `framer-motion` use WAAPI when they can) | `durationMs`, `easing`, `properties`, `keyframes` |
| `timeline: ScrollTimeline` or `ViewTimeline` | CSS animation linked to scroll (`animation-timeline`) | The CSS: `animation-timeline`, `animation-range` |
| Seen in screenshots, **not** in `animations-seen.json`, `probe.gsap.tweens` has entries | GSAP exposed on `window` | `probe.gsap.tweens` (duration in **seconds**), `probe.gsap.scrollTriggers` |
| Seen, in neither of the two, `network.json` → `codeSignatures` includes GSAP | Bundled GSAP | Tracks (`--track`) |
| Seen, none of the above | Own `requestAnimationFrame`, canvas or WebGL | Tracks if it is DOM; if it is `canvas`, only `Inferred` from screenshots or video |

## 2. Scroll

| Signal | Meaning |
|---|---|
| `html.lenis`, `window.Lenis` or `lenis` in `network.json` | Smooth scroll with Lenis: the window scroll is interpolated. `probe.scroll.lenisInstance` carries its options if the instance is at `window.lenis` |
| `[data-scroll-container]`, `html.has-scroll-smooth` | Locomotive Scroll: in v4 the page moves with `transform` and `scrollY` stays at 0 |
| `#smooth-wrapper` + `#smooth-content` | GSAP ScrollSmoother |
| `scrollTriggers[].pin: true` | Section pinned while scroll advances. `startPx`/`endPx` say how long it lasts in pixels |
| `scrollTriggers[].scrub` | `true` = follows the scroll exactly; a number = follows with that delay in seconds |
| Segment with `scrollLinked: true` | Scrub effect; its «curve» depends on how the scrolling was done, not on time |
| `scroll-snap-type` in CSS | Sections that snap into place |
| `[data-aos]` | AOS: the effect type is in the attribute value (`fade-up`, `zoom-in`…), duration in `data-aos-duration` |

## 3. Page transition

| Signal | Mechanism |
|---|---|
| `navigation.type` = full reload and there is `@view-transition { navigation: auto }` | View Transitions between documents (MPA) |
| No reload and `startViewTransition` in the code | View Transitions in an SPA |
| No reload and Barba, Swup, Highway or Taxi detected | Transition library: the exit and enter animations are usually GSAP or CSS inside its *hooks* |
| No reload, Next/Nuxt/Astro, and `AnimatePresence` or `<ViewTransitions />` in code | Framework transition |
| `03-nav-*` screenshots the same except the last | No transition: a direct cut |

## 4. Text

| Signal | Mechanism |
|---|---|
| SplitText, SplitType or Splitting.js detected; many `span` / `div` per word or letter | Text split and animated by parts with `stagger` |
| Animated `clip-path: inset(...)` (`clip0..3` in the tracks) | Reveal with a mask |
| `ty` from 100 % of the line to 0 inside a container with `overflow: hidden` | Text that «rises» from below a mask |

## 5. Curves: equivalences
GSAP calls `power1` quad, `power2` cubic, `power3` quart and `power4` quint. The `css` column of `lib/curves.mjs` gives the usual `cubic-bezier` approximation. GSAP's exact curves are not Bézier, so the CSS approximation matches by eye but not point by point.

CSS keywords:

| Keyword | Equals |
|---|---|
| `ease` | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| `ease-in` | `cubic-bezier(0.42, 0, 1, 1)` |
| `ease-out` | `cubic-bezier(0, 0, 0.58, 1)` |
| `ease-in-out` | `cubic-bezier(0.42, 0, 0.58, 1)` |

Spring (Motion, react-spring): it has no fixed duration. Report `stiffness`, `damping` and `mass` from the code; the track will give an approximate duration and a curve with a high error, which is normal.

## 6. Units
- GSAP and Motion: duration in **seconds** in the code.
- react-spring: milliseconds.
- `animations-seen.json`, tracks and normalized CSS: **milliseconds**.
Convert everything to milliseconds in the report and note the original unit next to the code evidence.

## 7. Quality of the measurement
- Tracks sample at the frame rate (about 16 ms): the duration has a ±20 ms margin.
- The real delay of a scroll-triggered animation depends on when it crossed the threshold; use ScrollTrigger's `start`/`end` or the code, not the measured time.
- A curve with error ≤ 0.02 is named; between 0.02 and 0.05 it is named as «probable»; above that, it is not named.
- On mobile (375 px) there is no hover or wheel: scrolling is done with `scrollTo` and smooth-scroll libraries may behave differently. Say so if results differ between windows.
