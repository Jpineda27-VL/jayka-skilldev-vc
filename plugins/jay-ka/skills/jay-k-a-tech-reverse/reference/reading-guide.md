# Guía de lectura: de la señal al mecanismo

Cómo convertir lo que sale de `scan-repo.mjs`, `capture-live.mjs` y la sonda en un mecanismo concreto con valores. Si una señal no aparece en esta guía, descríbela tal cual y márcala como `Inferido`.

## 1. ¿Quién mueve el elemento?

| Señal | Mecanismo | Dónde están los valores |
|---|---|---|
| Aparece en `animaciones-vistas.json` con `tipo: CSSTransition` | Transición CSS | `duracionMs`, `curva`, `nombre` (la propiedad) |
| `tipo: CSSAnimation` | `@keyframes` | `nombre` = nombre del keyframe; búscalo en el CSS para ver los fotogramas |
| `tipo: Animation` con `linea: DocumentTimeline` | Web Animations API: `el.animate()`, Motion (`motion` / `framer-motion` usan WAAPI cuando pueden) | `duracionMs`, `curva`, `propiedades`, `fotogramas` |
| `linea: ScrollTimeline` o `ViewTimeline` | Animación CSS ligada al scroll (`animation-timeline`) | El CSS: `animation-timeline`, `animation-range` |
| Se ve en capturas, **no** en `animaciones-vistas.json`, `sonda.gsap.tweens` tiene entradas | GSAP expuesto en `window` | `sonda.gsap.tweens` (duración en **segundos**), `sonda.gsap.scrollTriggers` |
| Se ve, no está en ninguna de las dos, `red.json` → `firmasEnCodigo` incluye GSAP | GSAP empaquetado | Pistas (`--track`) |
| Se ve, nada de lo anterior | `requestAnimationFrame` propio, canvas o WebGL | Pistas si es DOM; si es `canvas`, solo `Inferido` desde capturas o video |

## 2. Scroll

| Señal | Significado |
|---|---|
| `html.lenis`, `window.Lenis` o `lenis` en `red.json` | Scroll suave con Lenis: el scroll de la ventana se interpola. `sonda.scroll.lenisInstancia` trae sus opciones si la instancia está en `window.lenis` |
| `[data-scroll-container]`, `html.has-scroll-smooth` | Locomotive Scroll: en la v4 la página se mueve con `transform` y `scrollY` se queda en 0 |
| `#smooth-wrapper` + `#smooth-content` | GSAP ScrollSmoother |
| `scrollTriggers[].pin: true` | Sección fijada mientras avanza el scroll. `inicioPx`/`finPx` dicen cuánto dura en píxeles |
| `scrollTriggers[].scrub` | `true` = sigue al scroll exacto; un número = sigue con ese retraso en segundos |
| Tramo con `ligadoAlScroll: true` | Efecto scrub; su «curva» depende de cómo se hizo scroll, no del tiempo |
| `scroll-snap-type` en CSS | Secciones que encajan solas |
| `[data-aos]` | AOS: el tipo de efecto está en el valor del atributo (`fade-up`, `zoom-in`…), duración en `data-aos-duration` |

## 3. Transición entre páginas

| Señal | Mecanismo |
|---|---|
| `navegacion.tipo` = recarga completa y hay `@view-transition { navigation: auto }` | View Transitions entre documentos (MPA) |
| Sin recarga y `startViewTransition` en el código | View Transitions en SPA |
| Sin recarga y Barba, Swup, Highway o Taxi detectados | Librería de transición: las animaciones de salida y entrada suelen ser GSAP o CSS dentro de sus *hooks* |
| Sin recarga, Next/Nuxt/Astro, y `AnimatePresence` o `<ViewTransitions />` en código | Transición del framework |
| Capturas `03-nav-*` iguales salvo la última | No hay transición: corte directo |

## 4. Texto

| Señal | Mecanismo |
|---|---|
| SplitText, SplitType o Splitting.js detectados; muchos `span` / `div` por palabra o letra | Texto dividido y animado por partes con `stagger` |
| `clip-path: inset(...)` animado (`recorte0..3` en las pistas) | Revelado con máscara |
| `ty` de 100 % de la línea a 0 dentro de un contenedor con `overflow: hidden` | Texto que «sube» desde debajo de una máscara |

## 5. Curvas: equivalencias
GSAP llama `power1` a quad, `power2` a cubic, `power3` a quart y `power4` a quint. La columna `css` de `lib/curves.mjs` da la aproximación con `cubic-bezier` que se usa habitualmente. Las curvas exactas de GSAP no son Bézier, así que la aproximación CSS coincide a la vista pero no punto por punto.

Palabras clave de CSS:

| Palabra | Equivale a |
|---|---|
| `ease` | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| `ease-in` | `cubic-bezier(0.42, 0, 1, 1)` |
| `ease-out` | `cubic-bezier(0, 0, 0.58, 1)` |
| `ease-in-out` | `cubic-bezier(0.42, 0, 0.58, 1)` |

Spring (Motion, react-spring): no tiene duración fija. Informa `stiffness`, `damping` y `mass` del código; la pista dará una duración aproximada y una curva con error alto, lo cual es normal.

## 6. Unidades
- GSAP y Motion: duración en **segundos** en el código.
- react-spring: milisegundos.
- `animaciones-vistas.json`, pistas y CSS normalizado: **milisegundos**.
Convierte todo a milisegundos en el informe y anota la unidad original junto a la evidencia de código.

## 7. Calidad de la medición
- Las pistas muestrean a la frecuencia de fotogramas (unos 16 ms): la duración tiene ±20 ms de margen.
- El retraso real de una animación disparada por scroll depende de cuándo cruzó el umbral; usa `start`/`end` de ScrollTrigger o el código, no el tiempo medido.
- Una curva con error ≤ 0.02 se nombra; entre 0.02 y 0.05 se nombra como «probable»; por encima, no se nombra.
- En celular (375 px) no hay hover ni rueda: el scroll se hace con `scrollTo` y las librerías de scroll suave pueden comportarse distinto. Dilo si los resultados difieren entre ventanas.
