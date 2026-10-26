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
Umbrales: texto normal AA 4.5:1 (AAA 7:1); texto grande (≥ 24 px, o ≥ 19 px en negrita) AA 3:1; componentes e íconos 3:1.
Calcula con un fragmento corto de Python o Node si hay disponible; si no, a mano. No uses sitios externos con datos del proyecto.

## 5. Medición en el navegador (opcional, solo lectura)
Con una herramienta de navegador (por ejemplo Playwright), abre cada pantalla y evalúa este fragmento. Devuelve las 12 o 14 apariciones más comunes de cada propiedad:

```js
(() => {
  const cuenta = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  const fondo = new Map(), texto = new Map(), borde = new Map(), fam = new Map(),
        tam = new Map(), radio = new Map(), relleno = new Map(), sombra = new Map();
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') cuenta(fondo, s.backgroundColor);
    cuenta(texto, s.color);
    if (parseFloat(s.borderTopWidth) > 0) cuenta(borde, s.borderTopColor);
    cuenta(fam, s.fontFamily.split(',')[0].trim());
    cuenta(tam, s.fontSize + ' / ' + s.fontWeight);
    if (s.borderTopLeftRadius !== '0px') cuenta(radio, s.borderTopLeftRadius);
    if (s.paddingTop !== '0px') cuenta(relleno, s.paddingTop);
    if (s.boxShadow !== 'none') cuenta(sombra, s.boxShadow);
  }
  const top = (m, n = 12) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
  const variables = [...document.styleSheets].flatMap((h) => { try { return [...h.cssRules]; } catch { return []; } })
    .filter((r) => r.selectorText === ':root')
    .flatMap((r) => [...r.style].filter((p) => p.startsWith('--')).map((p) => [p, r.style.getPropertyValue(p).trim()]));
  return {
    fondo: top(fondo), texto: top(texto), borde: top(borde), familia: top(fam, 6), tamanoPeso: top(tam, 14),
    radio: top(radio, 8), relleno: top(relleno, 10), sombra: top(sombra, 6), variablesRaiz: variables,
    libreriasEnVentana: ['gsap', 'Lenis', 'AOS', 'Swiper', 'THREE', 'lottie'].filter((n) => n in window),
    fuentesCargadas: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight),
  };
})()
```

Notas:
- Los colores salen como `rgb(...)`; conviértelos a hex en la ficha.
- Repite en escritorio (1280 px de ancho) y en celular (375 px) y anota diferencias.
- Mide también un estado interactivo clave (foco de un botón o campo) si es posible.
- Si una librería no aparece en `window`, no significa que no se use (puede venir empaquetada): confirma en `package.json`.

## 6. Qué NO hacer
- No abrir ni copiar `.env` o credenciales.
- No iniciar sesión con cuentas reales ni enviar formularios.
- No guardar capturas con datos personales de clientes: pide al usuario una cuenta de pruebas o recorta.
- No copiar textos, logos ni fotos propios del proyecto a la ficha.
