# Photo service (Laravel + GD)

Generic reference. Change names, tables and messages to your project. It needs the GD extension with WebP support (`imagewebp`).

```php
<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Photos
{
    public const MAX_BYTES = 5 * 1024 * 1024;   // maximum upload size
    public const MAX_SIDE = 1200;               // maximum long side, in pixels
    public const QUALITY = 82;                  // initial WebP quality
    public const QUALITY_MIN = 60;              // it goes down to here
    public const TARGET_BYTES = 220 * 1024;     // above this, the quality is lowered

    private const TYPES = ['image/jpeg' => 'imagecreatefromjpeg', 'image/png' => 'imagecreatefrompng', 'image/webp' => 'imagecreatefromwebp'];

    /** Path ready to display: a stored one carries its version (?v=) so a change shows at once. */
    public static function path(?string $value, ?string $fallback = 'base-image'): string
    {
        $value = $value ?: $fallback;
        if ($value === null) {
            return '';
        }
        if (! str_contains($value, '/')) {
            return $value;            // sample key, not a stored file
        }
        $file = Storage::disk('public')->path($value);

        return is_file($file) ? $value.'?v='.filemtime($file) : (string) $fallback;
    }

    /** File name: img-<owner>-<role>.webp (no accents or spaces). */
    public static function pathFor(int $ownerId, string $ownerName, string $role, ?string $item = null): string
    {
        $base = 'img-'.Str::slug($ownerName).'-'.$role.($item ? '-'.Str::slug($item) : '').'.webp';

        return "owners/{$ownerId}/".($item ? 'items/' : '').$base;
    }

    /** Saves an uploaded photo at $target and deletes the previous one if it was another. Returns the relative path. */
    public static function save(UploadedFile $file, string $target, ?string $previous = null): string
    {
        if (! $file->isValid()) {
            // PHP rejects the file before it gets here when it exceeds its own limit (upload_max_filesize).
            if (in_array($file->getError(), [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
                throw new BusinessError('photo_too_large', 'The photo is over 5 MB. Choose a lighter one.', 422);
            }
            throw new BusinessError('photo_invalid', 'The photo could not be read. Try another one.', 422);
        }
        if ($file->getSize() > self::MAX_BYTES) {
            throw new BusinessError('photo_too_large', 'The photo is over 5 MB. Choose a lighter one.', 422);
        }
        self::process($file->getRealPath(), $target);
        if ($previous && $previous !== $target && str_contains($previous, '/')) {
            Storage::disk('public')->delete($previous);
        }

        return $target;
    }

    /** Reads, straightens, shrinks and saves as WebP. It also works for sample photos already on the server. */
    public static function process(string $source, string $target): void
    {
        $type = (string) @mime_content_type($source);          // REAL type, by content
        if (! isset(self::TYPES[$type])) {
            throw new BusinessError('photo_format', 'The photo must be JPG, PNG or WebP.', 422);
        }
        $create = self::TYPES[$type];
        $image = @$create($source);
        if (! $image) {
            throw new BusinessError('photo_invalid', 'The photo could not be read. Try another one.', 422);
        }
        if ($type === 'image/jpeg') {
            $image = self::straighten($image, self::orientation($source));
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $scale = min(1, self::MAX_SIDE / max($width, $height));  // never enlarged
        if ($scale < 1) {
            $resized = imagescale($image, (int) round($width * $scale), (int) round($height * $scale), IMG_BICUBIC);
            imagedestroy($image);
            $image = $resized;
        }
        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);

        $disk = Storage::disk('public');
        $disk->makeDirectory(dirname($target));
        $final = $disk->path($target);
        $quality = self::QUALITY;
        do {
            imagewebp($image, $final, $quality);
            clearstatcache(true, $final);
            $quality -= 6;
        } while (filesize($final) > self::TARGET_BYTES && $quality >= self::QUALITY_MIN);
        imagedestroy($image);
    }

    /** EXIF orientation of a JPG (1 = normal). Phones store the photo "sideways" and note it here. */
    private static function orientation(string $file): int
    {
        if (function_exists('exif_read_data')) {
            $exif = @exif_read_data($file);

            return (int) ($exif['Orientation'] ?? 1);
        }

        return 1;   // without the exif extension: see a manual reading of the JPEG header if needed
    }

    private static function straighten(\GdImage $image, int $orientation): \GdImage
    {
        $rotated = match ($orientation) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => null,
        };
        if ($rotated) {
            imagedestroy($image);

            return $rotated;
        }

        return $image;
    }
}
```

## Use in a controller
```php
$path = Photos::save($request->file('photo') ?? throw new BusinessError('photo_missing', 'Choose a photo to upload.', 422),
    Photos::pathFor($owner->id, $owner->name, 'cover'), $owner->photo);
DB::table('owners')->where('id', $owner->id)->update(['photo' => $path, 'updated_at' => now()]);
return response()->json(['ok' => true, 'photo' => Photos::path($path)]);
```

## Note on orientation without the `exif` extension
If the hosting does not have `exif`, the JPG can be read by hand: look for the `APP1` block with the `Exif` mark and the tag `0x0112`. If it is not needed, keep the version above.
