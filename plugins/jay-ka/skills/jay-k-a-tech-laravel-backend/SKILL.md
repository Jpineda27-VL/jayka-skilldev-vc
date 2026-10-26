---
name: jay-k-a-tech-laravel-backend
description: "Patrón de backend Laravel probado en producción: controladores delgados, reglas de negocio en servicios, errores de negocio con código estable, una acción por POST, bitácora de cambios, varias cuentas con guards separados, pruebas por regla y seeders locales. Invócala con /jay-k-a-tech-laravel-backend nuevo, modulo <nombre> o revisar."
argument-hint: "nuevo | modulo <nombre> | revisar [<sección>]"
disable-model-invocation: true
---

# JayKA · Tech · Laravel Backend

Orden para construir un backend Laravel que **crece sin enredarse**: dónde vive cada cosa, cómo se nombran los errores, cómo se prueba. Los ejemplos de código están en `reference/patterns.md`. Los nombres de ejemplo están en español; usa el idioma del proyecto.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).
Cualquier otro argumento: responde solo «No reconozco `<argumento>`. Opciones: …» con las opciones de esta tabla, y no hagas nada más.

| Argumento | Alias | Qué hace |
|---|---|---|
| `nuevo` | `new` | Arranque de un backend nuevo: sección 10 |
| `modulo <nombre>` | `module` | Módulo nuevo en un backend existente: sección 9 |
| `revisar [<sección>]` | `audit` | Revisa el backend actual contra las secciones 1 a 8 (o solo la indicada, por número) y entrega **Bien / Falta / No aplica** con origen. No cambia código |
| *(vacío)* | | Si existe `artisan` en la carpeta: pregunta «¿Módulo nuevo o revisar?». Si no: `nuevo` |

## Preparación (siempre)
- Versión: lee `laravel/framework` en `composer.json` y `php --version`. Si el proyecto no es Laravel, dilo y detente.
- Comando de pruebas: `php artisan test` (o el script `test` de `composer.json` si existe). Córrelo una vez al empezar para conocer el punto de partida y anota el resultado.

## Reglas de esta skill
- Cumple `jay-k-a-working-rules`: plan antes de construir y un módulo a la vez.
- **Permisos:** instalar paquetes (`composer require`), crear el proyecto (`composer create-project`), tocar la base real o cambiar configuración de producción requieren permiso explícito. Antes de migrar en una base con datos, respaldo con fecha.
- Nunca claves ni `.env` reales: solo `.env.example` y variables que el usuario completa.

## 1. Dónde vive cada cosa
| Capa | Responsabilidad | NO debe |
|---|---|---|
| **Ruta** | Dirección, método, guard, límite de peticiones | Tener lógica |
| **Controlador** | Recibir la petición, llamar al servicio, devolver JSON o redirección | Decidir reglas, consultar tablas a mano |
| **Servicio** (`app/Servicios/`) | **Todas las reglas de negocio** y los cambios de datos, dentro de transacciones | Conocer la petición HTTP ni la vista |
| **Modelo / consulta** | Acceso a datos | Reglas de negocio |
| **Vista / app** | Mostrar y enviar | Calcular, validar como única defensa |

La pantalla (Blade, React, app móvil) solo muestra y envía. **Todo se valida otra vez en el servidor.**

## 2. Errores de negocio con código estable
- Una excepción propia (`ErrorDeNegocio`) con tres datos: **código** corto y estable (`motivo_requerido`, `no_existe`), **mensaje** para la persona, y **estado HTTP** (422, 404, 409…).
- Los servicios la lanzan; el controlador la atrapa y responde `{ ok:false, codigo, mensaje }` (JSON) o vuelve con el error (Blade).
- Los códigos son un contrato: las apps y las pruebas dependen de ellos. No los renombres sin migrar a los clientes.
- Mensajes **claros y sin jerga técnica**; nunca filtres detalles internos.

## 3. Una acción por POST
Para paneles con muchas operaciones, en lugar de una ruta por cada una:
- Una ruta `POST /area/accion/{accion}` con `whereIn('accion', LISTA)`.
- Cada servicio declara sus `ACCIONES` (constante). El controlador las junta y despacha con `match`.
- Ventajas: una sola puerta para autorizar, auditar y limitar; las acciones nuevas no tocan las rutas.
- Las **lecturas** van aparte, como `GET /api/<area>/...` con el guard correspondiente y JSON estable.

