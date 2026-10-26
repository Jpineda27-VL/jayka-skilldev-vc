---
name: jay-k-a-tech-codex-plan-high
description: "Para trabajo GRANDE que se le pide a Codex (una vista completa, un formulario, un flujo): pasa por Plan Builder, divide el plan en tareas .md ordenadas con criterios, pruebas y revisión con Playwright, y define el informe .md que Codex devuelve. El usuario revisa al final. Invócala con /jay-k-a-tech-codex-plan-high <plan> <bloque>, o «revisar NNN» cuando Codex devuelva el resultado."
argument-hint: "[<ruta-del-plan> <bloque>] | revisar <NNN>"
disable-model-invocation: true
---

# JayKA · Tech · Codex Plan High

Para pedirle a Codex **un bloque grande**: «crea una vista completa con un formulario», «arma el flujo de pedidos». Codex construye el **esquema base completo**; el usuario **revisa y termina** al final. Para cambios pequeños usa `jay-k-a-tech-codex-plan-low`.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).
Cualquier otro argumento: responde solo «No reconozco `<argumento>`. Opciones: …» con las opciones de esta tabla, y no hagas nada más.

| Argumento | Alias | Qué hace |
|---|---|---|
| `<ruta-del-plan> <bloque>` | | Usa ese bloque (número o título) de ese plan aprobado y va al Paso 2 |
| `revisar <NNN>` | `review` | Paso 4 para la tarea `NNN` |
| *(vacío)* | | Busca en `docs/planes/` planes aprobados con bloques sin marcar. Si hay, los lista y pregunta cuál bloque. Si no hay, va al Paso 1 (plan primero) |

Codex solo se usa **si el usuario lo pide**. Esta skill prepara todo; el usuario decide cuándo y cómo pasárselo.

## Paso 1 · Plan primero (obligatorio)
1. Usa `jay-k-a-plan-builder`. Si Superpowers no está instalado, Plan Builder lo dirá y el usuario elegirá; respeta esa elección y anótala en el plan.
2. Del plan aprobado, toma **un bloque a la vez**. Si el plan no existe todavía, créalo antes; no escribas tareas sueltas para trabajo grande.
3. **Estado limpio:** revisa `git status`; si hay cambios sin commitear, propón un commit local previo (con `jay-k-a-git-rules`) para poder revisar después solo lo de Codex. Pide aprobación.
4. **Entorno de Codex:** igual que en `jay-k-a-tech-codex-plan-low` (Paso 1, punto 4): averigua si tiene Playwright y puede levantar la app, y anótalo en el campo de la tarea.

## Paso 2 · Diseñar la tarea grande
Una tarea grande = **un bloque del plan** con un esquema completo. Sigue `reference/task-template.md`, que añade a lo básico:
- **Objetivo y resultado esperado** en lenguaje claro, con la pantalla o flujo descrito de arriba abajo.
- **Especificación de la vista:** secciones, campos (nombre, tipo, obligatorio, validación, mensajes de error), estados (vacío, cargando, error, éxito), textos, acciones y a dónde lleva cada una.
- **Reglas:** la validación y la lógica **van en el servidor**; la pantalla solo muestra y envía. Si el proyecto tiene reglas de negocio, indica el documento donde están y **no inventes reglas nuevas**: lo no decidido se deja marcado como pendiente.
- **Datos:** qué tablas o modelos usa, qué migraciones nuevas (solo agregar, nunca editar las aplicadas) y datos de ejemplo por seeder, no escritos a mano en la pantalla.
- **Rutas y nombres** según las convenciones del proyecto.
- **Estilo:** usar los tokens y componentes existentes (o el briefing de `jay-k-a-style-build`); sin colores ni tamaños sueltos.
- **Alcance:** lista de archivos a crear y a tocar; nada fuera de la lista sin pedir permiso en el informe.
- **Pruebas:** una prueba por regla importante, más las del área; resultado real en el informe.
- **Revisión visual obligatoria:** cada pantalla nueva a 375 px y 1280 px, recorriendo el flujo (incluidos errores de validación y estados vacíos), con capturas en `docs/codex/capturas/NNN/`. Sin Playwright, Codex **no lo instala ni describe lo que no vio**: la declara «NO HECHA» y deja la lista exacta de lo que hay que mirar (la plantilla trae las tres situaciones).
- **Prohibiciones fijas:** no instalar dependencias, no tocar secretos ni variables de entorno, no push, no PR, no cambiar de rama, no cambiar reglas de negocio ni el estilo aprobado.
- **Puntos de parada:** si algo es ambiguo, Codex **se detiene en esa parte**, lo anota en «Dudas» y avanza con lo demás.
- **Qué debe devolver:** el informe en `docs/codex/resultados/NNN-<slug>.md` (`reference/report-template.md`).

