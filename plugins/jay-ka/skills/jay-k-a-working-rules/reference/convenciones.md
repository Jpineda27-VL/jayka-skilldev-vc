# Convenciones comunes de las skills jay-k-a-*

Todas las skills JayKA siguen estas reglas. Si una skill dice algo distinto, manda la skill. Lo que esté en **Mis ajustes** manda sobre todo.

## 1. Argumentos
- Cada skill manual recibe sus argumentos en `$ARGUMENTS` y trae una tabla «Argumentos» con lo que acepta.
- Se leen en este orden: (1) la primera palabra elige el modo o comando, aceptando los alias de la tabla, en español o inglés; (2) el resto es el objetivo o texto libre.
- Sin argumentos: la skill hace lo que su tabla marca como «por defecto». Si no tiene uno, muestra sus opciones en una línea y pregunta cuál.
- Palabra no reconocida: responde «No reconozco `<palabra>`. Opciones: …» y no hagas nada más.
- Falta un dato obligatorio: pregunta **solo** por ese dato, con un ejemplo.

## 2b. Cómo se nombra una skill al sugerirla
El pack se puede instalar de dos formas, y el comando cambia:
- **Como plugin** (la ruta de la skill que estás usando contiene `/plugins/`): `/jay-ka:<nombre>`, por ejemplo `/jay-ka:jay-k-a-continuity cerrar`.
- **Copiado a `~/.claude/skills`** (`scripts/install.sh` o `install.ps1`): `/<nombre>`, por ejemplo `/jay-k-a-continuity cerrar`.

Cada vez que le digas al usuario que corra una skill, escríbela con el prefijo de la instalación actual. En los textos de las skills los nombres van sin prefijo (`jay-k-a-…`) porque valen para las dos formas.

## 2. Rutas
**Dentro del proyecto**

| Ruta | Qué guarda | La escribe |
|---|---|---|
| `CLAUDE.md` | Entrada corta para el asistente | `new-project` |
| `.claude/estado/CONTINUAR.md` | Estado: hecho, pendiente, decisiones | `continuity`, `new-project` |
| `.claude/estructura/arbol.md` | Árbol de carpetas aprobado y rutas de la app | `project-structure` |
| `.claude/estructura/pantallas.md` | Inventario de pantallas y su paridad | `tech-views-parity` |
| `docs/proyecto/entrevista.md` | Respuestas de la entrevista | `new-project` |
| `docs/proyecto/informe-inicial.md` | Informe de arranque | `new-project` |
| `docs/proyecto/estilo.md` | Briefing de estilo aprobado | `style-build` |
| `docs/proyecto/datos-de-prueba.md` | Cuentas de prueba, cómo reiniciar datos, qué sigue en demostración | `tech-real-data` |
| `docs/planes/AAAA-MM-DD-<slug>.md` | Planes por bloques | `plan-builder` |
| `docs/codex/tareas/NNN-<slug>.md` | Tareas para Codex | `tech-codex-plan-low`, `-high` |
| `docs/codex/resultados/NNN-<slug>.md` | Informes que devuelve Codex | Codex |
| `docs/codex/capturas/NNN/` | Capturas de Playwright de cada tarea | Codex |
| `docs/seguridad/AAAA-MM-DD-<web\|deploy>.md` | Informes de seguridad | `security-web`, `security-deploy` |

**Fuera de los proyectos (biblioteca personal)**

| Ruta | Qué guarda |
|---|---|
| `~/.claude/jay-k-a/estilos/` | Fichas de estilo y `estilo-base.md` |
| `~/.claude/jay-k-a/inversa/` | Estudios de ingeniería inversa |
| `~/.claude/jay-k-a/tools/` | Herramientas instaladas con permiso (por ejemplo Playwright) |

Si el proyecto ya usa otra ruta para lo mismo, se respeta la del proyecto y se anota en `CLAUDE.md`.

## 3. Nombres
- **Slug:** minúsculas, sin acentos ni espacios, palabras separadas por guiones, 50 caracteres como máximo. Ejemplo: «Flujo de Pedidos» → `flujo-de-pedidos`.
- **Fecha:** `AAAA-MM-DD`, la de hoy.
- **NNN:** tres dígitos. Es el número más alto que ya exista en `docs/codex/tareas/` más uno; si no hay ninguno, `001`. La tarea y su resultado llevan el mismo número.

## 4. Crear carpetas y archivos
- Una carpeta de la tabla que **no existe**: pide permiso una vez, con este texto: «Voy a crear `<ruta>` para <propósito>. ¿Sigo?». Si ya existe, no se pregunta.
- Un archivo que ya existe se **actualiza**, no se pisa. Si hay que reemplazarlo entero, se guarda antes la versión anterior como `<nombre>.<AAAA-MM-DD>.md`.

## 5. Compuertas (puntos donde se espera al usuario)
- Una sola pregunta, cerrada, con las opciones a la vista. Ejemplo: «¿Lo apruebo así o cambias algo?».
- No se avanza sin una respuesta explícita. El silencio o un tema nuevo no cuentan como «sí».
- Un «sí» vale solo para esa compuerta, no para las siguientes.

## 6. Origen de cada afirmación (en informes y auditorías)
- `Medido`: salió de un comando, prueba, navegador o script.
- `Código`: está en `archivo:línea`.
- `Inferido`: razonado sin comprobar. Nunca se presenta como medido.

## 7. «Terminado cuando»
Cada skill trae esa sección con condiciones comprobables. Si una no se cumple, se dice cuál y por qué; no se da por terminado.

## 8. Cierre
Como dice «Al cerrar un bloque de trabajo» en `jay-k-a-communication`.
