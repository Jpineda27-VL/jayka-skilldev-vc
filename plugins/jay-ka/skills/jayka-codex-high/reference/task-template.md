# Task {{NNN}} · {{title}}  (block {{n}} of plan {{plan path}})

> For Codex. Read everything before starting. This is a big task with a closed scope. If something is ambiguous, **do not invent**: note it under «Doubts» and go on with the rest.

## 1. Goal and expected result
{{What must exist when finished, described from top to bottom, in clear language.}}

## 2. Context
- Project and technology: {{…}}
- Documents you must read first: {{CLAUDE.md, state, business rules, plan}}
- Decisions already made (do not change them): {{list}}
- Style: use the existing tokens and components ({{path of the brief or of the design system}}). **No loose colors, sizes or radii.**
- Playwright in your environment: {{yes | no | unknown}}. How to start the app: `{{command}}` at {{http://localhost:…}}.

## 3. Specification
### Screen / view
- Route: {{…}}
- Sections (top to bottom): {{…}}

### Fields (if there is a form)
| Field | Type | Required | Validation (on the server) | Error message |
|---|---|---|---|---|
| | | | | |

### States
- Empty: …
- Loading: …
- Error: …
- Success: …

### Actions
| Action | What it does | Where it leads |
|---|---|---|
| | | |

### Texts
{{Exact titles, buttons and messages, or the tone to follow.}}

## 4. Rules
- **Validation and logic go on the server**; the screen only shows and sends.
- Business rules in force: {{document}}. **Do not invent new rules.**
- Pending decision (leave it marked, do not resolve it): {{list}}

## 5. Data
- Models or tables it uses: {{…}}
- New migrations: {{only add; never edit those already applied}}
- Sample data: by repeatable seeder, not written by hand in the screen.

## 6. Files
**You may create:** {{list}}
**You may modify:** {{list}}
**Do not touch anything else.** If needed, stop and ask for permission in the report.

## 7. Acceptance criteria
- [ ] {{Checkable 1}}
- [ ] {{Checkable 2}}
- [ ] One test per important rule.

## 8. Forbidden
Installing or updating dependencies · touching secrets, `.env` or environment variables · `git push`, PR or switching branch · changing business rules · changing the approved style · editing applied migrations.

## 9. Mandatory verification
1. **Tests:** `{{command}}`. Note the real result, even if it fails.
2. **Visual review** of every new screen at **375 px** and **1280 px**, going through the complete flow: success, validation errors and empty state.
   - **If you have Playwright:** do it and save screenshots in `docs/codex/screenshots/{{NNN}}/`, one per screen, size and state.
   - **If you do not have Playwright:** **do not install it** (installing is forbidden) and **do not describe screens you did not see**. In the report write «Visual check: NOT DONE», the reason, and the exact list of what needs to be looked at: screen, size, state and what to check. Whoever requested the task will do that review.
   - **If you cannot start the app** (missing database, variables or a service): write «I could not start the app» with the key lines of the error. Do not try to fix it outside the allowed files.
3. Review the diff before finishing.

## 10. What you must return
The report at `docs/codex/results/{{NNN}}-{{slug}}.md`, in the format below. **Do not commit.**

### Report format
```md
# Result {{NNN}} · {{title}}
## Status: done | done with remarks | could not finish
## What I built (file by file, one line each)
## Decisions I made on my own (each one, with reason)
## Tests (command and real result)
## Visual check: done with Playwright (375 and 1280, flow covered, screenshots, what I saw) | NOT DONE (reason and list of what needs to be looked at)
## Doubts and decisions I need from the user
## Pending and what I did NOT do (with reason)
## How to try it (routes and sample data; no real keys)
```
