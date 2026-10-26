# jayka-skilldev-vc

*English: [README.md](README.md)*

**Skills auxiliares y opcionales para Claude Code**, para programadores que construyen con IA («vibe coding») y quieren mantener el orden **desde el chat**, sin escribir comandos ni acordarse de procesos.

Tú describes lo que quieres; las skills cuidan el orden alrededor: un plan antes de construir, permisos pedidos, secretos que quedan en tus manos, verificación antes de decir «listo», commits limpios y el estado guardado entre sesiones. Son **ayudantes, no un framework**: cada proyecto conserva sus propias skills y reglas, y usas estas solo cuando te sirven.

> Estado: v0.10.0 · 21 skills · probado instalado como plugin y por copia. Las skills están escritas en inglés y **responden en tu idioma** (español, inglés…). Mira `docs/PLAN.md`.

## Instalar

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
```

Las 3 pruebas con navegador corren solo si Playwright está en `~/.claude/jayka/tools/` (o en la carpeta que indique la variable `JAYKA_TOOLS`); si no, se omiten.

```bash
# 2. Comportamiento con Claude: escenarios en plugins/jay-ka/evals/ (usan tu cuenta)
cd plugins/jay-ka
claude plugin eval . --tag no-shell --scaffold --allow-tools Write Edit --trust-plugin --runs 1
```

Detalles, casos y límites en `plugins/jay-ka/evals/README.md` (en inglés).

## Licencia
[MIT](LICENSE).
