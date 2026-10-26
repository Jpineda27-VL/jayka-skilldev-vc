---
name: jay-k-a-style-self-learning
description: "Estudia el frontend de un proyecto terminado (vista del cliente y dashboard), en solo lectura, y guarda una ficha de estilo (tecnología, paleta, tipografía, espaciados, componentes, patrones, animación, accesibilidad) más un tokens.json en la biblioteca personal. Invócala con /jay-k-a-style-self-learning al final de un proyecto, opcionalmente con su ruta."
argument-hint: "[<ruta>] [--slug <nombre>] [--sin-navegador]"
disable-model-invocation: true
---

# JayKA · Style Self-Learning

Modo **aprendizaje** de la pareja de estilo. Estudia un proyecto ya terminado y deja una **ficha** reutilizable. La otra mitad, `jay-k-a-style-build`, usa esas fichas para construir prototipos nuevos con tu estilo.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).

| Argumento | Por defecto | Qué hace |
|---|---|---|
| `<ruta>` | la carpeta actual | Proyecto a estudiar. Si no existe, lo dice y se detiene |
| `--slug <nombre>` | el nombre de la carpeta, como slug | Nombre de la ficha en la biblioteca |
| `--sin-navegador` | se pregunta en el Paso 0 | Estudio solo de código: se salta el Paso 5 y la ficha lo dice |

Con los argumentos dados, el Paso 0 solo pregunta lo que falte.

## Reglas que no se rompen
1. **Solo lectura.** No modificas, formateas, instalas ni borras nada en el proyecto estudiado. No ejecutas `npm install`, migraciones ni nada con efectos.
2. **Solo frontend**: la vista que ve el cliente y el dashboard o panel (y cualquier otra pantalla visible). Del backend solo miras lo que llegue a la pantalla (plantillas, rutas de vistas). No estudies lógica de negocio.
3. **No toques secretos.** No abras `.env`, claves ni archivos de credenciales. Si aparecen, ignóralos y no los copies a la ficha.
4. **Cada afirmación lleva evidencia**: archivo y línea, o «medido en el navegador». Marca lo **inferido** como inferido. No inventes tokens que no existan.
5. **La ficha no copia contenido del proyecto**: ni textos de clientes, ni datos personales, ni imágenes de marca. Solo el sistema de diseño y los patrones.
6. Las fichas viven en la biblioteca personal (`~/.claude/jay-k-a/estilos/`), **fuera** del proyecto estudiado.

## Paso 0 · Preparación (pregunta corto, una vez)
1. Ruta del proyecto (por defecto, la carpeta actual) y nombre para la ficha (se guarda como `<slug>`).
2. ¿Está terminado? Si no, pregúntale cuánto falta; la ficha dirá «proyecto en curso».
3. Superficies a estudiar: vista del cliente, dashboard, otras. Si hay varias apps (web y móvil), pregunta cuáles.
4. ¿Autoriza abrirlo en el navegador (servidor local o dirección publicada) para **medir** estilos reales? Es opcional y solo lectura. Si no, el estudio es solo de código.
5. ¿Existe ya una ficha de ese proyecto? Si sí, esta pasa a ser una **actualización** (conserva la versión anterior como `ficha.<fecha>.md`).

## Paso 1 · Tecnología
Detecta, con evidencia, mirando `package.json`, archivos de configuración y plantillas:
- Framework y lenguaje del frontend (React, Vue, Svelte, Blade, Astro, HTML plano, Expo…), y herramienta de construcción.
- Enfoque de estilos: Tailwind, CSS Modules, SCSS, CSS plano, CSS-in-JS, librería de componentes (shadcn/ui, MUI, Chakra, Bootstrap…).
- **Animación y desplazamiento**: GSAP/ScrollTrigger, Framer Motion/Motion, Lenis, Locomotive, AOS, Lottie, Three.js, View Transitions, animaciones CSS.
- Íconos (librería o SVG propio), gráficas (Recharts, Chart.js, D3…), mapas, editores, tablas.
- Imágenes: formatos, `srcset`, carga diferida, optimización.
- Renderizado: SPA, SSR, estático, plantillas del servidor.
Guía de búsqueda: `reference/extraction-guide.md`.

