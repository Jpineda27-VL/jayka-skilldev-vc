---
name: jay-k-a-init
description: Muestra el catálogo de skills jay-k-a-* con una línea por skill y si están instaladas. Invócala con /jay-k-a-init para saber qué hay y cuál usar.
disable-model-invocation: true
---

# JayKA · Init

Muestra el catálogo. **Una línea por skill, sin explicaciones largas.** Para cada una indica si está instalada, mirando la lista de skills disponibles en la sesión. Si el usuario pide más detalle de una, lee su `SKILL.md` y resúmela en 3 líneas.

Formato de salida: grupo, y debajo `nombre: descripción corta [instalada / no instalada]`.

## Siempre activas (cortas)
- `jay-k-a-communication`: cómo conversar (español claro, resumen primero, sin editar al conversar).
- `jay-k-a-working-rules`: reglas de trabajo (plan, permisos, secretos solo del usuario, verificar).
- `jay-k-a-git-rules`: commits locales, push y PR solo con tu orden.

## Empezar y continuar
- `jay-k-a-new-project`: proyecto nuevo con entrevista de 42 preguntas e informe.
- `jay-k-a-project-structure`: propone las carpetas según haya frontend, backend o ambos.
- `jay-k-a-continuity`: cierra y abre sesiones sin perder el hilo.

## Seguridad y publicación
- `jay-k-a-security-web`: encabezados, cookies, CSRF, límites, permisos y subidas.
- `jay-k-a-security-deploy`: checklist antes de publicar.

## Estilo visual
- `jay-k-a-style-self-learning`: estudia un proyecto terminado y guarda su estilo en una ficha.
- `jay-k-a-style-build`: construye prototipos con tus fichas y la entrevista.
- `jay-k-a-style-library`: lista y compara fichas; solo informa.
- `jay-k-a-companion-tools`: sugiere cuándo usar Impeccable, Superpowers y otras herramientas.

## Planes y Codex
- `jay-k-a-plan-builder`: plan por bloques en `.md` (usa Superpowers si está instalado).
- `jay-k-a-tech-codex-plan-low`: tareas simples para Codex, en `.md`.
- `jay-k-a-tech-codex-plan-high`: trabajo grande para Codex, con plan completo.

## Técnicas
- `jay-k-a-tech-laravel-backend`: patrón de backend con servicios, errores de negocio y pruebas.
- `jay-k-a-tech-photos`: subida de fotos comprimidas a WebP con nombres claros.
- `jay-k-a-tech-views-parity`: dos frontends con las mismas pantallas.
- `jay-k-a-tech-real-data`: datos de ejemplo reales con seeders, sin demostración.
- `jay-k-a-tech-reverse`: ingeniería inversa de un sitio (`live <url>`) o repo (`repo <ruta>`): stack, animaciones medidas e informe.

## Al terminar
Pregunta una sola cosa: «¿Cuál quieres usar?». Si el usuario describe lo que necesita en vez de dar un nombre, sugiere la skill que mejor encaje y por qué en una línea.

## Mis ajustes
<!-- Agrega aquí tus propias skills o quita las que no uses. -->
