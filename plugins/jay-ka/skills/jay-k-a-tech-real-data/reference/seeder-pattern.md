# Patrón de seeders de ejemplo (Laravel)

Adapta a tu stack. La idea es la misma en cualquier framework: **repetible, solo local, por clave natural, sin secretos reales**.

## Seeder de catálogo
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogoInicialSeeder extends Seeder
{
    public function run(): void
    {
        abort_unless(app()->environment('local'), 403, 'El catálogo de ejemplo solo se crea en local.');

        $ahora = now();
        $negocios = [
            1 => ['Negocio Uno', 'Descripción corta.', ['Producto A', 'Producto B', 'Producto C', 'Producto D', 'Producto E']],
            // …
        ];

        foreach ($negocios as $id => [$nombre, $descripcion, $productos]) {
            // Si el id ya existe (tiene historial), se ACTUALIZA; si no, se crea.
            if (DB::table('negocios')->where('id', $id)->exists()) {
                DB::table('negocios')->where('id', $id)->update(['nombre' => $nombre, 'descripcion' => $descripcion, 'updated_at' => $ahora]);
            } else {
                DB::table('negocios')->insert(['id' => $id, 'nombre' => $nombre, 'descripcion' => $descripcion, 'created_at' => $ahora, 'updated_at' => $ahora]);
            }
            foreach ($productos as $i => $producto) {
                // Clave natural: (negocio, nombre). Repetir el seeder no duplica.
                DB::table('productos')->updateOrInsert(
                    ['negocio_id' => $id, 'nombre' => $producto],
                    ['orden' => $i + 1, 'updated_at' => $ahora, 'created_at' => $ahora]
                );
            }
        }
    }
}
```

## Cuentas de prueba (sin secretos reales)
```php
$clave = Hash::make(env('CLAVE_DEMO', 'clave-solo-para-local'));   // la clave real de nadie; solo desarrollo
foreach (['usuario-uno', 'usuario-dos'] as $usuario) {
    DB::table('cuentas')->updateOrInsert(
        ['usuario' => $usuario],
        ['contrasena' => $clave, 'estado' => 'activa', 'updated_at' => now(), 'created_at' => now()]
    );
}
```
Documenta **los usuarios** y el **nombre de la variable**; no escribas la contraseña en documentos compartidos ni en el repositorio público.

## Identidad nueva sobre datos con historial
Si ya hay filas con relaciones (pedidos de un repartidor, por ejemplo) y quieres «reemplazarlas»:
1. **No borres.** Actualiza la fila (mismo `id`) con la identidad nueva.
2. Cierra o limpia lo transitorio (turnos activos, sesiones, ofertas abiertas).
3. Si faltan filas, créalas con los ids siguientes.

## Seeder maestro
```php
class DatabaseSeeder extends Seeder
{
    /** Solo en local, en orden de dependencias. */
    public function run(): void
    {
        $this->call(BaseSeeder::class);            // zonas, categorías, ajustes
        $this->call(CatalogoInicialSeeder::class); // negocios y productos
        $this->call(CuentasSeeder::class);         // cuentas de prueba
    }
}
```

## Comprobaciones tras sembrar
- Contar filas por tabla y comparar con lo planeado.
- Abrir las pantallas con los datos nuevos (sin errores ni imágenes rotas).
- Correr el seeder **otra vez** y verificar que los conteos no cambian.
- Correr las pruebas automáticas (usan su propia base, no la sembrada).
