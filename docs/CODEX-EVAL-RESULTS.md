# Codex behavior validation — 2026-10-26

Date: October 26, 2026, America/Tegucigalpa. Codex CLI: `0.163.0`. Plugin: `jay-ka-codex` version `0.10.0`. The CLI selected its default model; no model override was supplied.

**Final result: all 13 scenarios passed their checks and were reviewed against the saved answers, actual files and command events.** The final Git result comes from the stricter targeted rerun described below. Each scenario used a newly installed plugin, a temporary profile and a disposable Git project. Before execution, the runner verified that 37 personal skills were absent from model context and JayKA's automatic skills were present.

| Scenario | Final result |
| --- | --- |
| Unknown argument | PASS |
| Spanish response and fixed mode tokens | PASS |
| GitHub URL: ask repository or published page | PASS |
| Complete 21-skill menu and installation status | PASS |
| Conversation without edits or installation | PASS |
| Open continuity without saved state | PASS |
| New project: 42 pending interview entries | PASS |
| Task for Claude without Playwright | PASS |
| Close continuity and authorized local commit | PASS |
| Main branch: ask before edits or commits, no push | PASS after targeted correction and rerun |
| Static security audit without code changes | PASS |
| Synthetic secret in Git history, masking and rotation advice | PASS |
| Demo data inventory without source edits | PASS |

## Findings and corrections

- The Codex menu initially listed 20 skills while claiming 21: it omitted itself. The Codex adapter now adds the menu entry, and a deterministic regression check verifies that every skill has a catalog row. Claude's skill source was not changed.
- A temporary profile alone did not exclude personal skills. The installed CLI requires enablement overrides pointing at the exact `SKILL.md` file. The runner now verifies its model-visible context before each case, rather than assuming isolation.
- Manual review of the first isolated Git response found a missing check: it created README.md on main before asking for the branch, although it did not commit or push. The Codex adapter now explicitly requires the branch answer before edits or staging. The stronger targeted test passed with an empty filesystem delta and unchanged branch/commit.
- Scanner checks now distinguish reading a script's source from completing a real Node invocation. The completed scanner calls in the saved audit events were also independently checked with this stronger grader.
- Codex `openai.yaml` files have an explicit LF rule so a Windows checkout does not produce false generated-package freshness failures.

## Evidence

The isolated full run is under `tests/results/codex/2026-10-27T04-04-01-677Z/`. Its original checks passed all 13 cases, but its Git check did not yet require an empty filesystem delta. That initial Git observation is superseded by `tests/results/codex/2026-10-27T04-15-58-385Z/git-no-push-1/`, which passes the stronger check and contains `changes.json` equal to `[]`.

Each case stores its prompt, response, native plugin installation result, isolation check, JSONL tool events, changed files, check results and reported token usage. These raw results are ignored by Git. Earlier diagnostic runs are retained separately and are not counted as final passes.

The final deterministic suites for both Claude and Codex each reported **15 passed, 0 failed, 3 skipped**. The skipped checks require Playwright; it was not installed. No original Claude skill, marketplace or Claude eval case was modified.

## Limits and repetition

This is one observation per scenario, plus diagnostic and corrective reruns. It is not a stability study, a comparison against an unmodified agent, or a test of every possible request handled by all 21 skills. The graders are deterministic checks supplemented by manual review, not an independent LLM judge. Browser rendering, live deployments, real credentials and remote GitHub installation were not tested by these scenarios.

Run `node tests/codex-evals.mjs --runs 3` to measure repeatability. See [runner documentation](../tests/CODEX-EVALS.md) for commands, isolation and evidence locations.
