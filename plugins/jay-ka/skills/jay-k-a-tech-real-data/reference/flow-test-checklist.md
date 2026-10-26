# Prueba de flujo completo entre roles

Objetivo: comprobar que un dato creado por un rol **llega** al siguiente y se refleja en el panel. Se prueba **en el servidor** (respuestas reales), no solo mirando pantallas.

## Antes
- [ ] Respaldo de la base con fecha.
- [ ] Servidor local en marcha con la configuración de desarrollo (por ejemplo límites de subida).
- [ ] Cuentas de prueba por rol listas (usuarios documentados; contraseña desde variable de entorno).
- [ ] Datos sembrados en los estados necesarios.

## Cómo ejecutarlo
Con una herramienta de navegador (por ejemplo Playwright) o llamadas HTTP con la sesión de cada rol:
1. Entra con cada rol en su propio contexto (host o perfil distinto) para no mezclar sesiones.
2. Cada paso hace la acción **por la misma vía que la app** (la misma petición, con su token CSRF) y comprueba la **respuesta** (estado HTTP y datos).
3. Después de cada paso, **lee desde el rol siguiente** para confirmar que el dato llegó.

## Ejemplo de flujo (adáptalo a tu producto)
| # | Rol | Acción | Comprobar |
|---|---|---|---|
| 1 | Operario / repartidor | Conectarse y reportar posición | Estado «disponible» |
| 2 | Cliente | Vaciar carrito, agregar producto, elegir entrega y pago, confirmar | Pedido creado con código |
| 3 | Comercio | Ve el pedido en «nuevos», lo acepta, lo pasa a cocina | Estados correctos |
| 4 | Operario / repartidor | Recibe la oferta y la acepta | Oferta con tiempo, luego «entrega en curso» |
| 5 | Administrador | Ve el pedido en el panel y su historial | Aparece con su estado |
| 6 | Cualquiera | Casos negativos | Errores con el código esperado |

## Casos negativos que no se deben olvidar
- [ ] Sin sesión: 401.
- [ ] Sesión de otro tipo de cuenta: sin acceso.
- [ ] Recurso de otro usuario: 404 o 403.
- [ ] Datos inválidos: 422 con el código de error de negocio esperado.
- [ ] Repetir la misma acción (doble clic): no duplica.

## Después (dejar todo como estaba)
- [ ] Cancelar o cerrar los pedidos de prueba (por la vía del panel, con motivo, que también prueba la bitácora).
- [ ] Desconectar a los operarios y cerrar turnos de prueba.
- [ ] Vaciar carritos y sesiones de prueba.
- [ ] Volver a correr el seeder de estados si hace falta.
- [ ] Confirmar que los conteos coinciden con lo acordado.
- [ ] Borrar de la carpeta de trabajo los scripts y las capturas de la prueba si no se guardarán.

## Reporte
Por paso: **hecho / falló / no probado**, con el dato real (código de respuesta, identificadores). Lista de lo que falló y de lo que quedó sin probar. Resumen en tres líneas.
