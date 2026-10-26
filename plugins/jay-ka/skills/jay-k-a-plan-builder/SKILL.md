---
name: jay-k-a-plan-builder
description: Arma un plan por bloques para trabajo grande, apoyándose en Superpowers (brainstorming y writing-plans), y lo deja en un archivo .md aprobado antes de ejecutar. Si Superpowers no está instalado, lo dice y no finge. Invócala con /jay-k-a-plan-builder.
disable-model-invocation: true
---

# JayKA · Plan Builder

Para trabajo **grande**: una funcionalidad nueva, una vista completa, una migración, un rediseño. Para tareas pequeñas **no la uses**: pide el cambio directo (o usa `jay-k-a-tech-codex-plan-low` si lo hace Codex).

## Regla de honestidad (la primera)
Esta skill está pensada para trabajar **con Superpowers** (`brainstorming` y `writing-plans`). Antes de empezar, **revisa la lista de skills disponibles** y busca `brainstorming` y `writing-plans` (pueden aparecer como `superpowers:brainstorming` y `superpowers:writing-plans`).

### Si están instaladas
Úsalas de verdad: invócalas con la herramienta de skills, en ese orden. No simules que las ejecutaste.

### Si NO están instaladas
No continúes en silencio. Di exactamente esto (con tus palabras, pero con este contenido):
> «Plan Builder está pensado para usar Superpowers y no lo tengo instalado, así que no puede correr como fue diseñado. Opciones: (a) lo instalas tú y te digo cómo; yo no instalo nada sin tu permiso, (b) sigo con una versión reducida que usa solo mis propias instrucciones: sirve, pero **no es igual**, sin la lluvia de ideas guiada de Superpowers, (c) lo dejamos para otro momento.»
- No inventes resultados de herramientas que no corriste.
- Si elige (b), anota en el plan: «Hecho con la versión reducida (sin Superpowers)».
- Si elige (a), dile qué instalar y espera. No lo instales por tu cuenta.

## Paso 1 · Contexto mínimo
Lee solo lo necesario, sin modificar nada: `CLAUDE.md`, el estado del proyecto (por ejemplo `.claude/estado/CONTINUAR.md`), las decisiones ya tomadas y los archivos que el trabajo tocaría. **No repitas preguntas ya respondidas en los documentos.** Resume el contexto en 5 líneas para el plan.

## Paso 2 · Aclarar (brainstorming)
Con Superpowers: invoca `brainstorming`. Sin él, versión reducida: haz como máximo **5 preguntas**, una por vez, sobre objetivo, quién lo usa, qué queda fuera, restricciones y cómo se sabrá que está bien.
Resultado: **objetivo en una frase**, **alcance** (entra, no entra), **criterios de aceptación** y **riesgos**.

## Paso 3 · Plan por bloques
Con Superpowers: invoca `writing-plans` con ese resultado. Sin él, usa `reference/plan-template.md`.
Un bloque es una unidad que se puede **construir, verificar y commitear sola** (una sesión o menos). Cada bloque trae:
- Objetivo y alcance (archivos o módulos).
- Pasos concretos.
- Verificación (pruebas y qué mirar en navegador).
- Dependencias de otros bloques y tamaño (S, M, L).
- Qué decisión del usuario necesita, si alguna.
Ordena por dependencia y por riesgo: lo incierto primero.

## Paso 4 · Escribir el plan
Archivo: `docs/planes/AAAA-MM-DD-<slug>.md` (pide permiso para crear la carpeta si no existe). El plan es **contexto mínimo y autosuficiente**: alguien (o un agente) que lea solo ese archivo debe poder ejecutarlo. Eso ahorra tokens: se lee el plan en vez de repetir la conversación.
Reglas de contenido:
- Sin secretos, claves ni datos personales.
- Lo no decidido va en **Decisiones pendientes**, no se inventa.
- Cada bloque con casillas `[ ]` que se marcan al terminar.

## Paso 5 · Aprobación (puerta)
Muestra el plan **resumido**: objetivo, lista de bloques con tamaño y orden, y las decisiones pendientes. Pregunta: «¿Lo apruebo así, cambias algo o quitas algún bloque?». **No ejecutes hasta que lo apruebe.**

## Paso 6 · Ejecutar (ofrece opciones, el usuario elige)
1. **Aquí**, bloque por bloque: construir, verificar, marcar la casilla, commit local (ver `jay-k-a-git-rules`) y reportar. Un bloque a la vez.
2. **Con Codex**: genera la tarea desde el bloque con `jay-k-a-tech-codex-plan-low` (bloque simple) o `jay-k-a-tech-codex-plan-high` (vista o flujo completo).
3. **Mixto**: lo delicado aquí, lo mecánico con Codex.
Mientras se ejecuta, mantén el plan **vivo**: casillas marcadas, cambios de alcance anotados con fecha, decisiones nuevas.

## Paso 7 · Cierre
Al terminar todos los bloques: resumen de lo hecho y lo no hecho, resultado de pruebas, y siguiente paso. Sugiere `jay-k-a-companion-tools` (auditoría y pulido) si hubo interfaz, y `jay-k-a-continuity` para guardar el estado.

## Qué NO hace
- No ejecuta sin aprobación.
- No decide por el usuario las decisiones de negocio.
- No reemplaza a Superpowers: lo usa, o dice que no puede.

## Mis ajustes
<!-- Cambia la carpeta de planes, el tamaño de bloque o el número máximo de preguntas de la versión reducida. -->
