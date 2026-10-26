# Plan y decisiones del repositorio `jay-ka-skilldev-vc`

Este documento es el punto de continuidad: quien abra el proyecto en una sesión nueva lo lee primero.

## Decisiones tomadas (2026-10-26)
- Prefijo de todas las skills: `jayka-` y nombres en inglés. El texto de las skills va en español.
  - Cambio del 2026-10-26 (v0.9.0): antes era `jay-k-a-` y las cuatro técnicas llevaban `tech-`. Ahora el formato es `/jay-ka:jayka-<comando>` (el catálogo se llama `jayka-menu`, no `init`) (plugin `jay-ka`, skill `jayka-<comando>`), más corto: `jayka-reverse`, `jayka-codex-low`, `jayka-codex-high`, `jayka-photos`…
  - Se conserva `jay-k-a` solo en rutas de datos (`~/.claude/jay-k-a/…`) y en las marcas del bloque de `CLAUDE.md`, porque no son nombres de skill y cambiarlas desconectaría lo ya guardado.
  - Con el prefijo `jayka-` el riesgo de choque al copiar las carpetas sueltas a `~/.claude/skills` sigue siendo bajo, así que los scripts de copia siguen valiendo (`/jayka-menu`).
- **Todas las skills son genéricas**: sirven para cualquier proyecto. Nada específico de un proyecto del autor.
- El repositorio es un **marketplace de plugins de Claude Code** con un plugin `jay-ka` que trae todas las skills. Alternativa: un script que copia las skills a `~/.claude/skills`.
- Dueño en GitHub: cuenta `Jpineda27-VL`. El repositorio se crea **privado**; el autor lo pasa a público cuando quiera.
- Se construye primero en local. Sin push hasta que el autor lo ordene.
- Las skills traen una sección **Mis ajustes** para que cada persona cambie las reglas a su estilo. Que las skills aprendan solas queda como idea para después.
- El asistente **nunca** toca claves, tokens ni servicios externos: solo el usuario. Está escrito en `jayka-working-rules`.
- Esto no es «vibe coding»: se entiende, se planea, se aprueba, se construye por grupos, se verifica y se audita.
- No se reemplaza nada de otras herramientas (Impeccable, Superpowers, etc.): solo se **sugieren** (`jayka-companion-tools`).

## Catálogo
Estado: ✅ escrita · 🔲 pendiente. Automática = Claude la carga cuando aplica (su descripción está siempre a la vista, el texto completo entra al usarla); manual = solo con `/nombre`. Lo que debe valer siempre va además en `CLAUDE.md` con `/jayka-menu instalar-reglas`.

| # | Skill | Tipo | Estado |
|---|---|---|---|
| 0 | `jayka-menu` | manual | ✅ catálogo en una línea por skill |
| 1 | `jayka-communication` | automática | ✅ |
| 2 | `jayka-working-rules` | automática | ✅ |
| 3 | `jayka-git-rules` | automática | ✅ |
| 4 | `jayka-security-deploy` | manual | ✅ `.env`, claves, debug apagado, HTTPS, cron, respaldos, rutas que deben dar 404, checklist del día de subir |
| 5 | `jayka-security-web` | manual | ✅ encabezados y CSP, CSRF, cookies, límites de peticiones y login, subidas, permisos entre usuarios, prueba final |
| 6 | `jayka-project-structure` | manual | ✅ carpetas según haya solo frontend, solo backend o ambos |
| 7 | `jayka-new-project` | manual | ✅ entrevista de ~40 preguntas, cada una **obligatoriamente** respondida o saltada a mano (nunca automático); identidad con tonos de color solo para sondear; informe final de lo definido y lo que falta; crea CLAUDE.md, REGLAS.md, estructura, git init y memoria; puede generar un prompt para otro chat |
| 8 | `jayka-continuity` | manual | ✅ al cerrar guarda estado, memoria, grafo y commit; al abrir lee el estado y dice dónde quedamos |
| 9 | `jayka-style-self-learning` | manual | ✅ estudia un proyecto terminado (solo frontend: cliente y dashboard), guarda una ficha + `tokens.json` en `~/.claude/jay-k-a/estilos/` y mantiene `estilo-base.md` |
| 10 | `jayka-style-build` | manual | ✅ toma el informe de `new-project` y las fichas; sugiere paletas, fuentes y estilos; construye prototipos; termina sugiriendo `companion-tools` |
| 11 | `jayka-style-library` | manual | ✅ **solo informa**: lista y compara fichas, dice qué coincide o ya funcionó; no cambia nada |
| 12 | `jayka-laravel-backend` | manual | ✅ servicios, errores de negocio, acción única por POST, bitácora, validación y pruebas |
| 13 | `jayka-photos` | manual | ✅ subida: WebP, 1200 px, 5 MB, nombres claros |
| 14 | `jayka-views-parity` | manual | ✅ versión genérica: dos frontends (por ejemplo web y app) con las mismas pantallas |
| 15 | `jayka-plan-builder` | manual | ✅ usa Superpowers (`brainstorming`) si está instalado; si no, avisa que no corre igual, ofrece una versión reducida y recomienda instalarlo; nunca lo instala; entrega el plan en `.md` |
| 16 | `jayka-codex-low` | manual | ✅ tareas simples: instrucción en `.md`, vuelve un plan básico en `.md`, pruebas básicas y revisión con Playwright |
| 16 | `jayka-codex-high` | manual | ✅ trabajo grande: pasa por `plan-builder`, pide el esquema de una vista completa (formulario, etc.), vuelve en `.md`; el usuario revisa |
| 17 | `jayka-real-data` | manual | ✅ seeders repetibles, sin datos de demostración, prueba de punta a punta |
| 18 | `jayka-companion-tools` | manual | ✅ solo sugiere cuándo usar `impeccable` (audit, polish, critique), `ui-ux-pro-max`, `design-taste-frontend`, `emil-design-eng` y Superpowers (`brainstorming`, `writing-plans`) |
| 19 | `jayka-reverse` | manual | ✅ ingeniería inversa de algo ajeno: `live <url>` o `repo <ruta-o-url-git>`, niveles 1-3. Scripts propios: escaneo de repo, captura con Playwright (scroll, hover, navegación, video, movimiento reducido), pistas por fotograma con ajuste de easing y comparación original/reproducción. Probada con sitio de prueba y un sitio real con GSAP |

