---
name: jay-k-a-security-deploy
description: "Checklist de seguridad antes de publicar un sitio o app (secretos, entorno, HTTPS, respaldos, cron, rutas que deben dar 404, prueba final). Invócala con /jay-k-a-security-deploy antes de subir a producción, opcionalmente con tu dominio."
argument-hint: "[<dominio>]"
disable-model-invocation: true
---

# JayKA · Security Deploy

Revisión de seguridad **antes de publicar**. Funciona en modo auditoría: revisas, reportas y propones. **No cambias nada ni tocas secretos sin permiso** (ver `jay-k-a-working-rules`).

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).

| Argumento | Qué hace |
|---|---|
| *(vacío)* | **Por defecto.** Auditoría de las secciones 1 a 8 contra el código y la configuración. La sección 9 se entrega como comandos con `TU-DOMINIO` para que los corra el usuario |
| `<dominio>` | Igual, y además la sección 9 con ese dominio. Antes de correrla pregunta: «¿Corro yo las pruebas de la sección 9 contra `<dominio>`? Solo son peticiones de lectura». Si dice que no, se entregan los comandos ya rellenos. Se acepta con o sin `https://` |

## Reglas de esta skill
- Las claves, tokens, contraseñas y variables de producción los maneja **solo el usuario**. Tú nunca las lees, creas, copias ni escribes. Dices qué falta y dónde va.
- No ejecutes nada contra el servidor de producción ni publiques. Las pruebas de la sección 9 se las pasas al usuario como comandos, o las corres solo si él te da la dirección y lo autoriza.
- Primero entiende el stack (lenguaje, framework, hosting). Adapta los puntos; marca «no aplica» lo que no corresponda.

## Scripts
Están en `<SKILL_DIR>/scripts/` (`SKILL_DIR` es el directorio base de esta skill, que Claude Code muestra al cargarla). Necesitan Node 18 o más (`node --version`); si no hay Node, esos puntos se revisan a mano y el informe lo dice.

| Script | Qué mide | Salida |
|---|---|---|
| `scan-git-secrets.mjs [<repo>]` | Secretos en **todo** el historial de git y en los archivos versionados hoy; si `.env` está en `.gitignore` | Tabla con commit, archivo y tipo; el valor siempre enmascarado. Código 1 si hay hallazgos |
| `check-deploy.mjs <dominio> [--out <json>]` | HTTPS, redirección, certificado, encabezados, cookies, 24 rutas que deben dar 404/403 y página de error. Solo peticiones GET, de a una | Tabla `bien / falla / revisar / no aplica`. Código 1 si hay alguna falla |

## Cómo trabajas
1. Pregunta (una sola vez, corto): framework, dónde se publica, si hay base de datos, si hay correo, si hay subida de archivos, si hay login.
2. Corre `node "<SKILL_DIR>/scripts/scan-git-secrets.mjs" .` en la raíz del proyecto. Lo que encuentre va a la sección 2 como `Medido`. Un secreto real en el historial es **Falta** y **Necesita al usuario**: rotarlo (borrarlo del historial no basta).
3. Recorre la lista de abajo contra el código y la configuración del proyecto (sin abrir archivos de secretos reales: mira solo plantillas como `.env.example`).
4. Si hay dominio y el usuario lo autorizó, corre la sección 9 con el script.
5. Entrega un informe: **Bien**, **Falta** (con qué hacer), **No aplica** y **Necesita al usuario** (lo que solo él puede hacer).

## 1. Entorno
- Modo debug apagado y entorno en «production». Un error con debug encendido muestra claves y rutas.
- Páginas de error genéricas, sin trazas ni rutas internas.
- Todo en HTTPS, con redirección de http a https y HSTS.
- Claves nuevas para producción: nunca reutilices las de desarrollo.

## 2. Secretos
- Los secretos viven en variables de entorno, no en el repositorio ni en el código.
- El archivo de entorno real (`.env` o similar) está en `.gitignore` y nunca se subió. Si alguna vez se subió: considéralo comprometido y pide al usuario rotar las claves.
- Revisa el historial de Git por claves subidas por error.
- Los registros (logs) no guardan contraseñas, tokens ni datos personales innecesarios.

