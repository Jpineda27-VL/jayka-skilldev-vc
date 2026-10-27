# Code patterns (Laravel)

Minimal, generic examples. Adapt names and language to the project. None of this carries keys or real data.

## 1. Business error
```php
<?php

namespace App\Services;

use RuntimeException;

/** A business rule that is not met: a stable code for the apps, a message for the person and an HTTP status. */
class BusinessError extends RuntimeException
{
    public function __construct(public readonly string $code_, string $message, public readonly int $status = 422)
    {
        parent::__construct($message);
    }
}
```
The property is named `code_` because `RuntimeException` already has a `code`; if you prefer, call it `errorCode` and use that name everywhere.

## 2. Audit log
```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AuditLog
{
    /** Records who did what, on what, how it was before and how it ended up. */
    public static function record(int $actor, string $action, string $objectType, int $objectId, ?array $before, ?array $after, ?string $reason = null): void
    {
        DB::table('audit_log')->insert([
            'actor_id' => $actor, 'action' => $action, 'object_type' => $objectType, 'object_id' => $objectId,
            'before' => $before ? json_encode($before) : null, 'after' => $after ? json_encode($after) : null,
            'reason' => $reason, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
```

## 3. Service with one rule, a transaction and the log
```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class OrdersAdmin
{
    /** The actions this service handles through the single dispatcher. */
    public const ACTIONS = ['order-cancel'];

    public static function cancel(int $actor, array $d): void
    {
        $id = (int) ($d['id'] ?? 0);
        $reason = self::reason($d['reason'] ?? null);

        DB::transaction(function () use ($actor, $id, $reason) {
            $o = DB::table('orders')->where('id', $id)->lockForUpdate()->first();
            if (! $o) {
                throw new BusinessError('not_found', 'That order does not exist.', 404);
            }
            if (in_array($o->status, ['Delivered', 'Cancelled'], true)) {
                throw new BusinessError('order_closed', 'That order is already finished and cannot be cancelled.', 409);
            }
            DB::table('orders')->where('id', $id)->update(['status' => 'Cancelled', 'updated_at' => now()]);
            AuditLog::record($actor, 'order-cancelled', 'order', $id, ['status' => $o->status], ['status' => 'Cancelled'], $reason);
        });
    }

    /** Interventions require a written reason. */
    private static function reason(?string $text): string
    {
        $t = trim((string) $text);
        if ($t === '') {
            throw new BusinessError('reason_required', 'Write the reason: it goes in the log.', 422);
        }

        return mb_substr($t, 0, 240);
    }
}
```

## 4. Single-action-per-POST dispatcher
```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\BusinessError;
use App\Services\OrdersAdmin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActionController extends Controller
{
    /** All the actions that exist: each service declares its own. */
    public static function actions(): array
    {
        return array_merge(OrdersAdmin::ACTIONS /*, OtherService::ACTIONS */);
    }

    public function __invoke(Request $request, string $action): JsonResponse
    {
        $actor = (int) Auth::guard('admin')->id();
        $d = $request->all();

        try {
            $result = match ($action) {
                'order-cancel' => tap([], fn () => OrdersAdmin::cancel($actor, $d)),
            };
        } catch (BusinessError $e) {
            return response()->json(['ok' => false, 'code' => $e->code_, 'message' => $e->getMessage()], $e->status);
        }

        return response()->json(['ok' => true] + $result);
    }
}
```
Route:
```php
Route::middleware('auth:admin')->group(function () {
    Route::post('/panel/action/{action}', ActionController::class)
        ->whereIn('action', ActionController::actions())
        ->middleware('throttle:60,1');
});
```

## 5. JSON read (no logic)
```php
Route::middleware(['web', 'auth:admin'])->prefix('api/admin')->group(function () {
    Route::get('/orders', [OrdersReadController::class, 'list']);
    Route::get('/orders/{id}', [OrdersReadController::class, 'detail'])->whereNumber('id');
});
```
The controller calls `OrdersAdmin::list()` / `detail()` and returns `response()->json(...)`. Keep the JSON shape stable.

## 6. Separate accounts with guards
```php
// config/auth.php
'guards' => [
    'client' => ['driver' => 'session', 'provider' => 'clients'],
    'admin'  => ['driver' => 'session', 'provider' => 'administrators'],
],
'providers' => [
    'clients'        => ['driver' => 'eloquent', 'model' => App\Models\Client::class],
    'administrators' => ['driver' => 'eloquent', 'model' => App\Models\Administrator::class],
],
```

## 7. Migration (add only)
```php
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_log', function (Blueprint $t) {
            $t->id();
            $t->foreignId('actor_id')->constrained('administrators');
            $t->string('action');
            $t->string('object_type');
            $t->unsignedBigInteger('object_id');
            $t->json('before')->nullable();
            $t->json('after')->nullable();
            $t->string('reason')->nullable();
            $t->timestamps();
            $t->index(['object_type', 'object_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_log');
    }
};
```

## 8. One test per rule
```php
class OrdersAdminTest extends TestCase
{
    use RefreshDatabase;

    private function act(string $action, array $data)
    {
        return $this->actingAs($this->admin, 'admin')->postJson("/panel/action/{$action}", $data);
    }

    public function test_cancel_requires_a_reason(): void
    {
        $this->act('order-cancel', ['id' => 1])->assertStatus(422)->assertJsonPath('code', 'reason_required');
    }

    public function test_cancel_leaves_a_trace_in_the_log(): void
    {
        $this->act('order-cancel', ['id' => 1, 'reason' => 'Test'])->assertOk();
        $this->assertSame(1, DB::table('audit_log')->where('action', 'order-cancelled')->count());
    }

    public function test_without_an_admin_session_it_is_not_allowed(): void
    {
        $this->postJson('/panel/action/order-cancel', ['id' => 1, 'reason' => 'x'])->assertStatus(401);
    }
}
```

## 9. Repeatable, local-only seeder
```php
class LocalDataSeeder extends Seeder
{
    public function run(): void
    {
        abort_unless(app()->environment('local'), 403, 'This data is only created locally.');

        // Update or insert by a natural key: repeating does not duplicate.
        DB::table('categories')->updateOrInsert(['name' => 'Coffee'], ['position' => 1, 'updated_at' => now(), 'created_at' => now()]);
    }
}
```

## 10. Scheduled task with a heartbeat
```php
// routes/console.php
Schedule::call(fn () => \App\Services\System::heartbeat())->everyMinute()->name('heartbeat');
```
