# Sample seeder pattern (Laravel)

Adapt it to your stack. The idea is the same in any framework: **repeatable, local only, by natural key, no real secrets**.

## Catalog seeder
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InitialCatalogSeeder extends Seeder
{
    public function run(): void
    {
        abort_unless(app()->environment('local'), 403, 'The sample catalog is only created locally.');

        $now = now();
        $shops = [
            1 => ['Shop One', 'Short description.', ['Product A', 'Product B', 'Product C', 'Product D', 'Product E']],
            // …
        ];

        foreach ($shops as $id => [$name, $description, $products]) {
            // If the id already exists (it has history), it is UPDATED; otherwise it is created.
            if (DB::table('shops')->where('id', $id)->exists()) {
                DB::table('shops')->where('id', $id)->update(['name' => $name, 'description' => $description, 'updated_at' => $now]);
            } else {
                DB::table('shops')->insert(['id' => $id, 'name' => $name, 'description' => $description, 'created_at' => $now, 'updated_at' => $now]);
            }
            foreach ($products as $i => $product) {
                // Natural key: (shop, name). Repeating the seeder does not duplicate.
                DB::table('products')->updateOrInsert(
                    ['shop_id' => $id, 'name' => $product],
                    ['position' => $i + 1, 'updated_at' => $now, 'created_at' => $now]
                );
            }
        }
    }
}
```

## Test accounts (no real secrets)
```php
$password = Hash::make(env('DEMO_PASSWORD', 'local-only-password'));   // nobody's real password; development only
foreach (['user-one', 'user-two'] as $username) {
    DB::table('accounts')->updateOrInsert(
        ['username' => $username],
        ['password' => $password, 'status' => 'active', 'updated_at' => now(), 'created_at' => now()]
    );
}
```
Document **the users** and the **variable name**; do not write the password in shared documents or in the public repository.

## New identity over data with history
If there are already rows with relations (a courier's orders, for example) and you want to «replace» them:
1. **Do not delete.** Update the row (same `id`) with the new identity.
2. Close or clean what is transient (active shifts, sessions, open offers).
3. If rows are missing, create them with the next ids.

## Master seeder
```php
class DatabaseSeeder extends Seeder
{
    /** Local only, in dependency order. */
    public function run(): void
    {
        $this->call(BaseSeeder::class);            // zones, categories, settings
        $this->call(InitialCatalogSeeder::class);  // shops and products
        $this->call(AccountsSeeder::class);        // test accounts
    }
}
```

## Checks after seeding
- Count rows per table and compare with the plan.
- Open the screens with the new data (no errors or broken images).
- Run the seeder **again** and verify that the counts do not change.
- Run the automated tests (they use their own database, not the seeded one).
