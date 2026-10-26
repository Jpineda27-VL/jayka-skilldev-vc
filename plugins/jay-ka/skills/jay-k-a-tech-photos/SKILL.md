---
name: jay-k-a-tech-photos
description: "Subida de fotos completa y segura: límite de peso, tipo real por contenido, corrección de orientación, reducción a un máximo de píxeles, compresión a WebP, nombres claros por dueño y rol, ruta relativa en la base, versión para evitar caché, reemplazo sin archivos huérfanos, subida desde el panel y límites de PHP. Invócala con /jay-k-a-tech-photos, opcionalmente diciendo qué fotos se suben."
argument-hint: "[<qué fotos>]"
disable-model-invocation: true
---

# JayKA · Tech · Photos

Receta para que las fotos que suben los usuarios (de un comercio, un producto, un perfil) **pesen poco, se vean bien, no sean un riesgo y se puedan identificar**. Los números son valores por defecto; cámbialos en **Mis ajustes**.

## Argumentos
Recibidos: `$ARGUMENTS` · Convenciones: `../jay-k-a-working-rules/reference/convenciones.md` (ruta relativa a esta skill).
Cualquier otro argumento: responde solo «No reconozco `<argumento>`. Opciones: …» con las opciones de esta tabla, y no hagas nada más.

| Argumento | Qué hace |
|---|---|
| *(vacío)* | **Por defecto.** Empieza en el paso 1 con todas sus preguntas |
| `<qué fotos>` | Texto libre (por ejemplo «portada y logo del comercio, fotos de producto»). Responde la primera pregunta del paso 1; las demás se preguntan |

## Valores por defecto
| Parámetro | Valor |
|---|---|
| Peso máximo de subida | **5 MB** |
| Tipos aceptados (por contenido) | JPG, PNG, WebP |
| Lado largo máximo | **1200 px** (nunca se agranda una foto chica) |
| Formato guardado | **WebP** |
| Calidad | 82, bajando de a 6 hasta 60 si pasa de ~220 KB |
| Nombre | `img-<dueño>-<rol>[-<elemento>].webp` |

## Reglas
1. **Permisos:** instalar una librería de imágenes (por ejemplo `sharp` en Node, o `Pillow` en Python) requiere permiso. En Laravel se usa la extensión **GD** que ya viene con PHP; comprueba que tenga WebP (`function_exists('imagewebp')`) antes de empezar.
2. **Nada del cliente se cree:** extensión y tipo declarado no valen. Se detecta el tipo **por el contenido** del archivo.
3. **Se vuelve a codificar siempre.** Así se descartan metadatos (ubicación, cámara) y cargas ocultas.
4. El nombre del archivo lo **genera el servidor**, nunca el que trae el usuario.
5. La base guarda **solo la ruta relativa**, no la dirección completa.
6. Un archivo nuevo **reemplaza** al anterior y el viejo se borra (sin huérfanos).
7. Las claves y rutas privadas no se mezclan con las públicas: las fotos de catálogo van en almacenamiento público; los documentos de personas, en privado con descarga autenticada.

## Pasos de la receta
1. **Pregunta** (corto): ¿qué fotos se suben (portada, logo, producto, perfil)? ¿Quién las sube (el dueño, un administrador, ambos)? ¿Hosting y librería de imágenes disponible? ¿Valores distintos a los por defecto?
2. **Almacenamiento:** carpeta pública por dueño (`<dueños>/<id>/…`) y enlace público (en Laravel, `php artisan storage:link`, que requiere permiso si crea enlaces). Confirma que el servidor web sirve esa carpeta.
3. **Servicio de fotos** (una sola clase/módulo con todas las reglas): valida peso y tipo, endereza por EXIF, reduce, comprime, guarda con nombre claro, actualiza la base, borra lo anterior. Código de referencia (Laravel + GD) en `reference/laravel-gd.md`; ideas de interfaz y pruebas en `reference/client-snippets.md`.
4. **Nombres:** `img-<dueño>-portada.webp`, `img-<dueño>-logo.webp`, `productos/img-<dueño>-menu-<producto>.webp`. Sin acentos ni espacios (conviértelos con un «slug»). Si dos elementos del mismo dueño tienen el mismo nombre, el segundo lleva su número para no pisarse.
5. **Versión para la caché:** al mostrar la foto, agrega `?v=<fecha de modificación del archivo>` para que un cambio se vea al instante. Si el archivo no existe, usa una imagen de respaldo.
6. **Endpoints:** subida por `POST` multipart con CSRF, protegida por sesión y por **pertenencia** (un dueño solo sube a lo suyo). Respuestas con el mismo formato de error de negocio del proyecto (`foto_grande`, `foto_formato`, `foto_falta`…).
7. **Interfaz:**
   - Botón «Cambiar foto» que abre el selector, comprueba el peso en el navegador (mensaje claro si pasa de 5 MB) y **envía solo** al elegir.
   - Muestra la foto actual, el texto de ayuda («JPG, PNG o WebP, hasta 5 MB. Se comprime sola.») y los errores del servidor.
   - En web con formularios anidados: el campo de archivo se asocia a un formulario separado con el atributo `form`.
   - Si el panel de administración también sube fotos (en nombre del dueño): mismo servicio, queda en bitácora y se puede **descargar** el archivo actual para compartirlo.
8. **Límites de PHP (o del servidor):** `upload_max_filesize` y `post_max_size` deben ser **mayores** que el máximo (por ejemplo 6 M y 8 M). Si no, el servidor rechaza el archivo antes de llegar al código y el usuario ve un error confuso. En local, con el servidor integrado de PHP, se pueden poner en un `.ini` aparte cargado con `PHP_INI_SCAN_DIR`. En el hosting, en `php.ini` o el panel. Revisa también el límite del proxy o servidor web (`client_max_body_size` en Nginx).
9. **Datos de ejemplo:** las fotos de ejemplo pasan por **el mismo servicio** (mismas reglas y nombres) para que lo sembrado se vea igual que lo subido.
10. **Pruebas** (una por regla): foto grande → reduce a 1200 px y proporciones intactas; foto chica → no se agranda; reemplazo → borra la anterior; más de 5 MB → error `foto_grande`; PDF con extensión de imagen → error `foto_formato`; sin archivo → `foto_falta`; recurso ajeno → 404; sin sesión → 401.
11. **Verifica en navegador:** sube una foto real desde celular y desde escritorio, mira que cargue sin romperse, y revisa el peso final (la mayoría de fotos reales quedan entre 40 y 250 KB).

## Qué NO hacer
- No guardar el original sin recodificar «por si acaso».
- No confiar en `accept="image/*"` como defensa: es solo comodidad.
- No exponer carpetas privadas por el mismo enlace público.
- No subir las fotos de prueba reales de clientes a un repositorio.

## Terminado cuando
- Todas las reglas viven en un solo servicio de fotos.
- Las pruebas del paso 10 existen y pasan (salida real en el resumen).
- Los límites del servidor están **medidos** (por ejemplo `php -i` filtrando `upload_max_filesize` y `post_max_size`) y son mayores que el máximo de subida.
- Una subida real, hecha desde el navegador en celular y en escritorio, dio un `.webp` con el lado largo de 1200 px o menos, el nombre según la convención, y un peso anotado en el resumen.

## Mis ajustes
<!-- Cambia 5 MB, 1200 px, calidad, formato (por ejemplo AVIF) y convención de nombres. -->
