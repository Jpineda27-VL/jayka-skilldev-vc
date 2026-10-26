---
name: jayka-security-web
description: "Revisión y reglas de seguridad web para cualquier app: encabezados y CSP, cookies, CSRF, límites de peticiones y login, validación, permisos entre usuarios (IDOR), subida de archivos, contraseñas y privacidad. Invócala con /jayka-security-web construir o /jayka-security-web auditar, opcionalmente con un área."
argument-hint: "construir | auditar [encabezados | sesion | csrf | limites | validacion | permisos | subidas | cuentas | privacidad]"
disable-model-invocation: true
---

# JayKA · Security Web

Dos modos:
- **Construir:** al crear login, formularios, API o subidas, aplica estas reglas desde el primer día.
- **Auditar:** revisa el código existente contra la lista y entrega un informe (**Bien**, **Falta**, **No aplica**). No corrijas sin permiso.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jayka-working-rules/reference/convenciones.md` (ruta relativa a esta skill).
Cualquier otro argumento: responde solo «No reconozco `<argumento>`. Opciones: …» con las opciones de esta tabla, y no hagas nada más.

| Argumento | Alias | Qué hace |
|---|---|---|
| `construir [<área>]` | `build`, `crear` | Aplica las reglas mientras se construye |
| `auditar [<área>]` | `audit`, `revisar` | Revisa lo existente y entrega informe |
| *(vacío)* | | Pregunta: «¿Construir o auditar?» |

Áreas (opcionales, una o varias separadas por coma; sin área se cubren todas):

| Área | Secciones |
|---|---|
| `encabezados` | 1 |
| `sesion` | 2 |
| `csrf` | 3 |
| `limites` | 4 |
| `validacion` | 5 |
| `permisos` | 6 |
| `subidas` | 7 |
| `cuentas` | 8 |
| `privacidad` | 9 |
| `login` (atajo) | 2, 4, 8 |
| `formularios` (atajo) | 3, 4, 5 |
| `api` (atajo) | 1, 3, 4, 5, 6 |

Los secretos, claves y servicios externos los maneja solo el usuario (ver `jayka-working-rules`).

## Medición (primero, en los dos modos)
Scripts en `<SKILL_DIR>/scripts/` (`SKILL_DIR` es el directorio base de esta skill, que Claude Code muestra al cargarla). Necesitan Node 18 o más.
1. **Patrones de riesgo en el código:** `node "<SKILL_DIR>/scripts/scan-security.mjs" . [--secciones <números>]`, usando los números de sección del área elegida.
   - Devuelve candidatos con severidad, sección, `archivo:línea` y nota: HTML sin escapar, SQL armado con variables, asignación masiva, `$guarded = []`, excepciones de CSRF, rutas GET que cambian datos, CORS `*` con credenciales, cookies sin banderas, TLS desactivado, hashes débiles, token en `localStorage`, nombre de archivo del usuario y secretos escritos en el código (con los patrones de `jayka-security-deploy`, si está instalada).
   - **Cada candidato se confirma leyendo el código** antes de clasificarlo: puede ser un falso positivo (por ejemplo, `{!! !!}` con HTML que genera el propio servidor). Un candidato descartado se anota como «descartado: <motivo>».
   - No encontrar nada no prueba que sea seguro: los permisos (sección 6) y los límites (sección 4) se revisan leyendo rutas, controladores y middleware.
2. **Encabezados y cookies en ejecución** (secciones 1 y 2), si hay una dirección donde corre la app (local o publicada) y el usuario lo autoriza:
   `node "<SKILL_DIR>/../jayka-security-deploy/scripts/check-deploy.mjs" <url> --solo-encabezados`. Si esa skill no está, se miran los encabezados con `curl -sI <url>`.

## 1. Encabezados HTTP (un solo middleware global)
- `Content-Security-Policy` estricta: `default-src 'self'`; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`; lista blanca explícita de dominios para scripts, estilos e imágenes. Evita `unsafe-inline`; si hace falta, usa nonces.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy`: apaga cámara, micrófono y geolocalización si no se usan.
- `Cross-Origin-Opener-Policy: same-origin`.
- `X-Frame-Options: DENY` (compatibilidad con navegadores viejos).
- `Strict-Transport-Security` en producción.
- `Cache-Control: no-store` en páginas con sesión o datos privados; caché larga e inmutable solo en archivos estáticos con versión.
- Quitar `X-Powered-By` y las versiones en `Server`.
- Meta etiquetas: `charset`, `viewport`, título por página, y `robots noindex` en áreas privadas.

## 2. Sesión y cookies
- Cookies de sesión `HttpOnly`, `Secure` y `SameSite=Lax` (o `Strict` en un panel de administración).
- Duración de sesión corta, id nuevo al iniciar sesión, y cerrar sesión invalida de verdad en el servidor.

## 3. CSRF y CORS
- Token CSRF en toda petición que cambie datos (formularios y cabecera en llamadas JSON). Revisa también `Origin`/`Host`.
- Nada que cambie datos por GET.
- CORS con lista blanca de orígenes. Nunca `*` junto con credenciales.

## 4. Límite de peticiones (rate limit)
- **Login:** máximo 5 intentos por minuto por IP y usuario, con bloqueo temporal creciente. Mensaje genérico (no revelar si el usuario existe).
- **Formularios públicos:** unos 10 por minuto por IP y también por teléfono o correo; honeypot o captcha; tiempo mínimo de envío.
- **API en general:** límite por IP y por usuario (por ejemplo 60 por minuto), más bajo en búsquedas y operaciones costosas.
- Respuesta `429` con `Retry-After`.
- Topes de tamaño: cuerpo de la petición, largo de cada campo, y resultados por página (paginar siempre, con máximo).
- Acciones repetibles (reservar, pedir, pagar): idempotentes, para que un doble clic no duplique. Si hay stock, transacción con bloqueo.

## 5. Validación y acceso a datos
- Valida en el servidor tipo, largo, rango y formato de cada campo; listas blancas para valores permitidos. Nunca confíes en el navegador.
- Consultas solo con parámetros (constructor de consultas u ORM). Nunca concatenes SQL con datos del usuario.
- Protección contra asignación masiva: campos permitidos explícitos.
- Escapa toda salida. Evita `innerHTML` con datos externos.

## 6. Permisos (el error más común)
- Cada lectura o cambio comprueba que el recurso es de quien lo pide, o que su rol lo permite (**IDOR**). Cambiar el número en la dirección no debe dar acceso a datos ajenos.
- Mínimo permiso por rol. El servidor decide; esconder un botón no es seguridad.
- Bitácora de lo que hace el administrador: quién, qué, antes, después y cuándo.

## 7. Archivos subidos
- Límite de peso (por ejemplo 5 MB) y comprobación del tipo **real por contenido**, no por extensión ni por lo que dice el navegador.
- Imágenes: aceptar solo formatos esperados (JPG, PNG, WebP), volver a codificarlas (quita metadatos y cargas ocultas) y limitar el tamaño en píxeles.
- Nombre de archivo generado por el servidor, nunca el del usuario.
- Archivos públicos en una carpeta; documentos privados en un almacenamiento privado con descarga autenticada.

## 8. Cuentas y contraseñas
- Contraseñas con hash fuerte (bcrypt o argon2) y largo mínimo. Nunca se guardan ni se registran en claro.
- Contraseña inicial con cambio obligatorio y caducidad.
- Verificación en dos pasos para administradores.
- Errores genéricos en acceso y recuperación (que no se pueda saber qué cuentas existen).

## 9. Privacidad
- Solo los datos personales necesarios.
- Nada personal en direcciones (URL), en `localStorage` ni en los registros. Los registros rotan.

## 10. Prueba de cierre
- Comprueba los encabezados (por ejemplo con securityheaders.com).
- Intenta abrir un recurso de otro usuario.
- Intenta diez logins fallidos seguidos.
- Intenta subir un archivo de otro tipo con extensión de imagen.
- Provoca un error: no debe mostrar trazas.

## Informe
Lista corta: **Bien**, **Falta** (con la corrección propuesta) y **No aplica**, cada punto con su origen (`Medido`, `Código` o `Inferido`). En modo auditar se guarda en `docs/seguridad/AAAA-MM-DD-web.md`. Pregunta antes de corregir.

## Terminado cuando
- **Auditar:** `scan-security.mjs` se corrió y cada candidato quedó confirmado o descartado con motivo; cada punto de las secciones del área está clasificado y con origen; el informe está guardado; no se cambió código.
- **Construir:** cada regla de las secciones del área está implementada o anotada como pendiente con su motivo; `scan-security.mjs` sobre lo construido no deja candidatos de severidad alta sin explicar; y las pruebas de la sección 10 que aplican se corrieron, con su resultado real.

## Mis ajustes
<!-- Cambia los números (intentos por minuto, peso máximo) o agrega reglas de tu stack. -->
