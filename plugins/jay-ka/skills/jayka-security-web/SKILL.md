---
name: jayka-security-web
description: "Web security review and rules for any app: headers and CSP, cookies, CSRF, request and login limits, validation, permissions between users (IDOR), file uploads, passwords and privacy. Invoke it with /jayka-security-web build or /jayka-security-web audit, optionally with an area."
argument-hint: "build | audit [headers | session | csrf | limits | validation | permissions | uploads | accounts | privacy]"
disable-model-invocation: true
---

# JayKA · Security Web

Two modes:
- **Build:** when creating login, forms, an API or uploads, apply these rules from day one.
- **Audit:** review the existing code against the list and deliver a report (**Good**, **Missing**, **Not applicable**). Do not fix without permission.

## Arguments
Received: `$ARGUMENTS` · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | Aliases | What it does |
|---|---|---|
| `build [<area>]` | `construir`, `crear` | Applies the rules while building |
| `audit [<area>]` | `auditar`, `revisar` | Reviews what exists and delivers a report |
| *(empty)* | | Ask: «Build or audit?» |

Areas (optional, one or several separated by commas; without an area all are covered):

| Area | Aliases | Sections |
|---|---|---|
| `headers` | `encabezados` | 1 |
| `session` | `sesion` | 2 |
| `csrf` | | 3 |
| `limits` | `limites` | 4 |
| `validation` | `validacion` | 5 |
| `permissions` | `permisos` | 6 |
| `uploads` | `subidas` | 7 |
| `accounts` | `cuentas` | 8 |
| `privacy` | `privacidad` | 9 |
| `login` (shortcut) | | 2, 4, 8 |
| `forms` (shortcut) | `formularios` | 3, 4, 5 |
| `api` (shortcut) | | 1, 3, 4, 5, 6 |

Secrets, keys and external services are handled only by the user (see `jayka-working-rules`).

## Measurement (first, in both modes)
Scripts in `<SKILL_DIR>/scripts/` (`SKILL_DIR` is the base directory of this skill, which Claude Code shows when loading it). They need Node 18 or newer.
1. **Risk patterns in the code:** `node "<SKILL_DIR>/scripts/scan-security.mjs" . [--sections <numbers>]`, using the section numbers of the chosen area.
   - It returns candidates with severity, section, `file:line` and a note: unescaped HTML, SQL built with variables, mass assignment, `$guarded = []`, CSRF exceptions, GET routes that change data, CORS `*` with credentials, cookies without flags, disabled TLS, weak hashes, token in `localStorage`, user-supplied filenames and secrets written in the code (using the patterns of `jayka-security-deploy`, if installed).
   - **Every candidate is confirmed by reading the code** before classifying it: it may be a false positive (for example `{!! !!}` with HTML the server itself generates). A discarded candidate is noted as «discarded: <reason>».
   - Finding nothing does not prove it is safe: permissions (section 6) and limits (section 4) are reviewed by reading routes, controllers and middleware.
2. **Headers and cookies at runtime** (sections 1 and 2), if there is an address where the app runs (local or published) and the user authorizes it:
   `node "<SKILL_DIR>/../jayka-security-deploy/scripts/check-deploy.mjs" <url> --headers-only`. If that skill is not there, look at the headers with `curl -sI <url>`.

## 1. HTTP headers (a single global middleware)
- Strict `Content-Security-Policy`: `default-src 'self'`; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`; an explicit allowlist of domains for scripts, styles and images. Avoid `unsafe-inline`; if needed, use nonces.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy`: turn off camera, microphone and geolocation if not used.
- `Cross-Origin-Opener-Policy: same-origin`.
- `X-Frame-Options: DENY` (compatibility with old browsers).
- `Strict-Transport-Security` in production.
- `Cache-Control: no-store` on pages with a session or private data; long immutable cache only on versioned static files.
- Remove `X-Powered-By` and the versions in `Server`.
- Meta tags: `charset`, `viewport`, a title per page, and `robots noindex` on private areas.

## 2. Session and cookies
- Session cookies `HttpOnly`, `Secure` and `SameSite=Lax` (or `Strict` in an admin panel).
- Short session lifetime, a new id on login, and logging out truly invalidates on the server.

## 3. CSRF and CORS
- CSRF token on every request that changes data (forms, and a header on JSON calls). Also check `Origin`/`Host`.
- Nothing that changes data through GET.
- CORS with an allowlist of origins. Never `*` together with credentials.

## 4. Rate limiting
- **Login:** at most 5 attempts per minute per IP and user, with growing temporary lockout. Generic message (do not reveal whether the user exists).
- **Public forms:** about 10 per minute per IP and also per phone or email; honeypot or captcha; minimum submit time.
- **API in general:** limit per IP and per user (for example 60 per minute), lower on searches and costly operations.
- `429` response with `Retry-After`.
- Size caps: request body, length of each field, and results per page (always paginate, with a maximum).
- Repeatable actions (book, order, pay): idempotent, so a double click does not duplicate. If there is stock, a transaction with a lock.

## 5. Validation and data access
- Validate on the server the type, length, range and format of every field; allowlists for permitted values. Never trust the browser.
- Queries only with parameters (query builder or ORM). Never concatenate SQL with user data.
- Protection against mass assignment: explicit allowed fields.
- Escape all output. Avoid `innerHTML` with external data.

## 6. Permissions (the most common mistake)
- Every read or change checks that the resource belongs to whoever asks, or that their role allows it (**IDOR**). Changing the number in the address must not give access to other people's data.
- Minimum permission per role. The server decides; hiding a button is not security.
- Log of what the administrator does: who, what, before, after and when.

## 7. Uploaded files
- Size limit (for example 5 MB) and a check of the **real type by content**, not by extension or by what the browser says.
- Images: accept only expected formats (JPG, PNG, WebP), re-encode them (removes metadata and hidden payloads) and limit the size in pixels.
- File name generated by the server, never the user's.
- Public files in one folder; private documents in private storage with authenticated download.

## 8. Accounts and passwords
- Passwords with a strong hash (bcrypt or argon2) and a minimum length. Never stored or logged in clear.
- Initial password with mandatory change and expiry.
- Two-step verification for administrators.
- Generic errors on login and recovery (it must not be possible to tell which accounts exist).

## 9. Privacy
- Only the necessary personal data.
- Nothing personal in addresses (URLs), in `localStorage` or in logs. Logs rotate.

## 10. Closing test
- Check the headers (for example with securityheaders.com).
- Try to open another user's resource.
- Try ten failed logins in a row.
- Try to upload a file of another type with an image extension.
- Cause an error: it must not show traces.

## Report
Short list: **Good**, **Missing** (with the proposed fix) and **Not applicable**, each point with its origin (`Measured`, `Code` or `Inferred`). In audit mode it is saved to `docs/security/YYYY-MM-DD-web.md`. Ask before fixing.

## Done when
- **Audit:** `scan-security.mjs` was run and each candidate ended confirmed or discarded with a reason; every point of the area's sections is classified and has an origin; the report is saved; no code was changed.
- **Build:** every rule of the area's sections is implemented or noted as pending with its reason; `scan-security.mjs` on what was built leaves no high-severity candidate unexplained; and the section 10 tests that apply were run, with their real result.

## My settings
<!-- Change the numbers (attempts per minute, maximum size) or add rules for your stack. -->
