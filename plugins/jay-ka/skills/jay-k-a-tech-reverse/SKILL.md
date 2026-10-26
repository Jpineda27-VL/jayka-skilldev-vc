---
name: jay-k-a-tech-reverse
description: Ingeniería inversa de un sitio en vivo o de un repositorio/template ajeno. Detecta stack y librerías, mide animaciones, transiciones y scroll con Playwright (duración, curva, disparador), deduce el easing de animaciones hechas con JS, revisa licencia y entrega un informe con evidencia y reproducciones mínimas verificadas. Invócala con /jay-k-a-tech-reverse live <url> o /jay-k-a-tech-reverse repo <ruta-o-url-git>.
argument-hint: "live <url> | repo <ruta-o-url-git> [--nivel 1|2|3] [--foco \"<efecto>\"]"
disable-model-invocation: true
---

# JayKA · Tech · Reverse

Estudia **algo ajeno** (un sitio publicado, un repositorio o un template) para entender **cómo está hecho** y poder reproducir sus técnicas con contenido propio. Es distinta de `jay-k-a-style-self-learning`, que estudia **tus** proyectos y guarda tu estilo. Aquí el resultado es un **informe técnico** con evidencia medida, no una ficha personal.

Esta skill es un **contrato de ejecución**: cada paso dice qué entra, qué comando se corre, qué debe salir y qué hacer si falla. Si un paso no se puede cumplir, se dice en el informe; no se rellena con suposiciones.

Argumentos recibidos: `$ARGUMENTS`

## 1. Cómo leer los argumentos

Forma: `<modo> <objetivo> [--nivel 1|2|3] [--foco "<efecto>"]`

| Modo | Alias aceptados | Objetivo válido |
|---|---|---|
| `live` | `online`, `web` | URL `http://` o `https://` |
| `repo` | `local`, `git` | ruta local que exista, o URL git (`https://github.com/…`, `https://gitlab.com/…`, `git@…`, termina en `.git`) |

Reglas, en este orden. Aplica la primera que corresponda y no improvises otra:
1. La primera palabra (en minúsculas) decide el modo según la tabla.
2. **Sin modo**: si el objetivo es una URL de `github.com`, `gitlab.com`, `bitbucket.org` o `codeberg.org` → `repo`; si es otra URL → `live`; si es una ruta que existe → `repo`. Escribe una línea: «Modo inferido: `<modo>`.» y sigue.
3. `live` con una URL de `github.com/<usuario>/<repo>` (no `github.io`) → pregunta una sola cosa: «¿Estudio el código (repo) o la página publicada (live)?».
4. `live` sin `http(s)://` → antepón `https://` y dilo en una línea.
5. Falta el objetivo o no es válido → responde solo: «Falta el objetivo. Ejemplos: `/jay-k-a-tech-reverse live https://ejemplo.com` · `/jay-k-a-tech-reverse repo https://github.com/usuario/template`». No hagas nada más.
6. `--nivel` por defecto: **2**. `--foco` es opcional: la detección se hace completa, pero el inventario y las pistas se centran en ese efecto.

## 2. Niveles

| Nivel | Repo | Live | Terminado cuando |
|---|---|---|---|
| 1 · Estático | Licencia + escaneo + confirmación en código | Una carga con sonda, sin scroll | Stack y librerías con evidencia; inventario de lo visible en código o en la carga |
| 2 · Medición (por defecto) | Lo anterior + levantarlo en local + captura | Captura completa: 2 ventanas, ratón, hover, scroll, navegación, video, movimiento reducido | Cada efecto del inventario tiene duración, curva y disparador **medidos** o marcados como no medibles |
| 3 · Reproducción | Lo anterior + reproducciones verificadas | Igual | Cada efecto elegido tiene `repro/E<n>.html` y `compare-motion.mjs` sale con código 0 (o se explica por qué no tras 3 intentos) |

