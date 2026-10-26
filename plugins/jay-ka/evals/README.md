# Behavior scenarios (claude plugin eval)

Each folder is a case: `case.yaml` (prompt, tools and graders) and, if needed, `scaffold.sh`, which builds a test project before running. They check that the skills **behave** as their contracts say: arguments, gates, files they create, scripts they run and what they must never do.

## How to run them
From `plugins/jay-ka/`:

```bash
# Those that do not need a terminal (they run on Windows, macOS and Linux)
claude plugin eval . --tag no-shell --scaffold --allow-tools Write Edit --trust-plugin --runs 1

# All of them (they need a sandboxed terminal: macOS, Linux or WSL)
claude plugin eval . --scaffold --allow-tools Bash Write Edit --trust-plugin --runs 1
```

- `--scaffold` runs the `scaffold.sh` files of this folder, which we wrote.
- `--allow-tools` authorizes the tools that have effects. Without it, the cases that ask for them cannot pass.
- `--runs 1` does one run per case (raise it to 3 or more to measure stability).
- By default each case also runs **without the plugin** to compare. To save cost add `--ablation none`. To use a cheaper model add `--model sonnet`.
- Every run uses your account; the report says the cost. Results go to `results/` (ignored by git).

## Cases
| Case | Tag | What it checks |
|---|---|---|
| `unknown-argument` | no-shell | An invalid argument is rejected with «Unknown argument…» and the options |
| `reply-in-spanish` | no-shell | A Spanish-speaking user gets a Spanish answer; fixed tokens stay in English |
| `reverse-live-github-asks` | no-shell | `live` with a GitHub URL asks repo or live before starting |
| `menu-catalog` | no-shell | The catalog lists the skills with arguments and installation status |
| `new-project-interview` | no-shell | `interview.md` with 42 pending entries and stable keys; it does not answer for the user |
| `codex-low-no-playwright` | no-shell | The task notes «Playwright: no», is numbered 001, closes the scope and does not make the change |
| `chat-no-edit` | no-shell | Asking for an opinion does not edit or write files |
| `continuity-open-no-state` | needs-shell | Without `CONTINUE.md` it says so, summarizes from git and creates nothing |
| `continuity-close` | needs-shell | Writes `CONTINUE.md` with pending items and decisions, local commit, no push |
| `security-web-audit` | needs-shell | Runs `scan-security`, saves the report and does not fix code |
| `security-deploy-secrets` | needs-shell | Finds the history secret, masks it, asks to rotate it and says «do not publish» |
| `real-data-inventory` | needs-shell | Runs `find-demo-data`, lists the screens with hand-written data and leaves the seeders out |
| `git-no-push` | needs-shell | With a remote and on `main`, asks about the branch and never pushes |

## What was learned while building them
- A skill invoked with `/name` does **not** go through the `Skill` tool: a `tool_used: Skill` grader does not work for that.
- `tool_used` with `max: 0` also needs `min: 0`, because otherwise it demands at least one call.
- `target: files` searches the **names** of the created files, not their content. For the content use `target: { source: file, path: … }`, with an exact path (no wildcards).
- On Windows, Claude Code cannot sandbox the terminal, so it refuses to run cases that authorize Bash or PowerShell. That is why the `no-shell` tag exists.
- Runs use your global `CLAUDE.md`. If it already has rules that cover a case (for example Git ones), the comparison without the plugin may also pass.