## Estándar de ejecución (desde `jayka-reverse`)
Las skills se escriben como **contrato de ejecución**, no como instrucciones sueltas:
- Argumentos con reglas de lectura en orden y respuesta exacta cuando faltan.
- Cada paso: qué entra, comando exacto, qué debe salir y qué hacer si falla.
- «Terminado cuando…» comprobable para cada nivel o fase.
- Compuertas de permiso con el texto exacto de la pregunta.
- Tabla «Si algo falla».
- Scripts propios cuando una tarea se puede medir en vez de describir.
Mejora de las demás skills a este estándar, por grupos:
- ✅ **A · Base común (2026-10-26):** `jayka-working-rules/reference/convenciones.md` (argumentos, rutas, slug/fecha/NNN, permisos de carpetas, compuertas, origen de afirmaciones). Las 18 manuales tienen `argument-hint`, tabla de argumentos con `$ARGUMENTS` y «Terminado cuando». Rutas unificadas (`.claude/estructura/arbol.md` y `pantallas.md`, `docs/seguridad/`, `docs/proyecto/datos-de-prueba.md`). Descripciones entre comillas (antes había 12 con «: », que rompe el YAML estricto).
- ✅ **B · Scripts que miden (2026-10-26):** probados con sitios, repos y apps de prueba.
  - `security-deploy`: `check-deploy.mjs` (HTTPS, redirección, certificado, encabezados, cookies, 24 rutas sensibles, página de error) y `scan-git-secrets.mjs` (secretos en todo el historial, valores enmascarados), con `secret-patterns.json`.
  - `security-web`: `scan-security.mjs` (22 reglas por sección más secretos en el código; los hallazgos son candidatos que se confirman leyendo).
  - `style-self-learning`: `style-probe.js` (se corre con `capture-live.mjs --eval` de `reverse`; incluye el contraste real con el fondo efectivo), `contrast.mjs` y `check-tokens.mjs` (recalcula contrastes). Corrigió dos contrastes mal calculados en el ejemplo de `tokens.schema.json`.
  - `real-data`: `find-demo-data.mjs`, más comprobación medida de seeders repetibles y del candado de entorno.
  - `views-parity`: `capture-pair.mjs` (capturas lado a lado, diferencias de títulos, acciones y campos, similitud de texto, `paridad.html`).
  - `capture-live.mjs` ganó `--eval` y `--sin-capturas` para que otras skills lo reusen.