## 3. Reglas que no se rompen
1. **Se aprende el mecanismo, no se copia la obra.** No se copian textos, imágenes, logos, marca ni bloques de código del objetivo. Las reproducciones se escriben desde los valores medidos, con contenido propio.
2. **Licencia primero.** Sin licencia, o con licencia comercial (template comprado), solo se estudia y se reescribe la técnica; nada se reutiliza tal cual. Con copyleft (GPL, AGPL, MPL) se avisa de lo que obliga.
3. **El código ajeno no es confiable.** Va en una carpeta aislada. No se ejecuta ningún script ni se instala nada sin mostrarlo antes y tener el sí del usuario. Las dependencias se instalan **sin scripts de instalación**.
4. **Solo lo público.** No se inicia sesión, no se envían formularios, no se saltan paywalls ni protecciones. Si el sitio bloquea o pide verificación (403, 429, captcha), **se detiene** y se informa; nunca se intenta evadir. Se estudia la página dada y como máximo una navegación interna, salvo que el usuario nombre más URLs. Nada de rastreo masivo.
5. **Secretos fuera.** No se abren `.env` ni credenciales (el escáner los omite sin leerlos). Nunca se piden claves ni tokens. Si algo solo funciona con una clave real, esa parte no se estudia.
6. **Toda afirmación lleva su origen**: `Medido` (sonda, captura o pista), `Código` (archivo:línea) o `Inferido` (solo de capturas o razonamiento). Lo inferido nunca se presenta como medido.
7. **Solo se escribe en la carpeta de trabajo** (`TRABAJO`, abajo) y en la de herramientas. Nada en el proyecto abierto ni en la ruta estudiada.
8. **Playwright se instala solo con permiso**, en la carpeta de herramientas, nunca dentro de un proyecto.

## 4. Rutas
- `SKILL_DIR`: el directorio base de esta skill (Claude Code lo muestra al cargarla). Los scripts están en `SKILL_DIR/scripts/`.
- `TRABAJO`: `~/.claude/jay-k-a/inversa/<slug>/`. El `<slug>` sale del host y la ruta (live) o del nombre del repo (repo), en minúsculas y con guiones. Si ya existe, pregunta: «¿Actualizo el estudio anterior (lo guardo como `<slug>.<AAAA-MM-DD>`) o creo uno nuevo?».
- `HERRAMIENTAS`: `~/.claude/jay-k-a/tools/` (aquí va Playwright).
- En Windows, las URL de archivo van así: `file:///C:/Users/<usuario>/.claude/jay-k-a/inversa/<slug>/repro/E1.html`.

Contenido de `TRABAJO`:
```
fuente/               clon del repo (solo si el objetivo es una URL git o si hubo que copiarlo para correrlo)
hallazgos-repo.json   salida de scan-repo.mjs
captura/              salida de capture-live.mjs (una subcarpeta por ventana, red.json, resumen.json)
pistas/               capturas con --track para efectos hechos con JS
repro/                reproducciones mínimas propias y sus capturas
informe.md            el informe final
```

## 5. Paso 0 · Preparación (siempre)
1. `node --version` → hace falta 18 o más. Si no hay Node: detente y dilo; esta skill no funciona sin él.
2. Si el nivel es 2 o más, o el modo es `live`: `node "<SKILL_DIR>/scripts/capture-live.mjs" --check`
   - Código 0 → sigue.
   - Código 3 → pide permiso con el texto exacto: «Para medir hace falta Playwright con Chromium (unos 150 MB) en `~/.claude/jay-k-a/tools/`, fuera de tus proyectos. ¿Lo instalo?». Con el sí: `npm install --prefix "<HERRAMIENTAS>" playwright` y `npx --prefix "<HERRAMIENTAS>" playwright install chromium`; repite `--check`.
   - Si dice que no → **modo manual**: usa la herramienta de navegador disponible (Playwright MCP o el navegador integrado). Obtén la sonda con `node "<SKILL_DIR>/scripts/capture-live.mjs" --print-probe`, evalúala en la página, desplázate y toma capturas a mano. El informe dirá «captura manual: sin video, sin pistas por fotograma, sin pasada de movimiento reducido».
3. Anuncia en tres líneas: modo y objetivo, nivel, carpeta de trabajo. No pidas aprobación para el nivel 1; los permisos se piden en cada compuerta.

## 6. Modo repo

**R1 · Obtener la fuente**
- Ruta local: se usa tal cual, **solo lectura**.
- URL git: `git clone --depth 1 --no-recurse-submodules -c core.symlinks=false "<url>" "<TRABAJO>/fuente"`
- Si el clon falla (privado, no existe, pide credenciales): detente y responde «No pude clonarlo: es privado o no existe. Si es tuyo, clónalo tú y pásame la ruta local.». No pidas tokens.

