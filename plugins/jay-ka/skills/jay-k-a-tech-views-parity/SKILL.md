---
name: jay-k-a-tech-views-parity
description: "Mantiene la paridad cuando un producto tiene dos frontends que deben mostrar las mismas pantallas (por ejemplo web renderizada en el servidor y app móvil, o web y app nativa): inventario de pantallas, fuente única de datos, checklist de paridad y verificación en ambos. Invócala con /jay-k-a-tech-views-parity inventario, cambio <pantalla> o verificar."
argument-hint: "inventario | cambio <pantalla> | verificar [<pantalla> | todo]"
disable-model-invocation: true
---

# JayKA · Tech · Views Parity

Cuando el mismo producto se ve en **dos frontends** (por ejemplo vistas del servidor para escritorio y una app para el celular), cada cambio de una pantalla debe llegar **a los dos**. Esta skill evita que se desfasen.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).

| Argumento | Alias | Qué hace |
|---|---|---|
| `inventario` | `inventory` | Paso 0: crea o actualiza el inventario |
| `cambio <pantalla>` | `change` | Pasos 1 a 4 para esa pantalla (por id o ruta del inventario) |
| `verificar [<pantalla> \| todo]` | `check` | Solo los pasos 3 y 4. Sin pantalla: las que el inventario no marca como `igual` |
| *(vacío)* | | Si no existe `.claude/estructura/pantallas.md` → `inventario`. Si existe → pregunta: «¿Cambio en una pantalla, o verificar?» |

Una pantalla que no está en el inventario → «`<pantalla>` no está en el inventario. ¿La agrego?».

## Regla central
**Cambiar una pantalla = cambiar las dos versiones en el mismo trabajo**, o dejar anotado explícitamente cuál queda pendiente y por qué. Nunca «después lo igualamos» sin registro.

## Principios
1. **Una sola fuente de verdad.** Los datos y las reglas viven en el **servidor** (servicios/API). Los dos frontends solo muestran y envían. Si una regla aparece duplicada en un frontend, es un defecto: muévela al servidor.
2. **Mismos datos, misma forma.** Los dos frontends leen de los mismos servicios o de una API con la misma forma. No crees una versión de los datos para cada uno.
3. **Mismo sistema de diseño.** Los mismos tokens (colores, tipografía, espaciados, radios) y los mismos nombres de rol. Un cambio de token se aplica a ambos.
4. **Mismos textos.** Títulos, botones y mensajes iguales. Idealmente salen de un solo lugar; si no, se actualizan juntos.
5. **Misma navegación y misma lógica de estados:** vacío, cargando, error, éxito y desactivado se comportan igual.
6. **Lo que sí puede diferir:** la distribución (columnas vs una columna), los gestos del celular y las pantallas que solo tienen sentido en un dispositivo (se anotan como «solo web» o «solo app» en el inventario, con motivo).

## Paso 0 · Inventario de pantallas
Mantén `.claude/estructura/pantallas.md` con una fila por pantalla. Plantilla en `reference/screen-inventory.md`. Si no existe, **créalo** (según las convenciones), recorriendo rutas y vistas.
Columnas mínimas: **id** · **ruta** · **frontend A (archivo)** · **frontend B (archivo)** · **datos (servicio o API)** · **estado de paridad** (`igual`, `A adelantado`, `B adelantado`, `solo A`, `solo B`) · **notas**.

## Paso 1 · Antes de tocar una pantalla
1. Búscala en el inventario. ¿Existe en los dos? ¿Está en paridad ahora?
2. Si no está en paridad, **díselo al usuario** antes de añadir más cambios: «Esta pantalla ya estaba desfasada en B; ¿la igualamos también?».
3. Revisa de dónde sale el dato. Si cambia, cambia en el servicio, no en un frontend.

## Paso 2 · Hacer el cambio en los dos
Orden recomendado: **servidor (datos y reglas)** → **frontend A** → **frontend B** → pruebas.
Usa el **checklist de paridad** (`reference/parity-checklist.md`) para no olvidar estados, textos ni tamaños.

## Paso 3 · Verificar los dos (obligatorio)
1. **Comparación medida.** Con los dos frontends corriendo (local o publicados), escribe un archivo de rutas con una línea por pantalla, `id | urlA | urlB`, sacado del inventario, y corre:
   `node "<SKILL_DIR>/scripts/capture-pair.mjs" --rutas <archivo> --out <carpeta> [--ua-b movil]`
   (`SKILL_DIR` es el directorio base de esta skill. Hace falta Node 18 o más y Playwright: si falta, el script sale con código 3 y explica cómo instalarlo; se instala solo con permiso. Para una sola pantalla: `--a <urlA> --b <urlB>`).
   - Usa `--ua-a` / `--ua-b` (`movil`, `escritorio` o un texto) cuando el servidor elige el frontend según el dispositivo.
   - Por pantalla y tamaño (1280 y 375 px) devuelve: `igual` o `difiere`, títulos, acciones y campos que están solo en A o solo en B, y la similitud del texto (0 a 1; `igual` exige 0.9 o más). `paridad.html` muestra las capturas de página completa lado a lado con esas diferencias. **Mira `paridad.html`**: el script no ve colores, orden ni espaciados.
2. **A mano, lo que el script no recorre:** estado vacío, error de validación y carga en cada frontend (el script no hace clics ni envía formularios).
3. Compara lado a lado: títulos, orden, textos, colores, estados, enlaces.
- Si cambió algo del servidor: corre las pruebas.
- Si el frontend B es una app que se exporta o compila, **vuelve a exportarla** y verifica la versión nueva (no la anterior en caché).

## Paso 4 · Actualizar el inventario
Marca el estado de paridad, la fecha y el commit. Si algo quedó pendiente, anótalo con el motivo y quién decide.

## Trampas frecuentes
- **Datos de ejemplo escritos a mano** en uno de los frontends: la pantalla «funciona» pero no lee el servidor. Detéctalo con `find-demo-data.mjs` de `jay-k-a-tech-real-data`.
- **Recargas completas** en un frontend (parpadeo, esqueleto) y actualización en vivo en el otro: unifica el comportamiento (refrescar sin vaciar la pantalla).
- **Rutas distintas** para la misma pantalla: documéntalas en el inventario.
- **Fotos y rutas de archivos** que solo resuelve uno de los frontends: usa la misma función o regla para construir la dirección.
- **Estados vacíos** olvidados en uno de los dos.
- **Textos copiados a mano** que se desactualizan: centralízalos si el proyecto crece.

## Qué NO hacer
- No duplicar lógica de negocio en el frontend para «ir más rápido».
- No dar por buena una pantalla porque se ve bien en un solo frontend.
- No cambiar el diseño de una versión sin avisar y registrar.

## Terminado cuando
- **`inventario`:** cada ruta y vista de los dos frontends tiene su fila, con estado de paridad.
- **`cambio`:** la pantalla quedó cambiada en los dos frontends (o lo pendiente está anotado con motivo), `capture-pair.mjs` da `igual` (o cada diferencia está explicada), el checklist de paridad está recorrido, las pruebas del servidor pasan si se tocó, y el inventario tiene estado, fecha y commit.
- **`verificar`:** `capture-pair.mjs` se corrió para cada pantalla revisada; cada `difiere` está explicado (corregido, o anotado como diferencia permitida con motivo); los estados que el script no recorre se revisaron a mano; y el estado en el inventario refleja lo que se vio.

## Mis ajustes
<!-- Nombra tus dos frontends (por ejemplo «Blade» y «app Expo»), la ubicación del inventario y las diferencias permitidas. -->
