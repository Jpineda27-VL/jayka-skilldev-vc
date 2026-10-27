---
name: jayka-laravel-backend
description: "Laravel backend pattern proven in production: thin controllers, business rules in services, business errors with a stable code, one action per POST, change log, several account types with separate guards, one test per rule and local seeders. Invoke it with $jayka-laravel-backend new, module <name> or review."
---

# JayKA · Laravel Backend

Order for building a Laravel backend that **grows without tangling**: where each thing lives, how errors are named, how it is tested. The code examples are in `reference/patterns.md`. Example names are in English; use the project's language where it differs.

## Arguments
Received: the text accompanying the skill invocation in the user message · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| `new` | `nuevo` | Start of a new backend: section 10 |
| `module <name>` | `modulo` | New module in an existing backend: section 9 |
| `review [<section>]` | `audit`, `revisar` | Reviews the current backend against sections 1 to 8 (or only the given one, by number) and delivers **Good / Missing / Not applicable** with origin. It changes no code |
| *(empty)* | | If `artisan` exists in the folder: ask «New module or review?». If not: `new` |

## Preparation (always)
- Version: read `laravel/framework` in `composer.json` and `php --version`. If the project is not Laravel, say so and stop.
- Test command: `php artisan test` (or the `test` script of `composer.json` if there is one). Run it once at the start to know the starting point and note the result.

## Rules of this skill
- Follow `jayka-working-rules`: plan before building and one module at a time.
- **Permissions:** installing packages (`composer require`), creating the project (`composer create-project`), touching the real database or changing production configuration require explicit permission. Before migrating on a database with data, a dated backup.
- Never real keys or `.env`: only `.env.example` and variables the user fills in.

## 1. Where each thing lives
| Layer | Responsibility | Must NOT |
|---|---|---|
| **Route** | Address, method, guard, request limit | Have logic |
| **Controller** | Receive the request, call the service, return JSON or a redirect | Decide rules, query tables by hand |
| **Service** (`app/Services/`) | **All business rules** and data changes, inside transactions | Know the HTTP request or the view |
| **Model / query** | Data access | Business rules |
| **View / app** | Show and send | Calculate, validate as the only defense |

The screen (Blade, React, mobile app) only shows and sends. **Everything is validated again on the server.**

## 2. Business errors with a stable code
- An own exception (`BusinessError`) with three pieces: a short, stable **code** (`reason_required`, `not_found`), a **message** for the person, and an **HTTP status** (422, 404, 409…).
- Services throw it; the controller catches it and answers `{ ok:false, code, message }` (JSON) or goes back with the error (Blade).
- Codes are a contract: apps and tests depend on them. Do not rename them without migrating the clients.
- Messages **clear and free of technical jargon**; never leak internal details.

## 3. One action per POST
For panels with many operations, instead of a route for each one:
- A single route `POST /area/action/{action}` with `whereIn('action', LIST)`.
- Each service declares its `ACTIONS` (constant). The controller gathers them and dispatches with `match`.
- Advantages: one single door to authorize, audit and limit; new actions do not touch the routes.
- **Reads** go apart, as `GET /api/<area>/...` with the corresponding guard and stable JSON.

## 4. Change log
- Every administrator action or sensitive change is recorded: **who**, **what**, **on which object**, **before**, **after**, **reason** and **when**.
- Interventions (cancel, suspend, reassign, refund) **require a reason**: if missing, a business error.

## 5. Accounts and permissions
- Different account types in **separate tables** and one **guard** per type (`config/auth.php`). A session of one type does not open the area of another.
- Every resource is checked against whoever asks (never only by the number in the address): this prevents access to other people's data.
- Explicit list of public routes; everything else requires a session.
- Security detail in `jayka-security-web`.

## 6. Data
- **Migrations:** only added; the applied ones are never edited. Name `YYYY_MM_DD_NNNNNN_description`. Comments on columns with non-obvious rules. Foreign keys with explicit behavior (`cascadeOnDelete`, `nullOnDelete`, restrictive).
- **Money:** decimals (`decimal(10,2)`), never `float`. Rounding in one place and documented.
- **Concurrency:** transaction with `lockForUpdate()` wherever two people can compete (stock, assignments, balances).
- **Idempotency:** repeating an action (double click, retry) does not duplicate the result.
- **Time zone** defined in `config/app.php` and used the same way across the app.
- **Adjustable rules** (rates, deadlines, limits): in a configuration table with a service, with a log when changed; not hidden in the code.
- **Seeders:** repeatable (they do not duplicate) and **local only** (`abort_unless(app()->environment('local'))`). See `jayka-real-data`.

## 7. Scheduled tasks
- `routes/console.php` with the tasks and a **heartbeat** every minute to know whether cron is alive.
- What is critical also has a **lazy route** (corrected when read) in case cron fails.
- Locally cron does not run: the panel must be able to show it («Cron down») without breaking anything.

## 8. Tests
- PHPUnit with `RefreshDatabase` and in-memory SQLite.
- **One test per important rule**, with a name that tells the rule (`test_cancel_requires_a_reason`).
- A `trait` or helper that builds the test «world» (shop, account, client…) so it is not repeated.
- Check the **error code and HTTP status**, not just that it «fails».
- Also test the negatives: no session, session of another type, someone else's resource, invalid values, double submit.
- Before saying «done»: run the whole suite and report the real result.

## 9. How to work a new module
1. **Clarify** (short): entities, roles that use it, rules already decided and pending. Do not invent rules.
2. **Plan** of 4 to 6 steps; for something big, `jayka-plan-builder`.
3. **Migration** (with a backup if there is data) → **service** with its rules and errors → **controller and routes** → **JSON reads** → **tests**.
4. Run the tests. If there is a screen, review it in a browser (mobile and desktop).
5. Summary: which rules it implemented, which error codes it exposes, which decisions remain pending.

## 10. Start of a new backend (checklist)
- [ ] Laravel project created (with permission) and database configured in `.env.example`.
- [ ] `BusinessError`, `AuditLog` and the base action controller.
- [ ] Guards and account tables per type.
- [ ] Security headers middleware and request limits (`jayka-security-web`).
- [ ] Test trait with the base «world» and the first green test.
- [ ] `docs/` with business rules and state (`jayka-continuity`).

## Done when
- **`new`:** every box of section 10 is checked or noted as pending with its reason, and `php artisan test` passes (real output in the summary).
- **`module`:** migration, service, controller and routes, JSON reads and one test per rule (including the negatives of section 8) exist; the whole suite passes; the summary lists the rules implemented, the error codes and the pending decisions.
- **`review`:** every point reviewed has a classification and origin (`Code` with `file:line` or `Measured`), and no code was changed.

## My settings
<!-- Folder and class names, Laravel version, database, test style. -->
