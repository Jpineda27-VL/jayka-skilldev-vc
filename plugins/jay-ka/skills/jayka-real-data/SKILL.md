---
name: jayka-real-data
description: "Stop working with demo screens: sample data stored in the database with repeatable, local-only seeders, test accounts without real secrets, an inventory of what is still demo and a complete end-to-end flow test across roles. Invoke it with /jayka-real-data, or with a phase (inventory, plan, seed, connect, flow)."
argument-hint: "[inventory | plan | seed | connect | flow]"
disable-model-invocation: true
---

# JayKA · Real Data

To go from «screens that seem to work» to **real sample data** that travels through the whole system: it is created in the database, the next role sees it and it shows up in the panel. That way the connection errors a demo hides are detected.

## Arguments
Received: `$ARGUMENTS` · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | Step |
|---|---|---|
| *(empty)* | | **Default.** From Step 1 to 6, in order, with their gates |
| `inventory` | `inventario` | Step 1 |
| `plan` | | Step 2 |
| `seed` | `sembrar` | Step 3 |
| `connect` | `conectar` | Step 4 |
| `flow` | `flujo` | Step 5 |

When starting at a phase, check that what comes before exists (for example, `seed` needs the plan from Step 2). If it is missing, say so and offer to do it first.

## Principles
1. **Sample data lives in the database**, seeded by seeders. Never written by hand inside the screens.
2. **What has no real data is labeled** («Demo») until it is connected, or removed. Nothing pretends to be real.
3. **Local only.** The sample seeders refuse to run outside development environments.
4. **No real secrets.** Test accounts use a development password defined in an environment variable (with a default only for local); never anybody's real password.
5. **Repeatable.** Running the seeder twice does not duplicate; it updates.
6. **A flow is worth a thousand screens:** it is tested that a datum created by one role reaches the next.

## Rules of this skill
- **Backup first:** before seeding or cleaning data in a database that already has information, make a dated backup. Without a backup, nothing is deleted or overwritten.
- **Permissions:** deleting or replacing existing data, changing the environment or installing tools requires explicit permission. What already exists is **kept** if there is history (the same identifiers are reused with the new identity, instead of deleting and breaking relations).
- **No keys:** never put or read real credentials. Tests use sample accounts.
- The data must be **plausible** for the place where the project will be used (names, currencies, addresses, sample phones). Do not use data of real people.

## Step 1 · Inventory of what is still demo
1. Run `node "<SKILL_DIR>/scripts/find-demo-data.mjs" . --out docs/project/demo-candidates.json` (`SKILL_DIR` is the base directory of this skill; it needs Node 18 or newer). It finds lorem ipsum, sample names, emails and phones, placeholder images, demo/mock constants, faker outside seeders, `TODO: connect…` and arrays of 3 or more hand-written objects. It ignores seeders, factories, tests, fixtures and stories. They are **candidates**: open each file and confirm. Then go through the screens for what the script does not see (for example, fixed numbers in a chart).
2. Build a table: **screen · current source (by hand / database) · what is missing to connect it · priority**.
3. Show it to the user and agree on **the order**. Mark what has no decided business rules as «pending decision»: it is not connected by inventing rules.

## Step 2 · Sample data plan
Ask the minimum (and propose default values):
- How many of each thing? (for example 5 shops with 5 or more products each; 5 couriers; 10 clients).
- Which states must exist to test? (new, in progress, finished, cancelled; active, suspended, inactive accounts).
- Which test accounts per role, with which users? (they are documented; the password is defined in an environment variable).
- Sample photos? Have them go through **the same upload service** the users use (`jayka-photos`).
Save the plan; for something big, `jayka-plan-builder`.

## Step 3 · Seeders
Follow `reference/seeder-pattern.md`:
- `abort_unless` local environment.
- Update or insert by a **natural key** (not by the number).
- Order by dependencies (first what depends on nobody).
- Accounts with the password from an environment variable.
- One seeder per topic (catalog, accounts, history) and one that calls them in order.
- Care with the real test database: **backup before**, and do not delete what has relations.
- **Check that they can be repeated** (measured, not assumed): note the row count per table, run the seeders, count again, run them once more and count again. The second run must not change any count.
  - Laravel: `php artisan db:show --counts` before and after each `php artisan db:seed --class=<MainSeeder>`.
  - Others: a `SELECT COUNT(*)` query per seeded table, with the project's database tool.
- **Check the environment lock:** run the seeder with the environment set to `production` **only against a local or disposable database** (for example, `APP_ENV=production php artisan db:seed --class=<Seeder>` with the local database). It must refuse to run. Never against the real database.

## Step 4 · Connect the screens
For each screen of the inventory, in the agreed order: remove the hand-written data, read from the service or API, take care of the empty and error states, and test it with the seeded data. If there are two frontends, `jayka-views-parity`.

## Step 5 · Complete flow test
Follow `reference/flow-test-checklist.md`. In short: walk through, with test accounts, the complete path across roles (for example: client orders → shop accepts → courier receives → administrator sees it), checking **every step on the server** and not only on the screen. When done, **clean up or restore** what the test changed (cancel the test order, disconnect the couriers, empty the carts) to leave the data as agreed.

## Step 6 · Document
Leave in `docs/project/test-data.md` (without passwords): test accounts per role (users), where the development password is defined (variable name), how to reset the data and what is still demo. Update the project state (`jayka-continuity`).

## What NOT to do
- Do not «fix» a demo screen with more hand-written data.
- Do not delete history to make the seeder look nice.
- Never seed in production.
- Do not leave the flow test with test data mixed with the real.

## Done when
- **Inventory:** `find-demo-data.mjs` was run and each candidate ended confirmed or discarded; each screen has its source (by hand or database) and priority, and the order was agreed.
- **Seed:** the seeders run **twice in a row** without duplicating (the row count of each seeded table is equal after the first and the second run, **measured**), and they refuse to run outside local (checked).
- **Connect:** when running `find-demo-data.mjs` again, the only candidates left are those labeled «Demo» or discarded with a reason.
- **Flow:** every step of the walk across roles was checked on the server, and the data was left as agreed.
- `docs/project/test-data.md` is written, without passwords.

## My settings
<!-- Default quantities, name of the password variable, region and style of sample names. -->
