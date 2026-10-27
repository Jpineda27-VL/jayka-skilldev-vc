# Codex behavior tests

These tests invoke the real `codex exec` CLI using your existing ChatGPT login and consume account tokens. They complement `node tests/run.mjs --edition codex`, which checks the package and scripts without model calls.

## Run

```text
node tests/codex-evals.mjs --list
node tests/codex-evals.mjs
node tests/codex-evals.mjs --only menu-catalog
node tests/codex-evals.mjs --runs 3
```

Optional flags:

| Flag | Purpose |
| --- | --- |
| `--only <substring>` | Run matching cases |
| `--runs <positive integer>` | Repeat each case; default 1 |
| `--timeout <seconds>` | Per-case exec timeout; default 600 |
| `--model <model>` | Explicit model selection; otherwise use the CLI default |
| `--cli <path>` | Executable or npm `bin/codex.js` when PATH discovery fails |
| `--out <directory>` | Result directory; defaults to ignored `tests/results/codex/<UTC timestamp>/` |

Requires Node 18+, Git, a current Codex CLI supporting `plugin add`, `exec --ephemeral`, `--json`, `--approve-for-me`, and `--ignore-rules`, and an existing file-backed Codex login (`codex login`). A missing login, CLI or stale generated package is reported as an error.

## Isolation and evidence

Each case creates a fresh temporary project and Codex profile, registers this repository's marketplace, and installs `jay-ka-codex` through the native CLI. It never copies the plugin into a standalone skills folder. User skills are disabled using their exact `SKILL.md` paths. Before every model call, `codex debug prompt-input` verifies that those paths are absent and the plugin's automatic skills are present; a failed check aborts the case as an infrastructure error. The profile starts without the user's config or global AGENTS.md. Every model execution uses `--ephemeral`.

The native CLI accesses the existing `auth.json` through a temporary hard link; the runner does not read, print or copy credential contents into results, and removes the link in `finally`. The temporary profile must be on the same filesystem as the existing auth file. Keyring-only login is not supported by this runner. Its fixture files, logs and plugin cache remain in temporary folders for review; the runner does not delete folders.

Commands use the workspace-write sandbox and automatic approval review. `--ignore-rules` excludes the user's execution-policy rules from the controlled test profile; sandboxing and automatic approval review remain active. If a case needs a local commit, its prompt explicitly authorizes it. The main-branch test uses a local disposable remote, never the real GitHub repository. No case authorizes a push.

Each result includes the actual final answer, JSONL events, stderr, token usage reported by Codex, changed-file contents, and a filesystem delta. Graders inspect the resulting files, Git state, executed commands and response. `exec` must finish successfully with a completed turn; an empty answer, timeout, infrastructure failure or denied operation that prevents the expected result is a failure. A failed case makes the runner exit nonzero. The aggregate JSON is updated after every case.

Scanner checks require a completed Node invocation in the recorded events. Reading a scanner's source or merely mentioning its filename does not satisfy that check. Result folders cannot be reused, preventing stale responses or files from being mistaken for new evidence.

The checks are deterministic contract checks, not an independent model judge. A passing regex alone does not establish overall quality. Review the saved answers and documents for semantic accuracy, especially audit reports and user approval gates. Automatic-skill scenarios test discovery without naming the skill; manual scenarios use `$skill-name` in the prompt. No desired answer or grader criteria are included in model prompts.

## Cases

| Case | Contract |
| --- | --- |
| `unknown-argument` | Reject invalid input, show valid modes, create nothing |
| `reply-in-spanish` | Spanish response with fixed `close`/`open` tokens |
| `reverse-live-github-asks` | Ask repository or published page before starting |
| `menu-catalog` | All 21 skills, invocation arguments and installation status |
| `chat-no-edit` | Advice without file changes or dependency installation |
| `continuity-open-no-state` | Missing state acknowledged, summary grounded in real Git history |
| `new-project-interview` | 42 pending entries, stable keys, no invented answers |
| `claude-low-no-playwright` | Task for Claude with scope and unavailable browser declared |
| `continuity-close` | State document, pending work, decision and authorized local commit |
| `git-no-push` | Branch approval on main before any edits, staging, branch changes or commits; no push |
| `security-web-audit` | Execute scanner, save report, preserve application code |
| `security-deploy-secrets` | Detect a synthetic history secret, mask it, require rotation |
| `real-data-inventory` | Execute scanner, identify demo screens, preserve source files |

The synthetic secret is assembled at runtime. Its presence in an isolated test repository is intentional; no real service key is involved. Claude's original eval cases remain unchanged.

See [official non-interactive mode documentation](https://learn.chatgpt.com/docs/non-interactive-mode) and [authentication documentation](https://learn.chatgpt.com/docs/auth).
