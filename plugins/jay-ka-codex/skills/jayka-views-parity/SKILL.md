---
name: jayka-views-parity
description: "Keeps parity when a product has two frontends that must show the same screens (for example a server-rendered web and a mobile app, or web and native app): screen inventory, single source of data, parity checklist and verification in both. Invoke it with $jayka-views-parity inventory, change <screen> or verify."
---

# JayKA · Views Parity

When the same product shows in **two frontends** (for example server views for desktop and an app for the phone), every change to a screen must reach **both**. This skill prevents them from drifting apart.

## Arguments
Received: the text accompanying the skill invocation in the user message · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| `inventory` | `inventario` | Step 0: creates or updates the inventory |
| `change <screen>` | `cambio` | Steps 1 to 4 for that screen (by id or route of the inventory) |
| `verify [<screen> \| all]` | `check`, `verificar`, `todo` | Only steps 3 and 4. Without a screen: those the inventory does not mark as `same` |
| *(empty)* | | If `.codex/structure/screens.md` does not exist → `inventory`. If it exists → ask: «A change on a screen, or verify?» |

A screen that is not in the inventory → «`<screen>` is not in the inventory. Shall I add it?».

## Central rule
**Changing a screen = changing both versions in the same piece of work**, or explicitly noting which one is left pending and why. Never «we will match it later» without a record.

## Principles
1. **A single source of truth.** Data and rules live on the **server** (services/API). Both frontends only show and send. If a rule appears duplicated in a frontend, it is a defect: move it to the server.
2. **Same data, same shape.** Both frontends read from the same services or from an API with the same shape. Do not create one version of the data for each.
3. **Same design system.** The same tokens (colors, typography, spacing, radii) and the same role names. A token change applies to both.
4. **Same texts.** Titles, buttons and messages the same. Ideally they come from one place; if not, they are updated together.
5. **Same navigation and same state logic:** empty, loading, error, success and disabled behave the same.
6. **What may differ:** the layout (columns vs one column), phone gestures and screens that only make sense on one device (noted as «web only» or «app only» in the inventory, with a reason).

## Step 0 · Screen inventory
Keep `.codex/structure/screens.md` with one row per screen. Template in `reference/screen-inventory.md`. If it does not exist, **create it** (following the conventions), going through routes and views.
Minimum columns: **id** · **route** · **frontend A (file)** · **frontend B (file)** · **data (service or API)** · **parity status** (`same`, `A ahead`, `B ahead`, `A only`, `B only`) · **notes**.

## Step 1 · Before touching a screen
1. Find it in the inventory. Does it exist in both? Is it in parity now?
2. If it is not in parity, **tell the user** before adding more changes: «This screen was already out of sync in B; do we match it too?».
3. Check where the data comes from. If it changes, it changes in the service, not in a frontend.

## Step 2 · Make the change in both
Recommended order: **server (data and rules)** → **frontend A** → **frontend B** → tests.
Use the **parity checklist** (`reference/parity-checklist.md`) so states, texts and sizes are not forgotten.

## Step 3 · Verify both (mandatory)
1. **Measured comparison.** With both frontends running (local or published), write a routes file with one line per screen, `id | urlA | urlB`, taken from the inventory, and run:
   `node "<SKILL_DIR>/scripts/capture-pair.mjs" --routes <file> --out <folder> [--ua-b mobile]`
   (`SKILL_DIR` is the base directory of this skill. It needs Node 18 or newer and Playwright: if missing, the script exits with code 3 and explains how to install it; it is installed only with permission. For a single screen: `--a <urlA> --b <urlB>`).
   - Use `--ua-a` / `--ua-b` (`mobile`, `desktop` or a text) when the server picks the frontend depending on the device.
   - Per screen and size (1280 and 375 px) it returns: `same` or `differs`, titles, actions and fields that are only in A or only in B, and the text similarity (0 to 1; `same` requires 0.9 or more). `parity.html` shows the full-page screenshots side by side with those differences. **Look at `parity.html`**: the script does not see colors, order or spacing.
2. **By hand, what the script does not cover:** empty state, validation error and loading in each frontend (the script does not click or submit forms).
3. Compare side by side: titles, order, texts, colors, states, links.
- If something on the server changed: run the tests.
- If frontend B is an app that is exported or compiled, **export it again** and verify the new version (not the cached old one).

## Step 4 · Update the inventory
Mark the parity status, the date and the commit. If something stayed pending, note it with the reason and who decides.

## Frequent traps
- **Sample data written by hand** in one of the frontends: the screen «works» but does not read the server. Detect it with `find-demo-data.mjs` of `jayka-real-data`.
- **Full reloads** in one frontend (flicker, skeleton) and live updating in the other: unify the behavior (refresh without emptying the screen).
- **Different routes** for the same screen: document them in the inventory.
- **Photos and file paths** that only one of the frontends resolves: use the same function or rule to build the address.
- **Empty states** forgotten in one of the two.
- **Texts copied by hand** that go stale: centralize them if the project grows.

## What NOT to do
- Do not duplicate business logic in the frontend to «go faster».
- Do not call a screen good because it looks fine in only one frontend.
- Do not change the design of one version without warning and recording it.

## Done when
- **`inventory`:** every route and view of both frontends has its row, with a parity status.
- **`change`:** the screen was changed in both frontends (or what is pending is noted with a reason), `capture-pair.mjs` gives `same` (or each difference is explained), the parity checklist is gone through, the server tests pass if it was touched, and the inventory has status, date and commit.
- **`verify`:** `capture-pair.mjs` was run for each screen reviewed; each `differs` is explained (fixed, or noted as an allowed difference with a reason); the states the script does not cover were reviewed by hand; and the status in the inventory reflects what was seen.

## My settings
<!-- Name your two frontends (for example «Blade» and «Expo app»), the location of the inventory and the allowed differences. -->
