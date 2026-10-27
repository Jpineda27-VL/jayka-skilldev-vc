# Task {{NNN}} · {{short title}}

> For Claude. Read everything before starting. This task is small and has a closed scope.

## What has to be done
{{One or two clear sentences.}}

## Minimum context
- Project: {{name and technology}}
- Affected screen or module: {{path or file}}
- Style: the existing one stays; **do not change colors, fonts or spacing** beyond what is asked.
- Playwright in your environment: {{yes | no | unknown}}. How to start the app: `{{command}}` at {{http://localhost:…}}.

## Files you may touch
- {{path/file-1}}
- {{path/file-2}}

**Do not touch anything outside this list.** If you think it is needed, **stop** and say so in the report as «I need permission to…».

## Acceptance criteria
- [ ] {{Checkable 1}}
- [ ] {{Checkable 2}}

## Forbidden
- Installing or updating dependencies.
- Touching secrets, keys, `.env` or environment variables.
- Running `git push`, opening a PR or switching branch.
- Changing business rules, database data or migrations already applied.
- Deleting files outside the list.

## Mandatory verification
1. **Tests:** run {{test command of the area}} and note the real result, even if it fails.
2. **Visual review of** {{screen path}} at **375 px** and at **1280 px**:
   - **If you have Playwright:** open it at both sizes, check that it looks right (no cut-off text or overflow) and save screenshots in `docs/claude/screenshots/{{NNN}}/`.
   - **If you do not have Playwright:** **do not install it** (installing is forbidden) and **do not describe screens you did not see**. In the report write «Visual check: NOT DONE», the reason, and the exact list of what needs to be looked at (path, size and what to check). Whoever requested the task will do that review.
   - **If you cannot start the app** (missing database, variables or a service): write «I could not start the app» with the key lines of the error. Do not try to fix it outside the allowed files.
3. Review the diff before finishing: only the allowed files must appear.

## What you must return
A report at `docs/claude/results/{{NNN}}-{{slug}}.md` in the format below. Do not commit.

### Report format
```md
# Result {{NNN}} · {{title}}
## Status: done | done with remarks | could not finish
## What I changed (file by file, one line each)
## Tests (command and real result)
## Visual check: done with Playwright | NOT DONE (reason) — and, if not done, the list of what needs to be looked at
## Doubts or things you need me to decide
## What I did NOT do and why
```