**R2 · Licencia**
Lee `LICENSE*` / `COPYING*` y el campo `license` de `package.json`. Busca también textos de licencia comercial (por ejemplo «Envato», «ThemeForest», «Regular License», «single use»). Clasifica:

| Clase | Ejemplos | Qué se puede hacer |
|---|---|---|
| Permisiva | MIT, ISC, BSD, Apache-2.0, MIT-0, Unlicense, CC0 | Reutilizar con atribución según la licencia; igual se reescribe por la regla 1 |
| Copyleft | GPL, LGPL, AGPL, MPL | Reutilizar obliga a liberar bajo la misma licencia; se avisa |
| Comercial | Template comprado | Solo estudiar; uso según lo que diga la licencia comprada |
| Sin licencia | Ningún archivo ni campo | Todos los derechos reservados: solo estudiar |

**R3 · Escaneo**
`node "<SKILL_DIR>/scripts/scan-repo.mjs" "<FUENTE>" --out "<TRABAJO>/hallazgos-repo.json"`
- Sale un resumen con detecciones (`[categoría] librería — evidencia`), scripts de instalación marcados con ⚠ y estadísticas de movimiento en CSS y en código.
- Si no detecta nada y no hay movimiento: dilo («sitio estático sin animación detectable en código») y pasa al nivel 2 si corresponde; puede haber movimiento que solo se ve en ejecución.

**R4 · Confirmar en el código**
Un paquete en `package.json` sin uso en el código se informa como «instalada, no usada». Para cada detección busca dónde se inicializa y dónde se define cada efecto, y anota `archivo:línea`. Patrones de búsqueda: `gsap.registerPlugin`, `gsap.timeline`, `ScrollTrigger.create`, `scrollTrigger:`, `new Lenis`, `<motion.`, `AnimatePresence`, `useScroll`, `useTransform`, `layoutId`, `@keyframes`, `transition:`, `startViewTransition`, `view-transition-name`, `animation-timeline`, `IntersectionObserver`, `requestAnimationFrame`. La guía para interpretar cada señal está en `reference/reading-guide.md`.

**R5 · Correrlo (nivel 2 o más)**
Compuerta: muestra al usuario, sacado de `hallazgos-repo.json`, el gestor de paquetes, los scripts de instalación, el script que se va a correr (`dev`, `start` o `preview`) y si existe `.env.example`. Pregunta: «¿Instalo sus dependencias sin scripts de instalación y lo levanto en local?».
- Si la fuente es una ruta local, primero se **copia** a `<TRABAJO>/fuente` (`git clone "<ruta>" "<TRABAJO>/fuente"` si es repo git; si no, copia excluyendo `node_modules`). Nunca se instala en la ruta del usuario.
- Instalación según el gestor:

| Gestor | Comando |
|---|---|
| npm | `npm ci --ignore-scripts` (sin lockfile: `npm install --ignore-scripts`) |
| pnpm | `pnpm install --frozen-lockfile --ignore-scripts` |
| yarn 1 | `yarn install --frozen-lockfile --ignore-scripts` |
| yarn 2+ | `yarn install --immutable --mode=skip-build` |
| bun | `bun install --frozen-lockfile --ignore-scripts` |

- Si falla porque un paquete necesita su script de instalación (por ejemplo `esbuild`, `sharp`, `@swc/core`): nombra el paquete y pide permiso para `npm rebuild <paquete>`; solo ese.
- `.env`: solo si existe `.env.example`, se copia como `.env` con los valores de ejemplo. Nunca claves reales.
- Levanta el servidor **en segundo plano** con el script elegido, lee el puerto en su salida y comprueba que responde (`curl -sI http://localhost:<puerto>`).
- HTML estático sin Node: `python -m http.server 4173 --directory "<FUENTE>"`. PHP/Laravel o similar sin las herramientas instaladas: quédate en nivel 1 y dilo.
- Si no compila: quédate en nivel 1, copia al informe las 10 líneas clave del error y sigue.
- Con el servidor arriba, ejecuta los pasos L2 y L3 contra `http://localhost:<puerto>`. Al terminar, **detén el servidor**.

