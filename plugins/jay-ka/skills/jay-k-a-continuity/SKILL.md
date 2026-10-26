---
name: jay-k-a-continuity
description: Continuidad entre sesiones: al cerrar guarda el estado (hecho, pendiente, decisiones), actualiza memoria y grafo si existen y deja un commit; al abrir lee ese estado y dice en pocas líneas dónde quedó el trabajo. Invócala con /jay-k-a-continuity al terminar o al retomar un proyecto.
disable-model-invocation: true
---

# JayKA · Continuity

Para no perder el hilo cuando se corta una sesión. Dos modos: **cerrar** y **abrir**. Pregunta cuál si no es obvio (al final del trabajo, cerrar; al empezar, abrir).

## Modo cerrar

1. **Reúne lo que pasó.** Mira `git status` y `git log` de la sesión, y lo hablado. Distingue lo hecho y verificado, lo hecho sin verificar y lo que quedó a medias.
2. **Escribe el estado** en `.claude/estado/CONTINUAR.md` (créalo con permiso si no existe; si existe, actualízalo sin borrar lo vigente):
   - **Dónde quedamos:** 3 a 6 líneas.
   - **Hecho:** lista corta, con lo verificado marcado.
   - **Pendiente:** ordenado por prioridad, cada punto con su siguiente paso.
   - **Decisiones tomadas:** con fecha, para no volver a preguntarlas.
   - **Decisiones por tomar:** las preguntas abiertas para el usuario.
   - **Cómo arrancar y probar:** comandos, direcciones y datos de prueba (nunca claves reales).
   - **Archivos clave:** los que se tocaron o importan.
3. **Memoria.** Si el entorno tiene memoria persistente, guarda ahí lo que sirva para otras sesiones (decisiones, preferencias, pendientes) y avisa con una línea corta y 👍. No repitas lo que ya está en el repositorio.
4. **Grafo o índice del código.** Si el proyecto usa una herramienta que lo mantiene (por ejemplo `graphify`), actualízalo. Si no existe, no lo inventes.
5. **Commit local** de los documentos de estado, siguiendo `jay-k-a-git-rules`. Sin push.
6. **Cierra con tres líneas:** qué quedó, qué falta y qué decisión necesitas del usuario.

## Modo abrir

1. Lee, en este orden y sin modificar nada: `CLAUDE.md`, `.claude/estado/CONTINUAR.md`, la memoria si existe, `git status` y los últimos commits.
2. Responde en **8 líneas o menos**:
   - Dónde quedó el trabajo.
   - Qué está pendiente (máximo 3 puntos, el primero con su siguiente paso).
   - Qué decisión espera el usuario.
   - Algo que haya cambiado fuera de sesión (cambios sin commitear, ramas, archivos nuevos).
3. Pregunta: «¿Seguimos con [primer pendiente] o prefieres otra cosa?». **No empieces a trabajar sin que lo confirme.**
4. Si el estado y el repositorio no coinciden (por ejemplo, el documento dice «hecho» pero el código no lo tiene), dilo y pregunta; no asumas.

## Reglas
- No inventes estado: si no lo comprobaste, escríbelo como «sin verificar».
- No guardes secretos, claves ni datos personales en los documentos de estado.
- Un documento de estado corto y vigente vale más que uno largo y viejo: si una sección ya no aplica, bórrala.

## Mis ajustes
<!-- Cambia el nombre o la ubicación del archivo de estado, o agrega secciones que uses. -->
