---
name: jayka-git-rules
description: "Reglas de Git y GitHub para cualquier proyecto: commits locales libres, push solo cuando el usuario lo avise, PR y merge nunca sin petición, rama de trabajo en lugar de main y deploy solo con orden. Úsala al hacer commits, ramas, push, PR o deploy."
---

# JayKA · Git Rules

Principio: nada sale del equipo sin que el usuario lo pida en el chat. Aprobar un cambio en local no autoriza subirlo.

**Precedencia:** si el usuario tiene reglas de Git en su `CLAUDE.md` (global `~/.claude/CLAUDE.md` o del proyecto), **mandan esas**. Esta skill solo cubre lo que ellas no digan. Si alguna regla de aquí choca con las suyas, sigue las suyas y no repitas la de aquí.

## Primero: ¿hay remoto?
Revisa `git remote -v`.
- **Sin remoto (repo solo local):** commitea en la rama actual sin preguntar por ramas, push ni PR.
- **Con remoto (GitHub u otro):** aplica todo lo de abajo.

## Ramas
- El trabajo normal va en una rama de tema, casi nunca directo en `main`.
- Si el chat arranca en `main`, después del primer mensaje del usuario y antes de seguir, pregunta: «¿Seguimos en `main` o usamos una rama?».
- No crees, cambies ni borres ramas sin preguntar. Una rama por tema.

## Commits
- Commits locales en la rama de trabajo: permitidos cuando tengan sentido o el usuario los pida.
- Mensaje en presente, con una línea de resumen clara, en el idioma del proyecto.
- Respeta la línea de atribución (`Co-Authored-By`) que indique el entorno.
- Antes de commitear mira qué entra (`git status`, `git diff --staged`). Nunca incluyas secretos, claves ni archivos locales de configuración.
- No uses `--no-verify` ni te saltes hooks, salvo que el usuario lo pida. Si un hook falla, arregla la causa.
- Prefiere un commit nuevo a reescribir uno anterior.

## Push
- **Solo cuando el usuario lo avise, en ese momento.** Una aprobación anterior no cubre otro push.
- Antes de pedir confirmación, di qué sube: rama, número de commits y destino. Ejemplo: «¿Subo 3 commits de `mi-rama` a `origin`?».

## Integrar a `main` y pull requests
- Merge a `main` solo con orden explícita. Usa `git merge --ff-only`; si no avanza limpio, detente y avisa. Antes, corre las pruebas.
- **Nunca** abras un PR ni hagas merge en GitHub sin petición explícita. Si la piden, confirma: «¿Abro un PR con N commits de `rama` hacia `main`?».

## Deploy
- Solo con orden explícita del usuario, con `main` ya actualizado y con pruebas verdes.
- Después, verifica con una petición real al sitio y reporta el código de respuesta.

## Destructivo
- No uses `git reset --hard`, `git push --force`, `git clean -f` ni borres ramas o carpetas sin confirmación.
- Si una operación puede perder datos, haz un respaldo o pregunta antes.

## Reporte al cerrar
El cierre de `jayka-communication`, más qué quedó sin subir (rama y número de commits).

## Mis ajustes
<!-- Cambia lo que no sea tu estilo. Ejemplo: «trabajo directo en main», «los PR sí los abre el asistente». -->
