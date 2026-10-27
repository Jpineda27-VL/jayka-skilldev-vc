# Interface and tests for photo upload

## 1. Check the size and submit by itself (plain JavaScript, no dependencies)
```html
<label class="btn" for="photo-file">Change photo</label>
<input type="file" id="photo-file" name="photo" form="photo-form"
       accept="image/jpeg,image/png,image/webp" data-auto-upload class="sr-only">
<small>JPG, PNG or WebP, up to 5 MB. It is compressed automatically.</small>
<small class="error" role="alert" hidden></small>

<!-- The form goes OUTSIDE the main form (they cannot be nested); the field is tied to it with form="photo-form". -->
<form id="photo-form" method="post" action="/path/upload-photo" enctype="multipart/form-data" hidden>
  <input type="hidden" name="_token" value="{{ csrf_token() }}">
</form>

<script>
  document.querySelectorAll('input[data-auto-upload]').forEach(function (field) {
    field.addEventListener('change', function () {
      var file = field.files && field.files[0];
      var notice = field.parentNode.querySelector('.error');
      notice.hidden = true;
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        notice.textContent = 'The photo is over 5 MB. Choose a lighter one.';
        notice.hidden = false;
        field.value = '';
        return;
      }
      document.getElementById(field.getAttribute('form')).submit();
    });
  });
</script>
```

## 2. Upload from a web app with `fetch`
```js
async function uploadPhoto(path, fields, file) {
  const body = new FormData();
  Object.entries(fields).forEach(([k, v]) => body.append(k, v));
  body.append('photo', file);
  const r = await fetch(path, {
    method: 'POST', credentials: 'same-origin',
    headers: { Accept: 'application/json', 'X-XSRF-TOKEN': readCookie('XSRF-TOKEN') },
    body,   // no Content-Type: the browser sets the boundary
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok && data.ok !== false, ...data };
}
```

## 3. PHP limits locally (built-in server)
File `limits.ini`:
```ini
upload_max_filesize=6M
post_max_size=8M
```
Start (the variable makes PHP read that file in addition to its `php.ini`):
```bash
PHP_INI_SCAN_DIR=/path/to/the/folder/with/limits.ini php artisan serve
```
In production: `php.ini` (or the hosting panel) and, if there is a proxy, its own limit (`client_max_body_size 8M;` in Nginx).

## 4. Tests (PHPUnit)
```php
public function test_the_cover_is_saved_as_a_1200_px_webp(): void
{
    Storage::fake('public');
    $this->upload(['photo' => UploadedFile::fake()->image('x.jpg', 3000, 2000)])->assertOk();
    [$width, $height, $type] = getimagesize(Storage::disk('public')->path($expectedPath));
    $this->assertSame(IMAGETYPE_WEBP, $type);
    $this->assertSame(1200, max($width, $height));
    $this->assertSame(800, min($width, $height));          // keeps the 3:2 proportion
}

public function test_a_small_photo_is_not_enlarged(): void
{
    $this->upload(['photo' => UploadedFile::fake()->image('logo.png', 300, 300)])->assertOk();
    $this->assertSame([300, 300], array_slice(getimagesize(Storage::disk('public')->path($path)), 0, 2));
}

public function test_heavy_photos_and_other_types_are_rejected(): void
{
    $this->upload(['photo' => UploadedFile::fake()->image('x.jpg', 800, 600)->size(6000)])->assertStatus(422)->assertJsonPath('code', 'photo_too_large');
    $this->upload(['photo' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')])->assertStatus(422)->assertJsonPath('code', 'photo_format');
    $this->upload([])->assertStatus(422)->assertJsonPath('code', 'photo_missing');
}

public function test_replacing_deletes_the_previous_photo(): void { /* uploads twice with different names and checks assertMissing */ }
public function test_an_owner_cannot_upload_to_another(): void { /* assertStatus(404) */ }
public function test_without_a_session_it_cannot_upload(): void { /* assertStatus(401) */ }
```

## 5. Node variant (requires permission to install `sharp`)
```js
import sharp from 'sharp';
await sharp(input).rotate()                         // straightens by EXIF
  .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(target);
```
Validate the real type with a «magic bytes» library (for example `file-type`) before processing.

## 6. Python variant (requires permission to install `Pillow`)
```python
from PIL import Image, ImageOps
img = ImageOps.exif_transpose(Image.open(source))
img.thumbnail((1200, 1200))                          # does not enlarge
img.save(target, 'WEBP', quality=82, method=6)
```