## 7. Modo live

**L1 · Nivel 1 (rápido)**
`node "<SKILL_DIR>/scripts/capture-live.mjs" "<url>" --out "<TRABAJO>/captura" --viewports 1280x800 --steps 0 --hover 0 --no-reduced`

**L2 · Nivel 2 (completo)**
`node "<SKILL_DIR>/scripts/capture-live.mjs" "<url>" --out "<TRABAJO>/captura" --video --nav`
Hace, por cada ventana (1280×800 y 375×812): sonda al cargar, recorrido del ratón y hover (solo escritorio), scroll en 8 pasos con rueda, clic en un enlace interno con capturas a 0–1800 ms, sonda final y registro de **cada** animación CSS o Web Animation que aparece y en qué fase. Al final, una pasada con `prefers-reduced-motion: reduce`.
- Lee el resumen que imprime y luego **mira las capturas** (`00-carga.png`, `01-hover-*.png`, `02-scroll-*.png`, `03-nav-*.png`).
- Lee `captura/live-1280x800/animaciones-vistas.json` (qué se animó, cuándo y con qué valores), `sonda-final.json` (GSAP y ScrollTrigger si están expuestos, CSS, variables) y `captura/red.json` (librerías encontradas en los JS descargados, aunque estén empaquetadas, y source maps).
- Si sale «BLOQUEADO»: detente (regla 4). Informa y ofrece estudiar el repo si el usuario lo tiene.

**L3 · Pistas por fotograma (efectos hechos con JS)**
Un efecto que se ve en las capturas pero no aparece en `animaciones-vistas.json` lo mueve JavaScript (GSAP empaquetado, `requestAnimationFrame`, scroll suave). Para medirlo:
1. Elige hasta 4 selectores **estables** de esos elementos (id, clase o atributo `data-*`), sacados de la sonda o del DOM.
2. `node "<SKILL_DIR>/scripts/capture-live.mjs" "<url>" --out "<TRABAJO>/pistas" --viewports 1280x800 --no-reduced --track "<sel1>,<sel2>"`
3. En `pistas/live-1280x800/pistas.json` cada tramo trae canal (`opacity`, `tx`, `ty`, `escala`, `rotacion`, `recorte0..3`, `filtro0..1`), desde→hasta, duración, si está **ligado al scroll** (scrub) y las 3 curvas que mejor ajustan, con su error.
4. Interpretación del error de ajuste: ≤ 0.02 → la curva es esa; 0.02–0.05 → probable, dilo así; > 0.05 → curva propia o compuesta: informa la curva cruda y no le pongas nombre. En tramos ligados al scroll la curva depende del scroll, no del tiempo: informa `start`/`end` y `scrub`, no un easing.

**L4 · Librerías empaquetadas**
Si `red.json` encontró una librería en el código descargado (`firmasEnCodigo`) pero no está en `window`, está empaquetada: sus valores salen de las pistas (L3), no de leer su configuración. Si hay source maps públicos, puedes leerlos con la herramienta de navegador para **ubicar** el código original de un efecto. Se cita la ubicación; no se copia el código.

## 8. Pasos comunes

**C1 · Inventario de efectos**
Una fila por efecto, con id `E1…En`:

| Id | Efecto | Dónde | Disparador | Mecanismo | Valores | Origen |
|---|---|---|---|---|---|---|
| E1 | Títulos que suben al entrar | `h2.section-title` | scroll (entra en pantalla) | GSAP + ScrollTrigger | `ty` 40→0 px, 800 ms, power3.out, stagger 0.08 s, start `top 80%` | Medido (pista) + Código `src/anim.ts:42` |

- Disparadores válidos: `carga`, `scroll (entra en pantalla)`, `scroll (ligado / scrub)`, `scroll (fijado / pin)`, `hover`, `ratón (sigue al cursor)`, `clic`, `navegación`, `continuo (bucle)`.
- Valores mínimos: propiedades animadas, duración, retraso, curva y, si aplica, stagger, start/end, scrub y pin.
- Con `--foco`: el inventario lleva ese efecto completo y del resto solo una lista corta.

