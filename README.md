# jay-ka-skilldev-vc

Skills de **JayKA** para Claude Code: la manera de trabajar del autor (comunicación, reglas de trabajo, Git, seguridad, estructura de proyectos y estilo visual), hechas para servir en cualquier proyecto.

*English: a personal skill pack for Claude Code covering working rules, Git, security, project structure and design-style learning. Generic, editable, opt-in.*

> Estado: en construcción (v0.1.0). Mira `docs/PLAN.md` para el catálogo y lo que falta.

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

- **Siempre activas (cortas):** `jay-k-a-communication`, `jay-k-a-working-rules`, `jay-k-a-git-rules`.
- **Manuales (solo cuando las escribes):** seguridad y publicación, estructura de proyectos, nuevo proyecto con entrevista, continuidad entre sesiones, aprendizaje y construcción de estilo, técnicas, planes para Codex y herramientas recomendadas.
- Escribe `/jay-k-a-init` para ver el catálogo completo en una línea por skill (próximamente).

## Hazlas tuyas
Cada skill termina con una sección **Mis ajustes**. Ahí cambias o agregas reglas a tu estilo; esa sección manda sobre el resto. Si una skill no va con tu forma de trabajar, simplemente no la uses.

## Qué NO hace
- No toca tus claves, tokens ni servicios externos: eso es solo tuyo.
- No reemplaza otras herramientas (Impeccable, Superpowers…): solo las sugiere.

## Licencia
Por definir.