Si el bloque es demasiado grande para una tarea (más de ~15 archivos o varias pantallas independientes), **divídelo** en tareas `NNN`, `NNN+1`, … con un orden y dependencias, y se pasan **una por una**.

## Paso 3 · Entregar al usuario
Muestra un resumen: tareas, orden, alcance y criterios. Pregunta: «¿Se las paso a Codex, o prefieres pegarlas tú?». Si pide delegar y el plugin de Codex está instalado, usa esa vía; si no, indica qué archivos pegar. **Una tarea a la vez.**

## Paso 4 · Revisar lo que devuelva Codex
No confíes en el informe. Por cada tarea:
1. Lee el informe.
2. Revisa el **diff real**: ¿solo archivos permitidos? ¿dependencias, secretos, migraciones editadas, reglas inventadas?
3. Corre las pruebas tú mismo.
4. **Revisión visual, siempre:** mira las pantallas a 375 px y 1280 px y recorre el flujo (éxito, errores de validación, estado vacío) con la herramienta de navegador disponible. Si el informe dice «NO HECHA», recorre además su lista punto por punto. Para capturas de carga a los dos tamaños, sirve `node "<SKILL_DIR>/../jay-k-a-tech-reverse/scripts/capture-live.mjs" <url> --out docs/codex/capturas/NNN/revision --steps 0 --hover 0 --no-reduced`; los estados del flujo (errores, vacío) se revisan a mano, porque el script no envía formularios. Si un informe describe pantallas pero dice que no tenía Playwright, trátalo como **no cumple**.
5. Compara con los criterios de aceptación y con el plan.
6. Entrega al usuario: **cumple / cumple con observaciones / no cumple**, lista de lo que falta y de lo que decidió Codex por su cuenta. **Sin revisión visual hecha por alguien, el veredicto no puede ser «cumple».**
7. Marca las casillas del plan, y haz commit local de lo aprobado (ver `jay-k-a-git-rules`).

## Paso 5 · Revisión final del usuario
Al terminar todas las tareas, prepara un **resumen de revisión** para el usuario: qué se creó, cómo probarlo (rutas y datos de prueba, sin claves reales), qué quedó pendiente y qué decisiones esperan. El usuario termina y ajusta. Sugiere `jay-k-a-companion-tools` (auditoría y pulido) y `jay-k-a-continuity` para guardar el estado.

## Qué NO hace
- No ejecuta Codex por su cuenta.
- No escribe tareas grandes sin plan aprobado.
- No amplía el alcance ni decide reglas de negocio.

## Terminado cuando
- **Preparar:** cada tarea `docs/codex/tareas/NNN-<slug>.md` (numeración según las convenciones) sale de un bloque de un plan aprobado y tiene especificación de la vista, alcance de archivos, pruebas, Playwright, prohibiciones, puntos de parada y formato de respuesta; si se dividió, el orden y las dependencias están escritos.
- **Revisar:** cada tarea tiene veredicto basado en tu propia revisión del diff, las pruebas y el navegador; las casillas del plan están marcadas y lo aprobado tiene commit local.
- **Final:** el resumen de revisión del Paso 5 se entregó.

## Mis ajustes
<!-- Cambia carpetas, límite de archivos por tarea, comando de pruebas o tamaños de Playwright. -->