## 4. Bitácora de cambios
- Toda acción de un administrador o un cambio sensible se registra: **quién**, **qué**, **sobre qué objeto**, **antes**, **después**, **motivo** y **cuándo**.
- Las intervenciones (cancelar, suspender, reasignar, reembolsar) **exigen motivo**: si falta, error de negocio.

## 5. Cuentas y permisos
- Tipos de cuenta distintos en **tablas separadas** y un **guard** por tipo (`config/auth.php`). Una sesión de un tipo no abre el área de otro.
- Cada recurso se comprueba contra quien lo pide (nunca solo por el número de la dirección): evita acceso a datos ajenos.
- Lista explícita de rutas públicas; todo lo demás exige sesión.
- Detalle de seguridad en `jay-k-a-security-web`.

## 6. Datos
- **Migraciones:** solo se agregan; nunca se editan las aplicadas. Nombre `AAAA_MM_DD_NNNNNN_descripcion`. Comentarios en columnas con reglas no obvias. Claves foráneas con comportamiento explícito (`cascadeOnDelete`, `nullOnDelete`, restrictivo).
- **Dinero:** decimales (`decimal(10,2)`), nunca `float`. Redondeos en un solo lugar y documentados.
- **Concurrencia:** transacción con `lockForUpdate()` donde dos personas puedan competir (stock, asignaciones, saldos).
- **Idempotencia:** repetir una acción (doble clic, reintento) no duplica el resultado.
- **Zona horaria** definida en `config/app.php` y usada igual en toda la app.
- **Reglas ajustables** (tarifas, plazos, límites): en una tabla de configuración con un servicio, con bitácora al cambiarlas; no escondidas en el código.
- **Seeders:** repetibles (no duplican) y **solo en local** (`abort_unless(app()->environment('local'))`). Ver `jay-k-a-tech-real-data`.

## 7. Tareas programadas
- `routes/console.php` con las tareas y un **latido** cada minuto para saber si el cron sigue vivo.
- Lo crítico tiene también una **ruta perezosa** (se corrige al leer) por si el cron falla.
- En local el cron no corre: el panel debe poder mostrarlo («Cron caído») sin romper nada.

## 8. Pruebas
- PHPUnit con `RefreshDatabase` y SQLite en memoria.
- **Una prueba por cada regla importante**, con nombre que cuente la regla (`test_cancelar_exige_motivo`).
- Un `trait` o ayudante que arma el «mundo» de prueba (comercio, cuenta, cliente…) para no repetir.
- Verifica **código de error y estado HTTP**, no solo que «falla».
- Prueba también lo negativo: sin sesión, sesión de otro tipo, recurso ajeno, valores inválidos, doble envío.
- Antes de decir «listo»: corre la suite completa y reporta el resultado real.

## 9. Cómo trabajar un módulo nuevo
1. **Aclara** (corto): entidades, roles que lo usan, reglas ya decididas y pendientes. No inventes reglas.
2. **Plan** de 4 a 6 pasos; para algo grande, `jay-k-a-plan-builder`.
3. **Migración** (con respaldo si hay datos) → **servicio** con sus reglas y errores → **controlador y rutas** → **lecturas JSON** → **pruebas**.
4. Corre las pruebas. Si hay pantalla, revísala en navegador (celular y escritorio).
5. Resumen: qué reglas implementó, qué códigos de error expone, qué decisiones quedan pendientes.

## 10. Arranque de un backend nuevo (checklist)
- [ ] Proyecto Laravel creado (con permiso) y base de datos configurada en `.env.example`.
- [ ] `ErrorDeNegocio`, `Bitacora` y el controlador de acciones base.
- [ ] Guards y tablas de cuentas por tipo.
- [ ] Middleware de encabezados de seguridad y límites de peticiones (`jay-k-a-security-web`).
- [ ] Trait de pruebas con el «mundo» base y la primera prueba verde.
- [ ] `docs/` con reglas de negocio y estado (`jay-k-a-continuity`).

## Terminado cuando
- **`nuevo`:** cada casilla de la sección 10 está marcada o anotada como pendiente con su motivo, y `php artisan test` pasa (salida real en el resumen).
- **`modulo`:** existen migración, servicio, controlador y rutas, lecturas JSON y una prueba por regla (incluidas las negativas de la sección 8); la suite completa pasa; el resumen lista las reglas implementadas, los códigos de error y las decisiones pendientes.
- **`revisar`:** cada punto revisado tiene clasificación y origen (`Código` con `archivo:línea` o `Medido`), y no se cambió código.

## Mis ajustes
<!-- Nombres de carpetas y clases, versión de Laravel, base de datos, estilo de pruebas. -->
