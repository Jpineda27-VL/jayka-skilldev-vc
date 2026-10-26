# jay-ka-skilldev-vc

Skills de **JayKA** para Claude Code: la manera de trabajar del autor (comunicación, reglas de trabajo, Git, seguridad, estructura de proyectos y estilo visual), hechas para servir en cualquier proyecto.

*English: a personal skill pack for Claude Code covering working rules, Git, security, project structure and design-style learning. Generic, editable, opt-in.*

> Estado: v0.8.0, catálogo de 21 skills (sin probar todavía instaladas dentro de Claude Code). Mira `docs/PLAN.md`.

## Instalar

**Opción A: como plugin (recomendada).** Dentro de Claude Code:

```text
/plugin marketplace add Jpineda27-VL/jay-ka-skilldev-vc
/plugin install jay-ka@jay-ka-skilldev-vc
```

Las skills de un plugin llevan el nombre del plugin delante, por ejemplo `/jay-ka:jay-k-a-git-rules`.

**Opción B: copiando las skills a tu carpeta global** (se invocan solo como `/jay-k-a-git-rules`).

```bash
# macOS, Linux o Git Bash
./scripts/install.sh
```

```powershell
# Windows PowerShell
./scripts/install.ps1
```

El script no pisa skills que ya existan; agrega `--force` (bash) o `-Force` (PowerShell) para reemplazarlas.

## Qué trae
Mira `docs/PLAN.md`. Resumen:

- **Automáticas:** `jay-k-a-communication`, `jay-k-a-working-rules`, `jay-k-a-git-rules`. Claude las carga cuando aplican. Para que las reglas que no pueden fallar valgan **siempre**, `/jay-k-a-init instalar-reglas` pone un bloque corto en tu `CLAUDE.md` (pide permiso y solo toca lo que está entre sus marcas). Si ya tienes reglas de Git en tu `CLAUDE.md`, mandan las tuyas.
- **Manuales (solo cuando las escribes):** seguridad y publicación, estructura de proyectos, nuevo proyecto con entrevista, continuidad entre sesiones, aprendizaje y construcción de estilo, técnicas, planes para Codex y herramientas recomendadas.
- Escribe `/jay-k-a-init` para ver el catálogo completo en una línea por skill.

`jay-k-a-tech-reverse` usa Node 18 o más y, para medir sitios, Playwright con Chromium. La skill pide permiso antes de instalarlo en `~/.claude/jay-k-a/tools/`, fuera de tus proyectos.

## Pruebas
Dos capas:

```bash
# 1. Deterministas: estructura de las 21 skills y comportamiento de cada script (no gastan tokens)
node tests/run.mjs
```

Las 3 pruebas con navegador corren solo si Playwright está en `~/.claude/jay-k-a/tools/` (o en la carpeta que indique la variable `JAYKA_TOOLS`); si no, se omiten.

```bash
# 2. Comportamiento con Claude: escenarios en plugins/jay-ka/evals/ (usan tu cuenta)
cd plugins/jay-ka
claude plugin eval . --tag sin-shell --scaffold --allow-tools Write Edit --trust-plugin --runs 1
```

Detalles, casos y limitaciones en `plugins/jay-ka/evals/README.md`.

## Hazlas tuyas
Cada skill termina con una sección **Mis ajustes**. Ahí cambias o agregas reglas a tu estilo; esa sección manda sobre el resto. Si una skill no va con tu forma de trabajar, simplemente no la uses.

## Qué NO hace
- No toca tus claves, tokens ni servicios externos: eso es solo tuyo.
- No reemplaza otras herramientas (Impeccable, Superpowers…): solo las sugiere.

## Licencia
Por definir.
