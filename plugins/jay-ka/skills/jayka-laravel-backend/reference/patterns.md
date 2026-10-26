# Patrones de código (Laravel)

Ejemplos mínimos y genéricos. Adapta nombres e idioma al proyecto. Nada de esto trae claves ni datos reales.

## 1. Error de negocio
```php
<?php

namespace App\Servicios;

use RuntimeException;

/** Una regla de negocio que no se cumple: código estable para las apps, mensaje para la persona y estado HTTP. */
class ErrorDeNegocio extends RuntimeException
{
    public function __construct(public readonly string $codigo, string $mensaje, public readonly int $estado = 422)
    {
        parent::__construct($mensaje);
    }
}
```

## 2. Bitácora
```php
<?php

namespace App\Servicios;

use Illuminate\Support\Facades\DB;

class Bitacora
{
    /** Registra quién hizo qué, sobre qué, cómo estaba antes y cómo quedó. */
    public static function registrar(int $actor, string $accion, string $objetoTipo, int $objetoId, ?array $antes, ?array $despues, ?string $motivo = null): void
    {
        DB::table('bitacora')->insert([
            'actor_id' => $actor, 'accion' => $accion, 'objeto_tipo' => $objetoTipo, 'objeto_id' => $objetoId,
            'antes' => $antes ? json_encode($antes) : null, 'despues' => $despues ? json_encode($despues) : null,
            'motivo' => $motivo, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
```

## 3. Servicio con una regla, transacción y bitácora
```php
<?php

namespace App\Servicios;

use Illuminate\Support\Facades\DB;

class PedidosAdmin
{
    /** Las acciones que este servicio atiende por el despachador único. */
    public const ACCIONES = ['pedido-cancelar'];

    public static function cancelar(int $actor, array $d): void
    {
        $id = (int) ($d['id'] ?? 0);
        $motivo = self::motivo($d['motivo'] ?? null);

        DB::transaction(function () use ($actor, $id, $motivo) {
            $p = DB::table('pedidos')->where('id', $id)->lockForUpdate()->first();
            if (! $p) {
                throw new ErrorDeNegocio('no_existe', 'Ese pedido no existe.', 404);
            }
            if (in_array($p->estado, ['Entregado', 'Cancelado'], true)) {
                throw new ErrorDeNegocio('pedido_cerrado', 'Ese pedido ya terminó y no se puede cancelar.', 409);
            }
            DB::table('pedidos')->where('id', $id)->update(['estado' => 'Cancelado', 'updated_at' => now()]);
            Bitacora::registrar($actor, 'pedido-cancelado', 'pedido', $id, ['estado' => $p->estado], ['estado' => 'Cancelado'], $motivo);
        });
    }

    /** Las intervenciones exigen un motivo escrito. */
    private static function motivo(?string $texto): string
    {
        $t = trim((string) $texto);
        if ($t === '') {
            throw new ErrorDeNegocio('motivo_requerido', 'Escribe el motivo: queda en la bitácora.', 422);
        }

        return mb_substr($t, 0, 240);
    }
}
```

## 4. Despachador de una acción por POST
```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Servicios\ErrorDeNegocio;
use App\Servicios\PedidosAdmin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AccionController extends Controller
{
    /** Todas las acciones que existen: cada servicio declara las suyas. */
    public static function acciones(): array
    {
        return array_merge(PedidosAdmin::ACCIONES /*, OtroServicio::ACCIONES */);
    }

    public function __invoke(Request $peticion, string $accion): JsonResponse
    {
        $actor = (int) Auth::guard('admin')->id();
        $d = $peticion->all();

        try {
            $resultado = match ($accion) {
                'pedido-cancelar' => tap([], fn () => PedidosAdmin::cancelar($actor, $d)),
            };
        } catch (ErrorDeNegocio $e) {
            return response()->json(['ok' => false, 'codigo' => $e->codigo, 'mensaje' => $e->getMessage()], $e->estado);
        }

        return response()->json(['ok' => true] + $resultado);
    }
}
```
Ruta:
```php
Route::middleware('auth:admin')->group(function () {
    Route::post('/panel/accion/{accion}', AccionController::class)
        ->whereIn('accion', AccionController::acciones())
        ->middleware('throttle:60,1');
});
```

## 5. Lectura JSON (sin lógica)
```php
Route::middleware(['web', 'auth:admin'])->prefix('api/admin')->group(function () {
    Route::get('/pedidos', [PedidosLecturaController::class, 'lista']);
    Route::get('/pedidos/{id}', [PedidosLecturaController::class, 'detalle'])->whereNumber('id');
});
```
El controlador llama a `PedidosAdmin::lista()` / `detalle()` y devuelve `response()->json(...)`. Mantén la forma del JSON estable.

## 6. Cuentas separadas con guards
```php
// config/auth.php
'guards' => [
    'cliente' => ['driver' => 'session', 'provider' => 'clientes'],
    'admin'   => ['driver' => 'session', 'provider' => 'administradores'],
],
'providers' => [
    'clientes'        => ['driver' => 'eloquent', 'model' => App\Models\Cliente::class],
    'administradores' => ['driver' => 'eloquent', 'model' => App\Models\Administrador::class],
],
```

## 7. Migración (solo agregar)
```php
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora', function (Blueprint $t) {
            $t->id();
            $t->foreignId('actor_id')->constrained('administradores');
            $t->string('accion');
            $t->string('objeto_tipo');
            $t->unsignedBigInteger('objeto_id');
            $t->json('antes')->nullable();
            $t->json('despues')->nullable();
            $t->string('motivo')->nullable();
            $t->timestamps();
            $t->index(['objeto_tipo', 'objeto_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora');
    }
};
```

## 8. Prueba por regla
```php
class PedidosAdminTest extends TestCase
{
    use RefreshDatabase;

    private function hacer(string $accion, array $datos)
    {
        return $this->actingAs($this->admin, 'admin')->postJson("/panel/accion/{$accion}", $datos);
    }

    public function test_cancelar_exige_un_motivo(): void
    {
        $this->hacer('pedido-cancelar', ['id' => 1])->assertStatus(422)->assertJsonPath('codigo', 'motivo_requerido');
    }

    public function test_cancelar_deja_rastro_en_la_bitacora(): void
    {
        $this->hacer('pedido-cancelar', ['id' => 1, 'motivo' => 'Prueba'])->assertOk();
        $this->assertSame(1, DB::table('bitacora')->where('accion', 'pedido-cancelado')->count());
    }

    public function test_sin_sesion_de_admin_no_se_puede(): void
    {
        $this->postJson('/panel/accion/pedido-cancelar', ['id' => 1, 'motivo' => 'x'])->assertStatus(401);
    }
}
```

## 9. Seeder repetible y solo local
```php
class DatosLocalesSeeder extends Seeder
{
    public function run(): void
    {
        abort_unless(app()->environment('local'), 403, 'Estos datos solo se crean en local.');

        // Actualizar o insertar por una clave natural: repetir no duplica.
        DB::table('categorias')->updateOrInsert(['nombre' => 'Café'], ['orden' => 1, 'updated_at' => now(), 'created_at' => now()]);
    }
}
```

## 10. Tarea programada con latido
```php
// routes/console.php
Schedule::call(fn () => \App\Servicios\Sistema::latido())->everyMinute()->name('latido');
```
