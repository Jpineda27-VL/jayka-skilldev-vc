---
name: jayka-security-deploy
description: "Security checklist before publishing a site or app (secrets, environment, HTTPS, backups, cron, paths that must return 404, final test). Invoke it with $jayka-security-deploy before going to production, optionally with your domain."
---

# JayKA · Security Deploy

Security review **before publishing**. It works in audit mode: you review, report and propose. **You change nothing and touch no secrets without permission** (see `jayka-working-rules`).

## Arguments
Received: the text accompanying the skill invocation in the user message · Conventions: `../jayka-working-rules/reference/conventions.md` (path relative to this skill).
Any other argument: answer only «Unknown argument `<argument>`. Options: …» with the options of this table, and do nothing else.

| Argument | What it does |
|---|---|
| *(empty)* | **Default.** Audit of sections 1 to 8 against the code and the configuration. Section 9 is delivered as commands with `YOUR-DOMAIN` for the user to run |
| `<domain>` | Same, plus section 9 with that domain. Before running it ask: «Shall I run the section 9 tests against `<domain>` myself? They are read-only requests». If they say no, deliver the commands already filled in. Accepted with or without `https://` |

## Rules of this skill
- Keys, tokens, passwords and production variables are handled **only by the user**. You never read, create, copy or write them. You say what is missing and where it goes.
- Do not run anything against the production server and do not publish. The section 9 tests are handed to the user as commands, or you run them only if they give you the address and authorize it.
- First understand the stack (language, framework, hosting). Adapt the points; mark «not applicable» whatever does not apply.

## Scripts
They are in `<SKILL_DIR>/scripts/` (`SKILL_DIR` is the base directory of this skill, located from the loaded SKILL.md path). They need Node 18 or newer (`node --version`); if there is no Node, those points are reviewed by hand and the report says so.

| Script | What it measures | Output |
|---|---|---|
| `scan-git-secrets.mjs [<repo>]` | Secrets in the **whole** git history and in the files tracked today; whether `.env` is in `.gitignore` | Table with commit, file and type; the value is always masked. Exit code 1 if there are findings |
| `check-deploy.mjs <domain> [--headers-only] [--out <json>]` | HTTPS, redirect, certificate, headers, cookies, 24 paths that must return 404/403 and the error page. GET requests only, one at a time | Table `ok / fail / review / n/a`. Exit code 1 if anything fails |

## How you work
1. Ask (once, short): framework, where it is published, whether there is a database, email, file uploads, login.
2. Run `node "<SKILL_DIR>/scripts/scan-git-secrets.mjs" .` at the project root. What it finds goes to section 2 as `Measured`. A real secret in the history is **Missing** and **Needs the user**: rotating it (deleting it from the history is not enough).
3. Go through the list below against the project's code and configuration (without opening real secret files: look only at templates such as `.env.example`).
4. If there is a domain and the user authorized it, run section 9 with the script.
5. Deliver a report: **Good**, **Missing** (with what to do), **Not applicable** and **Needs the user** (what only they can do).

## 1. Environment
- Debug mode off and environment set to «production». An error with debug on shows keys and paths.
- Generic error pages, without traces or internal paths.
- Everything on HTTPS, with http-to-https redirect and HSTS.
- New keys for production: never reuse the development ones.

## 2. Secrets
- Secrets live in environment variables, not in the repository or the code.
- The real environment file (`.env` or similar) is in `.gitignore` and was never committed. If it ever was: consider it compromised and ask the user to rotate the keys.
- Check the Git history for keys committed by mistake.
- Logs do not store passwords, tokens or unnecessary personal data.

## 3. Test accounts and data
- No test accounts or passwords in production. No demo data.
- Initial passwords changed, and expiring if the system generates them.
- Database with a minimum-permission user (not administrator) and no access from the internet.

## 4. What must never be reachable from the web (must return 404 or 403)
`/.env`, `/.git`, backup folders, `.sql` files, `/storage` or private folders, `phpinfo`, debug panels, `/node_modules`, configuration files and source code that is not public.

## 5. Server
- Firewall open only on 80 and 443 (and SSH with a key, not a password).
- Operating system, runtime (PHP, Node…) and dependencies up to date. Run the project's dependency audit (`npm audit`, `composer audit`, `pip-audit`…) and report; do not update without permission.
- Hide the server and language versions in the headers.

## 6. Backups
- Automatic backup of the database and of uploaded files, dated.
- A restore test done at least once.

## 7. Scheduled tasks and email
- Cron or scheduled jobs are configured and there is a sign they are still alive (for example a «heartbeat»).
- Real email configured, with SPF, DKIM and DMARC if emails are sent from the domain.

## 8. Headers and limits
This is detailed in `jayka-security-web`. Here only confirm that a headers middleware exists and request limits on login and public forms.

## 9. Final test (the day of publishing)
**Measured by the script** (with permission, through the `<domain>` argument):
`node "<SKILL_DIR>/scripts/check-deploy.mjs" <domain> --out docs/security/YYYY-MM-DD-deploy-network.json`
It covers: HTTPS and redirect, certificate, headers, cookies, sensitive paths (`/.env`, `/.git/config`, logs, `.sql` backups, `phpinfo`, debug panels, folder listings…) and an error page without traces. Each `fail` row is **Missing**; each `review` is looked at by hand and classified.
If the user prefers to run it themselves, give them the same command, or at least `curl -I https://THEIR-DOMAIN/.env` and `curl -I https://THEIR-DOMAIN/.git/config` (both must return 404).

**By hand only** (the script does not log in or submit forms). Steps for the user, with a test account of their own:
- Open another user's resource by changing the number in the address: it must be denied.
- Ten failed logins in a row: it must block or slow down.

## If something fails
| Situation | What to do |
|---|---|
| `check-deploy` exits with code 2 (cannot connect) | Check the domain with the user; if the site is not published yet, section 9 stays «pending» |
| A path returns 200 with the home page | It is the app's generic response (`ok`); confirm it does not serve the real file |
| `scan-git-secrets` finds a secret that the user says is fake | Note it as «confirmed fake by the user»; do not delete it from the report |
| It is not a git repository | The history point is «not applicable» and that is stated |

## Final report
Save it to `docs/security/YYYY-MM-DD-deploy.md` and show it summarized. End with: what is ready, what is missing, what the user needs to do, and a clear verdict: **ready to publish** or **do not publish yet** and why.

## Done when
- Every point of sections 1 to 9 is marked **Good**, **Missing**, **Not applicable** or **Needs the user**, with its origin (`Measured`, `Code` or `Inferred`, per the conventions).
- No real secret file was opened.
- The report is saved and has a verdict. If any point of sections 1, 2 or 4 is **Missing**, the verdict is «do not publish yet».

## My settings
<!-- Add or remove points depending on your hosting and your stack. -->