- ✅ **C · Plantillas (2026-10-26):**
  - `continuity/reference/continuar-template.md` (encabezado con rama y commit, hecho con verificación, pendientes con siguiente paso y bloqueo, decisiones con fecha).
  - `new-project`: las 42 preguntas tienen **clave estable** (`proyecto.nombre` … `calidad.forma-de-trabajo`); plantillas de `entrevista.md` (formato fijo por entrada con estado), `informe-inicial.md` (cada dato cita su clave) y `CLAUDE.md` (menos de 40 líneas). `retomar` convierte entrevistas del formato anterior.
  - `style-build` lee la entrevista por clave, y su mini-cuestionario guarda con las mismas claves.
  - Codex: la tarea dice si su entorno tiene Playwright; sin él, Codex no lo instala ni describe lo que no vio y declara la revisión «NO HECHA» con la lista de lo que hay que mirar. Quien revisa la hace siempre, y sin revisión visual no hay «cumple».
- ✅ **D · Las tres automáticas sin repeticiones (2026-10-26):** cada regla vive en un solo lugar (`communication`: cómo se habla y se cierra; `working-rules`: permisos, secretos, verificación, negocio, datos y convenciones; `git-rules`: Git) y las demás apuntan a ella. `git-rules` cede ante las reglas de Git del `CLAUDE.md` del usuario. Nuevo bloque `working-rules/reference/bloque-claude-md.md` con las 5 reglas que no pueden fallar, instalable con `/jayka-menu instalar-reglas [global|proyecto]` (con permiso, solo entre sus marcas). No se quitó ninguna regla. Las manuales conservan sus recordatorios de secretos porque son específicos de su contexto.
- ✅ **E · Pruebas (2026-10-26):**
  - `tests/run.mjs`: 15 pruebas deterministas, de estructura (frontmatter, argumentos, «Terminado cuando», referencias y scripts citados que existan, versiones) y de cada script con fixtures temporales. Los secretos falsos se arman en tiempo de ejecución. Las 3 con navegador se omiten sin Playwright. Resultado: 15/15.
  - `plugins/jay-ka/evals/`: 12 escenarios para `claude plugin eval`. Los 6 `sin-shell` pasaron 6/6 en Windows (1 corrida, Sonnet, 0.38 USD). Los 6 `requiere-shell` **no se pudieron correr aquí**: Claude Code no aísla la terminal en Windows. Hay que correrlos en macOS, Linux o WSL.
  - Lo que salió al probar: cada skill manual dice ahora la respuesta exacta ante un argumento desconocido (antes estaba solo en las convenciones y el modelo no la usaba).

## Instalación probada (2026-10-26)
- **Plugin desde la carpeta local:** `claude plugin marketplace add "<ruta del repo>"` y `claude plugin install jay-ka@jay-ka-skilldev-vc` (ámbito usuario). Lee directo de `plugins/jay-ka`, así que los cambios del repo se ven en la siguiente sesión. `claude plugin details jay-ka` reconoce las 21 skills.
- **Costo fijo:** unas **3,200 fichas por sesión**. Las descripciones de las skills manuales también cuentan, aunque su cuerpo no se cargue.
- **Corridas en sesiones nuevas (Sonnet, solo lectura):** `menu` (catálogo), `menu buscar`, `continuity bailar` («No reconozco») y `style-library` (sin biblioteca, solo informa, no creó carpetas).
- **Arreglado al probar:**
  - `menu` marcaba 18 skills como «no instaladas». Las manuales no aparecen en la lista de skills de la sesión; ahora se comprueba por archivo.
  - Con el plugin, los comandos llevan el prefijo `/jay-ka:`; nueva sección 2b de las convenciones y aclaración en los textos que nombran comandos.
  - `menu` contaba mal el total; el catálogo dice ahora «21 skills».
- **Copia a `~/.claude/skills`:** `install.sh` e `install.ps1` probados con `CLAUDE_HOME` temporal: 21 copiadas; bash no pisa sin `--force`; las rutas entre skills vecinas funcionan.
- `/jayka-menu` sin prefijo **no** funciona con el plugin: hay que usar `/jay-ka:jayka-menu`.

## Pendiente
- Correr los escenarios `requiere-shell` en macOS, Linux o WSL.
- Decidir si se acortan las descripciones de las skills manuales para bajar el costo fijo.

## Cómo trabajamos
1. Construir las skills por grupos, mostrando cada una antes de darla por buena.
2. Probar cada skill instalada de verdad (no solo escribirla).
3. Cuando el autor lo ordene: revisar que no haya datos personales, elegir licencia, subir.

## Pendientes de decisión
- Revisión de todas las skills con un modelo más potente antes de instalarlas.
- Licencia (por ejemplo MIT).
- Si el README lleva también versión en inglés.
- Verificar el comando de instalación con el repositorio ya publicado.
