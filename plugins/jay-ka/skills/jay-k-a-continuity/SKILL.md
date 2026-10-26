---
name: jay-k-a-continuity
description: "Continuidad entre sesiones: «cerrar» guarda el estado (hecho, pendiente, decisiones), actualiza memoria y grafo si existen y deja un commit; «abrir» lee ese estado y dice en pocas líneas dónde quedó el trabajo. Invócala con /jay-k-a-continuity cerrar o /jay-k-a-continuity abrir."
argument-hint: "cerrar | abrir"
disable-model-invocation: true
---

# JayKA · Continuity

Para no perder el hilo cuando se corta una sesión. Dos modos: **cerrar** y **abrir**.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).

| Argumento | Alias | Qué hace |
|---|---|---|
| `cerrar` | `guardar`, `close`, `save` | Modo cerrar |
| `abrir` | `retomar`, `open`, `resume` | Modo abrir |
| *(vacío)* | | Si es el primer mensaje de la sesión → `abrir`. Si no → pregunta: «¿Cierro (guardo el estado) o abro (retomo)?» |

## Modo cerrar

1. **Reúne lo que pasó** con estos comandos, sin modificar nada: `git status --short`, `git log --oneline -15`, `git diff --stat` y `git stash list`. Súmale lo hablado en la sesión. Distingue lo hecho y verificado, lo hecho sin verificar y lo que quedó a medias.
2. **Escribe el estado** en `.claude/estado/CONTINUAR.md` con la plantilla `reference/continuar-template.md`. Si no existe, la carpeta se crea según las convenciones. Si existe, actualízalo: conserva las decisiones tomadas y lo pendiente que siga vigente, y borra lo que ya no aplica. Las ocho secciones son:
   - **Encabezado:** fecha de hoy, rama y último commit.
   - **Dónde quedamos:** 3 a 6 líneas.
   - **Hecho:** cada punto dice si está verificado y cómo, o «sin verificar».
   - **Pendiente:** tabla ordenada por prioridad, cada punto con su siguiente paso concreto y lo que lo bloquea.
   - **Decisiones tomadas:** con fecha, para no volver a preguntarlas.
   - **Decisiones por tomar:** las preguntas abiertas para el usuario.
   - **Cómo arrancar y probar:** comandos y direcciones (nunca claves reales).
   - **Archivos clave** y **cambios sin commitear al cerrar**.
3. **Memoria.** Si el entorno tiene memoria persistente, guarda ahí lo que sirva para otras sesiones (decisiones, preferencias, pendientes) y avisa con una línea corta y 👍. No repitas lo que ya está en el repositorio.
4. **Grafo o índice del código.** Si el proyecto usa una herramienta que lo mantiene (por ejemplo `graphify`), actualízalo. Si no existe, no lo inventes.
5. **Commit local** de los documentos de estado, siguiendo `jay-k-a-git-rules`. Sin push.
6. **Cierra con tres líneas:** qué quedó, qué falta y qué decisión necesitas del usuario.

## Modo abrir

1. Lee, en este orden y sin modificar nada: `CLAUDE.md`, `.claude/estado/CONTINUAR.md`, la memoria si existe, `git status --short`, `git log --oneline -10` y `git branch --show-current`. Si `CONTINUAR.md` no existe, dilo y resume solo desde git.
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

## Terminado cuando
- **Cerrar:** `CONTINUAR.md` sigue la plantilla, tiene la fecha de hoy y sus secciones completas; lo no comprobado dice «sin verificar»; hay commit local de los documentos de estado (o se dijo por qué no); se cerró con tres líneas.
- **Abrir:** la respuesta tiene 8 líneas o menos, señala cualquier diferencia entre el documento y el repositorio, termina con la pregunta y no se modificó nada.

## Mis ajustes
<!-- Cambia el nombre o la ubicación del archivo de estado, o agrega secciones que uses. -->
