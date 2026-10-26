# Servicio de fotos (Laravel + GD)

Referencia genérica. Cambia nombres, tablas y mensajes a tu proyecto. Requiere la extensión GD con soporte WebP (`imagewebp`).

```php
<?php

namespace App\Servicios;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Fotos
{
    public const MAX_BYTES = 5 * 1024 * 1024;   // peso máximo de subida
    public const LADO_MAX = 1200;               // lado largo máximo, en píxeles
    public const CALIDAD = 82;                  // calidad inicial de WebP
    public const CALIDAD_MIN = 60;              // hasta aquí se baja
    public const OBJETIVO_BYTES = 220 * 1024;   // si pasa de esto, se baja la calidad

    private const TIPOS = ['image/jpeg' => 'imagecreatefromjpeg', 'image/png' => 'imagecreatefrompng', 'image/webp' => 'imagecreatefromwebp'];

    /** Ruta lista para mostrar: una guardada lleva su versión (?v=) para que un cambio se vea al instante. */
    public static function ruta(?string $valor, ?string $respaldo = 'imagen-base'): string
    {
        $valor = $valor ?: $respaldo;
        if ($valor === null) {
            return '';
        }
        if (! str_contains($valor, '/')) {
            return $valor;            // clave de ejemplo, no un archivo guardado
        }
        $archivo = Storage::disk('public')->path($valor);

        return is_file($archivo) ? $valor.'?v='.filemtime($archivo) : (string) $respaldo;
    }

    /** Nombre de archivo: img-<dueño>-<rol>.webp (sin acentos ni espacios). */
    public static function rutaDe(int $duenoId, string $duenoNombre, string $rol, ?string $elemento = null): string
    {
        $base = 'img-'.Str::slug($duenoNombre).'-'.$rol.($elemento ? '-'.Str::slug($elemento) : '').'.webp';

        return "duenos/{$duenoId}/".($elemento ? 'elementos/' : '').$base;
    }

    /** Guarda una foto subida en $destino y borra la anterior si era otra. Devuelve la ruta relativa. */
    public static function guardar(UploadedFile $archivo, string $destino, ?string $anterior = null): string
    {
        if (! $archivo->isValid()) {
            // PHP rechaza el archivo antes de llegar aquí cuando pasa su propio límite (upload_max_filesize).
            if (in_array($archivo->getError(), [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
                throw new ErrorDeNegocio('foto_grande', 'La foto pesa más de 5 MB. Elige una más liviana.', 422);
            }
            throw new ErrorDeNegocio('foto_invalida', 'No se pudo leer la foto. Prueba con otra.', 422);
        }
        if ($archivo->getSize() > self::MAX_BYTES) {
            throw new ErrorDeNegocio('foto_grande', 'La foto pesa más de 5 MB. Elige una más liviana.', 422);
        }
        self::procesar($archivo->getRealPath(), $destino);
        if ($anterior && $anterior !== $destino && str_contains($anterior, '/')) {
            Storage::disk('public')->delete($anterior);
        }

        return $destino;
    }

    /** Lee, endereza, achica y guarda como WebP. También sirve para fotos de ejemplo que ya están en el servidor. */
    public static function procesar(string $origen, string $destino): void
    {
        $tipo = (string) @mime_content_type($origen);          // tipo REAL, por contenido
        if (! isset(self::TIPOS[$tipo])) {
            throw new ErrorDeNegocio('foto_formato', 'La foto debe ser JPG, PNG o WebP.', 422);
        }
        $crear = self::TIPOS[$tipo];
        $imagen = @$crear($origen);
        if (! $imagen) {
            throw new ErrorDeNegocio('foto_invalida', 'No se pudo leer la foto. Prueba con otra.', 422);
        }
        if ($tipo === 'image/jpeg') {
            $imagen = self::enderezar($imagen, self::orientacion($origen));
        }

        $ancho = imagesx($imagen);
        $alto = imagesy($imagen);
        $escala = min(1, self::LADO_MAX / max($ancho, $alto));  // nunca se agranda
        if ($escala < 1) {
            $nueva = imagescale($imagen, (int) round($ancho * $escala), (int) round($alto * $escala), IMG_BICUBIC);
            imagedestroy($imagen);
            $imagen = $nueva;
        }
        imagepalettetotruecolor($imagen);
        imagealphablending($imagen, false);
        imagesavealpha($imagen, true);

        $disco = Storage::disk('public');
        $disco->makeDirectory(dirname($destino));
        $final = $disco->path($destino);
        $calidad = self::CALIDAD;
        do {
            imagewebp($imagen, $final, $calidad);
            clearstatcache(true, $final);
            $calidad -= 6;
        } while (filesize($final) > self::OBJETIVO_BYTES && $calidad >= self::CALIDAD_MIN);
        imagedestroy($imagen);
    }

    /** Orientación EXIF de un JPG (1 = normal). Los celulares guardan la foto "de lado" y lo anotan aquí. */
    private static function orientacion(string $archivo): int
    {
        if (function_exists('exif_read_data')) {
            $exif = @exif_read_data($archivo);

            return (int) ($exif['Orientation'] ?? 1);
        }

        return 1;   // sin la extensión exif: ver una lectura manual del encabezado JPEG si hace falta
    }

    private static function enderezar(\GdImage $imagen, int $orientacion): \GdImage
    {
        $girada = match ($orientacion) {
            3 => imagerotate($imagen, 180, 0),
            6 => imagerotate($imagen, -90, 0),
            8 => imagerotate($imagen, 90, 0),
            default => null,
        };
        if ($girada) {
            imagedestroy($imagen);

            return $girada;
        }

        return $imagen;
    }
}
```

## Uso en un controlador
```php
$ruta = Fotos::guardar($peticion->file('foto') ?? throw new ErrorDeNegocio('foto_falta', 'Elige una foto para subir.', 422),
    Fotos::rutaDe($dueno->id, $dueno->nombre, 'portada'), $dueno->foto);
DB::table('duenos')->where('id', $dueno->id)->update(['foto' => $ruta, 'updated_at' => now()]);
return response()->json(['ok' => true, 'foto' => Fotos::ruta($ruta)]);
```

## Nota sobre la orientación sin la extensión `exif`
Si el hosting no tiene `exif`, el JPG se puede leer a mano: buscar el bloque `APP1` con la marca `Exif` y la etiqueta `0x0112`. Si no hace falta, deja la versión de arriba.