## Paso 2 · Sistema de diseño (tokens)
Extrae, con su origen (variable CSS, tema de Tailwind, constante, valor suelto):
- **Color**: paleta completa con **roles** (fondo, superficie, texto, texto suave, primario, acento, éxito, aviso, peligro, bordes, enfoque), versión oscura si existe, y la frecuencia de uso. Mide el **contraste** de los pares importantes (texto/fondo, texto sobre botón, texto suave) según WCAG.
- **Tipografía**: familias (y de dónde cargan), pesos, escala de tamaños, interlineado, espaciado entre letras, unidades (rem o px), uso de números tabulares.
- **Espaciado**: escala, rejilla base, anchos de contenedor, márgenes de página.
- **Forma**: radios, bordes, sombras, opacidades, desenfoques, degradados.
- **Movimiento**: duraciones, curvas, qué se anima y con qué librería, efectos de desplazamiento, `prefers-reduced-motion`.
- **Puntos de corte** y comportamiento responsivo.
Guarda el resultado en `tokens.json` (formato en `reference/tokens.schema.json`).

## Paso 3 · Componentes y patrones
- Inventario: botones (variantes y estados), tarjetas, formularios y campos, navegación (barra superior, inferior, lateral), tablas, modales y hojas, avisos, insignias, gráficas, estados vacíos, de carga y de error.
- **Layouts**: cómo se arma la vista del cliente (encabezado, héroe, secciones, pie) y el dashboard (barra lateral, barra superior, tarjetas de cifras, tablas, filtros, paneles).
- **Motivos distintivos**: lo que hace reconocible al proyecto (un tipo de foto, una forma, una franja, un subrayado). Descríbelo y di por qué funciona.

## Paso 4 · Lenguaje visual y experiencia
- **Sensación** en 5 palabras, y qué decisiones concretas la producen («cálida: fondo crema, acento coral, esquinas muy redondeadas…»).
- Imágenes e ilustración: estilo, tratamiento, proporciones.
- Voz de los textos: tono, longitud, ejemplos cortos (sin datos reales).
- Interacción: retroalimentación, transiciones, gestos, comportamiento en celular.
- **Accesibilidad**: contraste medido, foco visible, áreas táctiles, lectores de pantalla, movimiento reducido, tamaños de texto.
- **Rendimiento visible**: fuentes, imágenes pesadas, animaciones costosas.

## Paso 5 · Medición en navegador (si lo autorizó)
Usa las herramientas de navegador disponibles (por ejemplo Playwright) para:
- Abrir cada superficie en escritorio (1280 px) y celular (375 px). Toma capturas **solo si el usuario las quiere guardar** (van a `capturas/` dentro de la ficha).
- Ejecutar el fragmento de medición de `reference/extraction-guide.md` para obtener colores, tipografías, radios, espaciados y sombras **reales**, y compararlos con lo que dice el código.
- No inicies sesión con cuentas reales. Si hace falta una cuenta de prueba, que la ponga el usuario.

## Paso 6 · Escribir la ficha
Carpeta: `~/.claude/jay-k-a/estilos/<slug>/`
- `ficha.md`: sigue `reference/ficha-template.md`.
- `tokens.json`: sigue `reference/tokens.schema.json`.
- `capturas/` (opcional).
Luego **actualiza `~/.claude/jay-k-a/estilos/estilo-base.md`**: los rasgos que se repiten entre fichas (familias, tonos, radios, patrones), con el conteo de en cuántos proyectos aparece cada uno. Si hay una sola ficha, el estilo base es esa; no inventes tendencias.
Las carpetas se crean según las convenciones.

## Paso 7 · Devolver al usuario
Resumen corto:
1. Los **5 rasgos de identidad** del proyecto.
2. Lo **reutilizable** (tokens y patrones que conviene llevar a otros proyectos).
3. Lo que **no** repetirías (debilidades: contraste bajo, exceso de animación, inconsistencias).
4. Qué quedó **inferido** o sin medir.
5. Una pregunta: «¿Funcionó este estilo para el objetivo del proyecto? ¿Qué cambiarías?». Guarda la respuesta del usuario en la sección **Resultado y lecciones** de la ficha (solo lo que él diga).
Cierra recordando que `jay-k-a-style-build` ya puede usar esta ficha y que `jay-k-a-style-library` sirve para compararlas.

## Terminado cuando
- Existen `ficha.md` (con todas las secciones de `reference/ficha-template.md`) y `tokens.json` (válido según `reference/tokens.schema.json`) en `~/.claude/jay-k-a/estilos/<slug>/`.
- Cada afirmación de la ficha tiene evidencia (`archivo:línea` o «medido en el navegador») o está marcada como inferida.
- Los contrastes de los pares importantes están calculados, no estimados.
- `estilo-base.md` está actualizado con los conteos.
- No se modificó nada en el proyecto estudiado y no se abrió ningún archivo de secretos.
- Se hizo la pregunta del Paso 7. La respuesta del usuario se guarda cuando llegue.

## Mis ajustes
<!-- Agrega aquí qué más quieres que estudie (por ejemplo, tono de microcopy, SEO visible) o qué no (por ejemplo, el dashboard). -->
