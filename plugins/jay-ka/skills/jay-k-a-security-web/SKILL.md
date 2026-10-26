---
name: jay-k-a-security-web
description: Revisión y reglas de seguridad web para cualquier app: encabezados y CSP, cookies, CSRF, límites de peticiones y login, validación, permisos entre usuarios (IDOR), subida de archivos, contraseñas y privacidad. Invócala con /jay-k-a-security-web al construir o revisar login, formularios, API o subidas.
disable-model-invocation: true
---

# JayKA · Security Web

Dos modos. Pregunta cuál quiere el usuario si no queda claro:
- **Construir:** al crear login, formularios, API o subidas, aplica estas reglas desde el primer día.
- **Auditar:** revisa el código existente contra la lista y entrega un informe (**Bien**, **Falta**, **No aplica**). No corrijas sin permiso.

Los secretos, claves y servicios externos los maneja solo el usuario (ver `jay-k-a-working-rules`).

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
Lista corta: **Bien**, **Falta** (con la corrección propuesta) y **No aplica**. Pregunta antes de corregir.

## Mis ajustes
<!-- Cambia los números (intentos por minuto, peso máximo) o agrega reglas de tu stack. -->
