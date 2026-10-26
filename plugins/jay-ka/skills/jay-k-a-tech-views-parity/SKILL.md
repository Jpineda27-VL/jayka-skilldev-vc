---
name: jay-k-a-tech-views-parity
description: Mantiene la paridad cuando un producto tiene dos frontends que deben mostrar las mismas pantallas (por ejemplo web renderizada en el servidor y app móvil, o web y app nativa): inventario de pantallas, fuente única de datos, checklist de paridad y verificación en ambos. Invócala con /jay-k-a-tech-views-parity al cambiar o crear una pantalla.
disable-model-invocation: true
---

# JayKA · Tech · Views Parity

Cuando el mismo producto se ve en **dos frontends** (por ejemplo vistas del servidor para escritorio y una app para el celular), cada cambio de una pantalla debe llegar **a los dos**. Esta skill evita que se desfasen.

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
Mantén un archivo (por ejemplo `.claude/estructura/pantallas.md` o `docs/pantallas.md`) con una fila por pantalla. Plantilla en `reference/screen-inventory.md`. Si no existe, **créalo** con permiso, recorriendo rutas y vistas.
Columnas mínimas: **id** · **ruta** · **frontend A (archivo)** · **frontend B (archivo)** · **datos (servicio o API)** · **estado de paridad** (`igual`, `A adelantado`, `B adelantado`, `solo A`, `solo B`) · **notas**.

## Paso 1 · Antes de tocar una pantalla
1. Búscala en el inventario. ¿Existe en los dos? ¿Está en paridad ahora?
2. Si no está en paridad, **díselo al usuario** antes de añadir más cambios: «Esta pantalla ya estaba desfasada en B; ¿la igualamos también?».
3. Revisa de dónde sale el dato. Si cambia, cambia en el servicio, no en un frontend.

## Paso 2 · Hacer el cambio en los dos
Orden recomendado: **servidor (datos y reglas)** → **frontend A** → **frontend B** → pruebas.
Usa el **checklist de paridad** (`reference/parity-checklist.md`) para no olvidar estados, textos ni tamaños.

## Paso 3 · Verificar los dos (obligatorio)
- Abre **ambos** en navegador: escritorio y celular (si el servidor decide qué frontend servir según el dispositivo, simula cada uno con el tamaño y el agente de usuario correspondientes).
- Recorre la pantalla en cada uno: datos reales, estado vacío, error de validación, carga.
- Compara lado a lado: títulos, orden, textos, colores, estados, enlaces.
- Si cambió algo del servidor: corre las pruebas.
- Si el frontend B es una app que se exporta o compila, **vuelve a exportarla** y verifica la versión nueva (no la anterior en caché).

## Paso 4 · Actualizar el inventario
Marca el estado de paridad, la fecha y el commit. Si algo quedó pendiente, anótalo con el motivo y quién decide.

## Trampas frecuentes
- **Datos de ejemplo escritos a mano** en uno de los frontends: la pantalla «funciona» pero no lee el servidor. Detecta con una búsqueda de constantes de demostración.
- **Recargas completas** en un frontend (parpadeo, esqueleto) y actualización en vivo en el otro: unifica el comportamiento (refrescar sin vaciar la pantalla).
- **Rutas distintas** para la misma pantalla: documéntalas en el inventario.
- **Fotos y rutas de archivos** que solo resuelve uno de los frontends: usa la misma función o regla para construir la dirección.
- **Estados vacíos** olvidados en uno de los dos.
- **Textos copiados a mano** que se desactualizan: centralízalos si el proyecto crece.

## Qué NO hacer
- No duplicar lógica de negocio en el frontend para «ir más rápido».
- No dar por buena una pantalla porque se ve bien en un solo frontend.
- No cambiar el diseño de una versión sin avisar y registrar.

## Mis ajustes
<!-- Nombra tus dos frontends (por ejemplo «Blade» y «app Expo»), la ubicación del inventario y las diferencias permitidas. -->
