---
name: jayka-menu
description: "Muestra el catálogo de skills jayka-* con una línea por skill, cómo se invoca y si está instalada. Con un nombre, explica esa skill; con «buscar», sugiere cuál usar; con «instalar-reglas», pone las reglas base en CLAUDE.md. Invócala con /jayka-menu."
argument-hint: "[<skill> | buscar <lo que necesitas> | instalar-reglas [global | proyecto]]"
disable-model-invocation: true
---

# JayKA · Menu

Muestra el catálogo. **Una línea por skill, sin explicaciones largas.**

**Instalada o no:** comprueba si existe `../<nombre>/SKILL.md` (ruta relativa a esta skill) con Glob o Read. **No uses la lista de skills de la sesión**: las skills manuales (con `disable-model-invocation`) no aparecen ahí aunque estén instaladas.

**Cómo se invoca:** escribe cada nombre con el prefijo que corresponde a la instalación, según la sección 2b de las convenciones (con plugin, `/jay-ka:<nombre>`; copiada a `~/.claude/skills`, `/<nombre>`).

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jayka-working-rules/reference/convenciones.md` (ruta relativa a esta skill).
Cualquier otro argumento: responde solo «No reconozco `<argumento>`. Opciones: …» con las opciones de esta tabla, y no hagas nada más.

| Argumento | Alias | Qué hace |
|---|---|---|
| *(vacío)* | `lista`, `list` | **Por defecto.** Catálogo completo |
| `<skill>` | con o sin el prefijo `jayka-` | Lee su `SKILL.md` y la resume en 3 líneas: para qué sirve, cómo se invoca (sus argumentos) y qué entrega |
| `buscar <texto>` | `search`, `cuál` | Sugiere la skill que mejor encaja con lo que describe el usuario, y una alternativa si la hay, con el motivo en una línea |
| `instalar-reglas [global \| proyecto]` | `reglas` | Pone en un `CLAUDE.md` el bloque corto de reglas que deben valer siempre. Ver «Instalar las reglas base». Por defecto: `proyecto` |

## Instalar las reglas base
Las skills automáticas se cargan cuando Claude las cree útiles; `CLAUDE.md` se lee **siempre**. Por eso las cinco reglas que no pueden fallar (no editar al conversar, secretos solo del usuario, permisos, no inventar negocio, verificar antes de «listo») también pueden ir en `CLAUDE.md`.
1. Destino: `proyecto` → `CLAUDE.md` en la raíz del proyecto actual; `global` → `~/.claude/CLAUDE.md` (vale para todos los proyectos).
2. Lee el bloque de `../jayka-working-rules/reference/bloque-claude-md.md` (ruta relativa a esta skill) y el archivo de destino, si existe.
3. Muestra el bloque tal cual y dónde irá. Si el destino ya tiene reglas que se parecen (por ejemplo, de Git o de secretos), dilo: el bloque no las reemplaza ni las borra.
4. Pregunta: «¿Agrego este bloque al final de `<destino>`?». Sin un «sí», no se toca nada.
5. Con el sí:
   - Si el archivo ya tiene las marcas `jay-k-a:reglas-base:inicio` y `…:fin`, reemplaza **solo** lo que está entre ellas.
   - Si no las tiene, agrega el bloque al final, separado por una línea en blanco.
   - Si el archivo no existe, créalo solo con el bloque.
   - Nunca cambies nada fuera de las marcas.
6. Muestra las líneas que cambiaron.

## Catálogo (21 skills)
Formato de salida: grupo, y debajo `nombre <argumentos>: descripción corta [instalada / no instalada]`.

### Automáticas (Claude las carga cuando aplican; las reglas que deben valer siempre van con `instalar-reglas`)
- `jayka-communication`: cómo conversar (español claro, resumen primero, sin editar al conversar).
- `jayka-working-rules`: reglas de trabajo y convenciones comunes de las skills.
- `jayka-git-rules`: commits locales, push y PR solo con tu orden.

### Empezar y continuar
- `jayka-new-project [retomar | informe]`: proyecto nuevo con entrevista de 42 preguntas e informe.
- `jayka-project-structure [nuevo | ordenar | ver]`: propone las carpetas según haya frontend, backend o ambos.
- `jayka-continuity cerrar | abrir`: cierra y abre sesiones sin perder el hilo.

### Seguridad y publicación
- `jayka-security-web construir | auditar [<área>]`: encabezados, cookies, CSRF, límites, permisos y subidas.
- `jayka-security-deploy [<dominio>]`: checklist antes de publicar.

### Estilo visual
- `jayka-style-self-learning [<ruta>] [--slug <nombre>]`: estudia un proyecto terminado y guarda su estilo en una ficha.
- `jayka-style-build [<qué construir>]`: construye prototipos con tus fichas y la entrevista.
- `jayka-style-library lista | ver | comparar | buscar | resumen | huecos | registro`: consulta las fichas; solo informa.
- `jayka-companion-tools [<momento>]`: sugiere cuándo usar Impeccable, Superpowers y otras herramientas.

### Planes y Codex
- `jayka-plan-builder <qué se va a construir>`: plan por bloques en `.md` (usa Superpowers si está instalado).
- `jayka-codex-low <tarea>`: tareas simples para Codex, en `.md`.
- `jayka-codex-high [<plan> <bloque>]`: trabajo grande para Codex, con plan completo.

### Técnicas
- `jayka-laravel-backend nuevo | modulo <nombre> | revisar`: backend con servicios, errores de negocio y pruebas.
- `jayka-photos [<qué fotos>]`: subida de fotos comprimidas a WebP con nombres claros.
- `jayka-views-parity inventario | cambio <pantalla> | verificar [<pantalla>]`: dos frontends con las mismas pantallas.
- `jayka-real-data [inventario | plan | sembrar | conectar | flujo]`: datos de ejemplo reales con seeders, sin demostración.
- `jayka-reverse live <url> | repo <ruta-o-url-git>`: ingeniería inversa de un sitio o repo: stack, animaciones medidas e informe.

## Al terminar
Pregunta una sola cosa: «¿Cuál quieres usar?».

## Terminado cuando
- Catálogo: aparecen todas las skills de la lista, cada una con su estado de instalación **comprobado por archivo** (no supuesto) y con el prefijo de invocación correcto para esta instalación.
- `<skill>`: el resumen sale de su `SKILL.md` leído en este momento. Si no está instalada, se dice y se resume desde este catálogo.
- `buscar`: una sugerencia con motivo, o «ninguna encaja» y por qué.
- `instalar-reglas`: el destino tiene el bloque una sola vez, entre sus marcas; nada fuera de ellas cambió; o, si el usuario no aprobó, nada cambió.

## Mis ajustes
<!-- Agrega aquí tus propias skills o quita las que no uses. -->
