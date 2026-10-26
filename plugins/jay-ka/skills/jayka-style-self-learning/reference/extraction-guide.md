# Guía de extracción (solo lectura)

Usa las herramientas de búsqueda de archivos del entorno (no modifiques nada). Los patrones son expresiones regulares. Adáptalos al framework que encuentres.

## 1. Tecnología
- `package.json` (y `composer.json`, `pubspec.yaml`, `requirements.txt` si hay): dependencias de interfaz.
- Archivos de configuración: `tailwind.config.*`, `postcss.config.*`, `vite.config.*`, `next.config.*`, `astro.config.*`, `app.json` (Expo), `components.json` (shadcn).
- **Animación y scroll:** busca estos nombres en dependencias e importaciones: `gsap`, `ScrollTrigger`, `framer-motion`, `motion`, `lenis`, `locomotive-scroll`, `aos`, `lottie`, `three`, `react-spring`, `@react-spring`, `anime`, `swiper`, `embla`. En CSS: `@keyframes`, `animation:`, `transition:`, `scroll-behavior`, `scroll-snap`, `view-transition`, `animation-timeline`.
- **Íconos:** `lucide`, `heroicons`, `phosphor`, `tabler`, `fontawesome`, `material-icons`, `react-icons`, o SVG sueltos / un archivo de íconos propio.
- **Gráficas:** `recharts`, `chart.js`, `d3`, `echarts`, `apexcharts`, `visx`, o SVG a mano.
- **Fuentes:** `@font-face`, `fonts.googleapis.com`, `next/font`, `@fontsource`, `font-family`.

## 2. Tokens en el código
- Variables CSS: `^\s*--[\w-]+\s*:`  (en `*.css`, `*.scss`).
- Tema de Tailwind: la clave `theme.extend` en `tailwind.config.*`.
- Variables SCSS/Less: `^\s*[\$@][\w-]+\s*:`.
- Colores sueltos (para medir frecuencia): `#[0-9a-fA-F]{3,8}\b`, `rgba?\(`, `hsla?\(`. Normaliza `#abc` a `#aabbcc` y agrupa. Descarta negro y blanco puros al buscar la paleta, pero anótalos.
- Tamaños de texto: `font-size\s*:`; pesos: `font-weight\s*:`.
- Espaciados: `(margin|padding|gap)\s*:` y clases de utilidad (`p-4`, `gap-6`…).
- Radios, sombras, bordes: `border-radius\s*:`, `box-shadow\s*:`, `border\s*:`.
- Puntos de corte: `@media\s*\(`.
- Modo oscuro: `prefers-color-scheme`, `[data-theme`, `.dark`.
- Movimiento reducido: `prefers-reduced-motion`.

## 3. Componentes y vistas
- Carpetas típicas: `components/`, `ui/`, `partials/`, `views/`, `resources/views`, `app/`, `pages/`, `screens/`.
- Para cada componente repetido, anota variantes (props o clases `--variante`) y estados (`:hover`, `:focus-visible`, `[disabled]`, `aria-*`).
- Layouts: busca el archivo de layout principal (`layout`, `_app`, `app.blade.php`, `RootLayout`).

## 4. Contraste (WCAG 2.x)
Luminancia relativa: `L = 0.2126·R + 0.7152·G + 0.0722·B`, con cada canal `c = C/255` convertido a `c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`.
Razón de contraste: `(L1 + 0.05) / (L2 + 0.05)` con `L1` la mayor.
Umbrales: texto normal AA 4.5:1 (AAA 7:1); texto grande (≥ 24 px, o ≥ 18.66 px en negrita) AA 3:1; componentes e íconos 3:1.
Calcula con `scripts/contrast.mjs` (por ejemplo `node scripts/contrast.mjs "#26264F" "#FFF8EF"`). No uses sitios externos con datos del proyecto.

## 5. Medición en el navegador (opcional, solo lectura)
La sonda está en `scripts/style-probe.js` y se corre con el capturador de `jayka-reverse` (ver Paso 5 de `SKILL.md`). Mide fondos, colores de texto, bordes, familias, tamaño/peso/interlineado, radios, rellenos, separaciones, sombras, variables de `:root`, fuentes cargadas y el contraste real de cada par texto/fondo visible.

Notas:
- Los colores salen en hex; con transparencia se muestran como `#RRGGBB / alfa`.
- Se mide en escritorio (1280 px) y en celular (375 px); anota las diferencias.
- Mide también un estado interactivo clave (foco de un botón o campo) si es posible, a mano con la herramienta de navegador.
- Si una librería no aparece en `window`, no significa que no se use (puede venir empaquetada): confírmalo en `package.json`.

## 6. Qué NO hacer
- No abrir ni copiar `.env` o credenciales.
- No iniciar sesión con cuentas reales ni enviar formularios.
- No guardar capturas con datos personales de clientes: pide al usuario una cuenta de pruebas o recorta.
- No copiar textos, logos ni fotos propios del proyecto a la ficha.