## 3. Cuentas y datos de prueba
- Sin cuentas ni contraseñas de prueba en producción. Sin datos de demostración.
- Contraseñas iniciales cambiadas, y con caducidad si el sistema las genera.
- Base de datos con un usuario de permisos mínimos (no administrador) y sin acceso desde internet.

## 4. Lo que nunca debe ser accesible desde la web (debe dar 404 o 403)
`/.env`, `/.git`, carpetas de respaldos, archivos `.sql`, `/storage` o carpetas privadas, `phpinfo`, paneles de depuración, `/node_modules`, archivos de configuración y de código fuente que no sean públicos.

## 5. Servidor
- Firewall abierto solo en 80 y 443 (y SSH con llave, no con contraseña).
- Sistema operativo, runtime (PHP, Node…) y dependencias al día. Corre la auditoría de dependencias del proyecto (`npm audit`, `composer audit`, `pip-audit`…) y reporta; no actualices sin permiso.
- Ocultar la versión del servidor y del lenguaje en los encabezados.

## 6. Respaldos
- Respaldo automático de la base y de los archivos subidos, con fecha.
- Una prueba de restauración hecha al menos una vez.

## 7. Tareas programadas y correo
- El cron o los trabajos programados están configurados y hay una señal de que siguen vivos (por ejemplo un «latido»).
- Correo real configurado, con SPF, DKIM y DMARC si se envían correos desde el dominio.

## 8. Encabezados y límites
Esto se detalla en `jay-k-a-security-web`. Aquí solo confirma que existe un middleware de encabezados y límites de peticiones en login y formularios públicos.

## 9. Prueba final (el día de publicar)
**Medida por el script** (con el permiso del argumento `<dominio>`):
`node "<SKILL_DIR>/scripts/check-deploy.mjs" <dominio> --out docs/seguridad/AAAA-MM-DD-deploy-red.json`
Cubre: HTTPS y redirección, certificado, encabezados, cookies, rutas sensibles (`/.env`, `/.git/config`, logs, respaldos `.sql`, `phpinfo`, paneles de depuración, listados de carpetas…) y página de error sin trazas. Cada fila `falla` es **Falta**; cada `revisar` se mira a mano y se clasifica.
Si el usuario prefiere correrlo él, dale el mismo comando, o como mínimo `curl -I https://SU-DOMINIO/.env` y `curl -I https://SU-DOMINIO/.git/config` (deben dar 404).

**Solo a mano** (el script no inicia sesión ni envía formularios). Son pasos para el usuario, con una cuenta de prueba suya:
- Abrir un recurso de otro usuario cambiando el número en la dirección: debe negarlo.
- Diez intentos de login fallidos seguidos: debe bloquear o frenar.

## Si algo falla
| Situación | Qué hacer |
|---|---|
| `check-deploy` sale con código 2 (no conecta) | Comprueba el dominio con el usuario; si el sitio aún no está publicado, la sección 9 queda «pendiente» |
| Una ruta da 200 con la página principal | Es la respuesta genérica de la app (`bien`); confirma que no sirve el archivo real |
| `scan-git-secrets` encuentra un secreto que el usuario dice que es falso | Anótalo como «confirmado falso por el usuario»; no lo borres del informe |
| No es un repositorio git | El punto del historial queda «no aplica» y se dice |

## Informe final
Guárdalo en `docs/seguridad/AAAA-MM-DD-deploy.md` y muéstralo resumido. Termina con: qué quedó listo, qué falta, qué necesita hacer el usuario, y un veredicto claro: **listo para publicar** o **no publicar todavía** y por qué.

## Terminado cuando
- Cada punto de las secciones 1 a 9 está como **Bien**, **Falta**, **No aplica** o **Necesita al usuario**, con su origen (`Medido`, `Código` o `Inferido`, según las convenciones).
- Ningún archivo de secretos real fue abierto.
- El informe está guardado y tiene veredicto. Si hay algún **Falta** de las secciones 1, 2 o 4, el veredicto es «no publicar todavía».

## Mis ajustes
<!-- Agrega o quita puntos según tu hosting y tu stack. -->