**C2 · Accesibilidad y rendimiento del movimiento**
- Movimiento reducido: el veredicto de `movimiento-reducido.json` (o «no medido» en modo manual).
- Propiedades costosas: animar `top`, `left`, `width`, `height`, `margin` o `box-shadow` obliga a recalcular la página; `transform`, `opacity` y `filter` no. Señala los efectos que usan las costosas.
- Scroll secuestrado (Lenis, Locomotive, ScrollSmoother): dilo, porque cambia cómo se siente el scroll y afecta al teclado y a los lectores de pantalla.
- Cantidad de `canvas` / WebGL y peso de las librerías (en `red.json`).

**C3 · Reproducción (nivel 3)**
1. Pregunta qué efectos reproducir (por defecto, los 3 más distintivos del inventario).
2. Para cada uno escribe `repro/E<n>.html`: una página independiente, con **contenido propio**, la misma librería y **la misma versión** fijada desde `https://cdn.jsdelivr.net/npm/<paquete>@<versión>/…` (o solo CSS si el original es CSS), y los valores del inventario. Dale altura suficiente si el efecto depende del scroll.
3. Mide la reproducción con el mismo método que el original:
   `node "<SKILL_DIR>/scripts/capture-live.mjs" "file:///<TRABAJO>/repro/E<n>.html" --out "<TRABAJO>/repro/captura-E<n>" --viewports 1280x800 --no-reduced --hover 0 --track "<selector propio>"`
4. Compara:
   `node "<SKILL_DIR>/scripts/compare-motion.mjs" "<TRABAJO>/pistas/live-1280x800/pistas.json" "<TRABAJO>/repro/captura-E<n>/live-1280x800/pistas.json" --canal <canal>`
   Para animaciones CSS, compara los `animaciones-vistas.json` de ambos.
5. Código 0 → hecho. Código 1 → ajusta los valores y repite, **máximo 3 intentos**; después informa lo que no coincide y por qué.

**C4 · Informe**
Escribe `TRABAJO/informe.md` con `reference/report-template.md`. Incluye las rutas de las capturas, no las incrustes.

**C5 · Entrega al usuario (máximo 8 líneas)**
1. Stack y librerías (con versión).
2. Los 3 efectos más distintivos, con sus valores.
3. Licencia y lo que permite.
4. Movimiento reducido y rendimiento, en una línea.
5. Qué quedó inferido o sin medir.
6. Dónde está el informe.
7. Siguiente paso sugerido: usar el informe como referencia en `jay-k-a-style-build`, o las herramientas de animación y diseño que tengas instaladas (ver `jay-k-a-companion-tools`).
No implementes nada en el proyecto del usuario: eso es otra tarea, a pedido.

## 9. Si algo falla

| Situación | Qué hacer |
|---|---|
| `--check` sale con 3 y el usuario no quiere instalar | Modo manual (Paso 0); el informe lo dice |
| Sitio bloquea, 401/403/429 o captcha | Detenerse; informar; no evadir |
| La sonda cuenta `hojasBloqueadas` | Normal en CSS de otro dominio: usa `red.json` → `css`, que lo analiza desde la red |
| GSAP detectado en `red.json` pero no en `window` | Está empaquetado: mide con pistas (L3) |
| `scrollY` no cambia al hacer scroll | Scroll con `transform` (Locomotive v4, ScrollSmoother): pon una pista sobre el contenedor que se mueve |
| Página infinita o muy alta | Limita con `--steps`; el informe dice hasta dónde se recorrió |
| Contenido detrás de login | No se estudia; se informa |
| El repo no compila | Quedarse en nivel 1 con el error en el informe |
| Una pista no detecta tramos | El selector no se movió o no existe: comprueba el selector con la sonda y repite |

## 10. Qué NO hace
- No copia ni publica código, textos, imágenes ni marca ajenos.
- No implementa nada en tu proyecto.
- No evade protecciones, no inicia sesión, no envía formularios.
- No escribe fuera de `TRABAJO` y `HERRAMIENTAS`.

## Mis ajustes
<!-- Cambia aquí el nivel por defecto, las ventanas (--viewports), los pasos de scroll, la tolerancia de compare-motion o la carpeta de trabajo. Lo que pongas aquí manda sobre lo de arriba. -->
