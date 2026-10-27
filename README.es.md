# jayka-skilldev-vc

*English: [README.md](README.md)*

**Skills auxiliares y opcionales para Claude Code y Codex**, para programadores que construyen con IA («vibe coding») y quieren mantener el orden **desde el chat**, sin escribir comandos ni acordarse de procesos.

Tú describes lo que quieres; las skills cuidan el orden alrededor: un plan antes de construir, permisos pedidos, secretos que quedan en tus manos, verificación antes de decir «listo», commits limpios y el estado guardado entre sesiones. Son **ayudantes, no un framework**: cada proyecto conserva sus propias skills y reglas, y usas estas solo cuando te sirven.

> Estado: v0.10.0 · 21 skills por edición · Claude probado como plugin y por copia; plugin Codex instalado y verificado por CLI con un perfil temporal. Las skills están escritas en inglés y **responden en tu idioma** (español, inglés…). Mira `docs/PLAN.md`.

## Instalar

### Codex: plugin desde este repositorio

Agrega el catálogo desde una terminal con una versión de Codex CLI que admita plugins:

```text
codex plugin marketplace add Jpineda27-VL/jayka-skilldev-vc
codex plugin add jay-ka-codex@jayka-skilldev-codex
```

También puedes instalarlo desde el directorio de plugins de la aplicación de escritorio: selecciona la fuente **JayKA for Codex** y el plugin **jay-ka-codex**. Reinicia la aplicación si el catálogo no aparece. En un chat nuevo, usa `$jayka-menu`.

Mientras esta compatibilidad solo esté en tu copia local, ejecuta `codex plugin marketplace add .` desde la raíz del repositorio. El comando de GitHub requiere que los archivos de Codex ya estén publicados en la rama remota que instales.

Ambas ediciones conviven en el repositorio: `plugins/jay-ka` para Claude y `plugins/jay-ka-codex` para Codex. Cada una tiene su catálogo. En Codex, las skills de tareas se llaman `$jayka-claude-low` y `$jayka-claude-high`: preparan archivos para trabajar con Claude. [Compatibilidad, mantenimiento y validación](docs/CODEX.md).

### Claude Code

**Opción A: como plugin (recomendada).** Dentro de Claude Code:

```text
/plugin marketplace add Jpineda27-VL/jayka-skilldev-vc
/plugin install jay-ka@jayka-skilldev-vc
```

Las skills de un plugin llevan el nombre del plugin delante: `/jay-ka:jayka-menu`, `/jay-ka:jayka-continuity close`…

**Opción B: copiar las skills a tu carpeta global** (así se llaman sin el prefijo: `/jayka-menu`).

```bash
# macOS, Linux o Git Bash
./scripts/install.sh
```

```powershell
# Windows PowerShell
./scripts/install.ps1
```

El script no pisa skills que ya existan; agrega `--force` (bash) o `-Force` (PowerShell) para reemplazarlas. No uses las dos opciones a la vez: verías cada skill duplicada.

## Primeros pasos
```text
/jay-ka:jayka-menu                      el catálogo, una línea por skill
/jay-ka:jayka-menu search <necesidad>   qué skill encaja con lo que necesitas
/jay-ka:jayka-menu install-rules        pone las reglas base en tu CLAUDE.md (pide permiso)
```

## Qué trae

| Grupo | Skills |
|---|---|
| **Automáticas** (Claude las carga cuando aplican) | `jayka-communication`, `jayka-working-rules`, `jayka-git-rules` |
| **Empezar y continuar** | `jayka-new-project` (entrevista de 42 preguntas), `jayka-project-structure`, `jayka-continuity` (`close` / `open`) |
| **Seguridad** | `jayka-security-web` (`build` / `audit`), `jayka-security-deploy` |
| **Estilo visual** | `jayka-style-self-learning`, `jayka-style-build`, `jayka-style-library`, `jayka-companion-tools` |
| **Planes y Codex** | `jayka-plan-builder`, `jayka-codex-low`, `jayka-codex-high` |
| **Técnicas** | `jayka-laravel-backend`, `jayka-photos`, `jayka-views-parity`, `jayka-real-data`, `jayka-reverse` |

`jayka-reverse` estudia un sitio o repositorio que no es tuyo (`live <url>` / `repo <ruta>`): stack, librerías y animaciones, transiciones y scroll **medidos**, más una reproducción verificada. Necesita Node 18+ y, para medir sitios, Playwright con Chromium; la skill pide permiso antes de instalarlo en `~/.claude/jayka/tools/`, fuera de tus proyectos.

Varias skills corren **sus propios scripts** (revisiones de seguridad, contraste, paridad, buscador de datos de demostración…) en vez de solo describir qué revisar. Necesitan Node 18+.

## Idioma
Las skills están escritas en inglés. Claude responde y escribe los documentos (informes, archivos de estado, entrevistas) en **el idioma en que le escribes**. Los elementos fijos que otras skills vuelven a leer (estados como `pending`, claves de la entrevista como `identity.tones`, nombres de archivo) se quedan en inglés. Los argumentos van en inglés con alias comunes en español (`close` = `cerrar`).

## Hazlas tuyas
Cada skill termina con una sección **My settings**. Ahí cambias o agregas reglas a tu estilo; esa sección manda sobre el resto. Si una skill no va con tu forma de trabajar, simplemente no la uses.

## Qué NO hacen
- No tocan tus claves, tokens ni servicios externos: eso es solo tuyo.
- No reemplazan otras herramientas (Impeccable, Superpowers…): solo las sugieren.
- No hacen push, no abren pull requests ni publican si no se lo pides en el chat.

## Pruebas
Dos capas:

```bash
# 1. Deterministas: estructura de las 21 skills y comportamiento de cada script (no gastan tokens)
node tests/run.mjs

# La misma suite para el paquete de Codex
node tests/run.mjs --edition codex
```

Las 3 pruebas con navegador corren solo si Playwright está en `~/.claude/jayka/tools/` (o en la carpeta que indique la variable `JAYKA_TOOLS`); si no, se omiten.

```bash
# 2. Comportamiento con Claude: escenarios en plugins/jay-ka/evals/ (usan tu cuenta)
cd plugins/jay-ka
claude plugin eval . --tag no-shell --scaffold --allow-tools Write Edit --trust-plugin --runs 1
```

Detalles, casos y límites en `plugins/jay-ka/evals/README.md` (en inglés).

Para probar el comportamiento del plugin Codex, desde la raíz del repositorio:

```bash
# Usa tu sesión de Codex y consume tokens de tu cuenta
node tests/codex-evals.mjs

# Un caso o varias repeticiones
node tests/codex-evals.mjs --only menu-catalog
node tests/codex-evals.mjs --runs 3
```

Cada caso instala el plugin en un perfil temporal y trabaja en un proyecto de prueba. Los resultados, respuestas, archivos creados y tokens quedan en `tests/results/codex/` (ignorado por Git). [Escenarios, requisitos y límites](tests/CODEX-EVALS.md).

## Licencia
[MIT](LICENSE).
