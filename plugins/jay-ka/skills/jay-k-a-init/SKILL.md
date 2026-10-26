---
name: jay-k-a-init
description: "Muestra el catálogo de skills jay-k-a-* con una línea por skill, cómo se invoca y si está instalada. Con un nombre, explica esa skill; con «buscar», sugiere cuál usar. Invócala con /jay-k-a-init."
argument-hint: "[<skill> | buscar <lo que necesitas>]"
disable-model-invocation: true
---

# JayKA · Init

Muestra el catálogo. **Una línea por skill, sin explicaciones largas.** Para cada una indica si está instalada, mirando la lista de skills disponibles en la sesión (una skill de plugin aparece como `jay-ka:<nombre>`).

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).

| Argumento | Alias | Qué hace |
|---|---|---|
| *(vacío)* | `lista`, `list` | **Por defecto.** Catálogo completo |
| `<skill>` | con o sin el prefijo `jay-k-a-` | Lee su `SKILL.md` y la resume en 3 líneas: para qué sirve, cómo se invoca (sus argumentos) y qué entrega |
| `buscar <texto>` | `search`, `cuál` | Sugiere la skill que mejor encaja con lo que describe el usuario, y una alternativa si la hay, con el motivo en una línea |

## Catálogo
Formato de salida: grupo, y debajo `nombre <argumentos>: descripción corta [instalada / no instalada]`.

### Siempre activas (cortas)
- `jay-k-a-communication`: cómo conversar (español claro, resumen primero, sin editar al conversar).
- `jay-k-a-working-rules`: reglas de trabajo y convenciones comunes de las skills.
- `jay-k-a-git-rules`: commits locales, push y PR solo con tu orden.

### Empezar y continuar
- `jay-k-a-new-project [retomar | informe]`: proyecto nuevo con entrevista de 42 preguntas e informe.
- `jay-k-a-project-structure [nuevo | ordenar | ver]`: propone las carpetas según haya frontend, backend o ambos.
- `jay-k-a-continuity cerrar | abrir`: cierra y abre sesiones sin perder el hilo.

### Seguridad y publicación
- `jay-k-a-security-web construir | auditar [<área>]`: encabezados, cookies, CSRF, límites, permisos y subidas.
- `jay-k-a-security-deploy [<dominio>]`: checklist antes de publicar.

### Estilo visual
- `jay-k-a-style-self-learning [<ruta>] [--slug <nombre>]`: estudia un proyecto terminado y guarda su estilo en una ficha.
- `jay-k-a-style-build [<qué construir>]`: construye prototipos con tus fichas y la entrevista.
- `jay-k-a-style-library lista | ver | comparar | buscar | resumen | huecos | registro`: consulta las fichas; solo informa.
- `jay-k-a-companion-tools [<momento>]`: sugiere cuándo usar Impeccable, Superpowers y otras herramientas.

### Planes y Codex
- `jay-k-a-plan-builder <qué se va a construir>`: plan por bloques en `.md` (usa Superpowers si está instalado).
- `jay-k-a-tech-codex-plan-low <tarea>`: tareas simples para Codex, en `.md`.
- `jay-k-a-tech-codex-plan-high [<plan> <bloque>]`: trabajo grande para Codex, con plan completo.

### Técnicas
- `jay-k-a-tech-laravel-backend nuevo | modulo <nombre> | revisar`: backend con servicios, errores de negocio y pruebas.
- `jay-k-a-tech-photos [<qué fotos>]`: subida de fotos comprimidas a WebP con nombres claros.
- `jay-k-a-tech-views-parity inventario | cambio <pantalla> | verificar [<pantalla>]`: dos frontends con las mismas pantallas.
- `jay-k-a-tech-real-data [inventario | plan | sembrar | conectar | flujo]`: datos de ejemplo reales con seeders, sin demostración.
- `jay-k-a-tech-reverse live <url> | repo <ruta-o-url-git>`: ingeniería inversa de un sitio o repo: stack, animaciones medidas e informe.

## Al terminar
Pregunta una sola cosa: «¿Cuál quieres usar?».

## Terminado cuando
- Catálogo: aparecen todas las skills de la lista, cada una con su estado de instalación **comprobado** en la lista de la sesión (no supuesto).
- `<skill>`: el resumen sale de su `SKILL.md` leído en este momento. Si no está instalada, se dice y se resume desde este catálogo.
- `buscar`: una sugerencia con motivo, o «ninguna encaja» y por qué.

## Mis ajustes
<!-- Agrega aquí tus propias skills o quita las que no uses. -->
