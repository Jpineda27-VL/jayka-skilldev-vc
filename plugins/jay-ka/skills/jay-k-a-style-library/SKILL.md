---
name: jay-k-a-style-library
description: "Consulta la biblioteca de fichas de estilo (solo lectura): lista, muestra, compara fichas y busca cuál encaja con una descripción, indicando qué coincide y qué ya funcionó. No modifica nada. Invócala con /jay-k-a-style-library lista, ver, comparar, buscar, resumen, huecos o registro."
argument-hint: "lista | ver <slug> | comparar <a> <b> [<c>] | buscar <descripción> | resumen | huecos | registro"
disable-model-invocation: true
---

# JayKA · Style Library

Consulta de la biblioteca personal de estilos. **Solo informa: no crea, edita ni borra nada.** Las fichas las escribe `jay-k-a-style-self-learning`; las usa `jay-k-a-style-build`.

## Dónde está
`~/.claude/jay-k-a/estilos/`
- `<slug>/ficha.md` y `<slug>/tokens.json` (y, opcional, `capturas/`)
- `estilo-base.md`: rasgos que se repiten entre fichas

Si la carpeta no existe o está vacía, dilo y explica cómo crear la primera ficha: «Corre `/jay-k-a-style-self-learning` (con el plugin: `/jay-ka:` delante, convenciones §2b) sobre un proyecto terminado». No crees la carpeta.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).
Cualquier otro argumento: responde solo «No reconozco `<argumento>`. Opciones: …» con las opciones de esta tabla, y no hagas nada más.

Sin argumentos se ejecuta **`lista`**. Alias: `list`, `show` = `ver`, `compare` = `comparar`, `search` = `buscar`, `summary` = `resumen`, `gaps` = `huecos`, `log` = `registro`. Un slug que no existe → «No hay una ficha `<slug>`. Fichas: …».

## Comandos
- **`lista`**: una línea por ficha: nombre, fecha, sensación en 5 palabras, tonos principales, tecnología, y si tiene «Resultado y lecciones» escrito.
- **`ver <slug>`**: resumen de una ficha en máximo 15 líneas: identidad, paleta con roles, tipografía, motivos, tecnología, qué se llevaría y qué evitar. Pregunta si quiere la ficha completa.
- **`comparar <a> <b> [<c>]`**: tabla lado a lado: sensación, color, tipografía, forma, movimiento, densidad, tecnología, resultado. Cierra con **qué comparten**, **qué las distingue** y **cuándo conviene cada una**.
- **`buscar <descripción>`**: busca qué fichas encajan con lo que el usuario describe («algo cálido para una tienda de reservas, en celular»). Usa las dimensiones de `jay-k-a-style-build/reference/matching.md` si está disponible. Por cada coincidencia: **qué coincide**, **qué no**, y **qué funcionó** según su sección «Resultado y lecciones». Si ninguna encaja, dilo.
- **`resumen`**: lee `estilo-base.md` y cuenta cuántos proyectos comparten cada rasgo (familias, tonos, radios, patrones, librerías). Señala la **firma** del usuario (lo que más se repite).
- **`huecos`**: qué le falta a la biblioteca: fichas sin «Resultado y lecciones», fichas antiguas (por fecha), fichas sin medición en navegador, y rasgos que aparecen en una sola ficha.
- **`registro`**: lista, por ficha, las lecciones registradas: qué funcionó y qué se cambiaría.

## Reglas
1. **Solo lectura.** Si el usuario pide cambiar o crear una ficha, dile qué skill lo hace (`jay-k-a-style-self-learning` para fichas, `jay-k-a-style-build` para usarlas) y no lo hagas aquí.
2. No inventes datos que la ficha no tenga: di «sin dato» y de dónde saldría.
3. No muestres capturas ni datos personales de clientes aunque estén en una ficha.
4. Respuestas cortas: tablas y listas, sin repetir la ficha entera.
5. Las coincidencias son sugerencias. La decisión es del usuario.

## Terminado cuando
- La respuesta sale solo de lo que dicen las fichas leídas en este momento; cada dato ausente dice «sin dato».
- Ningún archivo de la biblioteca cambió.

## Mis ajustes
<!-- Cambia el formato de la lista o agrega comandos propios. -->
