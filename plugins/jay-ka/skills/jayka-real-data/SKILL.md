---
name: jayka-real-data
description: "Deja de trabajar con pantallas de demostración: datos de ejemplo guardados en la base con seeders repetibles y solo en local, cuentas de prueba sin secretos reales, inventario de lo que sigue en demostración y prueba del flujo completo de punta a punta entre roles. Invócala con /jayka-real-data, o con una fase (inventario, plan, sembrar, conectar, flujo)."
argument-hint: "[inventario | plan | sembrar | conectar | flujo]"
disable-model-invocation: true
---

# JayKA · Tech · Real Data

Para pasar de «pantallas que parecen funcionar» a **datos reales de ejemplo** que viajan por todo el sistema: se crean en la base, los ve el siguiente rol y aparecen en el panel. Así se detectan errores de conexión que una demo esconde.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jayka-working-rules/reference/convenciones.md` (ruta relativa a esta skill).
Cualquier otro argumento: responde solo «No reconozco `<argumento>`. Opciones: …» con las opciones de esta tabla, y no hagas nada más.

| Argumento | Paso |
|---|---|
| *(vacío)* | **Por defecto.** Del Paso 1 al 6, en orden, con sus compuertas |
| `inventario` | Paso 1 |
| `plan` | Paso 2 |
| `sembrar` | Paso 3 |
| `conectar` | Paso 4 |
| `flujo` | Paso 5 |

Al empezar en una fase, comprueba que lo anterior existe (por ejemplo, `sembrar` necesita el plan del Paso 2). Si falta, dilo y ofrece hacerlo primero.

## Principios
1. **Los datos de ejemplo viven en la base**, sembrados por seeders. Nunca escritos a mano dentro de las pantallas.
2. **Lo que no tiene datos reales se rotula** («Demostración») hasta que se conecte, o se elimina. Nada finge ser real.
3. **Solo en local.** Los seeders de ejemplo se niegan a correr fuera de entornos de desarrollo.
4. **Nada de secretos reales.** Las cuentas de prueba usan una contraseña de desarrollo definida en una variable de entorno (con valor por defecto solo para local); jamás una contraseña real de nadie.
5. **Repetibles.** Correr el seeder dos veces no duplica; actualiza.
6. **Un flujo vale más que mil pantallas:** se prueba que un dato creado por un rol llega al siguiente.

## Reglas de esta skill
- **Respaldo primero:** antes de sembrar o limpiar datos en una base que ya tenga información, haz un respaldo con fecha. Sin respaldo, no se borra ni se sobrescribe nada.
- **Permisos:** borrar o reemplazar datos existentes, cambiar el entorno o instalar herramientas requiere permiso explícito. Lo que ya existe se **conserva** si hay historial (se reutilizan los mismos identificadores con la identidad nueva, en vez de borrar y romper relaciones).
- **Sin claves:** nunca pongas ni leas credenciales reales. Las pruebas usan cuentas de ejemplo.
- Los datos deben ser **verosímiles** para el lugar donde se usará el proyecto (nombres, monedas, direcciones, teléfonos de ejemplo). No uses datos de personas reales.

## Paso 1 · Inventario de lo que sigue en demostración
1. Corre `node "<SKILL_DIR>/scripts/find-demo-data.mjs" . --out docs/proyecto/demo-candidatos.json` (`SKILL_DIR` es el directorio base de esta skill; hace falta Node 18 o más). Encuentra lorem ipsum, nombres, correos y teléfonos de ejemplo, imágenes de relleno, constantes demo/mock, faker fuera de seeders, `TODO: conectar…` y arreglos de 3 o más objetos escritos a mano. Ignora seeders, factories, pruebas, fixtures y stories. Son **candidatos**: abre cada archivo y confirma. Después recorre las pantallas para lo que el script no ve (por ejemplo, números fijos en una gráfica).
2. Arma una tabla: **pantalla · fuente actual (a mano / base) · qué falta para conectarla · prioridad**.
3. Muéstrala al usuario y acuerda **el orden**. Marca lo que no tenga reglas de negocio decididas como «pendiente de decisión»: no se conecta inventando reglas.

## Paso 2 · Plan de datos de ejemplo
Pregunta lo mínimo (y propone valores por defecto):
- ¿Cuántos de cada cosa? (por ejemplo 5 comercios con 5 o más productos cada uno; 5 repartidores; 10 clientes).
- ¿Qué estados deben existir para probar? (nuevo, en proceso, terminado, cancelado; cuentas activas, suspendidas, inactivas).
- ¿Qué cuentas de prueba por rol, con qué usuarios? (se documentan; la contraseña se define en una variable de entorno).
- ¿Fotos de ejemplo? Que pasen por **el mismo servicio de subida** que usan los usuarios (`jayka-photos`).
Guarda el plan; para algo grande, `jayka-plan-builder`.

## Paso 3 · Seeders
Sigue `reference/seeder-pattern.md`:
- `abort_unless` entorno local.
- Actualizar o insertar por una **clave natural** (no por el número).
- Orden por dependencias (primero lo que no depende de nadie).
- Cuentas con contraseña desde variable de entorno.
- Un seeder por tema (catálogo, cuentas, historial) y uno que los llame en orden.
- Cuidado con la base real de pruebas: **respaldo antes**, y no borrar lo que tiene relaciones.
- **Comprobar que se pueden repetir** (medido, no supuesto): anota el conteo de filas por tabla, corre los seeders, vuelve a contar, córrelos otra vez y vuelve a contar. La segunda corrida no debe cambiar ningún conteo.
  - Laravel: `php artisan db:show --counts` antes y después de cada `php artisan db:seed --class=<SeederPrincipal>`.
  - Otros: una consulta `SELECT COUNT(*)` por tabla sembrada, con la herramienta de base de datos del proyecto.
- **Comprobar el candado de entorno:** corre el seeder con el entorno puesto en `production` **solo contra una base local o desechable** (por ejemplo, `APP_ENV=production php artisan db:seed --class=<Seeder>` con la base local). Debe negarse a correr. Nunca contra la base real.

## Paso 4 · Conectar las pantallas
Para cada pantalla del inventario, en el orden acordado: quitar los datos escritos a mano, leer del servicio o API, cuidar los estados vacío y de error, y probarla con los datos sembrados. Si hay dos frontends, `jayka-views-parity`.

## Paso 5 · Prueba del flujo completo
Sigue `reference/flow-test-checklist.md`. En resumen: recorrer, con cuentas de prueba, el camino completo entre roles (por ejemplo: cliente pide → comercio acepta → repartidor recibe → administrador lo ve), comprobando **cada paso en el servidor** y no solo en la pantalla. Al terminar, **limpiar o devolver a su estado** lo que la prueba cambió (cancelar el pedido de prueba, desconectar a los repartidores, vaciar carritos) para dejar los datos como se acordó.

## Paso 6 · Documentar
Deja en `docs/proyecto/datos-de-prueba.md` (sin contraseñas): cuentas de prueba por rol (usuarios), dónde se define la contraseña de desarrollo (nombre de la variable), cómo reiniciar los datos y qué sigue en demostración. Actualiza el estado del proyecto (`jayka-continuity`).

## Qué NO hacer
- No «arreglar» una pantalla de demostración con más datos escritos a mano.
- No borrar historial para que el seeder quede bonito.
- No sembrar en producción jamás.
- No dejar la prueba de flujo con datos de prueba mezclados con lo real.

## Terminado cuando
- **Inventario:** `find-demo-data.mjs` se corrió y cada candidato quedó confirmado o descartado; cada pantalla tiene su fuente (a mano o base) y prioridad, y el orden quedó acordado.
- **Sembrar:** los seeders corren **dos veces seguidas** sin duplicar (el conteo de filas de cada tabla sembrada es igual después de la primera y de la segunda corrida, **medido**), y se niegan a correr fuera de local (comprobado).
- **Conectar:** al volver a correr `find-demo-data.mjs`, los únicos candidatos que quedan son los rotulados «Demostración» o los descartados con motivo.
- **Flujo:** cada paso del recorrido entre roles se comprobó en el servidor, y los datos quedaron como se acordó.
- `docs/proyecto/datos-de-prueba.md` está escrito, sin contraseñas.

## Mis ajustes
<!-- Cantidades por defecto, nombre de la variable de contraseña, zona y estilo de nombres de ejemplo. -->
