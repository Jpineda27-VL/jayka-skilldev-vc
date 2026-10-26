---
name: jay-k-a-companion-tools
description: Sugiere, en el momento justo, qué otras herramientas usar (Impeccable para auditar y pulir, Superpowers para planear, skills de diseño contra el aspecto de IA, seguridad, pruebas) sin reemplazarlas ni ejecutarlas. Invócala con /jay-k-a-companion-tools o deja que otras skills JayKA la mencionen.
disable-model-invocation: true
---

# JayKA · Companion Tools

Esta skill **no hace trabajo propio**: recomienda qué herramienta de otros autores encaja con el momento, para no reinventar nada. Existen herramientas muy buenas (por ejemplo Impeccable, Superpowers); aquí solo se sabe **cuándo** conviene usarlas.

## Reglas
1. **Solo sugiere.** No ejecutes ninguna herramienta recomendada sin que el usuario lo pida. No la reemplaces con una versión propia.
2. **Revisa qué está instalado.** Mira la lista de skills disponibles en la sesión. Recomienda las instaladas con su nombre exacto; de las que **no** están, di el nombre, para qué sirve y que no está instalada. **Nunca instales nada** (requiere permiso explícito del usuario, y la instalación la decide él).
3. **Pocas sugerencias, bien elegidas.** Máximo 3 por momento, cada una en una línea: qué es, por qué ahora, y qué se obtiene. Marca la que recomiendas primero.
4. No inventes capacidades: si no conoces una herramienta, no la describas.
5. La decisión es del usuario. Termina con: «¿Corro alguna?».

## Cuándo sugerir qué

### Antes de un plan o bloque grande de trabajo
(más de ~5 archivos, varios días, requisitos poco claros, o cambios que tocan datos)
- **Superpowers `brainstorming`**: aclara la idea antes de planear.
- **Superpowers `writing-plans`**: escribe el plan que se va a ejecutar, en `.md`.
- **`jay-k-a-plan-builder`**: arma el plan por bloques usando lo anterior; para Codex, ver `jay-k-a-tech-codex-plan-low` y `-high`.

### Después de construir o cambiar interfaz
- **Impeccable**: `audit` (calidad técnica: accesibilidad, rendimiento, responsivo), `critique` (revisión de UX), `polish` (pasada final), `harden` (casos límite, errores), `adapt` (otros tamaños y dispositivos).
- Para el **aspecto de IA**: `design-taste-frontend`, `emil-design-eng` (detalles de pulido y animación), `ui-ux-pro-max` (estilos, paletas y pautas de UX), `high-end-visual-design`, `minimalist-ui` o `industrial-brutalist-ui` según el estilo, `redesign-existing-projects` para mejorar algo ya hecho.
- **Prueba de rotura:** `break-ui` (datos extremos: nombres largos, listas vacías, números enormes).

### Animación y movimiento
`animate` (construir), `review-animations` (revisar), `improve-animations` (auditar todo el proyecto), `animation-performance` (si va lenta), `animate-expo` (React Native / Expo), `mobile-native` (que una web se sienta nativa en el celular).

### Seguridad
- `jay-k-a-security-web` (construir o auditar), `jay-k-a-security-deploy` (antes de publicar).
- `security-review` y `differential-review` (revisión de cambios con enfoque de seguridad).

### Calidad de código y pruebas
- `/code-review` (errores en el diff), `simplify` (reuso y limpieza), `safe-refactor` (reestructurar sin cambiar comportamiento), `surgical-patch` (arreglo mínimo), `verify-and-stop` (comprobar que se cumple lo pedido sin ampliar alcance), `investigate-first` (fallos que no se entienden).
- `playwright-skill` (automatizar y revisar en navegador).

### Datos y gráficas
`dataviz` (cualquier gráfica o panel de cifras).

### Entre sesiones
`jay-k-a-continuity` (cerrar y abrir), `jay-k-a-style-self-learning` (cuando un proyecto queda terminado, para guardar su estilo).

## Formato de salida
```text
Para este momento ([lo que acaba de pasar]):
1. [herramienta] (instalada | no instalada): [para qué, en una línea].
2. …
¿Corro alguna?
```

## Si el usuario pregunta «¿qué más hay?»
Lista las herramientas instaladas que encajan con lo que está haciendo, agrupadas como arriba, sin descripciones largas.

## Mis ajustes
<!-- Agrega tus herramientas favoritas o quita las que no uses. Ejemplo: «siempre sugerir impeccable audit después de style-build». -->
