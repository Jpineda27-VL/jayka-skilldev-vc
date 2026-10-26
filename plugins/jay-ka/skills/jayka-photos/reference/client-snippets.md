# Interfaz y pruebas de la subida de fotos

## 1. Comprobar el peso y enviar solo (JavaScript puro, sin dependencias)
```html
<label class="btn" for="foto-archivo">Cambiar foto</label>
<input type="file" id="foto-archivo" name="foto" form="foto-form"
       accept="image/jpeg,image/png,image/webp" data-subir-auto class="sr-only">
<small>JPG, PNG o WebP, hasta 5 MB. Se comprime sola.</small>
<small class="error" role="alert" hidden></small>

<!-- El formulario va FUERA del formulario principal (no se pueden anidar); el campo se une con form="foto-form". -->
<form id="foto-form" method="post" action="/ruta/subir-foto" enctype="multipart/form-data" hidden>
  <input type="hidden" name="_token" value="{{ csrf_token() }}">
</form>

<script>
  document.querySelectorAll('input[data-subir-auto]').forEach(function (campo) {
    campo.addEventListener('change', function () {
      var archivo = campo.files && campo.files[0];
      var aviso = campo.parentNode.querySelector('.error');
      aviso.hidden = true;
      if (!archivo) return;
      if (archivo.size > 5 * 1024 * 1024) {
        aviso.textContent = 'La foto pesa más de 5 MB. Elige una más liviana.';
        aviso.hidden = false;
        campo.value = '';
        return;
      }
      document.getElementById(campo.getAttribute('form')).submit();
    });
  });
</script>
```

## 2. Subida desde una app web con `fetch`
```js
async function subirFoto(ruta, campos, archivo) {
  const cuerpo = new FormData();
  Object.entries(campos).forEach(([k, v]) => cuerpo.append(k, v));
  cuerpo.append('foto', archivo);
  const r = await fetch(ruta, {
    method: 'POST', credentials: 'same-origin',
    headers: { Accept: 'application/json', 'X-XSRF-TOKEN': leerCookie('XSRF-TOKEN') },
    body: cuerpo,   // sin Content-Type: el navegador pone el límite (boundary)
  });
  const datos = await r.json().catch(() => ({}));
  return { ok: r.ok && datos.ok !== false, ...datos };
}
```

## 3. Límites de PHP en local (servidor integrado)
Archivo `limites.ini`:
```ini
upload_max_filesize=6M
post_max_size=8M
```
Arranque (la variable hace que PHP lea ese archivo además de su `php.ini`):
```bash
PHP_INI_SCAN_DIR=/ruta/a/la/carpeta/con/limites.ini php artisan serve
```
En producción: `php.ini` (o el panel del hosting) y, si hay proxy, su propio límite (`client_max_body_size 8M;` en Nginx).

## 4. Pruebas (PHPUnit)
```php
public function test_la_portada_se_guarda_como_webp_de_1200_px(): void
{
    Storage::fake('public');
    $this->subir(['foto' => UploadedFile::fake()->image('x.jpg', 3000, 2000)])->assertOk();
    [$ancho, $alto, $tipo] = getimagesize(Storage::disk('public')->path($rutaEsperada));
    $this->assertSame(IMAGETYPE_WEBP, $tipo);
    $this->assertSame(1200, max($ancho, $alto));
    $this->assertSame(800, min($ancho, $alto));          // mantiene la proporción 3:2
}

public function test_una_foto_chica_no_se_agranda(): void
{
    $this->subir(['foto' => UploadedFile::fake()->image('logo.png', 300, 300)])->assertOk();
    $this->assertSame([300, 300], array_slice(getimagesize(Storage::disk('public')->path($ruta)), 0, 2));
}

public function test_se_rechazan_fotos_pesadas_y_otros_tipos(): void
{
    $this->subir(['foto' => UploadedFile::fake()->image('x.jpg', 800, 600)->size(6000)])->assertStatus(422)->assertJsonPath('codigo', 'foto_grande');
    $this->subir(['foto' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')])->assertStatus(422)->assertJsonPath('codigo', 'foto_formato');
    $this->subir([])->assertStatus(422)->assertJsonPath('codigo', 'foto_falta');
}

public function test_reemplazar_borra_la_foto_anterior(): void { /* sube dos veces con nombres distintos y comprueba assertMissing */ }
public function test_un_dueno_no_puede_subir_a_otro(): void { /* assertStatus(404) */ }
public function test_sin_sesion_no_se_puede_subir(): void { /* assertStatus(401) */ }
```

## 5. Variante para Node (requiere permiso para instalar `sharp`)
```js
import sharp from 'sharp';
await sharp(entrada).rotate()                       // endereza por EXIF
  .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(destino);
```
Valida el tipo real con una librería de «magic bytes» (por ejemplo `file-type`) antes de procesar.

## 6. Variante para Python (requiere permiso para instalar `Pillow`)
```python
from PIL import Image, ImageOps
img = ImageOps.exif_transpose(Image.open(entrada))
img.thumbnail((1200, 1200))                          # no agranda
img.save(destino, 'WEBP', quality=82, method=6)
```
