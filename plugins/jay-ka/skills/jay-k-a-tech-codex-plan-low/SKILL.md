---
name: jay-k-a-tech-codex-plan-low
description: "Prepara una tarea SIMPLE para Codex como archivo .md (alcance cerrado, criterios, pruebas básicas y revisión con Playwright) y define el informe .md que debe devolver. Para cambios pequeños y manuales, sin plan grande. Invócala con /jay-k-a-tech-codex-plan-low <tarea>, o «revisar NNN» cuando Codex devuelva el resultado."
argument-hint: "<tarea en una frase> | revisar <NNN>"
disable-model-invocation: true
---

# JayKA · Tech · Codex Plan Low

Para **tareas simples** que se le piden a Codex: cambiar tarjetas, ajustar una pantalla, corregir un detalle, mover un componente. **Sin plan grande**: una instrucción corta en `.md`, y Codex devuelve un informe corto en `.md`. Para una vista o flujo completo usa `jay-k-a-tech-codex-plan-high`.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).

| Argumento | Alias | Qué hace |
|---|---|---|
| `<tarea en una frase>` | | Pasos 1 a 3: prepara la tarea |
| `revisar <NNN>` | `review` | Paso 4: revisa lo que devolvió Codex para la tarea `NNN`. Si no existe `docs/codex/resultados/NNN-*.md`, lo dice y se detiene |
| *(vacío)* | | Pregunta: «¿Qué tarea le pasamos a Codex? (una frase)» |

## Cuándo sí y cuándo no
- **Sí:** el cambio cabe en pocos archivos, el resultado es fácil de comprobar, no hay decisiones de negocio nuevas.
- **No:** hay que diseñar una vista nueva, un formulario completo, datos nuevos o reglas nuevas, o el alcance no está claro. Entonces: `jay-k-a-tech-codex-plan-high` (o `jay-k-a-plan-builder` primero).
- Codex solo se usa **si el usuario lo pide**. Esta skill prepara la tarea; **el usuario decide cuándo y cómo se la pasa a Codex** (la pega en Codex, o pide delegarla si tiene el plugin de Codex).

## Paso 1 · Antes de escribir la tarea
1. **Aclara la tarea en una frase** y confirma el alcance con el usuario (qué sí, qué no). Si faltan datos, pregunta lo mínimo.
2. **Estado limpio:** revisa `git status`. Si hay cambios sin commitear, propón un **commit local** antes de pasarle la tarea a Codex (con `jay-k-a-git-rules`), para poder revisar después solo lo que cambie Codex. No lo hagas sin que el usuario lo apruebe.
3. **Una tarea a la vez.** Si el usuario pide varias, haz varias tareas separadas y en orden.

## Paso 2 · Escribir la tarea
Archivo: `docs/codex/tareas/NNN-<slug>.md` (NNN, slug y carpeta según las convenciones). Usa `reference/task-template.md`. Reglas de contenido:
- **Corta:** una página como máximo.
- **Alcance cerrado:** lista de archivos que puede tocar y la orden «no toques nada fuera de esa lista; si hace falta, detente y pregunta en el informe».
- **Criterios de aceptación** comprobables.
- **Verificación obligatoria:** las pruebas básicas necesarias (las del área, no toda la suite si es muy larga) y revisión con **Playwright** de la pantalla afectada en **375 px y 1280 px**, con capturas.
- **Prohibiciones fijas:** no instalar dependencias, no tocar secretos ni variables de entorno, no hacer push, no cambiar reglas de negocio, no cambiar el estilo aprobado.
- **Formato de respuesta:** el informe en `docs/codex/resultados/NNN-<slug>.md`, con `reference/report-template.md`.
- Sin secretos ni datos personales.

## Paso 3 · Entregar al usuario
Muestra la tarea resumida y di dónde quedó el archivo. Pregunta: «¿Se la paso a Codex o prefieres pegarla tú?». Si el usuario pide delegarla y el plugin de Codex está instalado, usa esa vía; si no, indica que debe pegar el contenido del archivo.

## Paso 4 · Cuando Codex devuelva el resultado
No confíes en el informe: **revísalo**.
1. Lee `docs/codex/resultados/NNN-<slug>.md`.
2. Revisa el **diff real** (`git diff`): ¿tocó solo lo permitido? ¿Hay cambios inesperados, dependencias, secretos?
3. Corre las pruebas tú y, si es visual, mira la pantalla en navegador a 375 px y 1280 px.
4. Compara con los criterios de aceptación.
5. Reporta al usuario: **cumple / cumple con observaciones / no cumple**, y qué falló. No lo des por bueno sin comprobarlo.
6. Si hay que corregir, redacta una tarea de seguimiento corta (otra `NNN`), no edites la anterior.
7. Commit local del resultado aprobado (ver `jay-k-a-git-rules`).

## Qué NO hace
- No ejecuta Codex por su cuenta.
- No amplía el alcance.
- No escribe planes grandes (eso es `plan-high`).

## Terminado cuando
- **Preparar:** `docs/codex/tareas/NNN-<slug>.md` existe, ocupa una página o menos y tiene lista de archivos permitidos, criterios de aceptación, verificación, prohibiciones y formato de respuesta; el usuario sabe dónde está y cómo pasarlo.
- **Revisar:** el veredicto (cumple / cumple con observaciones / no cumple) se basa en el diff, las pruebas y el navegador revisados por ti, no en el informe de Codex; lo aprobado tiene commit local.

## Mis ajustes
<!-- Cambia la carpeta de tareas, las pruebas por defecto, el tamaño de pantalla de Playwright o las prohibiciones. -->
