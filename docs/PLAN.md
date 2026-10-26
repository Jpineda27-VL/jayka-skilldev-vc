# Plan y decisiones del repositorio `jay-ka-skilldev-vc`

Este documento es el punto de continuidad: quien abra el proyecto en una sesión nueva lo lee primero.

## Decisiones tomadas (2026-10-26)
- Prefijo de todas las skills: `jay-k-a-` y nombres en inglés. El texto de las skills va en español.
- **Todas las skills son genéricas**: sirven para cualquier proyecto. Nada específico de un proyecto del autor.
- El repositorio es un **marketplace de plugins de Claude Code** con un plugin `jay-ka` que trae todas las skills. Alternativa: un script que copia las skills a `~/.claude/skills`.
- Dueño en GitHub: cuenta `Jpineda27-VL`. El repositorio se crea **privado**; el autor lo pasa a público cuando quiera.
- Se construye primero en local. Sin push hasta que el autor lo ordene.
- Las skills traen una sección **Mis ajustes** para que cada persona cambie las reglas a su estilo. Que las skills aprendan solas queda como idea para después.
- El asistente **nunca** toca claves, tokens ni servicios externos: solo el usuario. Está escrito en `jay-k-a-working-rules`.
- Esto no es «vibe coding»: se entiende, se planea, se aprueba, se construye por grupos, se verifica y se audita.
- No se reemplaza nada de otras herramientas (Impeccable, Superpowers, etc.): solo se **sugieren** (`jay-k-a-companion-tools`).

## Catálogo
Estado: ✅ escrita · 🔲 pendiente. Automática = se carga siempre (descripción corta); manual = solo con `/nombre`.

| # | Skill | Tipo | Estado |
|---|---|---|---|
| 0 | `jay-k-a-init` | manual | 🔲 catálogo en una línea por skill |
| 1 | `jay-k-a-communication` | automática | ✅ |
| 2 | `jay-k-a-working-rules` | automática | ✅ |
| 3 | `jay-k-a-git-rules` | automática | ✅ |
| 4 | `jay-k-a-security-deploy` | manual | 🔲 `.env`, claves, debug apagado, HTTPS, cron, respaldos, rutas que deben dar 404, checklist del día de subir |
| 5 | `jay-k-a-security-web` | manual | 🔲 encabezados y CSP, CSRF, cookies, límites de peticiones y login, subidas, permisos entre usuarios, prueba final |
| 6 | `jay-k-a-project-structure` | manual | 🔲 carpetas según haya solo frontend, solo backend o ambos |
| 7 | `jay-k-a-new-project` | manual | 🔲 entrevista de ~40 preguntas, cada una **obligatoriamente** respondida o saltada a mano (nunca automático); identidad con tonos de color solo para sondear; informe final de lo definido y lo que falta; crea CLAUDE.md, REGLAS.md, estructura, git init y memoria; puede generar un prompt para otro chat |
| 8 | `jay-k-a-continuity` | manual | 🔲 al cerrar guarda estado, memoria, grafo y commit; al abrir lee el estado y dice dónde quedamos |
| 9 | `jay-k-a-style-self-learning` | manual | 🔲 estudia un proyecto terminado (solo frontend: cliente y dashboard), guarda una ficha + `tokens.json` en `~/.claude/jay-k-a/estilos/` y mantiene `estilo-base.md` |
| 10 | `jay-k-a-style-build` | manual | 🔲 toma el informe de `new-project` y las fichas; sugiere paletas, fuentes y estilos; construye prototipos; termina sugiriendo `companion-tools` |
| 11 | `jay-k-a-style-library` | manual | 🔲 **solo informa**: lista y compara fichas, dice qué coincide o ya funcionó; no cambia nada |
| 12 | `jay-k-a-tech-laravel-backend` | manual | 🔲 servicios, errores de negocio, acción única por POST, bitácora, validación y pruebas |
| 13 | `jay-k-a-tech-photos` | manual | 🔲 subida: WebP, 1200 px, 5 MB, nombres claros |
| 14 | `jay-k-a-tech-views-parity` | manual | 🔲 versión genérica: dos frontends (por ejemplo web y app) con las mismas pantallas |
| 15 | `jay-k-a-plan-builder` | manual | 🔲 usa Superpowers (`brainstorming`) si está instalado; si no, avisa que no corre igual, ofrece una versión reducida y recomienda instalarlo; nunca lo instala; entrega el plan en `.md` |
| 16 | `jay-k-a-tech-codex-plan-low` | manual | 🔲 tareas simples: instrucción en `.md`, vuelve un plan básico en `.md`, pruebas básicas y revisión con Playwright |
| 16 | `jay-k-a-tech-codex-plan-high` | manual | 🔲 trabajo grande: pasa por `plan-builder`, pide el esquema de una vista completa (formulario, etc.), vuelve en `.md`; el usuario revisa |
| 17 | `jay-k-a-tech-real-data` | manual | 🔲 seeders repetibles, sin datos de demostración, prueba de punta a punta |
| 18 | `jay-k-a-companion-tools` | manual | 🔲 solo sugiere cuándo usar `impeccable` (audit, polish, critique), `ui-ux-pro-max`, `design-taste-frontend`, `emil-design-eng` y Superpowers (`brainstorming`, `writing-plans`) |

## Cómo trabajamos
1. Construir las skills por grupos, mostrando cada una antes de darla por buena.
2. Probar cada skill instalada de verdad (no solo escribirla).
3. Cuando el autor lo ordene: revisar que no haya datos personales, elegir licencia, subir.

## Pendientes de decisión
- Licencia (por ejemplo MIT).
- Si el README lleva también versión en inglés.
- Verificar el comando de instalación con el repositorio ya publicado.
